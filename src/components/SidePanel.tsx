import React from 'react';
import { 
  Settings, 
  Subtitles, 
  Sparkles, 
  Languages, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Zap, 
  Move, 
  Plus, 
  Trash2, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Sliders,
  Download 
} from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { EnglishStyle } from '../types';
import { ExportVideoModal } from './ExportVideoModal';

export function SidePanel() {
  const [activeTab, setActiveTab] = React.useState<'subtitles' | 'placement' | 'settings'>('subtitles');
  const [showExportModal, setShowExportModal] = React.useState(false);
  const { 
    subtitles, 
    updateSubtitle, 
    addSubtitleCue,
    deleteSubtitleCue,
    translationSettings, 
    updateTranslationSettings, 
    subtitleStyleSettings,
    updateSubtitleStyleSettings,
    rescanAndTranslateToEnglish, 
    isScanningLanguages 
  } = useStore();

  const detectedLanguagesCount = new Set(subtitles.map(s => s.detectedLanguage)).size;

  return (
    <div className="flex flex-col h-full bg-[#0F0F11] border-l border-[#313135] w-[320px] select-none text-[11px]">
      {/* Tabs */}
      <div className="flex border-b border-[#313135] p-1.5 space-x-1 bg-[#161618] shrink-0">
        <button 
          onClick={() => setActiveTab('subtitles')}
          className={cn(
            "flex-1 flex items-center justify-center py-1.5 text-[9.5px] font-bold uppercase rounded transition-colors",
            activeTab === 'subtitles' ? "bg-slate-800 text-white border border-[#313135]" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Subtitles className="w-3 h-3 mr-1 text-[#00F5FF]" />
          Subtitles
        </button>
        <button 
          onClick={() => setActiveTab('placement')}
          className={cn(
            "flex-1 flex items-center justify-center py-1.5 text-[9.5px] font-bold uppercase rounded transition-colors",
            activeTab === 'placement' ? "bg-slate-800 text-white border border-[#313135]" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Move className="w-3 h-3 mr-1 text-[#00F5FF]" />
          Placement
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex-1 flex items-center justify-center py-1.5 text-[9.5px] font-bold uppercase rounded transition-colors",
            activeTab === 'settings' ? "bg-slate-800 text-white border border-[#313135]" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Settings className="w-3 h-3 mr-1" />
          Settings
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-3">
        {/* Prominent Download Finished Product Action Card */}
        <div className="bg-gradient-to-r from-[#1A1A1D] to-[#0F0F11] p-2.5 rounded-lg border border-[#00F5FF]/50 shadow-[0_0_12px_rgba(0,245,255,0.25)] flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold text-white uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#00F5FF]" /> Finished Product
            </div>
            <p className="text-[9px] text-slate-400">
              {subtitles.length} English cues ready for download
            </p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3 py-1.5 bg-[#00F5FF] text-black font-extrabold uppercase hover:bg-white transition-all flex items-center gap-1 text-[10px] rounded shadow cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            Download
          </button>
        </div>

        {activeTab === 'subtitles' ? (
          <>
            {/* Multi-language summary banner */}
            <div className="bg-[#161618] p-2 rounded border border-[#313135] flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5 text-[#00F5FF]" /> Auto-Language Detection
                </span>
                <span className="text-[9px] bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                  {detectedLanguagesCount} Languages → English
                </span>
              </div>
              
              {/* Quick English Format Switcher */}
              <div className="flex gap-1 pt-1 border-t border-[#313135]">
                {(['natural', 'simple', 'contextual'] as EnglishStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => updateTranslationSettings({ englishStyle: style })}
                    className={cn(
                      "flex-1 py-1 text-[9px] font-bold uppercase rounded border transition-colors",
                      translationSettings.englishStyle === style 
                        ? "bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]/50" 
                        : "bg-[#0A0A0B] text-slate-500 border-[#313135] hover:text-slate-300"
                    )}
                  >
                    {style === 'natural' ? 'Natural' : style === 'simple' ? 'Simple Read' : 'Contextual'}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Subtitle Cue Action */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Subtitle Cues ({subtitles.length})
              </span>
              <button
                onClick={addSubtitleCue}
                className="px-2 py-1 bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] hover:bg-[#00F5FF] hover:text-black font-bold uppercase rounded text-[9px] transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Cue
              </button>
            </div>

            {/* Subtitle Items List */}
            <div className="flex-1 space-y-2.5">
              {subtitles.map((sub, idx) => {
                const displayEnglish = translationSettings.englishStyle === 'simple' && sub.simpleEnglishText
                  ? sub.simpleEnglishText
                  : sub.translatedText;

                return (
                  <div key={sub.id} className="bg-[#161618] p-2.5 rounded border border-[#313135] flex flex-col gap-2">
                    {/* Header line with timestamp editor & delete cue button */}
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <div className="flex items-center gap-1 bg-[#0A0A0B] px-1.5 py-0.5 rounded border border-[#313135]">
                        <span className="text-slate-500 font-bold">Start:</span>
                        <input 
                          type="number"
                          step="0.1"
                          min="0"
                          value={sub.startTime}
                          onChange={(e) => updateSubtitle(sub.id, { startTime: Number(e.target.value) })}
                          className="w-11 bg-transparent text-white focus:outline-none focus:text-[#00F5FF]"
                        />
                        <span className="text-slate-500">s - End:</span>
                        <input 
                          type="number"
                          step="0.1"
                          min="0"
                          value={sub.endTime}
                          onChange={(e) => updateSubtitle(sub.id, { endTime: Number(e.target.value) })}
                          className="w-11 bg-transparent text-white focus:outline-none focus:text-[#00F5FF]"
                        />
                        <span className="text-slate-500">s</span>
                      </div>
                      
                      <button
                        onClick={() => deleteSubtitleCue(sub.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete Subtitle Cue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Language shift alert badge */}
                    {sub.languageShift && (
                      <div className="flex items-center gap-1 bg-amber-900/30 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded text-[9px] font-mono">
                        <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Language changed to <strong>{sub.detectedLanguage}</strong></span>
                      </div>
                    )}

                    {/* Original Foreign Text */}
                    <div className="bg-[#0A0A0B] p-1.5 rounded border border-[#26262a]">
                      <div className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5 font-bold">
                        Source Spoken ({sub.detectedLanguage}):
                      </div>
                      <input 
                        type="text"
                        value={sub.originalText}
                        onChange={(e) => updateSubtitle(sub.id, { originalText: e.target.value })}
                        className="w-full bg-transparent text-slate-300 italic text-[10px] font-serif focus:outline-none focus:text-white"
                      />
                    </div>

                    {/* Formatted English Translation */}
                    <div className="bg-[#0F0F11] p-2 rounded border border-[#313135]">
                      <div className="flex items-center justify-between text-[8px] text-[#00F5FF] uppercase font-bold tracking-wider mb-1">
                        <span>🇺🇸 English ({translationSettings.englishStyle}):</span>
                        <span className={cn(
                          "px-1 py-0.2 rounded font-mono text-[8px]",
                          sub.cps > 20 ? "bg-red-900/40 text-red-400" : "bg-emerald-900/40 text-emerald-400"
                        )}>
                          CPS: {sub.cps} ({sub.readingDifficulty})
                        </span>
                      </div>

                      <textarea 
                        value={displayEnglish}
                        onChange={(e) => {
                          if (translationSettings.englishStyle === 'simple') {
                            updateSubtitle(sub.id, { simpleEnglishText: e.target.value });
                          } else {
                            updateSubtitle(sub.id, { translatedText: e.target.value });
                          }
                        }}
                        className="w-full bg-[#000] border border-[#313135] text-white p-1.5 rounded text-[11px] focus:outline-none focus:border-[#00F5FF] resize-none font-sans leading-snug"
                        rows={2}
                      />

                      {/* Cultural/Idiom Notes if present */}
                      {sub.culturalNotes && translationSettings.englishStyle === 'contextual' && (
                        <div className="mt-1.5 flex items-start gap-1 text-[9px] text-slate-400 bg-slate-900/80 p-1 rounded border border-slate-800 font-sans">
                          <Info className="w-3 h-3 text-[#00F5FF] shrink-0 mt-0.5" />
                          <span>{sub.culturalNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : activeTab === 'placement' ? (
          /* Placement & Style Tab */
          <div className="space-y-4">
            <div className="bg-[#161618] p-3 rounded border border-[#313135] space-y-3">
              <div className="text-[10px] uppercase font-bold text-[#00F5FF] flex items-center justify-between">
                <span>SUBTITLE POSITION & PLACEMENT</span>
                <Move className="w-3.5 h-3.5 text-[#00F5FF]" />
              </div>

              {/* Vertical Position Presets */}
              <div>
                <label className="text-[9px] text-slate-400 block mb-1 uppercase font-mono">Vertical Position Preset</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => updateSubtitleStyleSettings({ position: 'top', yOffsetPercent: 12 })}
                    className={cn(
                      "py-1.5 px-2 text-[9.5px] font-bold uppercase rounded border transition-colors",
                      subtitleStyleSettings.yOffsetPercent <= 25 ? "bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]/60" : "bg-[#0A0A0B] border-[#313135] text-slate-400"
                    )}
                  >
                    Top (12%)
                  </button>
                  <button
                    onClick={() => updateSubtitleStyleSettings({ position: 'middle', yOffsetPercent: 50 })}
                    className={cn(
                      "py-1.5 px-2 text-[9.5px] font-bold uppercase rounded border transition-colors",
                      subtitleStyleSettings.yOffsetPercent > 25 && subtitleStyleSettings.yOffsetPercent < 75 ? "bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]/60" : "bg-[#0A0A0B] border-[#313135] text-slate-400"
                    )}
                  >
                    Middle (50%)
                  </button>
                  <button
                    onClick={() => updateSubtitleStyleSettings({ position: 'bottom', yOffsetPercent: 85 })}
                    className={cn(
                      "py-1.5 px-2 text-[9.5px] font-bold uppercase rounded border transition-colors",
                      subtitleStyleSettings.yOffsetPercent >= 75 ? "bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]/60" : "bg-[#0A0A0B] border-[#313135] text-slate-400"
                    )}
                  >
                    Bottom (85%)
                  </button>
                </div>
              </div>

              {/* Y-Offset Slider */}
              <div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mb-1">
                  <span>Vertical Offset (Y%)</span>
                  <span className="text-[#00F5FF] font-bold">{subtitleStyleSettings.yOffsetPercent}%</span>
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

              {/* X-Offset Slider */}
              <div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mb-1">
                  <span>Horizontal Offset (X%)</span>
                  <span className="text-[#00F5FF] font-bold">{subtitleStyleSettings.xOffsetPercent}%</span>
                </div>
                <input 
                  type="range"
                  min={10}
                  max={90}
                  value={subtitleStyleSettings.xOffsetPercent}
                  onChange={(e) => updateSubtitleStyleSettings({ position: 'custom', xOffsetPercent: Number(e.target.value) })}
                  className="w-full accent-[#00F5FF] h-1.5 bg-[#000] rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Typography & Background Formatting */}
            <div className="bg-[#161618] p-3 rounded border border-[#313135] space-y-3">
              <div className="text-[10px] uppercase font-bold text-slate-400">SUBTITLE STYLING & FORMAT</div>

              {/* Font Size */}
              <div>
                <label className="text-[9px] text-slate-500 block mb-1 uppercase font-mono">Font Size</label>
                <select 
                  value={subtitleStyleSettings.fontSize}
                  onChange={(e) => updateSubtitleStyleSettings({ fontSize: e.target.value as any })}
                  className="w-full bg-[#000] border border-[#313135] rounded py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-[#00F5FF]"
                >
                  <option value="small">Small (14px - Compact)</option>
                  <option value="medium">Medium (18px - Standard Easy Read)</option>
                  <option value="large">Large (24px - High Visibility)</option>
                  <option value="xlarge">Extra Large (30px - TV/Large Screens)</option>
                </select>
              </div>

              {/* Box Background Style */}
              <div>
                <label className="text-[9px] text-slate-500 block mb-1 uppercase font-mono">Background Style</label>
                <select 
                  value={subtitleStyleSettings.bgStyle}
                  onChange={(e) => updateSubtitleStyleSettings({ bgStyle: e.target.value as any })}
                  className="w-full bg-[#000] border border-[#313135] rounded py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-[#00F5FF]"
                >
                  <option value="dark_glass">Dark Glass (Cyan Border)</option>
                  <option value="solid_black">Solid Black Box</option>
                  <option value="yellow_box">Yellow Box (High Contrast Black Text)</option>
                  <option value="text_shadow">Text Shadow Only (No Box)</option>
                  <option value="transparent">Transparent Glass</option>
                </select>
              </div>

              {/* Text Color */}
              <div>
                <label className="text-[9px] text-slate-500 block mb-1 uppercase font-mono">Text Color</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'yellow', label: 'Yellow', color: 'bg-yellow-400' },
                    { id: 'white', label: 'White', color: 'bg-white' },
                    { id: 'cyan', label: 'Cyan', color: 'bg-[#00F5FF]' },
                    { id: 'lime', label: 'Lime', color: 'bg-emerald-400' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateSubtitleStyleSettings({ textColor: c.id as any })}
                      className={cn(
                        "py-1 flex items-center justify-center gap-1 text-[9px] font-bold uppercase rounded border transition-colors",
                        subtitleStyleSettings.textColor === c.id ? "border-[#00F5FF] bg-[#00F5FF]/10 text-white" : "border-[#313135] bg-[#000] text-slate-400"
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full", c.color)}></span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alignment */}
              <div>
                <label className="text-[9px] text-slate-500 block mb-1 uppercase font-mono">Text Alignment</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => updateSubtitleStyleSettings({ alignment: 'left' })}
                    className={cn(
                      "py-1.5 flex items-center justify-center gap-1 text-[9.5px] font-bold uppercase rounded border transition-colors",
                      subtitleStyleSettings.alignment === 'left' ? "bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]" : "bg-[#000] border-[#313135] text-slate-400"
                    )}
                  >
                    <AlignLeft className="w-3 h-3" /> Left
                  </button>
                  <button
                    onClick={() => updateSubtitleStyleSettings({ alignment: 'center' })}
                    className={cn(
                      "py-1.5 flex items-center justify-center gap-1 text-[9.5px] font-bold uppercase rounded border transition-colors",
                      subtitleStyleSettings.alignment === 'center' ? "bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]" : "bg-[#000] border-[#313135] text-slate-400"
                    )}
                  >
                    <AlignCenter className="w-3 h-3" /> Center
                  </button>
                  <button
                    onClick={() => updateSubtitleStyleSettings({ alignment: 'right' })}
                    className={cn(
                      "py-1.5 flex items-center justify-center gap-1 text-[9.5px] font-bold uppercase rounded border transition-colors",
                      subtitleStyleSettings.alignment === 'right' ? "bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]" : "bg-[#000] border-[#313135] text-slate-400"
                    )}
                  >
                    <AlignRight className="w-3 h-3" /> Right
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Target Language configuration (Locked to English) */}
            <div className="bg-[#161618] p-3 rounded border border-[#313135] space-y-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                <span>TARGET TRANSLATION LANGUAGE</span>
                <span className="text-[#00F5FF] font-mono text-[9px]">EN-US (PRIMARY)</span>
              </div>

              <div>
                <label className="text-[9px] text-slate-500 block mb-1 uppercase font-mono">English Output Accent</label>
                <select 
                  value={translationSettings.englishAccent}
                  onChange={(e) => updateTranslationSettings({ englishAccent: e.target.value as any })}
                  className="w-full bg-[#000] border border-[#313135] rounded py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-[#00F5FF]"
                >
                  <option value="us">English (US Standard)</option>
                  <option value="uk">English (UK Studio)</option>
                  <option value="aus">English (Australian Clear)</option>
                  <option value="global">English (Global Neutral)</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-500 block mb-1 uppercase font-mono">English Formatting Mode</label>
                <select 
                  value={translationSettings.englishStyle}
                  onChange={(e) => updateTranslationSettings({ englishStyle: e.target.value as any })}
                  className="w-full bg-[#000] border border-[#313135] rounded py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-[#00F5FF]"
                >
                  <option value="natural">Natural & Fluent English</option>
                  <option value="simple">Simplified English (Easy Understanding)</option>
                  <option value="contextual">Contextual (With Idiom Explanations)</option>
                  <option value="literal">Direct Word-for-Word English</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-[#313135]">
                <input 
                  type="checkbox" 
                  id="simplifyJargon"
                  checked={translationSettings.simplifyJargon}
                  onChange={(e) => updateTranslationSettings({ simplifyJargon: e.target.checked })}
                  className="accent-[#00F5FF] rounded"
                />
                <label htmlFor="simplifyJargon" className="text-[10px] text-slate-300 cursor-pointer">
                  Auto-simplify complex technical jargon for easy reading
                </label>
              </div>
            </div>

            {/* Auto Detection Settings */}
            <div className="bg-[#161618] p-3 rounded border border-[#313135] space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">AUTOMATIC LANGUAGE DETECTION</div>
              
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-300">Detect Spoken Shifts (WhisperX)</span>
                <input 
                  type="checkbox" 
                  checked={translationSettings.autoDetectLanguage}
                  onChange={(e) => updateTranslationSettings({ autoDetectLanguage: e.target.checked })}
                  className="accent-[#00F5FF]"
                />
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">
                Identifies whenever source speakers switch languages mid-sentence (Spanish, Japanese, French, German, Mandarin, etc.) and seamlessly formats into English.
              </p>
            </div>

          </div>
        )}
      </div>
      
      {/* Action Footer */}
      <div className="p-3 border-t border-[#313135] bg-[#0F0F11] shrink-0 flex flex-col gap-2">
        <button 
          onClick={() => setShowExportModal(true)}
          className="w-full py-2 bg-[#00F5FF] text-black font-extrabold uppercase hover:bg-white flex items-center justify-center text-[10px] rounded transition-all shadow-[0_0_10px_rgba(0,245,255,0.4)] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 text-black" />
          Download Finished Product
        </button>

        <button 
          onClick={rescanAndTranslateToEnglish}
          disabled={isScanningLanguages}
          className="w-full py-1.5 bg-[#1A1A1D] border border-[#313135] text-slate-300 font-bold uppercase hover:bg-[#26262a] hover:text-white flex items-center justify-center text-[9.5px] rounded transition-colors disabled:opacity-50"
        >
          {isScanningLanguages ? (
            <>
              <RefreshCw className="w-3 h-3 mr-1.5 animate-spin text-[#00F5FF]" />
              Auto-Detecting Languages & Formatting...
            </>
          ) : (
            <>
              <Languages className="w-3 h-3 mr-1.5 text-[#00F5FF]" />
              Auto-Detect Languages & Format to English
            </>
          )}
        </button>
      </div>

      <ExportVideoModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </div>
  );
}

