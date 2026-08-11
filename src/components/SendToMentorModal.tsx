import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  FileText,
  FileSpreadsheet,
  Send,
  Copy,
  Check,
  GraduationCap,
  Download,
  Paperclip,
  User,
  ShieldCheck,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Trade, TraderProfile, DashboardMetrics } from '../types';
import { exportTradesToPDF, exportTradesToExcel } from '../utils/export';
import { calculateMetrics, formatINR } from '../utils/calculations';

interface SendToMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  profile: TraderProfile;
  metrics: DashboardMetrics;
}

export const SendToMentorModal: React.FC<SendToMentorModalProps> = ({
  isOpen,
  onClose,
  trades,
  profile,
  metrics,
}) => {
  const [mentorEmail, setMentorEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [studentName, setStudentName] = useState(profile.name || 'Student Trader');
  const [studentContact, setStudentContact] = useState('');
  const [dateScope, setDateScope] = useState<'all' | 'month' | 'today'>('all');
  const [customNote, setCustomNote] = useState(
    'Dear Mentor,\n\nPlease review my trading journal report and trades log attached. I would appreciate your guidance on my entry/exit rules and risk management.'
  );

  const [copiedText, setCopiedText] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [fileDownloaded, setFileDownloaded] = useState(false);

  // Filter trades based on scope
  const filteredTrades = React.useMemo(() => {
    if (dateScope === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return trades.filter((t) => t.date === today);
    }
    if (dateScope === 'month') {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      return trades.filter((t) => t.date.startsWith(currentMonth));
    }
    return trades;
  }, [trades, dateScope]);

  const scopeMetrics = React.useMemo(() => {
    return calculateMetrics(filteredTrades);
  }, [filteredTrades]);

  if (!isOpen) return null;

  // Generate Email Body Text
  const generateMailBody = () => {
    const scopeLabel =
      dateScope === 'today'
        ? 'Today'
        : dateScope === 'month'
        ? 'Current Month'
        : 'All-Time Journal';

    const text = `
=== WEALTHON TRADING ACADEMY - STUDENT JOURNAL REPORT ===

STUDENT DETAILS:
----------------
• Student Name: ${studentName}
• Platform: ${profile.platform || 'Indian Options Trading'}
• Capital / Margin: ${formatINR((profile.capital || 0))}
• Contact Email / Phone: ${studentContact || 'Not provided'}
• Report Date: ${new Date().toLocaleDateString('en-IN')} (${scopeLabel})

SUMMARY PERFORMANCE METRICS:
----------------------------
• Total Trades Executed: ${scopeMetrics.totalTrades}
• Net Realized P&L: ${formatINR(scopeMetrics.netPnL)}
• Win Rate: ${scopeMetrics.winRate.toFixed(1)}%
• Winning Trades: ${scopeMetrics.winningTrades} | Losing Trades: ${scopeMetrics.losingTrades}
• Total Brokerage & Charges: {formatINR((scopeMetrics?.totalCharges ?? 0))}

MESSAGE / QUESTIONS FOR MENTER:
------------------------------
${customNote}

*** ATTACHMENT NOTICE ***
I have attached my official WealthOn Trading Journal report file (PDF / Excel log) exported directly from my app.

--------------------------------------------------
Generated via WealthOn Trading Academy Journal App
Journal Today, Profit Tomorrow
`;
    return text.trim();
  };

  const handleDownloadPDF = () => {
    exportTradesToPDF(filteredTrades, studentName);
    setFileDownloaded(true);
  };

  const handleDownloadExcel = () => {
    exportTradesToExcel(filteredTrades, studentName);
    setFileDownloaded(true);
  };

  const handleOpenEmailClient = () => {
    if (!mentorEmail.trim()) {
      setEmailError('Please enter your mentor\'s email address.');
      return;
    }
    setEmailError('');

    // 1. Auto trigger PDF download first so the file is ready in user's downloads folder
    handleDownloadPDF();

    // 2. Prepare text & subject
    const scopeLabel =
      dateScope === 'today'
        ? 'Today'
        : dateScope === 'month'
        ? 'This Month'
        : 'Complete Log';
    const subject = `[WealthOn Journal Report] - ${studentName} (${scopeLabel})`;
    const fullBodyText = generateMailBody();

    // 3. Auto-copy report text to clipboard for convenient pasting
    try {
      navigator.clipboard.writeText(fullBodyText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch (e) {
      console.warn('Clipboard copy warning:', e);
    }

    // 4. Safely trigger mailto without navigating iframe top window
    const truncatedBody =
      fullBodyText.length > 1200
        ? fullBodyText.substring(0, 1200) + '\n\n[Full report text copied to clipboard! PDF downloaded in downloads folder.]'
        : fullBodyText;

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(truncatedBody);
    const mailtoUrl = `mailto:${mentorEmail.trim()}?subject=${encodedSubject}&body=${encodedBody}`;

    try {
      const link = document.createElement('a');
      link.href = mailtoUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('Could not launch mailto protocol link directly:', err);
    }
  };

  const handleOpenGmailWebmail = () => {
    if (!mentorEmail.trim()) {
      setEmailError('Please enter your mentor\'s email address.');
      return;
    }
    setEmailError('');
    handleDownloadPDF();

    const scopeLabel =
      dateScope === 'today'
        ? 'Today'
        : dateScope === 'month'
        ? 'This Month'
        : 'Complete Log';
    const subject = `[WealthOn Journal Report] - ${studentName} (${scopeLabel})`;
    const fullBodyText = generateMailBody();

    try {
      navigator.clipboard.writeText(fullBodyText);
      setCopiedText(true);
    } catch (e) {
      // ignore
    }

    const truncatedBody =
      fullBodyText.length > 1500
        ? fullBodyText.substring(0, 1500) + '\n\n[Note: PDF report auto-downloaded to your device. Attach it to this email.]'
        : fullBodyText;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      mentorEmail.trim()
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(truncatedBody)}`;

    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendWhatsAppToMentor = () => {
    handleDownloadPDF();
    const scopeLabel =
      dateScope === 'today'
        ? 'Today'
        : dateScope === 'month'
        ? 'This Month'
        : 'Complete Log';
    const text = `*WealthOn Trading Journal Report (${scopeLabel})*\n*Student:* ${studentName}\n*Net PnL:* ${formatINR(
      scopeMetrics.netPnL
    )}\n*Win Rate:* ${scopeMetrics.winRate.toFixed(1)}%\n\n${customNote}\n\n_Generated via WealthOn Trading Academy App_`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyBodyText = () => {
    navigator.clipboard.writeText(generateMailBody());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyMentorEmail = () => {
    navigator.clipboard.writeText(mentorEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white rounded-xl backdrop-blur-xs text-blue-200">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-blue-200 bg-white px-2 py-0.5 rounded-full border border-white/10">
                  WealthOn Mentor Connect
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-0.5">Send Journal to Mentor</h2>
                <p className="text-xs text-blue-200/90 font-medium">
                  Submit your trading performance & attached PDF report to your academy mentor
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 text-xs sm:text-sm">
            {/* Attachment Instruction Banner */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3">
              <Paperclip className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-900 text-xs sm:text-sm">
                  Step 1: Download your Journal Report File
                </p>
                <p className="text-xs text-amber-800/90 leading-relaxed">
                  Web browsers cannot automatically attach local files to email apps due to security rules.
                  <span className="font-bold"> Download your PDF or Excel report below</span>, then attach it when your email composer opens.
                </p>
              </div>
            </div>

            {/* Step 1: Download File Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadPDF}
                className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-rose-800 font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-rose-600" />
                <span>1. Download Journal PDF Report</span>
                <Download className="w-4 h-4 text-rose-500 ml-auto" />
              </button>

              <button
                onClick={handleDownloadExcel}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Download Excel Log (.xlsx)</span>
                <Download className="w-4 h-4 text-emerald-500 ml-auto" />
              </button>
            </div>

            {fileDownloaded && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Report file downloaded! Proceed to open your mail app and attach it.</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mentor Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mentor / Academy Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={mentorEmail}
                      onChange={(e) => {
                        setMentorEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      placeholder="Enter mentor's email address (e.g. mentor@academy.com)"
                      className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none ${
                        emailError ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                    />
                    {mentorEmail && (
                      <button
                        onClick={handleCopyMentorEmail}
                        type="button"
                        className="absolute right-2 top-2 p-1 text-slate-400 hover:text-blue-600 transition"
                        title="Copy Mentor Email"
                      >
                        {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                  {emailError && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{emailError}</span>
                    </p>
                  )}
                </div>

                {/* Scope Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Data Period
                  </label>
                  <select
                    value={dateScope}
                    onChange={(e) => setDateScope(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="all">All-Time Journal ({trades.length} trades)</option>
                    <option value="month">Current Month Trades</option>
                    <option value="today">Today's Trades Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Student Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student / Trader Name
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Contact Email/Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Email / Phone
                  </label>
                  <input
                    type="text"
                    value={studentContact}
                    onChange={(e) => setStudentContact(e.target.value)}
                    placeholder="student@example.com / +91 9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Message to Mentor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message / Questions for Mentor
                </label>
                <textarea
                  rows={3}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Type any specific doubts or feedback requests for your mentor..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                ></textarea>
              </div>
            </div>

            {/* Performance Summary Preview */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Summary Stats Included in Email:</span>
                <span className="text-slate-500">{filteredTrades.length} Trades Selected</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Net Realized P&L</span>
                  <span className={`font-bold ${scopeMetrics.netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatINR(scopeMetrics.netPnL)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Win Rate</span>
                  <span className="font-bold text-slate-800">{scopeMetrics.winRate.toFixed(1)}%</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Total Charges</span>
                  <span className="font-bold text-slate-700">{formatINR((scopeMetrics?.totalCharges ?? 0))}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Profit Factor</span>
                  <span className="font-bold text-slate-800">{scopeMetrics.profitFactor.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <button
                onClick={handleCopyBodyText}
                type="button"
                className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSendWhatsAppToMentor}
                type="button"
                className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Share on WhatsApp</span>
              </button>

              <button
                onClick={handleOpenGmailWebmail}
                type="button"
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Open Gmail</span>
              </button>

              <button
                onClick={handleOpenEmailClient}
                type="button"
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Auto-Download & Open Mail App</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>PDF report automatically downloads when clicking any send button.</span>
              <button
                onClick={onClose}
                type="button"
                className="font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer underline"
              >
                Close Window
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
