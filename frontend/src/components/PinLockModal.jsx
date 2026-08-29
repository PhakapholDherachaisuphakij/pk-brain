import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Sparkles, ArrowRight, Brain, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function PinLockModal({ onAuthenticated }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNumClick = (num) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      if (newPin.length === 6) {
        verify(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verify = async (pinToTest) => {
    const code = pinToTest || pin;
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      await api.verifyPin(code);
      localStorage.setItem('pk_brain_auth', 'true');
      onAuthenticated();
    } catch (err) {
      setError(err.message || 'รหัส PIN ไม่ถูกต้อง');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key >= '0' && e.key <= '9') {
      handleNumClick(e.key);
    } else if (e.key === 'Backspace') {
      handleDelete();
    } else if (e.key === 'Enter') {
      verify();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-gradient-to-b from-gray-900/90 to-black/95 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-0.5 shadow-lg shadow-purple-500/20 mb-4">
          <div className="w-full h-full bg-black/80 rounded-[14px] flex items-center justify-center">
            <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight text-center">PK Brain Security</h1>
        <p className="text-xs text-gray-400 mt-1 mb-6 text-center">กรุณากรอกรหัส PIN 6 หลักเพื่อเข้าสู่ระบบ</p>

        {/* PIN Indicators */}
        <div className="flex gap-3 mb-6">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-purple-500 border-purple-400 scale-110 shadow-lg shadow-purple-500/50'
                  : 'bg-white/5 border-white/20'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 mb-4 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg animate-shake">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumClick(num.toString())}
              disabled={loading}
              className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-purple-600/30 border border-white/5 text-lg font-semibold text-white transition-all flex items-center justify-center hover:scale-105 active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-transparent hover:bg-white/5 text-xs text-gray-400 transition-all flex items-center justify-center"
          >
            ล้าง
          </button>
          <button
            onClick={() => handleNumClick('0')}
            disabled={loading}
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-purple-600/30 border border-white/5 text-lg font-semibold text-white transition-all flex items-center justify-center hover:scale-105 active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-transparent hover:bg-white/5 text-xs text-gray-400 transition-all flex items-center justify-center font-mono"
          >
            ⌫
          </button>
        </div>

        {/* Manual submit if length > 0 */}
        {pin.length > 0 && (
          <button
            onClick={() => verify()}
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-purple-600/30"
          >
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
