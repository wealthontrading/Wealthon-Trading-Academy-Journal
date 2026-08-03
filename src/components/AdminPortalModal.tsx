import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Key,
  Search,
  Users,
  Clock,
  PlusCircle,
  AlertCircle,
  BarChart2,
  Lock,
} from 'lucide-react';
import { StudentAccount } from '../types';
import {
  adminAddAndApproveStudent,
  adminDeleteStudent,
  adminUpdateStudentStatus,
  clearAllStudents,
  getStoredStudents,
} from '../utils/studentStorage';
import { getStoredTrades } from '../utils/storage';
import { subscribeStudentsFromFirestore } from '../utils/firebaseSync';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectStudentJournal: (email: string, name: string) => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  onInspectStudentJournal,
}) => {
  const [students, setStudents] = useState<StudentAccount[]>(() => getStoredStudents());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'disabled'>('all');

  // Quick Add Student State
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('student123');

  // Bulk Add Student State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkEmailsText, setBulkEmailsText] = useState('');

  // Editing Password Inline State
  const [editingPasswordEmail, setEditingPasswordEmail] = useState<string | null>(null);
  const [editPassVal, setEditPassVal] = useState('');

  // Status Banners
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Firestore subscription for real-time student request updates across devices
  useEffect(() => {
    if (isOpen) {
      const unsubscribe = subscribeStudentsFromFirestore((updatedStudents) => {
        setStudents(updatedStudents);
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleDeleteStudent = (email: string) => {
    if (confirm(`Are you sure you want to remove student ${email} from the Admin system?`)) {
      adminDeleteStudent(email);
      setBannerMsg({ type: 'success', text: `Removed student ${email}!` });
      refreshStudents();
    }
  };

  const handleClearAllStudents = () => {
    if (confirm('Are you sure you want to CLEAR ALL student approvals and pending requests? This will wipe all existing student records so you can start completely fresh.')) {
      clearAllStudents();
      setStudents([]);
      setBannerMsg({ type: 'success', text: 'All student approvals and pending requests have been cleared! System is ready for fresh starting.' });
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const totalStudents = students.length;
  const approvedStudents = students.filter((s) => s.status === 'approved').length;
  const pendingStudents = students.filter((s) => s.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full">
                  Admin Control Portal
                </span>
                <span className="text-xs text-indigo-300 font-mono">ID: admin</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                Student Account & Approval Manager
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowBulkModal(!showBulkModal)}
              className="px-3.5 py-2 bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer border border-indigo-600 shadow-xs flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4 text-indigo-200" />
              <span>Bulk Approve Emails</span>
            </button>

            <button
              onClick={handleClearAllStudents}
              className="px-3.5 py-2 bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-bold text-xs rounded-xl transition cursor-pointer border border-rose-700 shadow-xs flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4 text-rose-300" />
              <span>Clear All Approvals</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-700"
            >
              Close Portal
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-100 border-b border-slate-200 shrink-0">
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-3 shadow-2xs">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Registered Students</p>
              <p className="text-lg font-extrabold text-slate-900">{totalStudents}</p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-3 shadow-2xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved Active Students</p>
              <p className="text-lg font-extrabold text-emerald-700">{approvedStudents}</p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-3 shadow-2xs">
            <Clock className="w-6 h-6 text-amber-600" />
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Approval Requests</p>
              <p className="text-lg font-extrabold text-amber-700">{pendingStudents}</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Banner Message */}
          {bannerMsg && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
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
              <button
                onClick={() => setBannerMsg(null)}
                className="font-extrabold text-sm px-1 hover:opacity-75 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Bulk Import Collapsible */}
          {showBulkModal && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>Bulk Approve Student Email IDs</span>
                </h3>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-xs text-indigo-700 font-bold hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-indigo-800">
                Paste student email addresses below (one per line or separated by commas). All entered emails will be immediately approved and granted default password <code className="bg-indigo-100 font-bold px-1 rounded">student123</code>.
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
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>Pre-Approve & Register New Student Email</span>
            </h3>

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
            </div>
          </div>

          {/* Students Directory Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Student Info</th>
                    <th className="py-3 px-4">Approval Status</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4">Trades Logged</th>
                    <th className="py-3 px-4 text-right">Actions / Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No student email accounts found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const studentTrades = getStoredTrades(s.email);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <p className="font-extrabold text-slate-900 text-xs">{s.email}</p>
                            <p className="text-[11px] text-slate-500">{s.name || 'Student'}</p>
                          </td>

                          <td className="py-3 px-4">
                            {s.status === 'approved' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Approved</span>
                              </span>
                            )}
                            {s.status === 'pending' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending Approval</span>
                              </span>
                            )}
                            {s.status === 'disabled' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Disabled</span>
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
                                  className="px-2 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-md"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPasswordEmail(null)}
                                  className="text-slate-400 text-[11px] px-1"
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
                                <button
                                  onClick={() => handleApproveStatus(s.email, 'disabled')}
                                  className="px-2 py-1 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer text-xs font-semibold"
                                  title="Disable account"
                                >
                                  Disable
                                </button>
                              )}

                              {s.status === 'disabled' && (
                                <button
                                  onClick={() => handleApproveStatus(s.email, 'approved')}
                                  className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                                >
                                  Re-enable
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  onInspectStudentJournal(s.email, s.name);
                                  onClose();
                                }}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs rounded-lg transition cursor-pointer flex items-center space-x-1"
                                title="Inspect this student's journal window"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Inspect Journal</span>
                              </button>

                              <button
                                onClick={() => handleDeleteStudent(s.email)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete student record"
                              >
                                <Trash2 className="w-4 h-4" />
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
          </div>
        </div>
      </div>
    </div>
  );
};
