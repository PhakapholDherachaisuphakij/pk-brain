import React from 'react';
import { Brain, Sparkles, BookOpen, Plus, FolderGit2, Lock } from 'lucide-react';

export default function Header({ stats, onOpenVault, onOpenProposals, onOpenStudio, onNewChat, onLock, activeTab }) {
  return (
    <header className="h-14 border-b border-white/5 bg-black/60 backdrop-blur-xl px-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Brand Logo & Identity */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onNewChat}
          className="flex items-center gap-2 group cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 p-[1.5px] flex items-center justify-center shadow-glow">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white tracking-wide flex items-center gap-1.5">
              PK Brain
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Hub
              </span>
            </span>
          </div>
        </button>
      </div>

      {/* Right: Quick Action Buttons & Stats */}
      <div className="flex items-center gap-2">
        {/* Knowledge Vault Button */}
        <button
          onClick={onOpenVault}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeTab === 'vault' 
              ? 'bg-blue-600 text-white shadow-glow' 
              : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
          }`}
          title="คลังความรู้ทั้งหมด"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Knowledge Vault</span>
          {stats?.total_entries > 0 && (
            <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded-full text-[10px] ml-0.5">
              {stats.total_entries}
            </span>
          )}
        </button>

        {/* Portfolio Proposals Button */}
        <button
          onClick={onOpenProposals}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all relative ${
            activeTab === 'proposals' 
              ? 'bg-purple-600 text-white shadow-glow-accent' 
              : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
          }`}
          title="รายการที่รอการอนุมัติเข้า Portfolio"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Proposals</span>
          {stats?.pending_proposals > 0 && (
            <span className="bg-purple-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold animate-pulse">
              {stats.pending_proposals}
            </span>
          )}
        </button>

        {/* Portfolio Studio Button */}
        <button
          onClick={onOpenStudio}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeTab === 'studio'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glow'
              : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 text-white border border-blue-500/30'
          }`}
          title="จัดการและแก้ไขเนื้อหา Portfolio ทั้งหมด"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-300" />
          <span className="font-semibold">Portfolio Studio</span>
        </button>

        {/* Lock Button */}
        {onLock && (
          <button
            onClick={onLock}
            className="p-1.5 rounded-full bg-white/5 hover:bg-red-500/20 hover:border-red-500/40 text-gray-400 hover:text-red-400 border border-white/10 transition-colors ml-0.5"
            title="ล็อค PK Brain"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors ml-1"
          title="เปิดแชทใหม่"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
