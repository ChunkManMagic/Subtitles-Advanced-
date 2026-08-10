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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * WebSocket Chunked Upload with Flow Control (ACK Backpressure) & Non-Blocking Ping/Pong Heartbeat
 */
async function uploadVideoViaWebSocket(
  fileOrBlob: File | Blob,
  fileName: string = 'video.mp4',
  onProgress?: (progressPercent: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws-upload`;
    const ws = new WebSocket(wsUrl);

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const size = fileOrBlob.size;
    const mimeType = fileOrBlob.type || 'video/mp4';
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunk size for optimal flow control
    const totalChunks = Math.ceil(size / CHUNK_SIZE);

    let isClosed = false;
    let pingInterval: any = null;

    const ackResolverMap = new Map<number, { resolve: () => void; reject: (err: Error) => void }>();
    let startAckResolver: { resolve: () => void; reject: (err: Error) => void } | null = null;
    let completeResolver: { resolve: (subtitles: any) => void; reject: (err: Error) => void } | null = null;

    const cleanup = () => {
      isClosed = true;
      if (pingInterval) clearInterval(pingInterval);
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      } catch (_) {}
    };

    const connTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        cleanup();
        reject(new Error('WebSocket connection timeout'));
      }
    }, 8000);

    ws.onopen = async () => {
      clearTimeout(connTimeout);

      // 1. PARALLEL NON-BLOCKING HEARTBEAT PING/PONG LOOP
      pingInterval = setInterval(() => {
        if (!isClosed && ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ type: 'ping' }));
          } catch (_) {}
        }
      }, 10000);

      try {
        // 2. Start Upload session
        const startAckPromise = new Promise<void>((res, rej) => {
          startAckResolver = { resolve: res, reject: rej };
        });

        ws.send(JSON.stringify({ type: 'start_upload', uploadId }));
        await Promise.race([
          startAckPromise,
          new Promise((_, rej) => setTimeout(() => rej(new Error('start_upload timeout')), 10000))
        ]);

        // 3. CHUNK UPLOAD WITH EXPLICIT ACK FLOW CONTROL (BACKPRESSURE)
        for (let i = 0; i < totalChunks; i++) {
          if (isClosed) throw new Error('Upload cancelled or connection lost');

          const start = i * CHUNK_SIZE;
          const end = Math.min(size, (i + 1) * CHUNK_SIZE);
          const chunkBlob = fileOrBlob.slice(start, end);
          const base64Data = await blobToBase64(chunkBlob);

          let ackReceived = false;
          let retries = 0;

          while (!ackReceived && retries < 3) {
            retries++;
            const chunkAckPromise = new Promise<void>((res, rej) => {
              ackResolverMap.set(i, { resolve: res, reject: rej });
            });

            ws.send(JSON.stringify({
              type: 'upload_chunk',
              uploadId,
              chunkIndex: i,
              totalChunks,
              data: base64Data,
            }));

            try {
              await Promise.race([
                chunkAckPromise,
                new Promise((_, rej) => setTimeout(() => rej(new Error(`Chunk ${i} ACK timeout`)), 15000))
              ]);
              ackReceived = true;
            } catch (retryErr) {
              ackResolverMap.delete(i);
              if (retries >= 3) throw retryErr;
              console.warn(`Retrying chunk ${i}/${totalChunks} (attempt ${retries + 1})...`);
              await new Promise((r) => setTimeout(r, 1000));
            }
          }

          const progress = Math.round(((i + 1) / totalChunks) * 75);
          onProgress?.(progress);
        }

        // 4. Assemble and AI Process video
        const completePromise = new Promise<any>((res, rej) => {
          completeResolver = { resolve: res, reject: rej };
        });

        ws.send(JSON.stringify({
          type: 'assemble_upload',
          uploadId,
          fileName,
          totalChunks,
          mimeType,
        }));

        onProgress?.(80);

        const subtitles = await Promise.race([
          completePromise,
          new Promise((_, rej) => setTimeout(() => rej(new Error('AI video assembly processing timeout')), 180000))
        ]);

        onProgress?.(100);
        cleanup();
        resolve(subtitles);
      } catch (err: any) {
        cleanup();
        reject(err);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // IMMEDIATE PONG HEARTBEAT HANDLING (NON-BLOCKING)
        if (msg.type === 'pong') {
          return;
        }

        if (msg.type === 'start_ack') {
          if (startAckResolver) {
            startAckResolver.resolve();
            startAckResolver = null;
          }
          return;
        }

        // FLOW CONTROL ACK HANDLING
        if (msg.type === 'chunk_ack') {
          const chunkIdx = msg.chunkIndex;
          const resolver = ackResolverMap.get(chunkIdx);
          if (resolver) {
            ackResolverMap.delete(chunkIdx);
            if (msg.status === 'ok') {
              resolver.resolve();
            } else {
              resolver.reject(new Error(msg.error || `Chunk ${chunkIdx} failed`));
            }
          }
          return;
        }

        if (msg.type === 'upload_complete') {
          if (completeResolver) {
            completeResolver.resolve(msg.subtitles || []);
            completeResolver = null;
          }
          return;
        }

        if (msg.type === 'upload_error') {
          if (completeResolver) {
            completeResolver.reject(new Error(msg.error || 'WebSocket assembly failed'));
            completeResolver = null;
          }
          return;
        }
      } catch (_) {}
    };

    ws.onerror = (err) => {
      console.warn('[WebSocket Upload Error]', err);
      if (!isClosed) {
        cleanup();
        reject(new Error('WebSocket network error'));
      }
    };

    ws.onclose = () => {
      if (!isClosed) {
        cleanup();
        reject(new Error('WebSocket connection closed unexpectedly'));
      }
    };
  });
}

/**
 * Fallback HTTP Chunked Upload
 */
async function uploadVideoViaHttp(
  fileOrBlob: File | Blob,
  fileName: string = 'video.mp4',
  onProgress?: (progressPercent: number) => void
): Promise<any> {
  const size = fileOrBlob.size;
  const mimeType = fileOrBlob.type || 'video/mp4';
  const CHUNK_SIZE = 4 * 1024 * 1024;

  if (size <= 12 * 1024 * 1024 && fileOrBlob instanceof File) {
    const formData = new FormData();
    formData.append('video', fileOrBlob);
    onProgress?.(30);

    const response = await fetchWithRetry('/api/translate-video', {
      method: 'POST',
      body: formData,
    }, 5);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Direct video upload failed');
    }

    onProgress?.(100);
    const data = await response.json();
    return data.subtitles || [];
  }

  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const totalChunks = Math.ceil(size / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(size, (i + 1) * CHUNK_SIZE);
    const chunk = fileOrBlob.slice(start, end);

    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', i.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('chunk', chunk, `${fileName}.part${i}`);

    const chunkRes = await fetchWithRetry('/api/upload-chunk', {
      method: 'POST',
      body: formData,
    }, 8);

    if (!chunkRes.ok) {
      const errData = await chunkRes.json().catch(() => ({}));
      throw new Error(errData.error || `Chunk ${i + 1}/${totalChunks} upload failed`);
    }

    const chunkProgress = Math.round(((i + 1) / totalChunks) * 60);
    onProgress?.(chunkProgress);
  }

  onProgress?.(70);

  const processRes = await fetchWithRetry('/api/process-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadId,
      fileName,
      totalChunks,
      mimeType,
    }),
  }, 5, 3000, 180000);

  if (!processRes.ok) {
    const errData = await processRes.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to assemble and process video');
  }

  onProgress?.(100);
  const data = await processRes.json();
  return data.subtitles || [];
}

export async function uploadAndTranslateVideo(
  fileOrBlob: File | Blob,
  fileName: string = 'video.mp4',
  onProgress?: (progressPercent: number) => void
): Promise<any> {
  // First attempt WebSocket upload with flow control ACK and parallel heartbeat
  try {
    return await uploadVideoViaWebSocket(fileOrBlob, fileName, onProgress);
  } catch (wsErr) {
    console.warn('[WebSocket Upload Failed, falling back to HTTP chunking]', wsErr);
    return await uploadVideoViaHttp(fileOrBlob, fileName, onProgress);
  }
}
