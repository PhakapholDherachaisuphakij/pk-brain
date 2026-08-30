import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, Trash2, X, RefreshCw, Clock, ShieldCheck, Mail } from 'lucide-react';

export default function AccessRequestsModal({ isOpen, onClose }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/access-requests');
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Fetch access requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchRequests();
  }, [isOpen]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/access-requests/${id}/approve`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      }
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/access-requests/${id}/reject`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
      }
    } catch (err) {
      alert(`Reject failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this request permanently?')) return;
    try {
      const res = await fetch(`/api/access-requests/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRequests(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shadow-xs">
              <Users size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-neutral-200">
                PK Notes — Access Requests
              </h3>
              <p className="text-[11px] text-neutral-400">
                Review and approve edit permissions for your Obsidian Vault workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRequests}
              title="Refresh"
              className="p-1.5 hover:bg-neutral-800 text-neutral-400 rounded-lg transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-800 text-neutral-400 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {loading && requests.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs font-mono">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 space-y-2">
              <ShieldCheck size={32} className="mx-auto text-neutral-600" />
              <p className="text-xs">No access requests at this moment.</p>
            </div>
          ) : (
            requests.map((req) => {
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';
              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl border transition-all text-xs ${
                    isPending
                      ? 'bg-amber-950/20 border-amber-800/40'
                      : isApproved
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : 'bg-neutral-800/40 border-neutral-700/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-200 text-sm">{req.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider ${
                            isPending
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : isApproved
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-neutral-700 text-neutral-400'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                        <Mail size={12} />
                        <span>{req.email}</span>
                        <span className="text-neutral-600">•</span>
                        <Clock size={12} />
                        <span>{new Date(req.created_at).toLocaleString()}</span>
                      </div>

                      {req.reason && (
                        <p className="mt-2 text-neutral-300 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800 leading-relaxed">
                          "{req.reason}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1 text-xs shadow-xs transition-colors"
                          >
                            <CheckCircle2 size={13} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium flex items-center gap-1 text-xs transition-colors"
                          >
                            <XCircle size={13} />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : isApproved ? (
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === req.id}
                          className="px-2.5 py-1 text-neutral-400 hover:text-amber-400 text-[11px] transition-colors"
                        >
                          Revoke Access
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading === req.id}
                          className="px-2.5 py-1 text-neutral-400 hover:text-emerald-400 text-[11px] transition-colors"
                        >
                          Re-Approve
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(req.id)}
                        className="p-1.5 hover:text-rose-400 text-neutral-500 rounded-lg transition-colors ml-1"
                        title="Delete record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
