import React from 'react';
import { Video, Mic, Subtitles, Plus, ZoomIn, ZoomOut, Scissors, Copy, Trash2, Languages } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';

import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';

export function Timeline() {
  const { tracks, zoom, setZoom, currentTime, setCurrentTime, project, subtitles, translationSettings } = useStore();
  const timelineRef = React.useRef<HTMLDivElement>(null);
  
  const pixelsPerSecond = 60 * zoom;
  const duration = project?.duration || 24;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const time = clickX / pixelsPerSecond;
    setCurrentTime(Math.min(duration, Math.max(0, time)));
  };

  return (
    <div className="h-full flex flex-col bg-[#0F0F11] select-none text-[11px]">
      {/* Timeline Toolbar */}
      <div className="h-8 border-b border-[#313135] bg-[#161618] flex items-center justify-between px-2">
        <div className="flex items-center space-x-1">
          <span className="text-[9px] font-mono text-[#00F5FF]">AUTODETECT ALIGNMENT: 99.4% MATCH</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-[9px] text-slate-500 uppercase font-mono">Zoom</span>
          <button 
            className="p-1 text-slate-400 hover:text-white"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <input 
            type="range" 
            min="0.5" 
            max="2.5" 
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-16 accent-[#00F5FF]"
          />
          <button 
            className="p-1 text-slate-400 hover:text-white"
            onClick={() => setZoom(Math.min(2.5, zoom + 0.2))}
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Tracks Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div className="w-36 border-r border-[#313135] bg-[#0A0A0B] flex flex-col shrink-0 z-10">
          <div className="h-6 border-b border-[#1A1A1D] flex items-center px-2 shrink-0 bg-[#0A0A0B]">
             <span className="text-[9px] uppercase font-bold text-slate-500">Track Stems</span>
          </div>
          {tracks.map(track => (
            <div key={track.id} className="h-10 border-b border-[#1A1A1D] flex items-center justify-between px-2 shrink-0 group">
              <div className="flex items-center text-[9px] uppercase font-bold text-slate-400 truncate group-hover:text-white">
                {track.type === 'video' ? <Video className="w-3 h-3 mr-1 text-blue-400 shrink-0" /> :
                 track.type === 'subtitle' ? <Subtitles className="w-3 h-3 mr-1 text-[#00F5FF] shrink-0" /> :
                 <Mic className="w-3 h-3 mr-1 text-emerald-400 shrink-0" />}
                <span className="truncate">{track.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Canvas */}
        <div 
          className="flex-1 overflow-auto relative bg-[#0F0F11] cursor-text" 
          ref={timelineRef}
          onMouseDown={(e) => handleTimelineClick(e)}
        >
          {/* Ruler */}
          <div className="h-6 border-b border-[#313135] sticky top-0 bg-[#0F0F11]/95 z-10 flex items-end overflow-hidden backdrop-blur-sm" style={{ width: Math.max(duration * pixelsPerSecond, 800) }}>
             {Array.from({ length: Math.ceil(duration / 2) }).map((_, i) => (
               <div key={i} className="absolute bottom-0 text-[9px] text-slate-500 border-l border-[#313135] h-2 pl-1 font-mono" style={{ left: i * 2 * pixelsPerSecond }}>
                 00:{(i * 2).toString().padStart(2, '0')}s
               </div>
             ))}
          </div>
          
          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-[#00F5FF] z-20 pointer-events-none shadow-[0_0_8px_#00F5FF]"
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
          >
            <div className="w-2 h-2 bg-[#00F5FF] rotate-45 -ml-0.75 -mt-1"></div>
          </div>

          {/* Track Rows */}
          <div className="relative" style={{ width: Math.max(duration * pixelsPerSecond, 800) }}>
            {tracks.map((track) => (
              <div key={track.id} className="h-10 relative border-b border-[#1A1A1D] flex items-center">
                {/* Standard track items */}
                {track.items.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "absolute h-7 rounded border flex items-center px-2 overflow-hidden group cursor-pointer transition-colors text-[9px]",
                      track.type === 'video' ? 'bg-blue-900/40 border-blue-500/50 text-blue-200' : 
                      item.name.includes('Isolated') ? 'bg-slate-800/80 border-slate-600 text-slate-300' :
                      'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    )}
                    style={{
                      left: `${item.startTime * pixelsPerSecond}px`,
                      width: `${item.duration * pixelsPerSecond}px`
                    }}
                  >
                    <div className="font-mono truncate w-full flex items-center justify-between">
                      <span>{item.name}</span>
                      {track.type === 'audio' && <span className="text-[8px] opacity-60 ml-2">48kHz</span>}
                    </div>
                  </div>
                ))}

                {/* Subtitle track items with auto-detected source language flags */}
                {track.type === 'subtitle' && subtitles.map(sub => {
                  const displayText = translationSettings.englishStyle === 'simple' && sub.simpleEnglishText 
                    ? sub.simpleEnglishText 
                    : sub.translatedText;

                  return (
                    <div
                      key={sub.id}
                      title={`Original (${sub.detectedLanguage}): "${sub.originalText}" -> English: "${displayText}"`}
                      className={cn(
                        "absolute h-7 rounded border flex items-center justify-between px-1.5 group cursor-pointer transition-all shadow-sm",
                        sub.languageShift 
                          ? "bg-amber-950/60 border-amber-500/70 text-amber-200 hover:bg-amber-900/80" 
                          : "bg-cyan-950/60 border-[#00F5FF]/60 text-cyan-200 hover:bg-cyan-900/80"
                      )}
                      style={{
                        left: `${sub.startTime * pixelsPerSecond}px`,
                        width: `${(sub.endTime - sub.startTime) * pixelsPerSecond}px`
                      }}
                    >
                      <span className="bg-black/60 text-[#00F5FF] text-[8px] px-1 py-0.2 rounded font-mono font-bold mr-1 shrink-0 flex items-center gap-0.5 border border-[#313135]">
                        {(sub.detectedLanguageCode || sub.detectedLanguage || 'EN').toUpperCase()}
                      </span>

                      <span className="text-[9px] font-sans font-medium truncate flex-1 text-white">
                        {displayText}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

