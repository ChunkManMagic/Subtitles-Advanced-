import { create } from 'zustand';
import { AppState, Project, Track, TranslationSettings, Subtitle, TaskManagerState, ProcessStage } from './types';

const INITIAL_TASK_MANAGER: TaskManagerState = {
  isProcessing: false,
  activeTaskName: 'Neural Dubbing Pipeline',
  currentStage: 'idle',
  overallProgress: 0,
  statusMessage: 'Ready',
  stages: {
    audio_separation: {
      id: 'audio_separation',
      name: 'Audio Separation',
      progress: 0,
      status: 'pending',
      detail: 'Demucs v4 Stem Separation'
    },
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
    id: 'track-a1',
    name: 'Original Dialogue Stem',
    type: 'audio',
    items: [
      {
        id: 'item-a1',
        type: 'audio',
        startTime: 0,
        duration: 22,
        name: 'Isolated Dialogue Stem (Demucs v4)'
      }
    ]
  },
  {
    id: 'track-a2',
    name: 'English Dub Audio',
    type: 'audio',
    items: [
      {
        id: 'item-a2',
        type: 'audio',
        startTime: 0.5,
        duration: 18,
        name: 'English Dub (Josh - ElevenLabs v3)'
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
  updateSubtitle: (id, data) => set((state) => ({
    subtitles: state.subtitles.map(s => s.id === id ? { ...s, ...data } : s)
  })),
  setSubtitles: (subtitles) => set({ subtitles }),

  startTaskPipeline: (taskName = 'Neural Dubbing Pipeline') => {
    set({
      taskManager: {
        isProcessing: true,
        activeTaskName: taskName,
        currentStage: 'audio_separation',
        overallProgress: 5,
        statusMessage: 'Step 1/3: Audio Separation (Demucs v4) isolating voice stems...',
        stages: {
          audio_separation: {
            id: 'audio_separation',
            name: 'Audio Separation',
            progress: 10,
            status: 'in_progress',
            detail: 'Demucs v4 vocal stem isolation'
          },
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

      // Calculate overall progress (Audio Sep: 33%, ASR: 33%, Trans: 34%)
      const p1 = updatedStages.audio_separation.progress;
      const p2 = updatedStages.asr_transcription.progress;
      const p3 = updatedStages.translation.progress;
      const overall = Math.min(99, Math.round((p1 * 0.33) + (p2 * 0.33) + (p3 * 0.34)));

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
      
      if (stage === 'audio_separation') {
        updatedStages.audio_separation.status = 'in_progress';
      } else if (stage === 'asr_transcription') {
        updatedStages.audio_separation.status = 'completed';
        updatedStages.audio_separation.progress = 100;
        updatedStages.asr_transcription.status = 'in_progress';
      } else if (stage === 'translation') {
        updatedStages.audio_separation.status = 'completed';
        updatedStages.audio_separation.progress = 100;
        updatedStages.asr_transcription.status = 'completed';
        updatedStages.asr_transcription.progress = 100;
        updatedStages.translation.status = 'in_progress';
      }

      // Overall baseline per stage
      let stageProgress = state.taskManager.overallProgress;
      if (stage === 'audio_separation') stageProgress = Math.max(stageProgress, 10);
      if (stage === 'asr_transcription') stageProgress = Math.max(stageProgress, 35);
      if (stage === 'translation') stageProgress = Math.max(stageProgress, 68);

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
        statusMessage: 'Pipeline Complete: All languages auto-detected & converted to English',
        stages: {
          audio_separation: { ...state.taskManager.stages.audio_separation, progress: 100, status: 'completed' },
          asr_transcription: { ...state.taskManager.stages.asr_transcription, progress: 100, status: 'completed' },
          translation: { ...state.taskManager.stages.translation, progress: 100, status: 'completed' }
        }
      }
    }));
  },

  failTaskPipeline: (errorMessage) => {
    set((state) => ({
      taskManager: {
        ...state.taskManager,
        isProcessing: false,
        currentStage: 'error',
        statusMessage: `Pipeline Error: ${errorMessage}`,
        stages: {
          ...state.taskManager.stages,
          [state.taskManager.currentStage === 'idle' ? 'audio_separation' : state.taskManager.currentStage]: {
            ...state.taskManager.stages[state.taskManager.currentStage === 'idle' || state.taskManager.currentStage === 'completed' || state.taskManager.currentStage === 'error' ? 'audio_separation' : state.taskManager.currentStage],
            status: 'error',
            detail: errorMessage
          }
        }
      }
    }));
  },

  resetTaskManager: () => {
    set({ taskManager: INITIAL_TASK_MANAGER });
  },

  rescanAndTranslateToEnglish: () => {
    set({ isScanningLanguages: true });
    get().startTaskPipeline('Auto-Detect Languages & Translate to English');
    get().setTaskStage('audio_separation', 'Demucs v4 extracting audio channels & speech stems...');
    get().updateTaskProgress('audio_separation', 60, 'Demucs v4 isolating dialogue...');

    setTimeout(() => {
      get().updateTaskProgress('audio_separation', 100, 'Speech stems isolated');
      get().setTaskStage('asr_transcription', 'WhisperX detecting speaker language shifts (ES, JA, FR, DE)...');
      get().updateTaskProgress('asr_transcription', 70, 'Diarizing multi-lingual audio channels...');

      setTimeout(() => {
        get().updateTaskProgress('asr_transcription', 100, 'All speaker shifts identified');
        get().setTaskStage('translation', 'Gemini 3.6 Flash formatting subtitles into Easy-Read English...');
        get().updateTaskProgress('translation', 80, 'Generating natural & simplified English pairs...');

        setTimeout(() => {
          get().updateTaskProgress('translation', 100, 'Subtitles & dubs aligned');
          set((state) => ({
            isScanningLanguages: false,
            subtitles: state.subtitles.map(sub => {
              const len = sub.translatedText.length;
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
        }, 500);
      }, 500);
    }, 500);
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

