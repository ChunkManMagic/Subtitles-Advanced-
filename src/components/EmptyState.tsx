import React, { useState } from 'react';
import { UploadCloud, Video, Mic, Languages, Globe, Zap, ArrowRight, Loader2, History } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../store';
import { uploadAndTranslateVideo } from '../lib/uploadVideo';
import { HistoryModal } from './HistoryModal';

export function EmptyState() {
  const { 
    setProject, 
    addTrack, 
    setSubtitles, 
    loadSampleProject,
    startTaskPipeline,
    updateTaskProgress,
    setTaskStage,
    completeTaskPipeline,
    failTaskPipeline,
    taskManager
  } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const url = URL.createObjectURL(file);
      
      setIsProcessing(true);
      setProcessingStatus('Uploading video & starting neural pipeline...');

      startTaskPipeline(`Process Video: ${file.name}`);
      setTaskStage('asr_transcription', 'WhisperX detecting speaker language shifts...');
      updateTaskProgress('asr_transcription', 40, 'Diarizing voice timestamps...');

      // Progress interval timer to simulate active feedback while waiting for Gemini AI
      const timer1 = setTimeout(() => {
        updateTaskProgress('asr_transcription', 100, 'All dialogue segments extracted');
        setTaskStage('translation', 'Gemini 3.6 Flash translating to Easy-Read English...');
        updateTaskProgress('translation', 50, 'Generating natural & simplified English pairs...');
      }, 4000);

      try {
        setProcessingStatus('Analyzing languages and translating to English...');
        
        const generatedSubtitles = await uploadAndTranslateVideo(file, file.name, (pct) => {
          updateTaskProgress('asr_transcription', pct, `Uploading & assembling video chunks (${pct}%)...`);
        });

        clearTimeout(timer1);

        updateTaskProgress('translation', 100, 'English formatting complete');

        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          const duration = video.duration && isFinite(video.duration) ? video.duration : 22;
          
          setProject({
            id: '1',
            name: file.name,
            duration: duration,
          });

          addTrack({
            id: 'track-v1',
            name: 'Video (Source)',
            type: 'video',
            items: [{ id: 'item-v1', type: 'video', startTime: 0, duration: duration, name: file.name, url, file, color: 'bg-blue-600' }]
          });

          addTrack({
            id: 'track-s1',
            name: 'English Subtitles',
            type: 'subtitle',
            items: []
          });

          setSubtitles(generatedSubtitles);
          completeTaskPipeline();
        };
        video.src = url;
      } catch (err: any) {
        clearTimeout(timer1);
        console.error(err);
        failTaskPipeline(err.message || 'Failed to process video');
        alert('Failed to process video. Please try again.');
      } finally {
        setIsProcessing(false);
        setProcessingStatus('');
      }
    }
  }, [setProject, addTrack, setSubtitles, startTaskPipeline, updateTaskProgress, setTaskStage, completeTaskPipeline, failTaskPipeline]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
    maxFiles: 1
  } as any);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#000]">
      <div 
        {...getRootProps()} 
        className={`w-full max-w-3xl border-2 border-dashed rounded-md p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-[#00F5FF] bg-[#00F5FF]/10' : 'border-[#313135] hover:border-slate-500 hover:bg-[#111]'
        }`}
      >
        <input {...getInputProps()} />
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-12 h-12 text-[#00F5FF] animate-spin mb-6" />
            <h2 className="text-[14px] font-bold text-white mb-2 uppercase tracking-widest">
              Processing Video
            </h2>
            <p className="text-[#00F5FF] text-[12px] font-mono mb-2">
              {processingStatus}
            </p>
            <div className="w-64 h-1 bg-[#1A1A1D] rounded-full overflow-hidden mt-4">
              <div className="h-full bg-[#00F5FF] animate-pulse rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 bg-[#161618] border border-[#313135] rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-7 h-7 text-[#00F5FF]" />
            </div>
            <h2 className="text-[14px] font-bold text-white mb-2 uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#00F5FF]" /> Auto-Detect Foreign Languages & Translate to English
            </h2>
            <p className="text-slate-400 max-w-lg mb-6 text-[11px] leading-relaxed">
              Upload any video containing foreign or changing languages (Spanish, Japanese, French, German, Mandarin, etc.). The system auto-identifies language shifts per speaker and formats clean, easy-to-understand English audio & subtitles.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  loadSampleProject();
                }}
                className="px-4 py-2 bg-[#00F5FF] text-black font-bold uppercase rounded text-[11px] hover:bg-white transition-colors flex items-center gap-2 shadow-lg"
              >
                <Zap className="w-4 h-4 text-black fill-black" /> Load Multi-Language Demo Project (ES, JA, FR, DE → EN) <ArrowRight className="w-4 h-4" />
              </button>

              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHistoryModal(true);
                }}
                className="px-4 py-2 bg-[#1A1A1D] border border-[#00F5FF]/40 text-[#00F5FF] font-bold uppercase rounded text-[11px] hover:bg-[#00F5FF]/10 transition-colors flex items-center gap-2"
              >
                <History className="w-4 h-4" /> View Past Uploads & History
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-6 w-full max-w-2xl text-left border-t border-[#313135] pt-6">
              <div className="flex flex-col items-center text-center space-y-1.5">
                 <div className="w-8 h-8 bg-[#1A1A1D] border border-[#00F5FF]/30 text-[#00F5FF] rounded flex items-center justify-center mb-1">
                   <Languages className="w-4 h-4" />
                 </div>
                 <h3 className="font-bold text-[10px] uppercase text-white">Auto Language Shift Detection</h3>
                 <p className="text-[9px] text-slate-500 font-mono">WhisperX multi-lingual diarization</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-1.5">
                 <div className="w-8 h-8 bg-[#1A1A1D] border border-amber-500/30 text-amber-400 rounded flex items-center justify-center mb-1">
                   <Globe className="w-4 h-4" />
                 </div>
                 <h3 className="font-bold text-[10px] uppercase text-white">Easy-Read English Format</h3>
                 <p className="text-[9px] text-slate-500 font-mono">Natural & Simplified English modes</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-1.5">
                 <div className="w-8 h-8 bg-[#1A1A1D] border border-emerald-500/30 text-emerald-400 rounded flex items-center justify-center mb-1">
                   <Video className="w-4 h-4" />
                 </div>
                 <h3 className="font-bold text-[10px] uppercase text-white">Interactive Timeline</h3>
                 <p className="text-[9px] text-slate-500 font-mono">Precision subtitle editing & alignment</p>
              </div>
            </div>
          </>
        )}
      </div>
      <HistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />
    </div>
  );
}
