export async function uploadAndTranslateVideo(
  fileOrBlob: File | Blob,
  fileName: string = 'video.mp4',
  onProgress?: (progressPercent: number) => void
): Promise<any> {
  const size = fileOrBlob.size;
  const mimeType = fileOrBlob.type || 'video/mp4';
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

  // For small Files (< 10MB), direct upload is fast
  if (size <= 10 * 1024 * 1024 && fileOrBlob instanceof File) {
    const formData = new FormData();
    formData.append('video', fileOrBlob);
    onProgress?.(30);
    const response = await fetch('/api/translate-video', {
      method: 'POST',
      body: formData,
    });

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

    const chunkRes = await fetch('/api/upload-chunk', {
      method: 'POST',
      body: formData,
    });

    if (!chunkRes.ok) {
      const errData = await chunkRes.json().catch(() => ({}));
      throw new Error(errData.error || `Chunk ${i + 1}/${totalChunks} upload failed`);
    }

    const chunkProgress = Math.round(((i + 1) / totalChunks) * 60);
    onProgress?.(chunkProgress);
  }

  onProgress?.(70);

  // Ask backend to assemble chunks and run Gemini video translation
  const processRes = await fetch('/api/process-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadId,
      fileName,
      totalChunks,
      mimeType,
    }),
  });

  if (!processRes.ok) {
    const errData = await processRes.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to assemble and process video');
  }

  onProgress?.(100);
  const data = await processRes.json();
  return data.subtitles || [];
}
