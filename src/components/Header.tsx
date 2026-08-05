import React, { useState } from 'react';
import { 
  Download, 
  Globe, 
  Languages, 
  Activity, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Music, 
  FileText, 
  Sparkles,
  X,
  History,
  Film
} from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { HistoryModal } from './HistoryModal';
import { ExportVideoModal } from './ExportVideoModal';

export function Header() {
  const { project, subtitles, taskManager, clearProject } = useStore();
  const [showDetailedTasks, setShowDetailedTasks] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const detectedLangs = Array.from(new Set(subtitles.map(s => s.detectedLanguageCode.toUpperCase()))).join(', ');
  const { isProcessing, overallProgress, statusMessage, stages, currentStage } = taskManager;

  return (
    <>
      <header className="relative flex flex-col bg-[#161618] border-b border-[#313135] shrink-0 z-50">
        {/* Top Header Main Bar */}
        <div className="flex items-center justify-between h-11 px-4 text-[11px]">
          {/* Brand & Target Language */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#00F5FF] rounded-sm shadow-[0_0_8px_rgba(0,245,255,0.6)]"></div>
              <h1 className="font-bold tracking-tight text-white uppercase text-[11px]">NeuralDub Pro</h1>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-[#00F5FF] font-mono font-bold flex items-center gap-1">
              <Globe className="w-2.5 h-2.5 text-[#00F5FF]" /> TARGET: ENGLISH (EN-US)
            </span>
          </div>

          {/* Center Section: Real-time Pipeline Progress Tracker */}
          <div className="flex-1 max-w-xl mx-4">
            <div className="flex flex-col gap-1">
              {/* Real-time status header line */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2 overflow-hidden">
                  <button 
                    onClick={() => setShowDetailedTasks(!showDetailedTasks)}
                    className="flex items-center gap-1 text-slate-300 hover:text-white font-bold uppercase transition-colors"
                  >
                    <Activity className={cn("w-3 h-3", isProcessing ? "text-[#00F5FF] animate-pulse" : "text-emerald-400")} />
                    <span>Pipeline Task Manager</span>
                    {showDetailedTasks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400 truncate text-[9.5px]">
                    {statusMessage}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "font-bold px-1.5 py-0.2 rounded text-[9px]",
                    isProcessing ? "bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/30" : 
                    currentStage === 'completed' ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                    currentStage === 'error' ? "bg-red-950 text-red-400 border border-red-800" : "bg-slate-800 text-slate-400"
                  )}>
                    {overallProgress}%
                  </span>
                </div>
              </div>

              {/* Stage Progress Bar Container */}
              <div 
                onClick={() => setShowDetailedTasks(!showDetailedTasks)}
                className="relative w-full h-2 bg-[#0A0A0B] rounded border border-[#313135] overflow-hidden cursor-pointer group"
              >
                {/* Animated Progress Fill */}
                <div 
                  className={cn(
                    "h-full transition-all duration-300 rounded-sm",
                    currentStage === 'error' ? "bg-red-500" :
                    currentStage === 'completed' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" :
                    "bg-gradient-to-r from-cyan-500 to-[#00F5FF] shadow-[0_0_8px_rgba(0,245,255,0.7)] animate-pulse"
                  )}
                  style={{ width: `${overallProgress}%` }}
                />

                {/* Stage Divider (50%) */}
                <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-[#161618]"></div>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 text-[10px]">
            <button 
              onClick={() => setShowHistoryModal(true)}
              className="font-bold text-[#00F5FF] hover:text-white bg-[#00F5FF]/10 hover:bg-[#00F5FF]/20 px-2.5 py-1 uppercase rounded border border-[#00F5FF]/30 transition-all flex items-center gap-1 text-[10px]"
            >
              <History className="w-3 h-3" />
              History
            </button>

            {(project || subtitles.length > 0) ? (
              <>
                <div className="hidden lg:flex items-center gap-2 bg-[#0A0A0B] px-2 py-1 rounded border border-[#313135]">
                  <Languages className="w-3 h-3 text-amber-400" />
                  <span className="text-[9.5px] font-mono text-amber-300">
                    [{detectedLangs || 'MULTI'}] → EN
                  </span>
                </div>

                <button 
                  onClick={clearProject}
                  className="font-bold text-slate-400 hover:text-white px-2 py-1 uppercase rounded hover:bg-[#1A1A1D] transition-colors flex items-center"
                >
                  Close Project
                </button>

                <button 
                  onClick={() => setShowExportModal(true)}
                  className="px-3.5 py-1 bg-[#00F5FF] text-black font-bold uppercase hover:bg-white transition-all flex items-center rounded-sm text-[10px] shadow-[0_0_12px_rgba(0,245,255,0.4)] gap-1.5 animate-pulse"
                  title="Download the finished subtitled video or subtitle files (.SRT / .VTT)"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  Download Finished Product
                </button>
              </>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">No active project</span>
            )}
          </div>
        </div>

        {/* Translation Completion Action Banner */}
        {currentStage === 'completed' && subtitles.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-[#00F5FF]/10 to-emerald-950/80 border-t border-emerald-500/40 px-4 py-1.5 flex items-center justify-between text-[11px] animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Translation Complete! All subtitles formatted in Easy-Read English.</span>
            </div>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-0.5 bg-[#00F5FF] text-black font-extrabold uppercase rounded hover:bg-white transition-all flex items-center gap-1.5 text-[10px] shadow-[0_0_10px_rgba(0,245,255,0.5)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              Download Finished Product
            </button>
          </div>
        )}

        {/* Expanded Detailed Task Pipeline Drawer / Panel */}
        {showDetailedTasks && (
          <div className="bg-[#0D0D0E] border-t border-[#313135] p-3 px-6 shadow-2xl transition-all animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#26262a]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00F5FF]" />
                <h3 className="font-bold text-white uppercase text-[11px] tracking-wider">
                  Real-Time Neural Pipeline Processes
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({taskManager.activeTaskName})
                </span>
              </div>
              
              <button 
                onClick={() => setShowDetailedTasks(false)}
                className="text-slate-500 hover:text-white p-0.5 rounded hover:bg-[#1A1A1D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Stage 1: ASR Transcription */}
              <div className={cn(
                "p-2.5 rounded border transition-colors flex flex-col gap-1.5",
                stages.asr_transcription.status === 'in_progress' ? "bg-[#00F5FF]/5 border-[#00F5FF]/50" :
                stages.asr_transcription.status === 'completed' ? "bg-emerald-950/20 border-emerald-500/30" :
                "bg-[#141416] border-[#26262a]"
              )}>
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-white">
                    <Languages className="w-3.5 h-3.5 text-amber-400" />
                    <span>1. ASR Transcription</span>
                  </div>
                  {stages.asr_transcription.status === 'completed' ? (
                    <span className="flex items-center text-emerald-400 text-[9px] font-mono gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 100%
                    </span>
                  ) : stages.asr_transcription.status === 'in_progress' ? (
                    <span className="flex items-center text-amber-400 text-[9px] font-mono gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> {stages.asr_transcription.progress}%
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[9px] font-mono">Pending</span>
                  )}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">WhisperX Multi-Lingual Diarization</div>
                <p className="text-[9px] text-slate-500 leading-tight">
                  {stages.asr_transcription.detail}
                </p>
                <div className="w-full bg-[#000] h-1 rounded overflow-hidden mt-1">
                  <div 
                    className={cn("h-full transition-all", stages.asr_transcription.status === 'completed' ? "bg-emerald-400" : "bg-amber-400")} 
                    style={{ width: `${stages.asr_transcription.progress}%` }}
                  />
                </div>
              </div>

              {/* Stage 2: Translation to English */}
              <div className={cn(
                "p-2.5 rounded border transition-colors flex flex-col gap-1.5",
                stages.translation.status === 'in_progress' ? "bg-[#00F5FF]/5 border-[#00F5FF]/50" :
                stages.translation.status === 'completed' ? "bg-emerald-950/20 border-emerald-500/30" :
                "bg-[#141416] border-[#26262a]"
              )}>
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-white">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>2. English Translation</span>
                  </div>
                  {stages.translation.status === 'completed' ? (
                    <span className="flex items-center text-emerald-400 text-[9px] font-mono gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 100%
                    </span>
                  ) : stages.translation.status === 'in_progress' ? (
                    <span className="flex items-center text-emerald-400 text-[9px] font-mono gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> {stages.translation.progress}%
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[9px] font-mono">Pending</span>
                  )}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">Gemini 3.6 Flash Easy-Read Formatting</div>
                <p className="text-[9px] text-slate-500 leading-tight">
                  {stages.translation.detail}
                </p>
                <div className="w-full bg-[#000] h-1 rounded overflow-hidden mt-1">
                  <div 
                    className={cn("h-full transition-all", stages.translation.status === 'completed' ? "bg-emerald-400" : "bg-emerald-400")} 
                    style={{ width: `${stages.translation.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <HistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />
      <ExportVideoModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </>
  );
}
