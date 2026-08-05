import React, { useEffect, useState } from 'react';
import { 
  History, 
  X, 
  Trash2, 
  Play, 
  Clock, 
  FileText, 
  RefreshCw, 
  Search, 
  Globe, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useStore } from '../store';
import { Subtitle } from '../types';

interface HistoryItem {
  id: string;
  videoId: string;
  fileName: string;
  subtitles: Subtitle[];
  createdAt: string;
  subtitlesCount: number;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const { loadHistoryProject } = useStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error('Failed to fetch translation history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this translation from history?')) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelect = (item: HistoryItem) => {
    loadHistoryProject(item);
    onClose();
  };

  if (!isOpen) return null;

  const filteredHistory = history.filter(item => 
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitles.some(s => 
      (s.originalText && s.originalText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.translatedText && s.translatedText.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#141416] border border-[#313135] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-[#26262a] bg-[#1A1A1D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                Analyzed Uploads & Translation History
              </h2>
              <p className="text-xs text-slate-400">
                Pick up where you left off on past translated videos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-2 rounded-lg bg-[#26262a] text-slate-300 hover:text-white hover:bg-[#313135] transition-colors"
              title="Refresh history"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00F5FF]' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#26262a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[#26262a] bg-[#0D0D0E] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by file name or subtitle text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1D] border border-[#313135] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F5FF] transition-colors"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredHistory.length} Saved {filteredHistory.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#00F5FF]" />
              <p className="text-xs font-mono">Loading saved translations from cloud cache...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#313135] rounded-xl p-6 bg-[#0D0D0E]">
              <History className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-300">No Translation History Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {searchQuery ? 'No past uploads match your search query.' : 'Videos you upload and translate will automatically save here so you can reaccess them anytime.'}
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const dateFormatted = new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const langs = Array.from(new Set(
                (item.subtitles || []).map(s => (s.detectedLanguage || 'English').toUpperCase())
              )).slice(0, 4).join(', ');

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#18181B] border border-[#2B2B30] hover:border-[#00F5FF]/60 hover:bg-[#1E1E22] transition-all cursor-pointer shadow-lg"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#00F5FF]/10 border border-[#00F5FF]/30 flex items-center justify-center text-[#00F5FF] shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm truncate group-hover:text-[#00F5FF] transition-colors">
                          {item.fileName}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1.5 font-mono">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {dateFormatted}
                        </span>

                        <span className="flex items-center gap-1 text-slate-300">
                          <FileText className="w-3 h-3 text-[#00F5FF]" />
                          {item.subtitlesCount} {item.subtitlesCount === 1 ? 'Subtitle' : 'Subtitles'}
                        </span>

                        {langs && (
                          <span className="flex items-center gap-1 text-amber-300">
                            <Globe className="w-3 h-3 text-amber-400" />
                            {langs}
                          </span>
                        )}
                      </div>

                      {item.subtitles && item.subtitles.length > 0 && (
                        <p className="text-xs text-slate-400 line-clamp-1 italic mt-2 bg-[#121214] p-1.5 px-2.5 rounded border border-[#26262a]">
                          "{item.subtitles[0].translatedText}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[#26262a]">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      disabled={deletingId === item.id}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/50 transition-colors"
                      title="Delete from history"
                    >
                      <Trash2 className={`w-4 h-4 ${deletingId === item.id ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleSelect(item)}
                      className="px-3.5 py-2 bg-[#00F5FF] text-black font-bold uppercase rounded-lg text-xs hover:bg-white transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,245,255,0.25)]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Pick Up Translation
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-6 border-t border-[#26262a] bg-[#0D0D0E] flex justify-between items-center text-xs text-slate-500">
          <span>Click any saved upload to instantly re-open subtitles and project tracks.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#26262a] text-slate-300 hover:text-white hover:bg-[#313135] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
