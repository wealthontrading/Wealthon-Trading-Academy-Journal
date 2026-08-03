import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  User,
  Check,
  Lock,
} from 'lucide-react';
import { PLATFORMS } from '../data/constants';
import { TraderProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  profile: TraderProfile;
  onClose: () => void;
  onSaveProfile: (profile: TraderProfile) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => boolean;
  onResetJournal: () => void;
  onSeedSampleTrades?: () => void;
  onOpenAdminPortal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSaveProfile,
  onExportBackup,
  onImportBackup,
  onResetJournal,
  onOpenAdminPortal,
}) => {
  const [name, setName] = useState(profile.name || '');
  const [platform, setPlatform] = useState(profile.platform || 'Zerodha (Kite)');
  const [instituteName, setInstituteName] = useState(profile.instituteName || 'WealthOn Trading Academy');
  const [theme, setTheme] = useState(profile.theme || 'light');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      name: name.trim(),
      platform: platform.trim(),
      instituteName: instituteName.trim() || 'WealthOn Trading Academy',
      theme,
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const success = onImportBackup(content);
          if (success) {
            alert('Backup restored successfully!');
            onClose();
          } else {
            alert('Invalid backup file format.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] relative"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-white/10 rounded-xl">
                <Settings className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Journal Settings & Data</h2>
                <p className="text-xs text-indigo-200">Manage profile, themes, and local backups.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-slate-800">
            {/* Edit Profile Form */}
            <form onSubmit={handleSave} className="space-y-4 pb-5 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Trader Profile</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trader Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Platform / Broker</label>
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Academy / Institute Name</span>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">White-Labeling Support</span>
                </label>
                <input
                  type="text"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="e.g. WealthOn Trading Academy, Alpha Capital, etc."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Custom academy name used on student report headers, journal badges, and exported files.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>

            {/* Backup & Restore */}
            <div className="space-y-3 pb-5 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Backup & Restore</h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center space-y-1 transition cursor-pointer"
                >
                  <Download className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">Backup Data</span>
                  <span className="text-[10px] text-slate-500">Download JSON file</span>
                </button>

                <label className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center space-y-1 transition cursor-pointer">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">Restore Data</span>
                  <span className="text-[10px] text-slate-500">Upload JSON file</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Reset & Delete (Danger Zone) */}
            <div className="space-y-3 pb-5 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600">Danger Zone</h3>

              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-900 block">Reset Journal</span>
                  <span className="text-[11px] text-rose-700">Clears all trades, notes & profile details.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Data</span>
                </button>
              </div>
            </div>

            {/* Admin Portal Easy Login Button at bottom */}
            {onOpenAdminPortal && (
              <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl flex items-center justify-between shadow-md border border-indigo-800/60">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-indigo-200" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Admin Control Portal</span>
                    <span className="text-[11px] text-indigo-200">Quick mentor & academy administration login</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminPortal();
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1 shrink-0"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Login</span>
                </button>
              </div>
            )}
          </div>

          {/* YES / NO CONFIRMATION POPUP FOR RESET JOURNAL */}
          <AnimatePresence>
            {showResetConfirmModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 text-slate-900"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-center"
                >
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
                    <ShieldAlert className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-slate-900">Confirm Reset All Data?</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      This will permanently delete all trades, daily notes, rules, goals, and history. You will remain logged in with a fresh blank journal window.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmModal(false)}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-300"
                    >
                      No, Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowResetConfirmModal(false);
                        onResetJournal();
                        onClose();
                      }}
                      className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-rose-600/20 flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete All</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
