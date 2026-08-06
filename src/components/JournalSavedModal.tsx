import React from 'react';
import { CheckCircle2, ShieldCheck, Database, Calendar, Clock, BookOpen, X, Sparkles, Check } from 'lucide-react';

interface JournalSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTimestamp?: string;
  totalTradesCount?: number;
  totalNotesCount?: number;
  activeRulesCount?: number;
  activeGoalsCount?: number;
  onNavigateToJournal?: () => void;
}

export const JournalSavedModal: React.FC<JournalSavedModalProps> = ({
  isOpen,
  onClose,
  savedTimestamp,
  totalTradesCount = 0,
  totalNotesCount = 0,
  activeRulesCount = 0,
  activeGoalsCount = 0,
  onNavigateToJournal,
}) => {
  if (!isOpen) return null;

  const nowStr = savedTimestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative text-center space-y-6 transform transition-all scale-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Checkmark Badge */}
        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center border-4 border-emerald-50 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cloud Sync Active</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Journal Saved Successfully!
          </h2>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
            All your trading records, daily reflection notes, discipline rules, and performance goals have been automatically persisted and synced.
          </p>
        </div>

        {/* Data Sync Breakdown */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2.5">
          <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sync Timestamp</span>
            </span>
            <span className="font-mono font-bold text-slate-800">{nowStr}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Trades Logged</span>
              <span className="font-black font-mono text-slate-900">{totalTradesCount}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Daily Notes</span>
              <span className="font-black font-mono text-blue-700">{totalNotesCount}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Active Rules</span>
              <span className="font-black font-mono text-indigo-700">{activeRulesCount}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Goals Set</span>
              <span className="font-black font-mono text-emerald-700">{activeGoalsCount}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          {onNavigateToJournal && (
            <button
              onClick={() => {
                onClose();
                onNavigateToJournal();
              }}
              className="w-full sm:w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>View Journal</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-1/2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Continue Trading</span>
          </button>
        </div>
      </div>
    </div>
  );
};
