import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  RefreshCw,
  Clock,
  Wrench,
  Sparkles,
  Lock,
  Key,
  User,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SystemMaintenanceState, UserSession } from '../types';
import { authenticateAdmin, authenticateStudent } from '../utils/studentStorage';

interface MaintenanceOverlayProps {
  maintenanceState: SystemMaintenanceState;
  onRefreshCheck?: () => void;
  isAdminPreview?: boolean;
  onDismissAdminPreview?: () => void;
  onLoginSuccess?: (session: UserSession) => void;
  currentSession?: UserSession | null;
  onLogout?: () => void;
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({
  maintenanceState,
  onRefreshCheck,
  isAdminPreview,
  onDismissAdminPreview,
  onLoginSuccess,
  currentSession,
  onLogout,
}) => {
  const [showLoginSection, setShowLoginSection] = useState(false);
  const [loginTab, setLoginTab] = useState<'admin' | 'student'>('admin');

  // Form states
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminMpin, setAdminMpin] = useState('');
  const [showMpinStep, setShowMpinStep] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!maintenanceState.isMaintenanceActive) {
    return null;
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (loginTab === 'admin') {
      if (!showMpinStep) {
        const res = authenticateAdmin(loginId, loginPassword);
        if (res.requiresMpin) {
          setShowMpinStep(true);
          setSuccessMsg('✅ ID & Password verified! Enter 6-digit MPIN Safety Number.');
        } else {
          setErrorMsg(res.message);
        }
      } else {
        const res = authenticateAdmin(loginId, loginPassword, adminMpin);
        if (res.success && res.session) {
          setSuccessMsg('✅ Admin MPIN verified! Accessing Admin Control Portal...');
          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess(res.session!);
            }
          }, 500);
        } else {
          setErrorMsg(res.message);
        }
      }
    } else {
      const res = authenticateStudent(loginId, loginPassword);
      if (res.success && res.session) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(res.session!);
          }
        }, 500);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      >
        <div className="max-w-xl w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden space-y-6 my-auto">
          {/* Decorative Glowing Accent Grid Background */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
                System Maintenance Active
              </span>
            </div>

            {maintenanceState.updatedAt && (
              <span className="text-[11px] font-mono text-slate-400">
                Updated: {new Date(maintenanceState.updatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Main Visual Icon & Heading */}
          <div className="text-center space-y-3 pt-1">
            <div className="inline-flex p-4 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-slate-800 rounded-2xl border border-amber-500/30 text-amber-400 shadow-xl shadow-amber-500/5 ring-1 ring-amber-400/20">
              <Wrench className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {maintenanceState.title || 'System Under Maintenance'}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-amber-300/90">
                Please wait or check back in a few minutes
              </p>
            </div>
          </div>

          {/* Description & Message Card */}
          <div className="p-4 sm:p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3 text-slate-300 text-xs sm:text-sm leading-relaxed shadow-inner">
            <div className="flex items-start space-x-2.5 text-slate-200">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-100">
                  {maintenanceState.message ||
                    'Our technical team is performing essential system upgrades and data optimizations. Please wait or come back shortly.'}
                </p>
              </div>
            </div>

            {/* Badges for Reason & Time */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
              {maintenanceState.reason && (
                <div className="px-3 py-1 bg-indigo-950/80 text-indigo-300 rounded-lg border border-indigo-800/60 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Reason: {maintenanceState.reason}</span>
                </div>
              )}

              {maintenanceState.estimatedDuration && (
                <div className="px-3 py-1 bg-amber-950/80 text-amber-300 rounded-lg border border-amber-800/60 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Est. Duration: {maintenanceState.estimatedDuration}</span>
                </div>
              )}
            </div>
          </div>

          {/* Current Session / Admin Action Bar */}
          {currentSession && (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <span className="font-semibold">Logged in as:</span>
                <span className="font-mono text-indigo-300 font-bold">{currentSession.email}</span>
                <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded text-[10px] uppercase font-bold border border-indigo-800">
                  {currentSession.role}
                </span>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 text-[11px] font-bold rounded-lg border border-slate-700 transition flex items-center space-x-1 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          )}

          {/* Admin Preview Dismiss Option if Admin is checking preview */}
          {isAdminPreview && onDismissAdminPreview && (
            <div className="p-4 bg-indigo-950/70 border border-indigo-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-indigo-200 block">Administrator Detected</span>
                <span className="text-slate-300 text-[11px]">You can bypass this overlay to manage maintenance controls.</span>
              </div>
              <button
                onClick={onDismissAdminPreview}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5 shrink-0"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Admin Portal</span>
              </button>
            </div>
          )}

          {/* DIRECT LOGIN FORM TOGGLE BUTTON */}
          <div className="pt-1">
            <button
              onClick={() => setShowLoginSection(!showLoginSection)}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-xs rounded-2xl transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Portal Account / Admin Login</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                <span>{showLoginSection ? 'Hide Form' : 'Login Here'}</span>
                {showLoginSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
          </div>

          {/* EXPANDABLE INLINE LOGIN PAGE FORM */}
          <AnimatePresence>
            {showLoginSection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 bg-slate-900/95 border border-slate-800 rounded-2xl space-y-4">
                  {/* Tab Selector */}
                  <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginTab('admin');
                        setShowMpinStep(false);
                        setAdminMpin('');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                        loginTab === 'admin'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Admin Login</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginTab('student');
                        setShowMpinStep(false);
                        setAdminMpin('');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                        loginTab === 'student'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-300" />
                      <span>Student Login</span>
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center space-x-2 font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-xl text-xs flex items-center space-x-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {loginTab === 'admin' ? 'Admin ID / Email *' : 'Student Email *'}
                      </label>
                      <div className="relative">
                        {loginTab === 'admin' ? (
                          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        ) : (
                          <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        )}
                        <input
                          type={loginTab === 'admin' ? 'text' : 'email'}
                          required
                          disabled={loginTab === 'admin' && showMpinStep}
                          value={loginId}
                          onChange={(e) => setLoginId(e.target.value)}
                          placeholder={loginTab === 'admin' ? 'Enter admin ID/email' : 'Enter student email'}
                          className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Password *</label>
                      <div className="relative">
                        <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          disabled={loginTab === 'admin' && showMpinStep}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter password"
                          className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {loginTab === 'admin' && showMpinStep && (
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-indigo-300 mb-1 flex items-center justify-between">
                          <span>Admin Security MPIN (6 Digits) *</span>
                          <span className="text-[10px] text-indigo-400">Step 2 Security</span>
                        </label>
                        <div className="relative">
                          <ShieldCheck className="w-4 h-4 text-indigo-400 absolute left-3 top-3" />
                          <input
                            type="password"
                            maxLength={6}
                            required
                            autoFocus
                            value={adminMpin}
                            onChange={(e) => setAdminMpin(e.target.value)}
                            placeholder="Enter 6-digit MPIN"
                            className="w-full pl-9 pr-3.5 py-2 rounded-xl border-2 border-indigo-500 bg-slate-950 text-white text-xs font-extrabold focus:ring-2 focus:ring-indigo-400 outline-none tracking-widest"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className={`w-full py-2.5 rounded-xl text-white font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-md ${
                        loginTab === 'admin'
                          ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                          : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                      }`}
                    >
                      <span>
                        {loginTab === 'admin'
                          ? showMpinStep
                            ? 'Verify Security MPIN & Login'
                            : 'Login to Admin Portal'
                          : 'Login to Student Account'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Real-time recovery listener feedback */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>Real-time Sync Active — Will auto-restore as soon as maintenance ends</span>
            </div>

            {onRefreshCheck && (
              <button
                onClick={onRefreshCheck}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Check Now
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

