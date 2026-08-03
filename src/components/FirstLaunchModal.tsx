import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { PLATFORMS } from '../data/constants';

interface FirstLaunchModalProps {
  isOpen: boolean;
  onSave: (name: string, platform: string) => void;
}

export const FirstLaunchModal: React.FC<FirstLaunchModalProps> = ({ isOpen, onSave }) => {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('Zerodha (Kite)');
  const [customPlatform, setCustomPlatform] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    const selectedPlatform = platform === 'Custom / Other' ? (customPlatform.trim() || 'Other Broker') : platform;
    onSave(name.trim(), selectedPlatform);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                <TrendingUp className="w-6 h-6 text-blue-200" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">Welcome Trader</span>
                <h2 className="text-xl font-black uppercase tracking-tight">WealthOn Trading Academy</h2>
                <p className="text-xs font-semibold text-blue-200">Journal Today, Profit Tomorrow</p>
              </div>
            </div>
            <p className="text-xs text-blue-100/90 mt-2 leading-relaxed">
              Set up your profile to start tracking your options, futures, and equity trades locally on your device with complete privacy.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center space-x-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>Trader Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm placeholder-slate-400 outline-none transition"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Trading Platform / Broker</span>
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm outline-none transition bg-white"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {platform === 'Custom / Other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-1"
              >
                <label className="block text-xs font-semibold text-slate-600 mb-1">Specify Broker Name</label>
                <input
                  type="text"
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  placeholder="e.g. Fyers, Sharekhan"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </motion.div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition duration-200 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Start Trading Journal</span>
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 leading-normal">
              🔒 100% Offline & Private. Data stays stored safely on your browser.
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
