import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import { tmpdir } from "os";

// Initialize Gemini Client
// We will only initialize it if needed or use a lazy initialization.
let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

// Multer for handling file uploads (stored in temp directory)
const upload = multer({ dest: tmpdir() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/translate-video", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No video file provided" });
        return;
      }
      
      const genAI = getAI();
      const videoPath = req.file.path;
      
      console.log(`Uploading file ${videoPath} to Gemini...`);

      // Upload file to Gemini using the new SDK
      const uploadedFile = await genAI.files.upload({
        file: videoPath,
        config: {
          mimeType: req.file.mimetype || 'video/mp4',
        }
      });

      console.log(`File uploaded successfully: ${uploadedFile.name}`);

      // Wait until the file is active (if processing is needed for video)
      let fileState = uploadedFile.state;
      let checkCount = 0;
      while (fileState === "PROCESSING" && checkCount < 30) {
        console.log(`Waiting for file processing... state: ${fileState}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const checkReq = await genAI.files.get({ name: uploadedFile.name });
        fileState = checkReq.state;
        checkCount++;
      }

      if (fileState === "FAILED") {
        throw new Error("Video processing failed on Gemini servers.");
      }

      console.log(`File is ready. Analyzing...`);

      const prompt = `You are a professional video translator and subtitle generator.
Analyze the video and its audio. 
Identify all dialogue. If there are multiple languages spoken, detect each one.
Transcribe the dialogue, translate it to English, and provide a simplified English version.

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

      const response = await genAI.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [
              { fileData: { fileUri: uploadedFile.uri, mimeType: uploadedFile.mimeType } },
              { text: prompt },
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const textResult = response.text || "[]";
      
      // Cleanup Gemini File
      try {
        await genAI.files.delete({ name: uploadedFile.name });
      } catch (e) {
        console.error("Failed to delete temp file from Gemini", e);
      }
      
      // Cleanup local file
      fs.unlinkSync(videoPath);

      let parsedSubtitles = [];
      try {
        parsedSubtitles = JSON.parse(textResult);
      } catch (e) {
        console.error("Failed to parse Gemini response as JSON", textResult);
        throw new Error("Invalid response from AI");
      }

      // Add extra derived fields and generate unique IDs
      const finalSubtitles = parsedSubtitles.map((sub: any, i: number) => {
        const len = sub.translatedText.length;
        const duration = Math.max(1, sub.endTime - sub.startTime);
        const cps = parseFloat((len / duration).toFixed(1));
        return {
          id: `sub-${Date.now()}-${i}`,
          ...sub,
          cps,
          readingDifficulty: cps > 20 ? 'Complex' : 'Easy',
        };
      });

      res.json({ subtitles: finalSubtitles });
    } catch (error: any) {
      console.error("Error in /api/translate-video:", error);
      res.status(500).json({ error: error.message || "Failed to process video" });
    }
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
