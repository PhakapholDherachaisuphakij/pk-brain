import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, X, Clock, Sparkles, Search } from 'lucide-react';
import { api } from '../lib/api';

export default function ChatHistorySidebar({ isOpen, onClose, currentSessionId, onSelectSession, onNewChat }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await api.getSessions();
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('คุณต้องการลบประวัติการคุยใน session นี้หรือไม่?')) return;
    try {
      await api.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        onNewChat();
      }
    } catch (err) {
      alert('ลบไม่สำเร็จ: ' + err.message);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-[#0e1017] border-r border-white/10 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Chat History</h2>
              <p className="text-[11px] text-gray-400">ประวัติการสนทนาย้อนหลัง ({sessions.length})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat & Search */}
        <div className="p-3 border-b border-white/5 space-y-2.5 bg-black/20">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>เริ่มแชทใหม่ (New Chat)</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาประวัติการคุย..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs text-gray-400 gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-blue-400" />
              <span>กำลังโหลดประวัติ...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500">
              {search ? 'ไม่พบประวัติการคุยที่ค้นหา' : 'ยังไม่มีประวัติการสนทนา'}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-sm'
                      : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 text-gray-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">
                        {session.title || 'การสนทนาไม่มีชื่อ'}
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <span>{new Date(session.updated_at || session.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-all"
                    title="ลบประวัติ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
