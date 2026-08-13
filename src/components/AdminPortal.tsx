import { sendEmailViaGmail } from "../lib/gmail";
import { getAccessToken, googleSignIn } from "../lib/firebase";
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import {
  ShieldCheck,
  UserCheck,
  BookOpen,
  PlusCircle,
  Calculator,
  BarChart3,
  Send,
  Sparkles,
  Users,
  CheckCircle2,
  Key,
  RefreshCw,
  Eye,
  UserPlus,
  Clock,
  XCircle,
  Trash2,
  Search,
  AlertCircle,
  Lock,
  Wrench,
  Power,
  Radio,
  Star,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { StudentAccount, SystemMaintenanceState, Trade, UserSession } from '../types';
import { AdminBrokerAnalytics } from './AdminBrokerAnalytics';
import { AdminFeedbackAnalytics } from './AdminFeedbackAnalytics';
import {
  adminAddAndApproveStudent,
  adminDeleteStudent,
  adminUpdateStudentStatus,
  adminUpdateStudentDates,
  getStoredMaintenanceState,
  getStoredStudents,
  saveStoredMaintenanceState,
} from '../utils/studentStorage';
import { getStoredTrades } from '../utils/storage';
import { subscribeMaintenanceModeFromFirestore, subscribeStudentsFromFirestore } from '../utils/firebaseSync';

interface AdminPortalProps {
  session: UserSession;
  onLogout: () => void;
  onSwitchToStudentView: () => void;
  onInspectStudentJournal: (email: string, name: string) => void;
  trades: Trade[];
  onSeedSampleTrades: () => void;
  onResetData: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  session,
  onLogout,
  onSwitchToStudentView,
  onInspectStudentJournal,
  onSeedSampleTrades,
}) => {
  const [activeGuideTab, setActiveGuideTab] = useState<'addTrade' | 'calculator' | 'analytics' | 'journal' | 'mentor'>('addTrade');
  const [activeAdminPage, setActiveAdminPage] = useState<'all' | 'students' | 'feedback' | 'ideas' | 'broker' | 'maintenance' | 'manual' | 'enquiries'>('all');

  // Live Students State
  const [students, setStudents] = useState<StudentAccount[]>(() => getStoredStudents());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'disabled' | 'rejected' | 'expiring' | 'expired'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  useEffect(() => {
    const unsub = subscribeStudentsFromFirestore((fsStudents) => {
      if (fsStudents && fsStudents.length > 0) {
        setStudents(fsStudents);
      }
    });
    return () => unsub();
  }, []);

  // Quick Add Student
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('student123');

  // Delete Confirmation
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  // Bulk Add Student
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkEmailsText, setBulkEmailsText] = useState('');

  // Password editing
  const [editingPasswordEmail, setEditingPasswordEmail] = useState<string | null>(null);
  const [editPassVal, setEditPassVal] = useState('');

  // Date editing
  const [editingDateEmail, setEditingDateEmail] = useState<string | null>(null);
  const [editApprovedAt, setEditApprovedAt] = useState<string>('');
  const [editExpiryDate, setEditExpiryDate] = useState<string>('');

  // Banner
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Maintenance Mode State
  const [maintState, setMaintState] = useState<SystemMaintenanceState>(() => getStoredMaintenanceState());
  const [maintTitle, setMaintTitle] = useState(maintState.title || 'System Under Maintenance');
  const [maintMsg, setMaintMsg] = useState(
    maintState.message ||
      'Our technical team is performing essential system upgrades and server maintenance. Please wait or check back shortly.'
  );
  const [maintReason, setMaintReason] = useState(maintState.reason || 'Scheduled Database & Platform Upgrade');
  const [maintDuration, setMaintDuration] = useState(maintState.estimatedDuration || '15-30 Minutes');

  useEffect(() => {
    const unsubMaint = subscribeMaintenanceModeFromFirestore((remoteState) => {
      if (remoteState) {
        setMaintState(remoteState);
        if (remoteState.title) setMaintTitle(remoteState.title);
        if (remoteState.message) setMaintMsg(remoteState.message);
        if (remoteState.reason) setMaintReason(remoteState.reason);
        if (remoteState.estimatedDuration) setMaintDuration(remoteState.estimatedDuration);
      }
    });
    return () => unsubMaint();
  }, []);

  const handleUpdateMaintenanceMode = (activate: boolean) => {
    const updated: SystemMaintenanceState = {
      isMaintenanceActive: activate,
      title: maintTitle,
      message: maintMsg,
      reason: maintReason,
      estimatedDuration: maintDuration,
      updatedAt: Date.now(),
      updatedBy: session.email,
    };
    saveStoredMaintenanceState(updated);
    setMaintState(updated);

    if (activate) {
      setBannerMsg({
        type: 'error',
        text: '🚨 System Maintenance Mode ACTIVATED! All student screens are now showing the Maintenance Notice window.',
      });
    } else {
      setBannerMsg({
        type: 'success',
        text: '✅ Maintenance Mode REMOVED! Student windows have returned to their normal profile and journal views.',
      });
    }
  };


  const refreshStudents = () => {
    setStudents(getStoredStudents());
  };

  const handleAddAndApproveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const res = adminAddAndApproveStudent(newEmail, newName, newPassword);
    if (res.success) {
      setBannerMsg({ type: 'success', text: res.message });
      setNewEmail('');
      setNewName('');
      setNewPassword('student123');
      refreshStudents();
    } else {
      setBannerMsg({ type: 'error', text: res.message });
    }
  };

  const handleBulkApprove = () => {
    if (!bulkEmailsText.trim()) return;
    const emailsList = bulkEmailsText
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 3 && e.includes('@'));

    let count = 0;
    emailsList.forEach((email) => {
      adminAddAndApproveStudent(email, email.split('@')[0], 'student123');
      count++;
    });

    setBannerMsg({
      type: 'success',
      text: `Successfully registered and approved ${count} student email addresses!`,
    });
    setBulkEmailsText('');
    setShowBulkModal(false);
    refreshStudents();
  };

  const handleRenew = (email: string) => {
    adminUpdateStudentStatus(email, 'approved', undefined, true);
    setBannerMsg({
      type: 'success',
      text: `Renewed account plan for ${email}!`,
    });
    refreshStudents();
  };


// Add this state variable to AdminPortal component
// const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

  const handleSendApprovalEmail = async (student: StudentAccount) => {
    const subject = "Your WealthOn Trading Journal account has been successfully activated!";
    const expiryStr = student.expiryDate ? new Date(student.expiryDate).toLocaleString() : '1 Month from activation';
    const bodyText = `Dear ${student.name || 'Student'},

🎉 Your WealthOn Trading Journal account has been successfully activated!

Thank you for choosing WealthOn Trading Academy. Your account approval and activation are now complete.

🔐 Login Details

Login ID: ${student.email}
Password: The password you created during registration
Account Expiry: ${expiryStr}

Please use the same password you entered when registering your account.

You can now access the WealthOn Trading Journal and start tracking your trades, P&L, and trading performance.

📊 Your 1-Month Access Includes:

Trade & P&L Tracking, Trading Performance Analytics, Strategy Analysis & Comparison, Monthly & Yearly Performance Reports, Trading Calendar & Heatmaps, AI Trading Coach & Journal Tools, and Trade History & Performance Insights.

Trade → Track → Analyze → Learn → Improve

Thank you for being a part of WealthOn Trading Academy.

🚀 Welcome to the next level of your trading journey!

Best Regards,
WealthOn Trading Academy
Journal Today, Profit Tomorrow`;

    try {
      let token = await getAccessToken();
      if (!token) {
        setBannerMsg({ type: 'success', text: 'Please sign in with Google to enable Gmail sending...' });
        const result = await googleSignIn();
        if (!result) return;
        token = result.accessToken;
      }
      
      await sendEmailViaGmail(student.email, subject, bodyText);
      setBannerMsg({ type: 'success', text: `✅ Approval email sent successfully to ${student.email}!` });
      window.alert(`✅ Approval email sent successfully to ${student.email}!`);
    } catch (err: any) {
      setBannerMsg({ type: 'error', text: `Failed to send email: ${err.message}` });
      window.alert(`❌ Failed to send email: ${err.message}`);
    }
  };

  const handleApproveStatus = (email: string, status: 'approved' | 'disabled' | 'rejected') => {
    adminUpdateStudentStatus(email, status);
    setBannerMsg({
      type: 'success',
      text: `Updated account status for ${email} to ${status.toUpperCase()}!`,
    });
    refreshStudents();
  };

  const handleSaveNewPassword = (email: string) => {
    if (!editPassVal.trim()) return;
    adminUpdateStudentStatus(email, 'approved', editPassVal.trim());
    setEditingPasswordEmail(null);
    setEditPassVal('');
    setBannerMsg({ type: 'success', text: `Password updated for student ${email}!` });
    refreshStudents();
  };

  const handleEditDates = (student: StudentAccount) => {
    setEditingDateEmail(student.email);
    // Format to yyyy-MM-ddThh:mm
    const formatForInput = (ms?: number) => {
      if (!ms) return '';
      const d = new Date(ms);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };
    setEditApprovedAt(formatForInput(student.approvedAt || student.registeredAt));
    setEditExpiryDate(formatForInput(student.expiryDate));
  };

  const handleSaveDates = (email: string) => {
    const approvedAtTime = editApprovedAt ? new Date(editApprovedAt).getTime() : undefined;
    const expiryDateTime = editExpiryDate ? new Date(editExpiryDate).getTime() : undefined;
    adminUpdateStudentDates(email, approvedAtTime, expiryDateTime);
    setEditingDateEmail(null);
    setBannerMsg({ type: 'success', text: `Dates updated for student ${email}!` });
    refreshStudents();
  };

  const confirmDeleteStudent = (email: string) => {
    adminDeleteStudent(email);
    setBannerMsg({ type: 'success', text: `Deleted student record and all associated data for ${email}!` });
    setDeleteCandidate(null);
    refreshStudents();
  };

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = false;
    if (statusFilter === 'all') matchesFilter = s.status !== 'pending';
    else if (statusFilter === 'expiring') {
      if (s.status === 'approved' && s.expiryDate && Date.now() <= s.expiryDate) {
        const daysLeft = Math.ceil((s.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
        matchesFilter = daysLeft <= 30 && daysLeft > 0;
      }
    } else if (statusFilter === 'expired') {
      matchesFilter = s.status === 'approved' && s.expiryDate !== undefined && Date.now() > s.expiryDate;
    } else {
      matchesFilter = s.status === statusFilter;
    }
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    const getStatusWeight = (s) => {
      if (s.status === 'pending') return 1;
      if (s.status === 'approved') return 3;
      return 2;
    };
    if (getStatusWeight(a) !== getStatusWeight(b)) {
      return getStatusWeight(a) - getStatusWeight(b);
    }
    return (b.registeredAt || 0) - (a.registeredAt || 0);
  });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);
  
  const totalStudents = students.length;
  const approvedStudents = students.filter((s) => s.status === 'approved').length;
  const pendingStudents = students.filter((s) => s.status === 'pending').length;
  const rejectedStudents = students.filter((s) => s.status === 'rejected').length;

  const expiredStudents = students.filter(s => s.status === 'approved' && s.expiryDate && Date.now() > s.expiryDate).length;
  const expiringSoonStudents = students.filter(s => {
    if (s.status !== 'approved' || !s.expiryDate || Date.now() > s.expiryDate) return false;
    const daysLeft = Math.ceil((s.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 30 && daysLeft > 0;
  }).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12 font-sans">
      {/* Admin Reminders Banner */}
      {(expiredStudents > 0 || expiringSoonStudents > 0) && (
        <div className="bg-amber-100 text-amber-900 px-4 py-2 text-xs font-bold flex items-center justify-center shadow-md border-b border-amber-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>
              <strong>Attention:</strong> {expiredStudents > 0 ? `${expiredStudents} student(s) have expired subscriptions.` : ''} 
              {expiredStudents > 0 && expiringSoonStudents > 0 ? ' And ' : ''}
              {expiringSoonStudents > 0 ? `${expiringSoonStudents} student(s) are expiring within 30 days.` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Admin Top Header Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Logo className="text-xl" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded-full">
                  Admin Control Portal
                </span>
                <span className="text-xs text-slate-400 font-mono">({session.email})</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
                Student Account Manager & Academy Control Panel
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onSwitchToStudentView}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Student Dashboard</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-700"
            >
              Logout Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Admin Welcome & System Stats Banner */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-xl border border-blue-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full text-xs font-bold text-blue-200 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Multi-Student Isolated Workspaces</span>
            </div>
            <h2 className="text-2xl font-black">Student Approval & Email Management Portal</h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Every student gets an individual journal window bound to their email address. Enter student emails below to approve access, manage student passwords, or inspect student journals.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0 font-mono">
            <div className="p-3 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 text-center">
              <span className="text-[10px] uppercase text-blue-200 font-bold block">Registered</span>
              <span className="text-2xl font-black text-white">{totalStudents}</span>
            </div>
            <div className="p-3 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 text-center">
              <span className="text-[10px] uppercase text-blue-200 font-bold block">Approved</span>
              <span className="text-2xl font-black text-emerald-400">{approvedStudents}</span>
            </div>
            <div className="p-3 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 text-center">
              <span className="text-[10px] uppercase text-blue-200 font-bold block">Pending</span>
              <span className="text-2xl font-black text-amber-300">{pendingStudents}</span>
            </div>
          </div>
        </div>

        {/* ADMIN MODULE QUICK NAVIGATION TABS */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveAdminPage('all')}
              className={`px-3.5 py-2 font-black rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminPage === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>All Admin Sections</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminPage('students')}
              className={`px-3.5 py-2 font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminPage === 'students'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Student Accounts</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminPage('feedback')}
              className={`px-3.5 py-2 font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminPage === 'feedback'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>User Feedback & Analytics</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminPage('ideas')}
              className={`px-3.5 py-2 font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminPage === 'ideas'
                  ? 'bg-purple-600 text-white font-black shadow-xs'
                  : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Ideas & Improvements</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminPage('enquiries')}
              className={`px-3.5 py-2 font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminPage === 'enquiries'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Enquiries</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminPage('broker')}
              className={`px-3.5 py-2 font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminPage === 'broker'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Broker Demands</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminPage('maintenance')}
              className={`px-3.5 py-2 font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminPage === 'maintenance'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>System Maintenance</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminPage('manual')}
              className={`px-3.5 py-2 font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminPage === 'manual'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Site Manual</span>
            </button>
          </div>
        </div>

        {/* Banner Notification */}
        {bannerMsg && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
              bannerMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              {bannerMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{bannerMsg.text}</span>
            </div>
            <button onClick={() => setBannerMsg(null)} className="font-extrabold text-sm px-1 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* SECTION 0: PAGE MAINTENANCE & SYSTEM NOTICE CONTROL */}
        {(activeAdminPage === 'all' || activeAdminPage === 'maintenance') && (
        <div
          className={`rounded-3xl border shadow-sm p-6 space-y-6 transition-all ${
            maintState.isMaintenanceActive
              ? 'bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 border-amber-300 shadow-amber-500/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-2xl text-white shadow-md ${
                  maintState.isMaintenanceActive ? 'bg-amber-600' : 'bg-slate-800'
                }`}
              >
                <Wrench className="w-6 h-6 stroke-[2.25]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-black text-slate-900">Page Maintenance & System Notice Control</h3>
                  {maintState.isMaintenanceActive ? (
                    <span className="px-2.5 py-0.5 bg-amber-600 text-white font-mono font-extrabold text-[10px] rounded-full uppercase tracking-wider animate-pulse">
                      🔴 LIVE MAINTENANCE ACTIVE
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] rounded-full uppercase tracking-wider">
                      🟢 OPERATIONAL
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  When enabled, all student screens display a maintenance window stating &quot;Please wait or come back later&quot;. Removing it restores students directly to their profile/journal view.
                </p>
              </div>
            </div>

            {/* Quick Status Toggle Buttons */}
            <div className="flex items-center space-x-3 self-start md:self-auto shrink-0">
              {maintState.isMaintenanceActive ? (
                <button
                  onClick={() => handleUpdateMaintenanceMode(false)}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Remove Maintenance Mode & Restore Access</span>
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateMaintenanceMode(true)}
                  className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-md shadow-amber-600/20"
                >
                  <Power className="w-4 h-4 text-amber-200" />
                  <span>Activate Maintenance Mode Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Maintenance Notice Customizer Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Notice Title Heading</label>
              <input
                type="text"
                value={maintTitle}
                onChange={(e) => setMaintTitle(e.target.value)}
                placeholder="e.g. System Under Maintenance"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Reason / Status Category Tag</label>
              <input
                type="text"
                value={maintReason}
                onChange={(e) => setMaintReason(e.target.value)}
                placeholder="e.g. Scheduled Database Sync & Platform Upgrade"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 bg-white"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-slate-800 block">Detailed Student Maintenance Message</label>
              <textarea
                value={maintMsg}
                onChange={(e) => setMaintMsg(e.target.value)}
                rows={2}
                placeholder="Message shown to students (e.g. Our team is updating features. Please wait or come back shortly.)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Estimated Downtime / Duration Badge</label>
              <input
                type="text"
                value={maintDuration}
                onChange={(e) => setMaintDuration(e.target.value)}
                placeholder="e.g. 15-30 Minutes"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 bg-white"
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <span className="font-bold text-slate-700 block mb-1">Quick Message Presets</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMaintTitle('System Under Maintenance');
                    setMaintReason('Server Maintenance');
                    setMaintMsg('Our team is performing scheduled server maintenance. Please wait or check back shortly.');
                    setMaintDuration('15 Mins');
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer"
                >
                  Server Upgrade
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMaintTitle('Database Sync in Progress');
                    setMaintReason('Database Migration');
                    setMaintMsg('Syncing cloud database records for high performance. Please wait a few moments.');
                    setMaintDuration('5-10 Mins');
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer"
                >
                  Database Sync
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMaintTitle('Emergency Platform Update');
                    setMaintReason('Bug Fix & Optimization');
                    setMaintMsg('Applying quick system improvements. Please hold on or return shortly.');
                    setMaintDuration('20 Mins');
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer"
                >
                  Urgent Patch
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>
                Changes sync live to all connected student screens automatically via Firestore & local browser channels.
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleUpdateMaintenanceMode(maintState.isMaintenanceActive)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Save Notice Details
              </button>
            </div>
          </div>
        </div>
        )}

        {/* SECTION 1: STUDENT APPROVAL & MANAGEMENT */}
        {(activeAdminPage === 'all' || activeAdminPage === 'students') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-slate-900">Student Account Approval & Email Directory</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Add student email addresses to grant access. When students log in with their email, they access their own personal trade journal.
              </p>
            </div>

            <button
              onClick={() => setShowBulkModal(!showBulkModal)}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>Bulk Approve Student Emails</span>
            </button>
          </div>

          {/* Bulk Import Collapsible */}
          {showBulkModal && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>Bulk Approve Student Email IDs</span>
                </h4>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-xs text-indigo-700 font-bold hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-indigo-800">
                Paste student email addresses below (one per line or separated by commas). All entered emails will be immediately approved with default password <code className="bg-indigo-100 font-bold px-1 rounded">student123</code>.
              </p>
              <textarea
                rows={3}
                value={bulkEmailsText}
                onChange={(e) => setBulkEmailsText(e.target.value)}
                placeholder="student1@gmail.com&#10;student2@yahoo.com&#10;student3@academy.in"
                className="w-full p-2.5 rounded-xl border border-indigo-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              />
              <button
                type="button"
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Approve All Entered Emails
              </button>
            </div>
          )}

          {/* Quick Add & Approve Form */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>Pre-Approve & Register New Student Email</span>
            </h4>

            <form onSubmit={handleAddAndApproveStudent} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Student Email ID *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="student@academy.in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Amit Kumar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Set Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="student123"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-200" />
                  <span>Approve & Save Email</span>
                </button>
              </div>
            </form>
          </div>

          {/* Directory Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student by email or name..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Approved ({approvedStudents})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  statusFilter === 'pending' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingStudents})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  statusFilter === 'rejected' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rejected ({rejectedStudents})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('expiring')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  statusFilter === 'expiring' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-600 hover:text-amber-700'
                }`}
              >
                Expiring ({expiringSoonStudents})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('expired')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  statusFilter === 'expired' ? 'bg-rose-700 text-white shadow-2xs' : 'text-rose-600 hover:text-rose-700'
                }`}
              >
                Expired ({expiredStudents})
              </button>
            </div>
          </div>

                    {/* Pending Student Requests Table */}
          {pendingStudents > 0 && (
            <div className="border-2 border-amber-200 rounded-2xl overflow-hidden bg-amber-50 shadow-sm mb-8">
              <div className="p-4 bg-amber-100/50 border-b border-amber-200 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-amber-900 uppercase tracking-wide">
                  New Student Access Requests ({pendingStudents})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-amber-100/30 border-b border-amber-200 text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">
                      <th className="py-3 px-4">Student Email & Name</th>
                      <th className="py-3 px-4">Requested On</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/50 text-xs">
                    {students.filter(s => s.status === 'pending').map((s) => (
                      <tr key={s.id} className="hover:bg-amber-100/40 transition">
                        <td className="py-3 px-4">
                          <p className="font-extrabold text-slate-900 text-xs">{s.email}</p>
                          <p className="text-[11px] text-slate-600">{s.name || 'Student'}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {new Date(s.registeredAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 text-[11px] font-bold animate-pulse">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Waiting Approval</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleApproveStatus(s.email, 'approved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-xs flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setDeleteCandidate(s.email)}
                              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-lg transition cursor-pointer flex items-center space-x-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

{/* Students Directory Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Student Email & Name</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Approval Status</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4">Trades Logged</th>
                    <th className="py-3 px-4 text-right">Actions / Inspect Journal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No student accounts found matching your query.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s) => {
                      const studentTrades = getStoredTrades(s.email);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <p className="font-extrabold text-slate-900 text-xs">{s.email}</p>
                            <p className="text-[11px] text-slate-500">{s.name || 'Student'}</p>
                          </td>

                          <td className="py-3 px-4 text-[11px] text-slate-600 space-y-1 w-56">
                            {editingDateEmail === s.email ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Login / Approved</label>
                                  <input 
                                    type="datetime-local" 
                                    className="w-full text-xs p-1 border rounded"
                                    value={editApprovedAt}
                                    onChange={e => setEditApprovedAt(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Expiry</label>
                                  <input 
                                    type="datetime-local" 
                                    className="w-full text-xs p-1 border rounded"
                                    value={editExpiryDate}
                                    onChange={e => setEditExpiryDate(e.target.value)}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleSaveDates(s.email)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">Save</button>
                                  <button onClick={() => setEditingDateEmail(null)} className="text-xs bg-slate-200 text-slate-800 px-2 py-1 rounded">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="group relative pr-6">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold">Login:</span>
                                    <span>{new Date(s.approvedAt || s.registeredAt).toLocaleString()}</span>
                                  </div>
                                  {s.expiryDate && (
                                    <div className="flex flex-col gap-1 mt-1 border-t border-slate-100 pt-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-slate-500 text-[10px]">Expiry:</span>
                                        <span className={Date.now() > s.expiryDate ? 'text-rose-600 font-bold text-[10px]' : 'text-slate-700 text-[10px]'}>
                                          {new Date(s.expiryDate).toLocaleDateString()}
                                        </span>
                                      </div>
                                      {(() => {
                                        const daysLeft = Math.ceil((s.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
                                        if (daysLeft <= 0) {
                                          return <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold w-fit">Expired</span>;
                                        }
                                        if (daysLeft <= 3) {
                                          return <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold w-fit animate-pulse">Expiring in {daysLeft} days</span>;
                                        }
                                        return <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium w-fit">{daysLeft} days left</span>;
                                      })()}
                                    </div>
                                  )}
                                </div>
                                <button 
                                  onClick={() => handleEditDates(s)}
                                  className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Edit Dates"
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {s.status === 'approved' && (!s.expiryDate || Date.now() <= s.expiryDate) && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Approved</span>
                              </span>
                            )}
                            {s.status === 'approved' && s.expiryDate && Date.now() > s.expiryDate && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                                <Clock className="w-3 h-3 text-rose-600" />
                                <span>Expired</span>
                              </span>
                            )}
                            {s.status === 'pending' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending Approval</span>
                              </span>
                            )}
                            {s.status === 'disabled' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold">
                                <Lock className="w-3 h-3 text-slate-600" />
                                <span>Disabled</span>
                              </span>
                            )}
                            {s.status === 'rejected' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Rejected (Banned)</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {editingPasswordEmail === s.email ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="text"
                                  value={editPassVal}
                                  onChange={(e) => setEditPassVal(e.target.value)}
                                  placeholder="New Password"
                                  className="w-24 px-2 py-1 text-xs border border-blue-400 rounded-md outline-none bg-white font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveNewPassword(s.email)}
                                  className="px-2 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-md cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPasswordEmail(null)}
                                  className="text-slate-400 text-[11px] px-1 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                                  {s.password || 'student123'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPasswordEmail(s.email);
                                    setEditPassVal(s.password || 'student123');
                                  }}
                                  className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                                  title="Change student password"
                                >
                                  <Key className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-700">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-900 font-bold text-xs">
                              {studentTrades.length} Trades
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {s.status === 'pending' && (
                                <button
                                  onClick={() => handleApproveStatus(s.email, 'approved')}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-2xs flex items-center space-x-1"
                                  title="Approve student email"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve Email</span>
                                </button>
                              )}

                              {s.status === 'approved' && (
                                <>
                                  <button
                                    onClick={() => handleSendApprovalEmail(s)}
                                    className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-xs rounded-lg transition cursor-pointer flex items-center space-x-1"
                                    title="Send approval email to student"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>Send Email</span>
                                  </button>
                                  <button
                                    onClick={() => handleApproveStatus(s.email, 'disabled')}
                                    className="px-2 py-1 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer text-xs font-semibold"
                                    title="Disable account"
                                  >
                                    Disable
                                  </button>
                                </>
                              )}

                              {s.status === 'approved' && s.expiryDate && Date.now() > s.expiryDate && (
                                <button
                                  onClick={() => handleRenew(s.email)}
                                  className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition cursor-pointer text-xs font-semibold"
                                  title="Renew plan"
                                >
                                  Renew Plan
                                </button>
                              )}

                              {(s.status === 'disabled' || s.status === 'rejected') && (
                                <button
                                  onClick={() => handleApproveStatus(s.email, 'approved')}
                                  className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                                >
                                  Re-enable
                                </button>
                              )}

                              <button
                                onClick={() => onInspectStudentJournal(s.email, s.name)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs rounded-lg transition cursor-pointer flex items-center space-x-1"
                                title="Inspect this student's journal window"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Inspect Journal</span>
                              </button>

                              <button
                                onClick={() => setDeleteCandidate(s.email)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Ban/Reject student record"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Showing {(currentPage - 1) * studentsPerPage + 1} to {Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} entries</span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition font-bold cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="font-bold">Page {currentPage} of {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition font-bold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* SECTION 2: USER FEEDBACK & SATISFACTION ANALYTICS */}
        {(activeAdminPage === 'all' || activeAdminPage === 'feedback') && (
          <AdminFeedbackAnalytics />
        )}
        
        {/* SECTION 2.5: IDEAS & IMPROVEMENTS */}
        {activeAdminPage === 'ideas' && (
          <AdminFeedbackAnalytics defaultTypeFilter="Idea" />
        )}

        {/* SECTION 2.6: ENQUIRIES */}
        {(activeAdminPage === 'all' || activeAdminPage === 'enquiries') && (
          <AdminFeedbackAnalytics defaultTypeFilter="Enquiry" />
        )}

        {/* SECTION 3: BROKER DEMAND ANALYTICS & MARKET SURVEY */}
        {(activeAdminPage === 'all' || activeAdminPage === 'broker') && (
          <AdminBrokerAnalytics onInspectStudentJournal={onInspectStudentJournal} />
        )}

        {/* SECTION 4: SITE USAGE MANUAL FOR ACADEMY */}
        {(activeAdminPage === 'all' || activeAdminPage === 'manual') && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-slate-900">Interactive Site Usage Manual for Students</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any tab below to learn how each feature on the platform works.
              </p>
            </div>

            {/* Guide Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                onClick={() => setActiveGuideTab('addTrade')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  activeGuideTab === 'addTrade' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Add Trade & Executions
              </button>
              <button
                onClick={() => setActiveGuideTab('calculator')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  activeGuideTab === 'calculator' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Auto Charges & Tranches
              </button>
              <button
                onClick={() => setActiveGuideTab('analytics')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  activeGuideTab === 'analytics' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Analytics & Charts
              </button>
              <button
                onClick={() => setActiveGuideTab('journal')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  activeGuideTab === 'journal' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4. Daily Journal Rules
              </button>
              <button
                onClick={() => setActiveGuideTab('mentor')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  activeGuideTab === 'mentor' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                5. Send to Mentor
              </button>
            </div>
          </div>

          {/* Guide Content Display */}
          {activeGuideTab === 'addTrade' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-2">
                <h4 className="text-sm font-extrabold text-blue-900 flex items-center space-x-2">
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>How to Log a Trade with Partial Execution Tranches</span>
                </h4>
                <p className="text-xs text-blue-950 leading-relaxed">
                  Students log trades by clicking <strong>&quot;+ Add Trade&quot;</strong>. If a trade involves entering or scaling out in partial tranches (e.g. buying/selling 100 qty then another tranche), click <strong>&quot;+ Add More Execution Leg&quot;</strong> inside the modal!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px] block">Execution Types</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>1. Manual Trading:</strong> Standard manual trade execution on broker platform.</li>
                    <li><strong>2. Algo Trading:</strong> Automated trading bot or algorithmic strategy execution.</li>
                    <li><strong>3. Copy Trading:</strong> Trade replicated from a signal provider or mentor.</li>
                    <li><strong>4. Others:</strong> Custom execution mode with mandatory reason input column.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px] block">Trade Parameters</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Segment & Strike:</strong> Options (CE/PE), Futures, Equity Cash.</li>
                    <li><strong>Entry / Exit / Quantity:</strong> Auto-calculates Gross P&L live across all execution legs.</li>
                    <li><strong>Strategy & Emotion:</strong> Track setups (CPR, VWAP, Scalping) & emotions (FOMO, Confident).</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {activeGuideTab === 'calculator' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                <h4 className="text-sm font-extrabold text-emerald-900 flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>Brokerage & Charges Auto-Calculator</span>
                </h4>
                <p className="text-xs text-emerald-950 leading-relaxed">
                  The system features an automated charge estimator tuned for Indian brokers (Zerodha, Groww, AngelOne, Dhan, Fyers).
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-900 uppercase text-[11px] block">How Auto Estimate Works:</span>
                <p>1. In the Add Trade modal, click <strong>&quot;Auto Estimate Charges&quot;</strong>.</p>
                <p>2. Automatically calculates STT (Securities Transaction Tax), Exchange Turnover Fees, GST (18%), and SEBI charges.</p>
                <p>3. Allows typing custom brokerage or taxes manually if needed.</p>
              </div>
            </motion.div>
          )}

          {activeGuideTab === 'analytics' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-2">
                <h4 className="text-sm font-extrabold text-purple-900 flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>Analytics & Performance Metrics</span>
                </h4>
                <p className="text-xs text-purple-950 leading-relaxed">
                  Students can view deep visual statistics on their trading performance under the Analytics tab.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Win Rate & Profit Factor</span>
                  <p className="text-slate-600">Tracks winning vs losing trade ratios and risk-reward factors automatically.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Daily P&L Heatmap</span>
                  <p className="text-slate-600">Visual green/red calendar showing profitable vs loss days.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Strategy Breakdown</span>
                  <p className="text-slate-600">Analyzes which strategy generates highest returns.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeGuideTab === 'journal' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 space-y-2">
                <h4 className="text-sm font-extrabold text-indigo-900 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Daily Notes, Trading Rules & Goals</span>
                </h4>
                <p className="text-xs text-indigo-950 leading-relaxed">
                  Building discipline is critical. Students log daily market reflections, active trading rules, and monthly P&L targets.
                </p>
              </div>
            </motion.div>
          )}

          {activeGuideTab === 'mentor' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 space-y-2">
                <h4 className="text-sm font-extrabold text-teal-900 flex items-center space-x-2">
                  <Send className="w-4 h-4 text-teal-600" />
                  <span>Send Trading Journal to Mentor</span>
                </h4>
                <p className="text-xs text-teal-950 leading-relaxed">
                  Students can click <strong>&quot;Send to Mentor&quot;</strong> in the header to generate a clean PDF / Excel summary or email their trading log to academy mentors for review.
                </p>
              </div>
            </motion.div>
          )}
        </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Delete Student?</h3>
              <p className="text-sm text-slate-600">
                Are you sure you want to permanently delete <strong>{deleteCandidate}</strong>? 
                This will erase their profile, journal trades, notes, and feedback.
              </p>
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setDeleteCandidate(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  No, Cancel
                </button>
                <button
                  onClick={() => confirmDeleteStudent(deleteCandidate)}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
