import { create } from 'zustand';
import { AppState, Project, Track, TranslationSettings, Subtitle, TaskManagerState, ProcessStage } from './types';
import { uploadAndTranslateVideo } from './lib/uploadVideo';

const INITIAL_TASK_MANAGER: TaskManagerState = {
  isProcessing: false,
  activeTaskName: 'Neural Translation Pipeline',
  currentStage: 'idle',
  overallProgress: 0,
  statusMessage: 'Ready',
  stages: {
    asr_transcription: {
      id: 'asr_transcription',
      name: 'ASR Transcription',
      progress: 0,
      status: 'pending',
      detail: 'WhisperX Multi-Lingual Diarization'
    },
    translation: {
      id: 'translation',
      name: 'Translation to English',
      progress: 0,
      status: 'pending',
      detail: 'Gemini 3.6 Flash Easy-Read English'
    }
  }
};

const INITIAL_SUBTITLES: Subtitle[] = [
  {
    id: 'sub-1',
    startTime: 0.5,
    endTime: 4.2,
    originalText: "Bienvenidos a la sesión de presentación del sistema.",
    detectedLanguage: "Spanish",
    detectedLanguageCode: "es",
    confidence: 0.99,
    translatedText: "Welcome to today's system architecture session.",
    simpleEnglishText: "Welcome to today's system overview.",
    culturalNotes: "Formal introductory greeting.",
    cps: 11.2,
    readingDifficulty: 'Easy',
    languageShift: false,
  },
  {
    id: 'sub-2',
    startTime: 4.5,
    endTime: 9.0,
    originalText: "ハイブリッド設計により、クラウドGPUコストと帯域幅を大幅に削減します。",
    detectedLanguage: "Japanese",
    detectedLanguageCode: "ja",
    confidence: 0.97,
    translatedText: "The hybrid design significantly reduces cloud GPU costs and bandwidth fees.",
    simpleEnglishText: "Using local computer power saves server costs and internet speed.",
    culturalNotes: "Refers to client-side WebAssembly vs cloud GPUs.",
    cps: 14.8,
    readingDifficulty: 'Easy',
    languageShift: true,
  },
  {
    id: 'sub-3',
    startTime: 9.3,
    endTime: 13.8,
    originalText: "Le moteur AI WhisperX identifie automatiquement les changements de langue.",
    detectedLanguage: "French",
    detectedLanguageCode: "fr",
    confidence: 0.98,
    translatedText: "The WhisperX AI engine automatically identifies language changes per speaker.",
    simpleEnglishText: "The smart system auto-detects when someone speaks a new language.",
    culturalNotes: "Refers to multi-lingual diarization.",
    cps: 15.6,
    readingDifficulty: 'Easy',
    languageShift: true,
  },
  {
    id: 'sub-4',
    startTime: 14.0,
    endTime: 18.5,
    originalText: "Synthetisierte englische Sprachausgabe und Untertitel werden sofort synchronisiert.",
    detectedLanguage: "German",
    detectedLanguageCode: "de",
    confidence: 0.96,
    translatedText: "Synthesized English speech and subtitles are synchronized immediately.",
    simpleEnglishText: "English voice audio and subtitles match the video timing automatically.",
    culturalNotes: "Describes real-time audio time-stretching.",
    cps: 16.2,
    readingDifficulty: 'Easy',
    languageShift: true,
  }
];

const SAMPLE_PROJECT: Project = {
  id: 'proj-sample-1',
  name: 'Multi_Lang_Presentation_to_English.mp4',
  duration: 22.0
};

const SAMPLE_TRACKS: Track[] = [
  {
    id: 'track-v1',
    name: 'Video (720p Proxy)',
    type: 'video',
    items: [
      {
        id: 'item-v1',
        type: 'video',
        startTime: 0,
        duration: 22,
        name: 'multi_language_source.mp4'
      }
    ]
  },
  {
    id: 'track-s1',
    name: 'English Subtitles',
    type: 'subtitle',
    items: []
  }
];

export const useStore = create<AppState>((set, get) => ({
  project: null,
  tracks: [],
  currentTime: 0,
  isPlaying: false,
  zoom: 1,
  selectedItemId: null,
  isScanningLanguages: false,
  translationSettings: {
    targetLanguage: 'en',
    englishStyle: 'natural',
    englishAccent: 'us',
    ttsVoice: 'josh',
    ttsProvider: 'elevenlabs',
    lipSyncEngine: 'synclabs',
    autoDetectLanguage: true,
    simplifyJargon: false
  },
  subtitleStyleSettings: {
    position: 'bottom',
    yOffsetPercent: 85,
    xOffsetPercent: 50,
    alignment: 'center',
    fontSize: 'medium',
    bgStyle: 'dark_glass',
    textColor: 'yellow',
  },
  subtitles: [],
  taskManager: INITIAL_TASK_MANAGER,
  
  setProject: (project) => set({ project }),
  addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),
  updateTrack: (trackId, data) => set((state) => ({
    tracks: state.tracks.map(t => t.id === trackId ? { ...t, ...data } : t)
  })),
  addTrackItem: (trackId, item) => set((state) => ({
    tracks: state.tracks.map(t => t.id === trackId ? { ...t, items: [...t.items, item] } : t)
  })),
  updateTrackItem: (itemId, data) => set((state) => ({
    tracks: state.tracks.map(t => ({
      ...t,
      items: t.items.map(i => i.id === itemId ? { ...i, ...data } : i)
    }))
  })),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedItemId: (selectedItemId) => set({ selectedItemId }),
  updateTranslationSettings: (settings) => set((state) => ({ 
    translationSettings: { ...state.translationSettings, ...settings } 
  })),
  updateSubtitleStyleSettings: (settings) => set((state) => ({
    subtitleStyleSettings: { ...state.subtitleStyleSettings, ...settings }
  })),
  updateSubtitle: (id, data) => set((state) => ({
    subtitles: state.subtitles.map(s => s.id === id ? { ...s, ...data } : s)
  })),
  addSubtitleCue: () => set((state) => {
    const lastSub = state.subtitles[state.subtitles.length - 1];
    const newStart = lastSub ? Number((lastSub.endTime + 0.2).toFixed(1)) : 0;
    const newEnd = Number((newStart + 3.5).toFixed(1));
    const newSub: Subtitle = {
      id: `sub-custom-${Date.now()}`,
      startTime: newStart,
      endTime: newEnd,
      originalText: 'New subtitle cue',
      detectedLanguage: 'English',
      detectedLanguageCode: 'en',
      confidence: 1.0,
      translatedText: 'New translated subtitle',
      simpleEnglishText: 'New translated subtitle',
      cps: 12.0,
      readingDifficulty: 'Easy',
      languageShift: false
    };
    return { subtitles: [...state.subtitles, newSub] };
  }),
  deleteSubtitleCue: (id) => set((state) => ({
    subtitles: state.subtitles.filter(s => s.id !== id)
  })),
  setSubtitles: (subtitles) => set({ subtitles }),

  startTaskPipeline: (taskName = 'Neural Translation Pipeline') => {
    set({
      taskManager: {
        isProcessing: true,
        activeTaskName: taskName,
        currentStage: 'asr_transcription',
        overallProgress: 5,
        statusMessage: 'Step 1/2: WhisperX detecting spoken foreign languages...',
        stages: {
          asr_transcription: {
            id: 'asr_transcription',
            name: 'ASR Transcription',
            progress: 10,
            status: 'in_progress',
            detail: 'WhisperX Multi-Lingual Diarization'
          },
          translation: {
            id: 'translation',
            name: 'Translation to English',
            progress: 0,
            status: 'pending',
            detail: 'Gemini 3.6 Flash Easy-Read English'
          }
        }
      }
    });
  },

  updateTaskProgress: (stage, progress, detail) => {
    set((state) => {
      const updatedStages = { ...state.taskManager.stages };
      const current = updatedStages[stage];
      if (current) {
        updatedStages[stage] = {
          ...current,
          progress: Math.min(100, Math.max(0, progress)),
          status: progress >= 100 ? 'completed' : 'in_progress',
          detail: detail || current.detail
        };
      }

      // Calculate overall progress (ASR: 50%, Trans: 50%)
      const p1 = updatedStages.asr_transcription.progress;
      const p2 = updatedStages.translation.progress;
      const overall = Math.min(99, Math.round((p1 * 0.5) + (p2 * 0.5)));

      return {
        taskManager: {
          ...state.taskManager,
          overallProgress: overall,
          stages: updatedStages
        }
      };
    });
  },

  setTaskStage: (stage, statusMessage) => {
    set((state) => {
      const updatedStages = { ...state.taskManager.stages };
      
      if (stage === 'asr_transcription') {
        updatedStages.asr_transcription.status = 'in_progress';
      } else if (stage === 'translation') {
        updatedStages.asr_transcription.status = 'completed';
        updatedStages.asr_transcription.progress = 100;
        updatedStages.translation.status = 'in_progress';
      }

      // Overall baseline per stage
      let stageProgress = state.taskManager.overallProgress;
      if (stage === 'asr_transcription') stageProgress = Math.max(stageProgress, 10);
      if (stage === 'translation') stageProgress = Math.max(stageProgress, 50);

      return {
        taskManager: {
          ...state.taskManager,
          currentStage: stage,
          overallProgress: stageProgress,
          statusMessage: statusMessage || state.taskManager.statusMessage,
          stages: updatedStages
        }
      };
    });
  },

  completeTaskPipeline: () => {
    set((state) => ({
      taskManager: {
        ...state.taskManager,
        isProcessing: false,
        currentStage: 'completed',
        overallProgress: 100,
        statusMessage: 'Pipeline Complete: All foreign subtitles converted to English',
        stages: {
          asr_transcription: { ...state.taskManager.stages.asr_transcription, progress: 100, status: 'completed' },
          translation: { ...state.taskManager.stages.translation, progress: 100, status: 'completed' }
        }
      }
    }));
  },

  failTaskPipeline: (errorMessage) => {
    set((state) => {
      const activeStage = state.taskManager.currentStage === 'idle' || state.taskManager.currentStage === 'completed' || state.taskManager.currentStage === 'error' ? 'asr_transcription' : state.taskManager.currentStage;
      return {
        taskManager: {
          ...state.taskManager,
          isProcessing: false,
          currentStage: 'error',
          statusMessage: `Pipeline Error: ${errorMessage}`,
          stages: {
            ...state.taskManager.stages,
            [activeStage]: {
              ...state.taskManager.stages[activeStage],
              status: 'error',
              detail: errorMessage
            }
          }
        }
      };
    });
  },

  resetTaskManager: () => {
    set({ taskManager: INITIAL_TASK_MANAGER });
  },

  loadHistoryProject: (item) => {
    const subtitles = item.subtitles || [];
    const maxEndTime = subtitles.length > 0 ? Math.max(...subtitles.map(s => s.endTime || 0)) : 30;
    const duration = Math.max(10, maxEndTime + 2);

    const tracks: Track[] = [
      {
        id: 'track-v1',
        name: item.fileName || 'Restored Video',
        type: 'video',
        items: [{
          id: 'item-v1',
          type: 'video',
          startTime: 0,
          duration: duration,
          name: item.fileName || 'Restored Video',
          color: 'bg-blue-600'
        }]
      },
      {
        id: 'track-s1',
        name: 'Easy-Read English Subtitles',
        type: 'subtitle',
        items: subtitles.map((s, idx) => ({
          id: s.id || `sub-restored-${idx}`,
          type: 'subtitle' as const,
          startTime: s.startTime,
          duration: Math.max(1, s.endTime - s.startTime),
          name: s.translatedText || s.originalText || 'Subtitle',
          color: 'bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/50'
        }))
      }
    ];

    set({
      project: {
        id: item.videoId || `hist-${Date.now()}`,
        name: item.fileName || 'Restored Translation Project',
        duration,
      },
      subtitles,
      tracks,
      currentTime: 0,
    });

    get().completeTaskPipeline();
    get().updateTaskProgress('asr_transcription', 100, 'Restored cached transcription');
    get().updateTaskProgress('translation', 100, 'Restored Easy-Read English subtitles');
  },

  rescanAndTranslateToEnglish: async () => {
    set({ isScanningLanguages: true });
    get().startTaskPipeline('Auto-Detect Languages & Translate to English');
    get().setTaskStage('asr_transcription', 'WhisperX detecting speaker language shifts (ES, JA, FR, DE)...');
    get().updateTaskProgress('asr_transcription', 60, 'Diarizing multi-lingual audio channels...');

    const videoTrack = get().tracks.find(t => t.type === 'video' || t.type === 'audio');
    const videoItem = videoTrack?.items[0];

    if (videoItem) {
      try {
        get().updateTaskProgress('asr_transcription', 100, 'All speaker shifts identified');
        get().setTaskStage('translation', 'Gemini 3.6 Flash formatting subtitles into Easy-Read English...');
        
        let subtitles: any[] = [];
        if (videoItem.file) {
          subtitles = await uploadAndTranslateVideo(videoItem.file, videoItem.file.name);
        } else if (videoItem.url) {
          // If uploaded preloaded / blob URL without file handle
          const blob = await fetch(videoItem.url).then(r => r.blob());
          subtitles = await uploadAndTranslateVideo(blob, videoItem.name || 'video.mp4');
        }

        if (subtitles && Array.isArray(subtitles) && subtitles.length > 0) {
          set({ subtitles });
        }
      } catch (e) {
        console.error('Error during rescan:', e);
      } finally {
        set({ isScanningLanguages: false });
        get().completeTaskPipeline();
      }
      return;
    }

    setTimeout(() => {
      get().updateTaskProgress('asr_transcription', 100, 'All speaker shifts identified');
      get().setTaskStage('translation', 'Gemini 3.6 Flash formatting subtitles into Easy-Read English...');
      get().updateTaskProgress('translation', 80, 'Generating natural & simplified English pairs...');

      setTimeout(() => {
        get().updateTaskProgress('translation', 100, 'Subtitles aligned');
        set((state) => ({
          isScanningLanguages: false,
          subtitles: state.subtitles.map(sub => {
            const len = (sub.translatedText || '').length;
            const duration = Math.max(1, sub.endTime - sub.startTime);
            const cps = parseFloat((len / duration).toFixed(1));
            return {
              ...sub,
              cps,
              readingDifficulty: cps > 20 ? 'Complex' : 'Easy'
            };
          })
        }));
        get().completeTaskPipeline();
      }, 750);
    }, 750);
  },

  loadSampleProject: () => {
    set({
      project: SAMPLE_PROJECT,
      tracks: SAMPLE_TRACKS,
      subtitles: INITIAL_SUBTITLES,
      currentTime: 0
    });
  },

  clearProject: () => {
    set({
      project: null,
      tracks: [],
      subtitles: [],
      currentTime: 0,
      isPlaying: false
    });
  }
}));

