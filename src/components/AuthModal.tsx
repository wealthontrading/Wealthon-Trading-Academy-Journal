import React, { useState } from 'react';
import { ShieldCheck, User, Key, CheckCircle2, AlertCircle, Lock, GraduationCap, ArrowRight, UserPlus } from 'lucide-react';
import { UserSession } from '../types';
import { WEALTHON_LOGO_URL } from '../assets/logo';
import {
  authenticateAdmin,
  authenticateStudent,
  registerStudentRequest,
} from '../utils/studentStorage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  initialMode?: 'student' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'student',
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin' | 'signup'>(initialMode);

  // Student Login Fields
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Signup Fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Admin Login Fields
  const [adminId, setAdminId] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Status/Error Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = authenticateStudent(studentEmail, studentPassword);
    if (res.success && res.session) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onLoginSuccess(res.session!);
        onClose();
      }, 500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleStudentSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = registerStudentRequest(signupEmail, signupName, signupPassword);
    if (res.success) {
      setSuccessMsg(res.message);
      setSignupEmail('');
      setSignupName('');
      setSignupPassword('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = authenticateAdmin(adminId, adminPassword);
    if (res.success && res.session) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onLoginSuccess(res.session!);
        onClose();
      }, 500);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            ✕
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={WEALTHON_LOGO_URL}
                alt="WealthOn Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full">
                WealthOn Portal
              </span>
              <h2 className="text-xl font-extrabold text-white mt-0.5">
                {activeTab === 'admin' ? 'Admin Control Portal' : activeTab === 'signup' ? 'Student Registration' : 'Student Journal Login'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2">
            Every student accesses their personal trading journal window. Log in on any device to view your data.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'student' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'signup' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Request Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'admin' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STUDENT LOGIN FORM */}
          {activeTab === 'student' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Registered Email ID *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="e.g. wealthonresearch@gmail.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Try demo emails: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800 font-bold">wealthonresearch@gmail.com</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800 font-bold">student@tradejournal.in</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Password *</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Enter password (default: student123)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Default password for all students: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-bold">student123</code></p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Login to My Student Window</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('signup')}
                  className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Not registered yet? Request student email approval →
                </button>
              </div>
            </form>
          )}

          {/* STUDENT REQUEST / SIGNUP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleStudentSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Requested Email ID *</label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="e.g. student@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Your Admin will review and approve this email address.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Set Your Student Password</label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Optional (Defaults to: student123)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Submit Student Approval Request</span>
                <UserPlus className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ADMIN LOGIN FORM */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium">
                <p className="font-bold">Admin Privileges:</p>
                <p className="mt-0.5">Admin can approve student email IDs, set passwords, and inspect student trading journal windows.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin ID / Email *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="Default Admin ID: admin"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Password *</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Default Password: admin123"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Open Admin Control Portal</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
