import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Logo } from '../Logo';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  Lock,
  Key,
  User,
  MessageSquare,
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../../lib/firebase';
import { StudentAccount, UserSession } from '../../types';
import {
  authenticateAdmin,
  authenticateStudent,
  getStoredStudents,
  registerStudentRequest,
} from '../../utils/studentStorage';
import { subscribeStudentsFromFirestore } from '../../utils/firebaseSync';
import { EnquiryView } from '../EnquiryView';

interface LoginModalProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'signup' | 'admin' | 'enquiry'>('signup');

  // Student Login State
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Waiting email state for live approval tracking
  const [waitingEmail, setWaitingEmail] = useState<string | null>(null);

  // Admin Login State
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminMpin, setAdminMpin] = useState('');
  const [showMpinStep, setShowMpinStep] = useState(false);

  // Statuses
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Live Firestore subscription: automatically unlocks when admin approves student anywhere
  useEffect(() => {
    const unsubscribe = subscribeStudentsFromFirestore((updatedStudents: StudentAccount[]) => {
      const targetEmail = (waitingEmail || studentEmail || signupEmail).trim().toLowerCase();
      if (targetEmail) {
        const student = updatedStudents.find((s) => s.email.trim().toLowerCase() === targetEmail);
        if (student && student.status === 'approved') {
          if (errorMsg.includes('pending') || errorMsg.includes('PENDING') || waitingEmail) {
            setErrorMsg('');
            setSuccessMsg(`🎉 LIVE APPROVAL RECEIVED! Access for ${student.email} has been approved by Admin! Opening Journal...`);
            const session: UserSession = {
              email: student.email,
              name: student.name || student.email.split('@')[0],
              role: 'student',
              plan: 'Active Plan - Limited',
              expiryDate: student.expiryDate,
            };
            setTimeout(() => {
              onLoginSuccess(session);
            }, 700);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [waitingEmail, studentEmail, signupEmail, errorMsg, onLoginSuccess]);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = studentEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your student email ID.');
      return;
    }

    const res = authenticateStudent(cleanEmail, studentPassword);
    if (res.success && res.session) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onLoginSuccess(res.session!);
      }, 400);
    } else {
      if (res.message.includes('not found')) {
        // Auto register student approval request so the user is never stuck
        const regRes = registerStudentRequest(cleanEmail, cleanEmail.split('@')[0], studentPassword || 'student123');
        setWaitingEmail(cleanEmail);
        if (regRes.success) {
          setSuccessMsg(`✅ Login request sent to Admin! Waiting for Admin approval for ${cleanEmail}...`);
        } else {
          setErrorMsg(regRes.message);
        }
      } else {
        if (res.message.includes('pending')) {
          setWaitingEmail(cleanEmail);
        }
        setErrorMsg(res.message);
      }
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = registerStudentRequest(signupEmail, signupName, signupPassword);
    if (res.success) {
      setWaitingEmail(signupEmail);
      setSuccessMsg(`✅ Request sent to Admin Portal! Waiting for Admin to approve ${signupEmail}...`);
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      if (!user.email) {
        setErrorMsg('Could not retrieve email address from Google Account.');
        return;
      }

      const email = user.email.trim().toLowerCase();
      const name = user.displayName || email.split('@')[0];

      // Check current students list
      const students = getStoredStudents();
      const existing = students.find((s) => s.email.toLowerCase() === email);

      if (existing) {
        if (existing.status === 'approved') {
          const res = authenticateStudent(email, existing.password);
          if (res.success && res.session) {
            setSuccessMsg(`🎉 Google Login Successful! Welcome, ${res.session.name}`);
            setTimeout(() => onLoginSuccess(res.session!), 400);
          } else {
            const googleSession: UserSession = {
              email: existing.email,
              name: existing.name || name,
              role: 'student',
              plan: 'Active Plan - Limited',
              expiryDate: existing.expiryDate,
            };
            setSuccessMsg(`🎉 Welcome back, ${googleSession.name}!`);
            setTimeout(() => onLoginSuccess(googleSession), 400);
          }
        } else if (existing.status === 'pending') {
          setWaitingEmail(email);
          setErrorMsg(`⏳ Google Account (${email}) request is PENDING Admin approval. Sent to Admin Portal live!`);
        } else {
          setErrorMsg(`Your Google Account (${email}) has been disabled or rejected by Admin.`);
        }
      } else {
        // Automatically submit request for new Google user
        registerStudentRequest(email, name, 'google_student');
        setWaitingEmail(email);
        setSuccessMsg(`✅ Request Sent! Google Account (${email}) submitted to Admin Portal live. Waiting for Admin approval...`);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        return;
      }
      setErrorMsg('Google Sign-In failed: ' + (err.message || 'Error authenticating with Google.'));
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!showMpinStep) {
      // Step 1: Verify ID & Password
      const res = authenticateAdmin(adminId, adminPassword);
      if (res.requiresMpin) {
        setShowMpinStep(true);
        setSuccessMsg('✅ ID & Password verified! Please enter your 6-Digit Admin Safety MPIN.');
      } else {
        setErrorMsg(res.message);
      }
    } else {
      // Step 2: Verify MPIN
      const res = authenticateAdmin(adminId, adminPassword, adminMpin);
      if (res.success && res.session) {
        setSuccessMsg('✅ Admin MPIN verified! Accessing Admin Control Portal...');
        setTimeout(() => {
          onLoginSuccess(res.session!);
        }, 400);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10"
      >
        {/* Header */}
        <div className="p-7 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white text-center relative">
          <Logo className="text-3xl" />
          <h1 className="text-2xl font-black tracking-tight">WealthOn Trading Academy</h1>
          <p className="text-xs text-blue-200 mt-1">
            Every student gets an individual journal window across devices.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-2 w-full">
            <button
              onClick={() => {
                setActiveTab('student');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 px-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'student' ? 'bg-blue-600 text-white shadow-md' : 'bg-white/10 border border-white/20 text-slate-200 hover:bg-white/20 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Student Login</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 px-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'signup' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/10 border border-white/20 text-slate-200 hover:bg-white/20 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Request Email</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('admin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 px-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/10 border border-white/20 text-slate-200 hover:bg-white/20 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
          </div>
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => {
                setActiveTab('enquiry');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-1.5 px-4 text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'enquiry' ? 'bg-amber-500 text-white shadow-md' : 'bg-transparent text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Submit Enquiry</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STUDENT LOGIN TAB */}
          {activeTab === 'student' && (
            <div className="space-y-4">
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Registered Email ID *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="Enter student email"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Password *</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Access My Student Window</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('signup')}
                    className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Not registered? Request student email approval →
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-slate-100 mt-4 text-center">
                <p className="text-xs text-slate-500 mb-2 font-medium">Want to join WealthOn Trading Academy?</p>
                <a
                  href="https://wa.me/918547742160?text=Hi%2C%20I%20would%20like%20to%20buy%20a%20plan%20for%20WealthOn%20Trading%20Academy."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer border border-emerald-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Buy a Plan via WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* SIGNUP REQUEST TAB */}
          {activeTab === 'signup' && (
            <div className="space-y-4">
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Requested Student Email ID *</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g. student@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password (Optional)</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Set your password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Submit Approval Request</span>
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-slate-100 mt-4 text-center">
                <p className="text-xs text-slate-500 mb-2 font-medium">Want to join WealthOn Trading Academy?</p>
                <a
                  href="https://wa.me/918547742160?text=Hi%2C%20I%20would%20like%20to%20buy%20a%20plan%20for%20WealthOn%20Trading%20Academy."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer border border-emerald-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Buy a Plan via WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* ADMIN LOGIN TAB */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Admin Control Center Access</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin ID / Email *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    disabled={showMpinStep}
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="Enter Admin ID / Email"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Password *</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    disabled={showMpinStep}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter Admin Password"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              {/* STEP 2: MPIN FIELD (Only shown AFTER valid ID & Password) */}
              {showMpinStep && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Admin Security MPIN (6 Digits) *</span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      Step 2 Verification
                    </span>
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 absolute left-3 top-3" />
                    <input
                      type="password"
                      maxLength={6}
                      required
                      autoFocus
                      value={adminMpin}
                      onChange={(e) => setAdminMpin(e.target.value)}
                      placeholder="Enter 6-digit MPIN"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border-2 border-indigo-500 bg-indigo-50/30 text-sm font-extrabold focus:ring-2 focus:ring-indigo-600 outline-none tracking-widest text-slate-900"
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMpinStep(false);
                        setAdminMpin('');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 underline cursor-pointer"
                    >
                      ← Re-enter ID / Password
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>{showMpinStep ? 'Verify Security MPIN' : 'Login to Admin Portal'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ENQUIRY TAB */}
          {activeTab === 'enquiry' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Send us your questions or enquiries</span>
              </div>
              <EnquiryView />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          WealthOn Trading Academy © 2026 • Multi-Student Journal Infrastructure
        </div>
      </motion.div>
    </div>
  );
};
