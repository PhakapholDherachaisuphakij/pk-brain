import React, { useState } from 'react';
import { Sparkles, Check, X, ExternalLink, Code2, Loader2, CheckCircle2, GraduationCap, Award } from 'lucide-react';
import { api } from '../lib/api';

export default function ProposalCard({ proposal, onResolved }) {
  const [status, setStatus] = useState(proposal.status || 'pending');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isActivity = proposal.proposal_type === 'activity';

  const handleApprove = async () => {
    try {
      setLoading(true);
      const res = await api.approveProposal(proposal.id);
      setStatus('approved');
      setFeedback(res.message || (isActivity ? 'เพิ่มกิจกรรมเข้าสู่ Portfolio แล้ว!' : 'เพิ่มโปรเจกต์เข้าสู่ Portfolio แล้ว!'));
      if (onResolved) onResolved(proposal.id, 'approved');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอนุมัติ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await api.rejectProposal(proposal.id);
      setStatus('rejected');
      setFeedback('ข้ามการบันทึกเข้า Portfolio');
      if (onResolved) onResolved(proposal.id, 'rejected');
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'approved') {
    return (
      <div className="mt-3 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn shadow-lg">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <div>
          <span className="font-semibold text-emerald-200">อนุมัติแล้ว:</span> {isActivity ? 'กิจกรรม' : 'โปรเจกต์'} <strong>{proposal.proposed_title}</strong> ถูกบรรจุเข้าสู่ระบบ Portfolio ของ PK เรียบร้อยแล้ว!
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="mt-3 p-3 rounded-2xl bg-gray-900/40 border border-white/5 text-gray-400 text-xs flex items-center gap-2">
        <X className="w-3.5 h-3.5 text-gray-500" />
        <span>ข้ามการเพิ่ม {isActivity ? 'กิจกรรม' : 'โปรเจกต์'} <strong>{proposal.proposed_title}</strong></span>
      </div>
    );
  }

  const galleryImages = proposal.gallery || (proposal.proposed_image_url ? [proposal.proposed_image_url] : []);

  return (
    <div className={`mt-3.5 p-4 rounded-3xl border text-left transition-all shadow-2xl ${
      isActivity 
        ? 'bg-gradient-to-b from-indigo-950/40 to-[#10121a] border-indigo-500/30 shadow-glow' 
        : 'bg-gradient-to-b from-purple-950/40 to-[#10121a] border-purple-500/30 shadow-glow-accent'
    }`}>
      {/* Header Tag */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${
          isActivity ? 'text-indigo-400' : 'text-purple-400'
        }`}>
          {isActivity ? (
            <GraduationCap className="w-4 h-4 text-indigo-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
          )}
          <span>{isActivity ? 'PK Brain ตรวจพบกิจกรรมใหม่ (Activity)' : 'PK Brain ตรวจพบโปรเจกต์ใหม่ (Project)'}</span>
        </div>
        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${
          isActivity 
            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        }`}>
          รอการยืนยันจาก PK
        </span>
      </div>

      {/* Title & Description */}
      <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
        {proposal.proposed_title}
        {proposal.proposed_link && (
          <a
            href={proposal.proposed_link}
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </h4>

      {proposal.proposed_description && (
        <p className="text-xs text-gray-300 mb-3 leading-relaxed line-clamp-3">
          {proposal.proposed_description}
        </p>
      )}

      {/* Gallery Images Preview */}
      {galleryImages.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {galleryImages.map((img, idx) => (
            <div key={idx} className="relative w-16 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/50">
              <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Tech Stack Chips (if project) */}
      {!isActivity && proposal.proposed_tech_stack && proposal.proposed_tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {proposal.proposed_tech_stack.map((tech, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-purple-200"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2.5 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="text-[11px] text-gray-400">
          ต้องการเพิ่มเข้าสู่หน้า <strong>Portfolio ({isActivity ? 'Activities' : 'Projects'})</strong> ทันทีไหมครับ?
        </span>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-medium border border-white/10 transition-colors disabled:opacity-50"
          >
            ข้าม
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-xs font-medium transition-all disabled:opacity-50 ${
              isActivity
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-glow'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow-accent'
            }`}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>อนุมัติเพิ่มเข้า Portfolio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
