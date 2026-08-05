/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { SidePanel } from './components/SidePanel';
import { Timeline } from './components/Timeline';
import { EmptyState } from './components/EmptyState';
import { useStore } from './store';

export default function App() {
  const { project } = useStore();

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0B] text-slate-300 font-sans overflow-hidden select-none text-[11px] border border-[#313135]">
      <Header />
      
      {!project ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 bg-[#000]">
              <VideoPlayer />
            </div>
            <SidePanel />
          </div>
          <div className="h-[280px] border-t border-[#313135] bg-[#0F0F11] shrink-0">
            <Timeline />
          </div>
        </>
      )}
    </div>
  );
}
