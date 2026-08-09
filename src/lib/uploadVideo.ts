async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 8,
  initialDelayMs: number = 1000,
  timeoutMs: number = 60000
): Promise<Response> {
  let lastErr: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      // Retry on server errors or transient chunk parsing glitches (400, 408, 429, 500, 502, 503, 504)
      if ([400, 408, 429, 500, 502, 503, 504].includes(response.status) && attempt < maxRetries) {
        const delay = Math.min(10000, Math.round(initialDelayMs * Math.pow(1.5, attempt - 1)));
        console.warn(`[Upload Retry] ${url} returned ${response.status}, retrying in ${delay}ms (${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastErr = err;
      const isAbort = err?.name === 'AbortError';
      const errMsg = isAbort ? 'Request timeout (60s)' : (err?.message || err);
      console.warn(`[Upload Network Error] ${url} attempt ${attempt}/${maxRetries}: ${errMsg}`);

      if (attempt < maxRetries) {
        const delay = Math.min(10000, Math.round(initialDelayMs * Math.pow(1.5, attempt - 1)));
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastErr || new Error(`Network request to ${url} failed after ${maxRetries} attempts.`);
}

export async function uploadAndTranslateVideo(
  fileOrBlob: File | Blob,
  fileName: string = 'video.mp4',
  onProgress?: (progressPercent: number) => void
): Promise<any> {
  const size = fileOrBlob.size;
  const mimeType = fileOrBlob.type || 'video/mp4';
  const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks for max reliability on all networks

  // For small Files (< 12MB), direct upload is fast and avoids chunking overhead
  if (size <= 12 * 1024 * 1024 && fileOrBlob instanceof File) {
    const formData = new FormData();
    formData.append('video', fileOrBlob);
    onProgress?.(30);
    
    let response: Response;
    try {
      response = await fetchWithRetry('/api/translate-video', {
        method: 'POST',
        body: formData,
      }, 5);
    } catch (netErr: any) {
      throw new Error("Unable to connect to the video processing server. Please check your network connection and try again.");
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Direct video upload failed');
    }

    onProgress?.(100);
    const data = await response.json();
    return data.subtitles || [];
  }

  // Chunked upload for larger files or fetched Blobs
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const totalChunks = Math.ceil(size / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(size, (i + 1) * CHUNK_SIZE);
    const chunk = fileOrBlob.slice(start, end);

    const formData = new FormData();
    // MUST append text metadata BEFORE binary chunk file so Multer parses req.body before req.file
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', i.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('chunk', chunk, `${fileName}.part${i}`);

    let chunkRes: Response;
    try {
      chunkRes = await fetchWithRetry('/api/upload-chunk', {
        method: 'POST',
        body: formData,
      }, 8); // Retry up to 8 times per chunk
    } catch (netErr) {
      throw new Error(`Failed uploading chunk ${i + 1}/${totalChunks} after multiple retries. Please verify your internet connection.`);
    }

    if (!chunkRes.ok) {
      const errData = await chunkRes.json().catch(() => ({}));
      throw new Error(errData.error || `Chunk ${i + 1}/${totalChunks} upload failed`);
    }

    const chunkProgress = Math.round(((i + 1) / totalChunks) * 60);
    onProgress?.(chunkProgress);
  }

  onProgress?.(70);

  // Ask backend to assemble chunks and run Gemini video translation
  let processRes: Response;
  try {
    processRes = await fetchWithRetry('/api/process-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        fileName,
        totalChunks,
        mimeType,
      }),
    }, 5, 3000, 180000); // 3-minute timeout for processing complete video with AI
  } catch (netErr) {
    throw new Error("Network connection lost during video AI analysis. Please try again.");
  }

  if (!processRes.ok) {
    const errData = await processRes.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to assemble and process video');
  }

  onProgress?.(100);
  const data = await processRes.json();
  return data.subtitles || [];
}
