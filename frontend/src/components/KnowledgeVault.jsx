import React, { useState, useEffect } from 'react';
import { X, Search, Trash2, Tag, BookOpen, Calendar, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

export default function KnowledgeVault({ isOpen, onClose, onRefreshStats }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'learning', label: '💡 Learning' },
    { id: 'career', label: '💼 Career' },
    { id: 'project-log', label: '🚀 Project Log' },
    { id: 'scb-work', label: '🏦 SCB QA' },
    { id: 'kmutt-study', label: '🎓 KMUTT' },
    { id: 'milestone', label: '🏆 Milestone' },
    { id: 'idea', label: '✨ Idea' },
  ];

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedTag) params.tag = selectedTag;
      if (search.trim()) params.q = search.trim();

      const data = await api.getKnowledge(params);
      setEntries(data || []);
    } catch (err) {
      console.error('Error loading knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKnowledge();
    }
  }, [isOpen, selectedCategory, selectedTag, search]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?`)) return;
    try {
      await api.deleteKnowledge(id);
      setEntries(entries.filter(e => e.id !== id));
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert('ลบไม่สำเร็จ: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0e1017] border-l border-white/10 h-full flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Knowledge Vault</h2>
              <p className="text-[11px] text-gray-400">คลังความรู้และเรื่องราวที่บันทึกไว้ ({entries.length} รายการ)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchKnowledge}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-white/5 space-y-3 bg-[#0a0c12]">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาความรู้, ทักษะ, หรือเนื้อหาที่เคยบันทึก..."
              className="w-full bg-[#151722] border border-white/10 focus:border-blue-500/50 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-blue-600 text-white shadow-glow'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="text-center py-12 text-gray-500 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span>กำลังโหลดข้อมูล Knowledge...</span>
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-xs">ยังไม่มีข้อมูลความรู้ในหมวดหมู่นี้</p>
              <p className="text-[11px] text-gray-600 mt-1">พิมพ์คุยในแชทเพื่อเริ่มสะสม Knowledge ของคุณได้เลย</p>
            </div>
          )}

          {!loading && entries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-2xl bg-[#13151f] border border-white/5 hover:border-white/15 transition-all group relative"
            >
              {/* Category & Date */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                  {entry.category}
                </span>

                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(entry.created_at).toLocaleDateString('th-TH')}</span>
                  
                  <button
                    onClick={() => handleDelete(entry.id, entry.summary)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all ml-1"
                    title="ลบรายการนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Summary / Content */}
              <h3 className="text-xs font-semibold text-white mb-1.5 leading-snug">
                {entry.summary || entry.content.slice(0, 100)}
              </h3>
              
              <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed mb-3">
                {entry.content}
              </p>

              {/* Tags */}
              {entry.knowledge_tags && entry.knowledge_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-white/5">
                  {entry.knowledge_tags.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTag(t.tag === selectedTag ? '' : t.tag)}
                      className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${
                        selectedTag === t.tag
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-gray-400'
                      }`}
                    >
                      #{t.tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
