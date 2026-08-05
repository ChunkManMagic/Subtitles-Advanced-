import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Maximize, 
  Languages, 
  Globe, 
  Move, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Download, 
  Sliders,
  Type
} from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { ExportVideoModal } from './ExportVideoModal';

export function VideoPlayer() {
  const { 
    isPlaying, 
    setIsPlaying, 
    project, 
    tracks, 
    currentTime, 
    setCurrentTime, 
    subtitles, 
    translationSettings,
    subtitleStyleSettings,
    updateSubtitleStyleSettings
  } = useStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [isDraggingSubtitle, setIsDraggingSubtitle] = useState(false);
  const [showPlacementToolbar, setShowPlacementToolbar] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Find video track
  const videoTrack = tracks.find(t => t.type === 'video');
  const videoUrl = videoTrack?.items[0]?.url;

  // Active subtitle
  const activeSub = subtitles.find(sub => currentTime >= sub.startTime && currentTime <= sub.endTime);

  const activeEnglishText = activeSub 
    ? (translationSettings.englishStyle === 'simple' && activeSub.simpleEnglishText 
        ? activeSub.simpleEnglishText 
        : activeSub.translatedText)
    : "";

  const togglePlay = () => setIsPlaying(!isPlaying);

  // Dragging logic for Subtitle Box
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSubtitle(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSubtitle || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = Math.min(95, Math.max(5, Math.round((x / rect.width) * 100)));
    const yPercent = Math.min(95, Math.max(5, Math.round((y / rect.height) * 100)));

    updateSubtitleStyleSettings({
      position: 'custom',
      xOffsetPercent: xPercent,
      yOffsetPercent: yPercent
    });
  };

  const handleMouseUp = () => {
    setIsDraggingSubtitle(false);
  };

  // Font size mapping to Tailwind classes
  const getFontSizeClass = () => {
    switch (subtitleStyleSettings.fontSize) {
      case 'small': return 'text-xs md:text-sm py-1 px-3';
      case 'large': return 'text-lg md:text-xl py-2.5 px-6';
      case 'xlarge': return 'text-xl md:text-2xl py-3 px-8';
      case 'medium':
      default:
        return 'text-base md:text-lg py-2 px-5';
    }
  };

  // Background style mapping
  const getBgStyleClass = () => {
    switch (subtitleStyleSettings.bgStyle) {
      case 'solid_black': return 'bg-black/95 text-yellow-300 border border-slate-700';
      case 'yellow_box': return 'bg-yellow-400 text-black font-bold border border-yellow-500 shadow-xl';
      case 'text_shadow': return 'bg-transparent text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]';
      case 'transparent': return 'bg-black/40 backdrop-blur-sm text-white';
      case 'dark_glass':
      default:
        return 'bg-black/85 border border-[#00F5FF]/60 text-yellow-300 backdrop-blur-md shadow-2xl';
    }
  };

  // Text color mapping
  const getTextColorClass = () => {
    if (subtitleStyleSettings.bgStyle === 'yellow_box') return 'text-black';
    switch (subtitleStyleSettings.textColor) {
      case 'white': return 'text-white';
      case 'cyan': return 'text-[#00F5FF]';
      case 'lime': return 'text-emerald-400';
      case 'yellow':
      default:
        return 'text-yellow-300';
    }
  };

  return (
    <>
      <div ref={containerRef} className="flex-1 flex flex-col bg-[#000] relative select-none">
        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
          <div 
            ref={stageRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="aspect-video w-full max-w-4xl bg-[#111] border border-[#313135] relative overflow-hidden flex items-center justify-center group shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
            
            {videoUrl ? (
              <video 
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain pointer-events-none"
                controls={false}
                onTimeUpdate={handleTimeUpdate}
              />
            ) : (
              <div className="text-slate-600 font-mono text-[80px] opacity-10 pointer-events-none">PREVIEW</div>
            )}
            
            {/* Top Left Status */}
            <div className="absolute top-3 left-3 flex gap-2 z-10">
              <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Live Preview</span>
              <span className="bg-black/80 text-[#00F5FF] border border-[#313135] px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" /> ENGLISH EASY-READ SUBTITLES
              </span>
            </div>

            {/* Placement Quick Bar Trigger */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button
                onClick={() => setShowPlacementToolbar(!showPlacementToolbar)}
                className="bg-black/80 hover:bg-[#1A1A1D] text-[#00F5FF] border border-[#00F5FF]/40 px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg transition-all"
                title="Edit Subtitle Placement & Styling"
              >
                <Sliders className="w-3 h-3" /> Subtitle Placement & Style
              </button>
            </div>

            {/* Quick Placement Overlay Toolbar */}
            {showPlacementToolbar && (
              <div className="absolute top-12 right-3 z-20 bg-[#141416]/95 border border-[#313135] rounded-xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2.5 text-xs text-white max-w-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-[#26262a] pb-1.5">
                  <span className="font-bold text-[10px] uppercase text-[#00F5FF] flex items-center gap-1">
                    <Move className="w-3 h-3" /> Subtitle Placement Controls
                  </span>
                  <button 
                    onClick={() => setShowPlacementToolbar(false)}
                    className="text-slate-400 hover:text-white text-[10px] uppercase font-bold"
                  >
                    Close
                  </button>
                </div>

                {/* Vertical Presets */}
                <div>
                  <label className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Vertical Placement Preset</label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => updateSubtitleStyleSettings({ position: 'top', yOffsetPercent: 12 })}
                      className={cn(
                        "py-1 px-2 text-[9px] font-bold uppercase rounded border transition-colors",
                        subtitleStyleSettings.yOffsetPercent <= 25 ? "bg-[#00F5FF]/20 text-[#00F5FF] border-[#00F5FF]" : "bg-[#0A0A0B] border-[#313135] text-slate-400"
                      )}
                    >
                      Top (12%)
                    </button>
                    <button
                      onClick={() => updateSubtitleStyleSettings({ position: 'middle', yOffsetPercent: 50 })}
                      className={cn(
                        "py-1 px-2 text-[9px] font-bold uppercase rounded border transition-colors",
                        subtitleStyleSettings.yOffsetPercent > 25 && subtitleStyleSettings.yOffsetPercent < 75 ? "bg-[#00F5FF]/20 text-[#00F5FF] border-[#00F5FF]" : "bg-[#0A0A0B] border-[#313135] text-slate-400"
                      )}
                    >
                      Center (50%)
                    </button>
                    <button
                      onClick={() => updateSubtitleStyleSettings({ position: 'bottom', yOffsetPercent: 85 })}
                      className={cn(
                        "py-1 px-2 text-[9px] font-bold uppercase rounded border transition-colors",
                        subtitleStyleSettings.yOffsetPercent >= 75 ? "bg-[#00F5FF]/20 text-[#00F5FF] border-[#00F5FF]" : "bg-[#0A0A0B] border-[#313135] text-slate-400"
                      )}
                    >
                      Bottom (85%)
                    </button>
                  </div>
                </div>

                {/* Y-Offset Slider */}
                <div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mb-0.5">
                    <span>Vertical Y-Offset</span>
                    <span className="text-[#00F5FF]">{subtitleStyleSettings.yOffsetPercent}%</span>
                  </div>
                  <input 
                    type="range"
                    min={5}
                    max={92}
                    value={subtitleStyleSettings.yOffsetPercent}
                    onChange={(e) => updateSubtitleStyleSettings({ position: 'custom', yOffsetPercent: Number(e.target.value) })}
                    className="w-full accent-[#00F5FF] h-1.5 bg-[#000] rounded cursor-pointer"
                  />
                </div>

                {/* Font Size & Background Style */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#26262a]">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Font Size</label>
                    <select
                      value={subtitleStyleSettings.fontSize}
                      onChange={(e) => updateSubtitleStyleSettings({ fontSize: e.target.value as any })}
                      className="w-full bg-[#000] border border-[#313135] rounded py-1 px-1.5 text-[10px] text-white"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="xlarge">Extra Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Box Style</label>
                    <select
                      value={subtitleStyleSettings.bgStyle}
                      onChange={(e) => updateSubtitleStyleSettings({ bgStyle: e.target.value as any })}
                      className="w-full bg-[#000] border border-[#313135] rounded py-1 px-1.5 text-[10px] text-white"
                    >
                      <option value="dark_glass">Dark Glass</option>
                      <option value="solid_black">Solid Black</option>
                      <option value="yellow_box">Yellow Box</option>
                      <option value="text_shadow">Text Shadow</option>
                    </select>
                  </div>
                </div>

                <p className="text-[9px] text-amber-300 font-mono bg-amber-950/40 p-1.5 rounded border border-amber-800/50 flex items-center gap-1">
                  <Move className="w-3 h-3 text-amber-400 shrink-0" />
                  Tip: Click & drag the subtitle box directly to place it anywhere on screen!
                </p>
              </div>
            )}

            {/* Subtitle Overlay with Draggable Position */}
            {activeSub && (
              <div 
                style={{
                  position: 'absolute',
                  top: `${subtitleStyleSettings.yOffsetPercent}%`,
                  left: `${subtitleStyleSettings.xOffsetPercent}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '90%',
                  maxWidth: '48rem',
                  textAlign: subtitleStyleSettings.alignment || 'center',
                  zIndex: 30
                }}
                className="cursor-move group/sub"
                onMouseDown={handleMouseDown}
                title="Click and drag to reposition subtitles on screen"
              >
                <div className={cn(
                  "inline-block rounded-lg font-bold transition-all relative",
                  getFontSizeClass(),
                  getBgStyleClass(),
                  isDraggingSubtitle ? "ring-2 ring-[#00F5FF] scale-105" : "hover:ring-1 hover:ring-[#00F5FF]/80"
                )}>
                  {/* Drag Handle Indicator on Hover */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/sub:opacity-100 transition-opacity bg-[#00F5FF] text-black text-[8px] font-mono font-bold px-1.5 py-0.2 rounded flex items-center gap-1 shadow">
                    <Move className="w-2.5 h-2.5" /> DRAG TO MOVE
                  </div>

                  <span className={cn("font-sans leading-snug drop-shadow-sm", getTextColorClass())}>
                    {activeEnglishText}
                  </span>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-0 w-full h-1 bg-slate-800 pointer-events-none">
              <div 
                className="h-full bg-[#00F5FF] shadow-[0_0_10px_#00F5FF] transition-all duration-150"
                style={{ width: `${project?.duration ? (currentTime / project.duration) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="h-11 bg-[#161618] border-t border-[#313135] flex items-center justify-between px-4 shrink-0">
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
            
            <div className="font-mono text-[#00F5FF] text-[10px] ml-2 bg-[#000] px-2 py-0.5 rounded border border-[#313135]">
              00:00:{(currentTime % 60).toFixed(1).padStart(4, '0')} / 00:00:{(project?.duration || 22.0).toFixed(1).padStart(4, '0')}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-400 text-[10px]">
            {/* Download Finished Product Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-1 bg-[#00F5FF] text-black font-bold uppercase rounded text-[10px] hover:bg-white transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,245,255,0.3)] shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Download Finished Product
            </button>

            <button 
              className="hover:text-white transition-colors p-1"
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
              className="hover:text-white transition-colors p-1"
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

      <ExportVideoModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </>
  );
}


