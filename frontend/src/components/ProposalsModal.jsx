import React, { useState, useEffect } from 'react';
import { X, FolderGit2, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import ProposalCard from './ProposalCard';

export default function ProposalsModal({ isOpen, onClose, onRefreshStats }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const data = await api.getProposals(filter);
      setProposals(data || []);
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProposals();
    }
  }, [isOpen, filter]);

  const handleResolved = (id, status) => {
    setProposals(proposals.map(p => p.id === id ? { ...p, status } : p));
    if (onRefreshStats) onRefreshStats();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0e1017] border-l border-white/10 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Portfolio Proposals</h2>
              <p className="text-[11px] text-gray-400">รายการโปรเจกต์ที่ AI ตรวจพบและรอการอนุมัติเข้า Portfolio</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchProposals}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
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

        {/* Filter Tabs */}
        <div className="p-3 border-b border-white/5 bg-[#0a0c12] flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-purple-600 text-white shadow-glow-accent'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400'
              }`}
            >
              {f === 'pending' ? '⏳ รอการอนุมัติ' : f === 'approved' ? '✅ อนุมัติแล้ว' : f === 'rejected' ? '❌ ข้ามแล้ว' : 'ทั้งหมด'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="text-center py-12 text-gray-500 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              <span>กำลังโหลดรายการข้อเสนอโปรเจกต์...</span>
            </div>
          )}

          {!loading && proposals.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <FolderGit2 className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-xs">ไม่มีรายการโปรเจกต์ในสถานะนี้</p>
              <p className="text-[11px] text-gray-600 mt-1">เมื่อคุณเล่าถึงโปรเจกต์ใหม่ในแชท AI จะนำเสนอมาที่นี่โดยอัตโนมัติ</p>
            </div>
          )}

          {!loading && proposals.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              onResolved={handleResolved}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
