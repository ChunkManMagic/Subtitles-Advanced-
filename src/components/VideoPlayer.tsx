import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize, Languages, Globe } from 'lucide-react';
import { useStore } from '../store';

export function VideoPlayer() {
  const { isPlaying, setIsPlaying, project, tracks, currentTime, setCurrentTime, subtitles, translationSettings } = useStore();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.play().catch(e => {
        console.warn('Playback prevented', e);
        setIsPlaying(false);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, setIsPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.currentTime >= (project?.duration || 0)) {
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  React.useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Find the video URL from tracks
  const videoTrack = tracks.find(t => t.type === 'video');
  const videoUrl = videoTrack?.items[0]?.url;

  // Active subtitle based on currentTime or playback
  const activeSub = subtitles.find(sub => currentTime >= sub.startTime && currentTime <= sub.endTime);

  const activeEnglishText = activeSub 
    ? (translationSettings.englishStyle === 'simple' && activeSub.simpleEnglishText 
        ? activeSub.simpleEnglishText 
        : activeSub.translatedText)
    : "";

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-[#000] relative">
      <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
        <div className="aspect-video w-full max-w-4xl bg-[#111] border border-[#313135] relative overflow-hidden flex items-center justify-center group shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
          {videoUrl ? (
            <video 
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              controls={false}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <div className="text-slate-600 font-mono text-[80px] opacity-10">PREVIEW</div>
          )}
          
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Live Proxy</span>
            <span className="bg-black/80 text-[#00F5FF] border border-[#313135] px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center gap-1">
              <Globe className="w-2.5 h-2.5" /> 🇺🇸 ENGLISH SUBTITLED
            </span>
          </div>

          <div className="absolute top-3 right-3 flex gap-1.5">
            {activeSub && (
              <span className="bg-black/80 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[9px] font-mono flex items-center gap-1">
                <Languages className="w-2.5 h-2.5" /> Source: {activeSub.detectedLanguage} (Auto-Detected)
              </span>
            )}
          </div>

          {/* Subtitle Overlay in Easy-to-Understand English Format */}
          {activeSub && (
            <div className="absolute bottom-8 px-6 w-full text-center">
              <div className="inline-block bg-black/85 border border-[#00F5FF]/60 text-white py-2 px-5 text-base md:text-lg font-bold rounded-lg shadow-2xl backdrop-blur-md max-w-2xl leading-snug">
                <span className="text-yellow-300 drop-shadow-sm font-sans">{activeEnglishText}</span>
              </div>

              <div className="flex items-center justify-center gap-3 text-[9px] font-mono mt-1.5">
                <span className="text-[#00F5FF] bg-black/60 border border-[#313135] px-2 py-0.5 rounded">
                  Format: Easy Read ({translationSettings.englishStyle.toUpperCase()})
                </span>
                <span className="text-emerald-400 bg-black/60 border border-[#313135] px-2 py-0.5 rounded">
                  CPS: {activeSub.cps || '14.2'} ({activeSub.readingDifficulty || 'Easy'})
                </span>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-0 w-full h-1 bg-slate-800">
            <div className="h-full bg-[#00F5FF] w-1/3 shadow-[0_0_10px_#00F5FF]"></div>
          </div>
        </div>
      </div>

      {/* Player Controls */}
      <div className="h-10 bg-[#161618] border-t border-[#313135] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-2">
          <button 
            className="text-slate-400 hover:text-white transition-colors p-1.5"
            onClick={() => handleSeek(Math.max(0, currentTime - 5))}
            title="Skip Back 5s"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button 
            className="px-2.5 py-1 bg-slate-800 text-[10px] text-white font-bold uppercase rounded hover:bg-slate-700 flex items-center gap-1.5 border border-[#313135]"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="w-3 h-3 text-[#00F5FF]" /> : <Play className="w-3 h-3 text-[#00F5FF]" />}
            {isPlaying ? 'Pause' : 'Play Video'}
          </button>
          <button 
            className="text-slate-400 hover:text-white transition-colors p-1.5"
            onClick={() => handleSeek(Math.min(project?.duration || 0, currentTime + 5))}
            title="Skip Forward 5s"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          
          <div className="font-mono text-[#00F5FF] text-[10px] ml-4 bg-[#000] px-2 py-0.5 rounded border border-[#313135]">
            00:00:{(currentTime % 60).toFixed(1).padStart(4, '0')} / 00:00:{(project?.duration || 22.0).toFixed(1).padStart(4, '0')}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-400 text-[10px]">
          <span className="font-mono text-slate-500 uppercase">Video Audio: Original Sound</span>
          <button 
            className="hover:text-white transition-colors"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = !videoRef.current.muted;
              }
            }}
            title="Toggle Mute"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button 
            className="hover:text-white transition-colors"
            onClick={() => {
              if (containerRef.current) {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  containerRef.current.requestFullscreen();
                }
              }
            }}
            title="Toggle Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

