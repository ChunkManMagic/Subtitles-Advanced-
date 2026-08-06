import React, { useState } from 'react';
import { useStore } from './store';
import { Header } from './components/Header';
import { EmptyState } from './components/EmptyState';
import { VideoPlayer } from './components/VideoPlayer';
import { Timeline } from './components/Timeline';
import { SidePanel } from './components/SidePanel';
import { AudioWaveformVisualizer } from './components/AudioWaveformVisualizer';
import { Menu, X, Settings, Layers, Film } from 'lucide-react';

export default function App() {
  const currentProject = useStore((state) => state.project);
  const [mobileTab, setMobileTab] = useState<'preview' | 'timeline'>('preview');
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Universal Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {!currentProject ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <EmptyState />
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
            {/* Primary Workspace */}
            <div className="flex-1 flex flex-col min-h-0 p-4 gap-4 overflow-y-auto lg:overflow-visible animate-fade-in">
              
              {/* Mobile Tab Swapper */}
              <div className="flex lg:hidden bg-slate-900/60 p-1 rounded-xl border border-slate-800/85 gap-1 shadow-lg backdrop-blur-md">
                <button
                  onClick={() => setMobileTab('preview')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    mobileTab === 'preview'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => setMobileTab('timeline')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    mobileTab === 'timeline'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Timeline & Subs
                </button>
                <button
                  onClick={() => setShowMobileSettings(!showMobileSettings)}
                  className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                    showMobileSettings
                      ? 'bg-slate-800 border-slate-700 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Desktop Dual-Pane Layout / Mobile Tab Conditional Display */}
              <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 min-h-0">
                {/* Left/Top Column: Video Player */}
                <div className={`col-span-12 lg:col-span-5 flex flex-col ${mobileTab === 'preview' ? 'block animate-fade-in' : 'hidden lg:flex'}`}>
                  <div className="flex-1 bg-slate-950/40 rounded-2xl border border-slate-900/80 p-4 flex flex-col justify-center shadow-2xl backdrop-blur-md">
                    <VideoPlayer />
                  </div>
                </div>

                {/* Right/Bottom Column: Interactive Timeline & Audio Waveform */}
                <div className={`col-span-12 lg:col-span-7 flex flex-col gap-4 min-h-0 ${mobileTab === 'timeline' ? 'block animate-fade-in' : 'hidden lg:flex'}`}>
                  {/* Waveform Visualizer (Integrated above Subtitle Timeline) */}
                  <div className="flex-shrink-0">
                    <AudioWaveformVisualizer />
                  </div>

                  {/* Visual Subtitle Track Timeline */}
                  <div className="flex-1 min-h-[300px] lg:min-h-0 bg-slate-950/40 rounded-2xl border border-slate-900/80 p-4 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
                    <Timeline />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Config Panel: Slideable drawer on mobile, static on desktop */}
            <div
              className={`
                fixed lg:static top-0 right-0 bottom-0 z-40 w-80 lg:w-72 bg-[#0d0d0f] border-l border-slate-900/80 shadow-2xl lg:shadow-none flex flex-col transform transition-transform duration-300 ease-out
                ${showMobileSettings ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
              `}
            >
              {/* Mobile Sidebar Close Button */}
              <div className="lg:hidden p-4 border-b border-slate-900 flex justify-between items-center bg-slate-900/30">
                <span className="text-xs font-bold uppercase text-slate-300">Translation Suite Settings</span>
                <button
                  onClick={() => setShowMobileSettings(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidePanel />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
