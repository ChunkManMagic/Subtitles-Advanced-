async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 5,
  initialDelayMs: number = 1200
): Promise<Response> {
  let lastErr: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      // If server returned 500, 502, 503, 504, 429 or similar transient error, retry
      if ([500, 502, 503, 504, 429].includes(response.status) && attempt < maxRetries) {
        console.warn(`[Upload Retry] ${url} returned ${response.status}, retrying (${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, initialDelayMs * attempt));
        continue;
      }
      return response;
    } catch (err: any) {
      lastErr = err;
      console.warn(`[Upload Network Error] ${url} attempt ${attempt}/${maxRetries}:`, err?.message || err);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, initialDelayMs * attempt));
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
  const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks for optimal speed and reliability

  // For small Files (< 10MB), direct upload is fast
  if (size <= 10 * 1024 * 1024 && fileOrBlob instanceof File) {
    const formData = new FormData();
    formData.append('video', fileOrBlob);
    onProgress?.(30);
    
    let response: Response;
    try {
      response = await fetchWithRetry('/api/translate-video', {
        method: 'POST',
        body: formData,
      }, 3);
    } catch (netErr: any) {
      throw new Error("Unable to connect to the video processing server. Please check your network or try again.");
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
    formData.append('chunk', chunk, `${fileName}.part${i}`);
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', i.toString());
    formData.append('totalChunks', totalChunks.toString());

    let chunkRes: Response;
    try {
      chunkRes = await fetchWithRetry('/api/upload-chunk', {
        method: 'POST',
        body: formData,
      }, 5); // Retry up to 5 times per chunk
    } catch (netErr) {
      throw new Error(`Failed uploading chunk ${i + 1}/${totalChunks} after multiple retries. Please verify your connection.`);
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
    }, 4, 3000);
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
