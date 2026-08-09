import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Video, 
  FileText, 
  X, 
  CheckCircle2, 
  Film, 
  Loader2, 
  Sparkles, 
  Play, 
  Settings,
  Layers,
  FileCode
} from 'lucide-react';
import { useStore } from '../store';
import { SubtitleStyleSettings } from '../types';

interface ExportVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportVideoModal({ isOpen, onClose }: ExportVideoModalProps) {
  const { project, tracks, subtitles, translationSettings, subtitleStyleSettings } = useStore();
  
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoTrack = tracks.find(t => t.type === 'video');
  const trackItem = videoTrack?.items[0];
  const videoUrl = trackItem?.url || (trackItem?.file ? URL.createObjectURL(trackItem.file) : undefined) || project?.videoUrl;

  useEffect(() => {
    if (!isOpen) {
      setIsExportingVideo(false);
      setExportProgress(0);
      setExportError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper to get active text based on style
  const getActiveText = (sub: typeof subtitles[0]) => {
    if (translationSettings.englishStyle === 'simple' && sub.simpleEnglishText) {
      return sub.simpleEnglishText;
    }
    return sub.translatedText || sub.originalText;
  };

  // 1. Export SRT
  const handleExportSRT = () => {
    const formatTime = (secs: number) => {
      const pad = (n: number, z = 2) => ('00' + n).slice(-z);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = Math.floor(secs % 60);
      const ms = Math.floor((secs % 1) * 1000);
      return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
    };

    const srtContent = subtitles.map((s, i) => 
      `${i + 1}\n${formatTime(s.startTime)} --> ${formatTime(s.endTime)}\n${getActiveText(s)}\n`
    ).join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project?.name || 'Subtitled_Video').replace(/\.[^/.]+$/, "")}_English.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. Export WebVTT
  const handleExportVTT = () => {
    const formatTime = (secs: number) => {
      const pad = (n: number, z = 2) => ('00' + n).slice(-z);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = Math.floor(secs % 60);
      const ms = Math.floor((secs % 1) * 1000);
      return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
    };

    const vttContent = `WEBVTT - NeuralDub Pro English Subtitles\n\n` + subtitles.map((s, i) => 
      `${i + 1}\n${formatTime(s.startTime)} --> ${formatTime(s.endTime)}\n${getActiveText(s)}\n`
    ).join('\n');

    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project?.name || 'Subtitled_Video').replace(/\.[^/.]+$/, "")}_English.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 3. Export Plain Transcript (.txt)
  const handleExportTXT = () => {
    const txtContent = subtitles.map((s) => `[${s.startTime.toFixed(1)}s - ${s.endTime.toFixed(1)}s] (${s.detectedLanguage}):\n${getActiveText(s)}\n`).join('\n');
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project?.name || 'Transcript').replace(/\.[^/.]+$/, "")}_English_Transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 4. Burn-in Subtitles & Record Video Stream Safely
  const handleRenderBurnedInVideo = async () => {
    if (!videoUrl) {
      setExportError("No source video found to render.");
      return;
    }

    setIsExportingVideo(true);
    setExportProgress(1);
    setExportError(null);
    setExportedVideoUrl(null);

    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = "anonymous";
    video.muted = false;
    video.playsInline = true;

    try {
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = (e) => reject(new Error("Failed to load source video for rendering."));
      });
    } catch (err: any) {
      setExportError(err.message || "Video loading error.");
      setIsExportingVideo(false);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setExportError("Canvas 2D context not supported.");
      setIsExportingVideo(false);
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    let audioCtx: AudioContext | null = null;
    let sourceNode: MediaElementAudioSourceNode | null = null;
    let destNode: MediaStreamAudioDestinationNode | null = null;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      sourceNode = audioCtx.createMediaElementSource(video);
      destNode = audioCtx.createMediaStreamDestination();
      sourceNode.connect(destNode);
      sourceNode.connect(audioCtx.destination);
    } catch (e) {
      console.warn("Web Audio routing bypass warning:", e);
    }

    const canvasStream = canvas.captureStream(30);
    if (destNode && destNode.stream.getAudioTracks().length > 0) {
      canvasStream.addTrack(destNode.stream.getAudioTracks()[0]);
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4';

    let mediaRecorder: MediaRecorder;
    const chunks: Blob[] = [];

    try {
      mediaRecorder = new MediaRecorder(canvasStream, { mimeType });
    } catch (err) {
      try {
        mediaRecorder = new MediaRecorder(canvasStream);
      } catch (fallbackErr) {
        setExportError("MediaRecorder initialization failed on this browser.");
        setIsExportingVideo(false);
        if (audioCtx) audioCtx.close();
        return;
      }
    }

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      try {
        const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
        const createdUrl = URL.createObjectURL(blob);
        setExportedVideoUrl(createdUrl);
        setIsExportingVideo(false);
        setExportProgress(100);
      } catch (err) {
        setExportError("Failed to assemble final video blob.");
        setIsExportingVideo(false);
      }

      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };

    mediaRecorder.onerror = (event: any) => {
      setExportError("MediaRecorder error encountered during export.");
      setIsExportingVideo(false);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };

    try {
      mediaRecorder.start(1000); // Collect data chunks every second to avoid memory bloat
      video.currentTime = 0;
      await video.play();
    } catch (playErr) {
      setExportError("Playback restriction prevented automatic video rendering.");
      setIsExportingVideo(false);
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
      return;
    }

    const duration = video.duration || project?.duration || 30;

    const renderFrame = () => {
      if (video.paused || video.ended) {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        return;
      }

      const currTime = video.currentTime;
      setExportProgress(Math.min(99, Math.round((currTime / duration) * 100)));

      // Draw background video frame
      ctx.drawImage(video, 0, 0, width, height);

      // Find active subtitle
      const activeSub = subtitles.find(s => currTime >= s.startTime && currTime <= s.endTime);
      if (activeSub) {
        const text = getActiveText(activeSub);
        
        ctx.save();
        
        let fontSizePx = Math.round(height * 0.042);
        if (subtitleStyleSettings.fontSize === 'small') fontSizePx = Math.round(height * 0.032);
        if (subtitleStyleSettings.fontSize === 'large') fontSizePx = Math.round(height * 0.055);
        if (subtitleStyleSettings.fontSize === 'xlarge') fontSizePx = Math.round(height * 0.068);

        ctx.font = `bold ${fontSizePx}px sans-serif`;

        let yPos = (height * (subtitleStyleSettings.yOffsetPercent || 85)) / 100;
        let xPos = (width * (subtitleStyleSettings.xOffsetPercent || 50)) / 100;

        ctx.textAlign = subtitleStyleSettings.alignment || 'center';
        ctx.textBaseline = 'middle';

        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const paddingX = fontSizePx * 0.8;
        const paddingY = fontSizePx * 0.5;

        let boxX = xPos - (textWidth / 2) - paddingX;
        if (subtitleStyleSettings.alignment === 'left') boxX = xPos - paddingX;
        if (subtitleStyleSettings.alignment === 'right') boxX = xPos - textWidth - paddingX;
        
        const boxWidth = textWidth + (paddingX * 2);
        const boxHeight = fontSizePx + (paddingY * 2);
        const boxY = yPos - (boxHeight / 2);

        if (subtitleStyleSettings.bgStyle === 'solid_black') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        } else if (subtitleStyleSettings.bgStyle === 'yellow_box') {
          ctx.fillStyle = 'rgba(250, 204, 21, 0.95)';
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        } else {
          ctx.fillStyle = 'rgba(10, 10, 12, 0.82)';
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
          ctx.strokeStyle = 'rgba(0, 245, 255, 0.6)';
          ctx.lineWidth = Math.max(1.5, height * 0.003);
          ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        }

        let fillTextColor = '#FACC15';
        if (subtitleStyleSettings.bgStyle === 'yellow_box') fillTextColor = '#000000';
        else if (subtitleStyleSettings.textColor === 'white') fillTextColor = '#FFFFFF';
        else if (subtitleStyleSettings.textColor === 'cyan') fillTextColor = '#00F5FF';
        else if (subtitleStyleSettings.textColor === 'lime') fillTextColor = '#4ADE80';

        ctx.fillStyle = fillTextColor;
        ctx.fillText(text, xPos, yPos);

        ctx.restore();
      }

      requestAnimationFrame(renderFrame);
    };

    renderFrame();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#141416] border border-[#313135] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-[#26262a] bg-[#1A1A1D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Export Translated Product</h2>
              <p className="text-xs text-slate-400">
                Download the finished video with burned-in subtitles or export subtitle files (.SRT / .VTT)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#26262a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Main Download Option */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-[#1A1A1D] to-[#121214] border border-[#00F5FF]/40 relative overflow-hidden shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#00F5FF] text-black">
                    Primary Product
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Format: Video + Burned-In Subtitles
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 pt-1">
                  <Film className="w-5 h-5 text-[#00F5FF]" />
                  Download Finished Subtitled Video
                </h3>
                <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                  Renders your uploaded video with your configured Easy-Read English subtitles directly overlaid at your chosen position & styling.
                </p>
              </div>
            </div>

            {/* Export State Display */}
            {isExportingVideo ? (
              <div className="mt-4 p-4 rounded-lg bg-[#0A0A0B] border border-[#313135] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#00F5FF] flex items-center gap-2 font-bold">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00F5FF]" />
                    Rendering Burned-In Subtitle Video Stream...
                  </span>
                  <span className="text-white font-bold">{exportProgress}%</span>
                </div>
                <div className="w-full bg-[#18181B] h-2 rounded overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-[#00F5FF] transition-all duration-200"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Processing active subtitle cues at selected placement...
                </p>
              </div>
            ) : exportedVideoUrl ? (
              <div className="mt-4 p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/50 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  Finished Video Render Complete!
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={exportedVideoUrl}
                    download={`${(project?.name || 'Subtitled_Video').replace(/\.[^/.]+$/, "")}_Subtitled.webm`}
                    className="px-5 py-2.5 bg-emerald-400 text-black font-bold text-xs uppercase rounded-lg hover:bg-white transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Download className="w-4 h-4" /> Save Subtitled Video File
                  </a>

                  <button
                    onClick={handleRenderBurnedInVideo}
                    className="px-3 py-2 bg-[#26262a] text-slate-300 text-xs font-bold rounded-lg hover:text-white hover:bg-[#313135]"
                  >
                    Re-render Video
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleRenderBurnedInVideo}
                  className="px-6 py-3 bg-[#00F5FF] text-black font-bold uppercase rounded-lg text-xs hover:bg-white transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                >
                  <Sparkles className="w-4 h-4" /> Render & Download Finished Video
                </button>
              </div>
            )}

            {exportError && (
              <p className="mt-2 text-xs text-red-400 bg-red-950/50 p-2 rounded border border-red-800">
                {exportError}
              </p>
            )}
          </div>

          {/* Subtitle File Exports */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-[#00F5FF]" /> Subtitle & Transcript Downloads
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleExportSRT}
                className="p-3.5 rounded-xl bg-[#18181B] border border-[#2B2B30] hover:border-[#00F5FF]/60 hover:bg-[#1E1E22] transition-all text-left flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm group-hover:text-[#00F5FF] transition-colors">.SRT File</span>
                    <FileText className="w-4 h-4 text-slate-500 group-hover:text-[#00F5FF]" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Standard SubRip file compatible with YouTube, Premiere, and media players.
                  </p>
                </div>
                <div className="text-[11px] font-bold text-[#00F5FF] uppercase flex items-center gap-1">
                  Download SRT <Download className="w-3 h-3" />
                </div>
              </button>

              <button
                onClick={handleExportVTT}
                className="p-3.5 rounded-xl bg-[#18181B] border border-[#2B2B30] hover:border-[#00F5FF]/60 hover:bg-[#1E1E22] transition-all text-left flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm group-hover:text-[#00F5FF] transition-colors">.VTT File</span>
                    <FileCode className="w-4 h-4 text-slate-500 group-hover:text-[#00F5FF]" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    WebVTT format for web video players, HTML5 video, and streaming platforms.
                  </p>
                </div>
                <div className="text-[11px] font-bold text-[#00F5FF] uppercase flex items-center gap-1">
                  Download VTT <Download className="w-3 h-3" />
                </div>
              </button>

              <button
                onClick={handleExportTXT}
                className="p-3.5 rounded-xl bg-[#18181B] border border-[#2B2B30] hover:border-[#00F5FF]/60 hover:bg-[#1E1E22] transition-all text-left flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm group-hover:text-[#00F5FF] transition-colors">.TXT Transcript</span>
                    <FileText className="w-4 h-4 text-slate-500 group-hover:text-[#00F5FF]" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Plain text transcript of all translated English segments with speake
