import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import { tmpdir } from "os";
import crypto from "crypto";

// Firebase initialization
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn("Could not load firebase-applet-config.json");
}

let db: any = null;
if (firebaseConfig) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// Multer for handling file uploads
const upload = multer({ 
  dest: tmpdir(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB per chunk or direct upload
});

async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Helper function to process video file path with Gemini
  async function processVideoFile(videoPath: string, mimeType: string, originalName?: string) {
    let videoHash = "";
    try {
      videoHash = await hashFile(videoPath);
      console.log(`Video SHA-256 hash: ${videoHash}`);
      
      // Check Firebase cache
      if (db) {
        try {
          const docRef = doc(db, 'processed_videos', videoHash);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const cached = docSnap.data().subtitles;
            if (Array.isArray(cached) && cached.length > 0) {
              console.log("Cache hit! Returning saved subtitles from Firebase.");
              return cached;
            }
          }
        } catch (e) {
          console.error("Error checking Firebase cache:", e);
        }
      }
    } catch (e) {
      console.error("Error hashing video file:", e);
    }

    const genAI = getAI();
    console.log(`Uploading file ${videoPath} to Gemini File API...`);

    const safeMime = (mimeType && mimeType.startsWith('video/')) ? mimeType : 'video/mp4';
    const uploadedFile = await genAI.files.upload({
      file: videoPath,
      config: {
        mimeType: safeMime,
      }
    });

    console.log(`File uploaded successfully: ${uploadedFile.name} (URI: ${uploadedFile.uri})`);

    let fileState = uploadedFile.state;
    let checkCount = 0;
    while ((fileState === "PROCESSING" || !fileState) && checkCount < 90) {
      if (!uploadedFile.name) break;
      console.log(`Waiting for file processing... state: ${fileState}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const checkReq = await genAI.files.get({ name: uploadedFile.name });
      fileState = checkReq.state;
      checkCount++;
    }

    if (fileState === "FAILED") {
      throw new Error("Video processing failed on Gemini servers.");
    }

    console.log(`File is ready. Analyzing with Gemini...`);

    const prompt = `You are a professional video translator and subtitle generator.
Analyze the video, including BOTH its spoken audio and ANY subtitles/text already present ON-SCREEN.
Identify all dialogue and on-screen text. If there are multiple languages spoken or written, detect each one accurately. Ensure you separate different languages properly - if two different subtitles or spoken segments are in different languages, treat them as separate distinct segments. Do not merge different languages into one. Ensure you use the context of the scene to accurately translate the dialogue and text.
Transcribe the dialogue/text, translate it to English, and provide a simplified English version.

Output the result strictly as a JSON array of subtitle objects.
Use this TypeScript interface for the output objects:
{
  startTime: number; // in seconds
  endTime: number; // in seconds
  originalText: string;
  detectedLanguage: string; // e.g. "Spanish"
  detectedLanguageCode: string; // e.g. "es"
  confidence: number; // 0.0 to 1.0
  translatedText: string; // Natural English
  simpleEnglishText: string; // Easy-to-understand English
  culturalNotes?: string;
  languageShift: boolean; // True if this segment is a different language from the preceding segment
}

Respond ONLY with the JSON array, nothing else. No markdown formatting.`;

    const requestPayload = {
      contents: [
        {
          fileData: {
            fileUri: uploadedFile.uri,
            mimeType: uploadedFile.mimeType || safeMime,
          }
        },
        {
          text: prompt
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startTime: { type: Type.NUMBER, description: "Start time in seconds" },
              endTime: { type: Type.NUMBER, description: "End time in seconds" },
              originalText: { type: Type.STRING, description: "Original spoken dialogue" },
              detectedLanguage: { type: Type.STRING, description: "Spoken language name e.g. Spanish" },
              detectedLanguageCode: { type: Type.STRING, description: "ISO language code e.g. es" },
              confidence: { type: Type.NUMBER, description: "Detection confidence 0.0 to 1.0" },
              translatedText: { type: Type.STRING, description: "Natural English translation" },
              simpleEnglishText: { type: Type.STRING, description: "Simplified easy-to-understand English" },
              culturalNotes: { type: Type.STRING, description: "Optional notes on cultural context or slang" },
              languageShift: { type: Type.BOOLEAN, description: "True if language changed from preceding segment" }
            },
            required: [
              "startTime",
              "endTime",
              "originalText",
              "detectedLanguage",
              "detectedLanguageCode",
              "translatedText",
              "simpleEnglishText",
              "languageShift"
            ]
          }
        }
      }
    };

    // Retry with exponential backoff and fallback models
    const candidateModels = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.5-pro"];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Sending prompt to ${modelName} (attempt ${attempt}/3)...`);
          response = await genAI.models.generateContent({
            ...requestPayload,
            model: modelName,
          });
          if (response && response.text) {
            console.log(`Success with model ${modelName}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || String(err);
          const status = err?.status || err?.code;
          console.warn(`Model ${modelName} attempt ${attempt} failed:`, errMsg);

          const isDemandSpike = status === 503 || status === 429 || status === 500 || status === 504 || 
            errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand') || errMsg.includes('quota');

          if (isDemandSpike && attempt < 3) {
            const delayMs = attempt * 2500;
            console.log(`High demand or transient error detected. Retrying ${modelName} in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }
          break; // Try next model fallback
        }
      }
      if (response && response.text) break;
    }

    if (!response || !response.text) {
      throw lastError || new Error("Gemini AI models are currently unavailable due to high traffic demand. Please try again in a few moments.");
    }

    const textResult = response.text || "[]";
    
    // Cleanup Gemini File
    if (uploadedFile.name) {
      try {
        await genAI.files.delete({ name: uploadedFile.name });
      } catch (e) {
        console.error("Failed to delete temp file from Gemini", e);
      }
    }

    let cleanJson = textResult.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    }

    // Isolate array if wrapped in extra text or markdown
    const firstBracket = cleanJson.indexOf('[');
    const lastBracket = cleanJson.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
    }

    let parsedSubtitles = [];
    try {
      parsedSubtitles = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON. Raw text:", textResult);
      // Fallback recovery if output was truncated
      try {
        if (firstBracket !== -1) {
          let partialJson = cleanJson;
          if (!partialJson.endsWith(']')) {
            partialJson = partialJson.replace(/,\s*$/, '') + ']';
          }
          parsedSubtitles = JSON.parse(partialJson);
        } else {
          throw e;
        }
      } catch (fallbackErr) {
        throw new Error("Invalid JSON response from Gemini model");
      }
    }

    const finalSubtitles = parsedSubtitles.map((sub: any, i: number) => {
      const len = (sub.translatedText || '').length;
      const duration = Math.max(1, (sub.endTime || 0) - (sub.startTime || 0));
      const cps = parseFloat((len / duration).toFixed(1));
      return {
        id: `sub-${Date.now()}-${i}`,
        ...sub,
        cps,
        readingDifficulty: cps > 20 ? 'Complex' : 'Easy',
      };
    });

    if (db && videoHash && finalSubtitles && finalSubtitles.length > 0) {
      try {
        const docRef = doc(db, 'processed_videos', videoHash);
        await setDoc(docRef, {
          videoId: videoHash,
          fileName: originalName || 'Analyzed Video',
          subtitles: finalSubtitles,
          createdAt: new Date().toISOString()
        });
        console.log("Subtitles saved to Firebase cache.");
      } catch (e) {
        console.error("Failed to save subtitles to cache:", e);
      }
    }

    return finalSubtitles;
  }

  // API Route: Get history of analyzed videos
  app.get("/api/history", async (req, res) => {
    if (!db) {
      return res.json({ history: [] });
    }
    try {
      const snap = await getDocs(collection(db, "processed_videos"));
      const history: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        history.push({
          id: docSnap.id,
          videoId: data.videoId || docSnap.id,
          fileName: data.fileName || `Analyzed Video (${docSnap.id.substring(0, 6)})`,
          subtitles: data.subtitles || [],
          createdAt: data.createdAt || new Date().toISOString(),
          subtitlesCount: data.subtitles ? data.subtitles.length : 0,
        });
      });
      // Sort descending by createdAt
      history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json({ history });
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // API Route: Delete history item
  app.delete("/api/history/:id", async (req, res) => {
    const { id } = req.params;
    if (!db || !id) {
      return res.status(400).json({ error: "Invalid request or missing database" });
    }
    try {
      await deleteDoc(doc(db, "processed_videos", id));
      res.json({ success: true, deletedId: id });
    } catch (error) {
      console.error("Error deleting history doc:", error);
      res.status(500).json({ error: "Failed to delete history item" });
    }
  });

  // API Route: Upload chunk
  app.post("/api/upload-chunk", upload.single("chunk"), async (req, res) => {
    try {
      const { uploadId, chunkIndex, totalChunks } = req.body;
      if (!req.file || !uploadId || chunkIndex === undefined) {
        res.status(400).json({ error: "Missing chunk data" });
        return;
      }

      const chunkDir = path.join(tmpdir(), "video_chunks", uploadId);
      if (!fs.existsSync(chunkDir)) {
        fs.mkdirSync(chunkDir, { recursive: true });
      }

      const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`);
      fs.renameSync(req.file.path, chunkPath);

      res.json({ success: true, chunkIndex: parseInt(chunkIndex, 10) });
    } catch (error: any) {
      console.error("Error in /api/upload-chunk:", error);
      res.status(500).json({ error: error.message || "Failed to upload chunk" });
    }
  });

  // API Route: Process video after chunks assemble
  app.post("/api/process-video", async (req, res) => {
    try {
      const { uploadId, fileName, totalChunks, mimeType } = req.body;
      if (!uploadId || totalChunks === undefined) {
        res.status(400).json({ error: "Missing upload session metadata" });
        return;
      }

      const chunkDir = path.join(tmpdir(), "video_chunks", uploadId);
      const assembledPath = path.join(tmpdir(), `assembled_${uploadId}_${fileName || 'video.mp4'}`);

      // Ensure assembled destination file is empty before appending
      if (fs.existsSync(assembledPath)) {
        fs.unlinkSync(assembledPath);
      }

      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunkDir, `chunk_${i}`);
        if (!fs.existsSync(chunkPath)) {
          throw new Error(`Missing chunk index ${i}`);
        }
        const data = fs.readFileSync(chunkPath);
        fs.appendFileSync(assembledPath, data);
      }

      // Clean up chunk directory
      try {
        fs.rmSync(chunkDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Error removing chunk dir:", e);
      }

      // Process complete video with Gemini
      const subtitles = await processVideoFile(assembledPath, mimeType || 'video/mp4', fileName);

      // Cleanup assembled file
      if (fs.existsSync(assembledPath)) {
        fs.unlinkSync(assembledPath);
      }

      res.json({ subtitles });
    } catch (error: any) {
      console.error("Error in /api/process-video:", error);
      res.status(500).json({ error: error.message || "Failed to process assembled video" });
    }
  });

  // Direct video upload fallback
  app.post("/api/translate-video", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No video file provided" });
        return;
      }
      
      const videoPath = req.file.path;
      const mime = (req.file.mimetype === 'application/octet-stream' || !req.file.mimetype) ? 'video/mp4' : req.file.mimetype;
      const finalSubtitles = await processVideoFile(videoPath, mime, req.file.originalname);
      
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }

      res.json({ subtitles: finalSubtitles });
    } catch (error: any) {
      console.error("Error in /api/translate-video:", error);
      res.status(500).json({ error: error.message || "Failed to process video" });
    }
  });

  // Express error handler (e.g. for Multer LIMIT_FILE_SIZE or 413)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err) {
      console.error("Express middleware error:", err);
      const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
      res.status(status).json({ 
        error: err.code === 'LIMIT_FILE_SIZE' 
          ? "File size too large (maximum 500MB allowed)" 
          : (err.message || "Server error processing request") 
      });
      return;
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
