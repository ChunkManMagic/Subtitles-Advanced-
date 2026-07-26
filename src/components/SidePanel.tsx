import React from 'react';
import { Settings, Subtitles, Sparkles, Languages, CheckCircle2, AlertTriangle, Info, RefreshCw, Zap } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { EnglishStyle } from '../types';

export function SidePanel() {
  const [activeTab, setActiveTab] = React.useState<'subtitles' | 'settings'>('subtitles');
  const { 
    subtitles, 
    updateSubtitle, 
    translationSettings, 
    updateTranslationSettings, 
    rescanAndTranslateToEnglish, 
    isScanningLanguages 
  } = useStore();

  const detectedLanguagesCount = new Set(subtitles.map(s => s.detectedLanguage)).size;

  return (
    <div className="flex flex-col h-full bg-[#0F0F11] border-l border-[#313135] w-[320px] select-none text-[11px]">
      {/* Tabs */}
      <div className="flex border-b border-[#313135] p-2 space-x-1 bg-[#161618] shrink-0">
        <button 
          onClick={() => setActiveTab('subtitles')}
          className={cn(
            "flex-1 flex items-center justify-center py-1.5 text-[10px] font-bold uppercase rounded transition-colors",
            activeTab === 'subtitles' ? "bg-slate-800 text-white border border-[#313135]" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Subtitles className="w-3.5 h-3.5 mr-1 text-[#00F5FF]" />
          English Subtitles
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex-1 flex items-center justify-center py-1.5 text-[10px] font-bold uppercase rounded transition-colors",
            activeTab === 'settings' ? "bg-slate-800 text-white border border-[#313135]" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Settings className="w-3.5 h-3.5 mr-1" />
          Settings
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-3">
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

            {/* Subtitle Items List */}
            <div className="flex-1 space-y-2.5">
              {subtitles.map((sub, idx) => {
                const displayEnglish = translationSettings.englishStyle === 'simple' && sub.simpleEnglishText
                  ? sub.simpleEnglishText
                  : sub.translatedText;

                return (
                  <div key={sub.id} className="bg-[#161618] p-2.5 rounded border border-[#313135] flex flex-col gap-2">
                    {/* Header line with timestamp & source language */}
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-400 font-bold">
                        [{sub.startTime.toFixed(1)}s - {sub.endTime.toFixed(1)}s]
                      </span>
                      
                      <span className="flex items-center gap-1 bg-[#0A0A0B] text-[#00F5FF] px-1.5 py-0.5 rounded border border-[#313135]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00F5FF]"></span>
                        {sub.detectedLanguage} ({(sub.confidence * 100).toFixed(0)}%)
                      </span>
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
                      <div className="text-slate-300 italic text-[10px] leading-tight font-serif">
                        "{sub.originalText}"
                      </div>
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
      <div className="p-3 border-t border-[#313135] bg-[#0F0F11] shrink-0">
        <button 
          onClick={rescanAndTranslateToEnglish}
          disabled={isScanningLanguages}
          className="w-full py-2 bg-[#00F5FF] text-black font-bold uppercase hover:bg-white flex items-center justify-center text-[10px] rounded transition-colors disabled:opacity-50"
        >
          {isScanningLanguages ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin text-black" />
              Auto-Detecting Languages & Formatting...
            </>
          ) : (
            <>
              <Languages className="w-3.5 h-3.5 mr-2 text-black" />
              Auto-Detect Languages & Format to English
            </>
          )}
        </button>
      </div>
    </div>
  );
}

