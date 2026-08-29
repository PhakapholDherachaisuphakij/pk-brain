import React, { useState } from 'react';
import { Brain, Lock, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function LockScreen({ onAuthenticated }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) return;

    try {
      setLoading(true);
      setError('');
      const res = await api.verifyPin(pin.trim());
      if (res.token) {
        onAuthenticated();
      }
    } catch (err) {
      setError(err.message || 'รหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07090e] p-4 text-center select-none">
      {/* Background Glow */}
      <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />

      <div className="relative w-full max-w-sm p-8 rounded-3xl bg-[#0e111a]/90 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-6 animate-fadeIn">
        {/* Brain Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 p-[1.5px] shadow-glow">
            <div className="w-full h-full bg-[#0c0e14] rounded-3xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-blue-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center justify-center gap-1.5">
            PK Brain
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              SECURE
            </span>
          </h2>
          <p className="text-xs text-gray-400">
            ระบบพื้นที่ส่วนตัวของ PK กรุณากรอก Master Passcode เพื่อปลดล็อก
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={pin}
              autoFocus
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              placeholder="ใส่รหัสผ่าน Master Passcode"
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-black/60 border border-white/15 text-white text-sm text-center tracking-widest focus:outline-none focus:border-blue-500 transition-colors placeholder:tracking-normal placeholder:text-gray-600 placeholder:text-xs"
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold tracking-wide uppercase shadow-glow disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>ปลดล็อกเข้าใช้งาน</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Tailscale Indicator */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-gray-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tailscale Mesh Protected • Homelab Node</span>
        </div>
      </div>
    </div>
  );
}
