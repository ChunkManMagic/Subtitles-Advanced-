import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import { Play, Pause, Volume2, VolumeX, Globe, Maximize, RotateCcw, Film } from 'lucide-react';

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastStoreUpdateRef = useRef<number>(0);

  const {
    subtitles,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    currentProject,
  } = useStore((state) => ({
    subtitles: state.subtitles,
    isPlaying: state.taskManager.isProcessing ? false : state.isPlaying,
    setIsPlaying: state.setIsPlaying,
    currentTime: state.currentTime,
    setCurrentTime: state.setCurrentTime,
    currentProject: state.currentProject,
  }));

  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Synchronize play state from store
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {
        setIsPlaying(false);
      });
      setLocalIsPlaying(true);
    } else {
      video.pause();
      setLocalIsPlaying(false);
    }
  }, [isPlaying, setIsPlaying]);

  // Synchronize seek/time changes from store (e.g. dragging timeline cursor)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Only seek video if the time difference is significant (prevents infinite loop with animation frame updates)
    if (Math.abs(video.currentTime - currentTime) > 0.3) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  // Premium Animation Loop for 60fps subtitle sync & throttled timeline cursor sync
  useEffect(() => {
    const updateLoop = () => {
      const video = videoRef.current;
      if (!video) return;

      const currTime = video.currentTime;

      // 1. High-Precision Local Subtitle Sync (0ms delay)
      const matchedSub = subtitles.find(
        (sub) => currTime >= sub.startTime && currTime <= sub.endTime
      );
      setActiveSubtitle(matchedSub ? matchedSub.translatedText : null);

      // 2. Throttled Global Store Sync for Timeline Cursor (throttled to 100ms to save CPU)
      const now = Date.now();
      if (now - lastStoreUpdateRef.current > 100 || video.paused) {
        setCurrentTime(currTime);
        lastStoreUpdateRef.current = now;
      }

      // Schedule next frame
      if (!video.paused) {
        requestRef.current = requestAnimationFrame(updateLoop);
      }
    };

    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        requestRef.current = requestAnimationFrame(updateLoop);
      } else {
        // Run once on pause to make sure subtitle matches seeked frame
        updateLoop();
      }
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, subtitles, setCurrentTime]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMute = !isMuted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
      if (nextMute) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = volume || 1;
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen().catch((err) => {
        console.error("Fullscreen request failed", err);
      });
    }
  };

  const handleReset = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <div className="relative w-full aspect-video bg-[#050507] rounded-xl overflow-hidden group shadow-2xl border border-white/5 flex flex-col justify-center items-center">
      {/* Video Stream Element */}
      {currentProject?.videoUrl ? (
        <video
          ref={videoRef}
          src={currentProject.videoUrl}
          className="w-full h-full object-contain"
          playsInline
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2 bg-slate-950/60 font-medium">
          <Film className="w-8 h-8 text-slate-700 animate-pulse" />
          <span>No Video Stream Loaded</span>
        </div>
      )}

      {/* Floating Status Indicator Badges */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <span className="bg-red-600 text-white px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase shadow-lg shadow-red-600/20">Live Proxy</span>
        <span className="bg-black/85 text-[#00F5FF] border border-[#313135] px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-black/30">
          <Globe className="w-3 h-3" /> 🇺🇸 ENGLISH SUBTITLED
        </span>
      </div>

      {/* 60fps Active Subtitle Overlay - Rendered dynamically over video viewports */}
      <div className="absolute left-6 right-6 bottom-16 flex justify-center pointer-events-none z-20 transition-all duration-150">
        {activeSubtitle && (
          <div className="px-5 py-2.5 rounded-xl bg-black/85 border border-white/15 text-white text-center text-sm md:text-base font-medium font-sans leading-snug max-w-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] tracking-wide">
            {activeSubtitle}
          </div>
        )}
      </div>

      {/* Custom Control Overlay Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 flex flex-col gap-3 z-30">
        {/* Timeline Progress Bar Scrubber */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={videoRef.current?.duration || 100}
            step={0.01}
            value={videoRef.current?.currentTime || 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (videoRef.current) {
                videoRef.current.currentTime = val;
              }
              setCurrentTime(val);
            }}
            className="w-full h-1 bg-white/10 hover:bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500 outline-none transition-colors"
          />
        </div>

        {/* Media Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider shadow-lg shadow-indigo-600/10 transition-all active:scale-95"
            >
              {localIsPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              {localIsPlaying ? 'Pause' : 'Play Video'}
            </button>

            <button
              onClick={handleReset}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-white/5 transition-all"
              title="Reset playhead"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Time Indicators */}
            <div className="text-[10px] font-mono text-zinc-400 select-none">
              <span>{formatTime(videoRef.current?.currentTime || 0)}</span>
              <span className="mx-1 opacity-50">/</span>
              <span>{formatTime(videoRef.current?.duration || 0)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 outline-none"
              />
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={handleFullscreen}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
