export interface Project {
  id: string;
  name: string;
  duration: number;
  videoUrl?: string;
}

export interface TrackItem {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  startTime: number; // in seconds
  duration: number; // in seconds
  file?: File;
  url?: string;
  name: string;
  color?: string;
  content?: string; // For subtitles
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'subtitle';
  items: TrackItem[];
  muted?: boolean;
  solo?: boolean;
  volume?: number;
}

export type EnglishStyle = 'natural' | 'simple' | 'literal' | 'contextual';

export type SubtitlePosition = 'bottom' | 'top' | 'middle' | 'custom';
export type SubtitleAlignment = 'center' | 'left' | 'right';
export type SubtitleFontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type SubtitleBgStyle = 'dark_glass' | 'solid_black' | 'yellow_box' | 'text_shadow' | 'transparent';
export type SubtitleTextColor = 'yellow' | 'white' | 'cyan' | 'lime';

export interface SubtitleStyleSettings {
  position: SubtitlePosition;
  yOffsetPercent: number; // 5 to 95 (default 85 for bottom)
  xOffsetPercent: number; // 5 to 95 (default 50 for center)
  alignment: SubtitleAlignment;
  fontSize: SubtitleFontSize;
  bgStyle: SubtitleBgStyle;
  textColor: SubtitleTextColor;
}

export interface TranslationSettings {
  targetLanguage: 'en';
  englishStyle: EnglishStyle;
  englishAccent: 'us' | 'uk' | 'aus' | 'global';
  ttsVoice: string;
  ttsProvider: 'elevenlabs' | 'fishaudio';
  lipSyncEngine: 'synclabs' | 'musetalk' | 'none';
  autoDetectLanguage: boolean;
  simplifyJargon: boolean;
}

export interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  originalText: string;
  detectedLanguage: string; // e.g., "Spanish", "Japanese", "French", "German"
  detectedLanguageCode: string; // "es", "ja", "fr", "de"
  confidence: number; // e.g. 0.98
  translatedText: string; // Natural or formatted English text
  simpleEnglishText: string; // Easy-to-understand simplified English
  culturalNotes?: string;
  cps: number; // Characters per second
  readingDifficulty: 'Easy' | 'Moderate' | 'Complex';
  languageShift?: boolean; // True if source language changed from preceding segment
}

export type ProcessStage = 'idle' | 'asr_transcription' | 'translation' | 'completed' | 'error';

export interface StageStatus {
  id: 'asr_transcription' | 'translation';
  name: string;
  progress: number; // 0 - 100
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  detail: string;
}

export interface TaskManagerState {
  isProcessing: boolean;
  activeTaskName: string;
  currentStage: ProcessStage;
  overallProgress: number; // 0 - 100
  statusMessage: string;
  stages: {
    asr_transcription: StageStatus;
    translation: StageStatus;
  };
}

export interface AppState {
  project: Project | null;
  tracks: Track[];
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  selectedItemId: string | null;
  translationSettings: TranslationSettings;
  subtitleStyleSettings: SubtitleStyleSettings;
  subtitles: Subtitle[];
  isScanningLanguages: boolean;
  taskManager: TaskManagerState;
  
  setProject: (project: Project) => void;
  addTrack: (track: Track) => void;
  updateTrack: (trackId: string, data: Partial<Track>) => void;
  addTrackItem: (trackId: string, item: TrackItem) => void;
  updateTrackItem: (itemId: string, data: Partial<TrackItem>) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setZoom: (zoom: number) => void;
  setSelectedItemId: (id: string | null) => void;
  updateTranslationSettings: (settings: Partial<TranslationSettings>) => void;
  updateSubtitleStyleSettings: (settings: Partial<SubtitleStyleSettings>) => void;
  updateSubtitle: (id: string, data: Partial<Subtitle>) => void;
  addSubtitleCue: () => void;
  deleteSubtitleCue: (id: string) => void;
  setSubtitles: (subtitles: Subtitle[]) => void;
  rescanAndTranslateToEnglish: () => void;
  loadHistoryProject: (item: { videoId: string; fileName: string; subtitles: Subtitle[] }) => void;
  loadSampleProject: () => void;
  clearProject: () => void;
  
  // Task Manager Actions
  updateTaskProgress: (stage: 'asr_transcription' | 'translation', progress: number, detail?: string) => void;
  setTaskStage: (stage: ProcessStage, statusMessage?: string) => void;
  startTaskPipeline: (taskName?: string) => void;
  completeTaskPipeline: () => void;
  failTaskPipeline: (errorMessage: string) => void;
  resetTaskManager: () => void;
}

