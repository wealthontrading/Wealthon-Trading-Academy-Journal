import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, MessageSquare, Clock } from 'lucide-react';
import { UserSession } from '../types';

interface ExpiryReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  daysLeft: number;
}

export const ExpiryReminderModal: React.FC<ExpiryReminderModalProps> = ({ isOpen, onClose, session, daysLeft }) => {
  const handleRenew = () => {
    const waText = encodeURIComponent(`Hi, I would like to renew my student plan. My email is ${session.email}.`);
    window.open(`https://wa.me/918547742160?text=${waText}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-amber-200"
          >
            <div className="bg-amber-50 p-6 flex flex-col items-center text-center space-y-4 border-b border-amber-100">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Subscription Expiring Soon</h2>
                <p className="text-sm font-bold text-amber-700 mt-1">
                  You have only {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left!
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-600 text-center leading-relaxed">
                Dear <strong>{session.name || 'Student'}</strong>,<br/>
                Your current plan for WealthOn Trading Academy is about to expire. Please renew to avoid losing access to your journal, AI assistant, and strategy builder.
              </p>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleRenew}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Renew via WhatsApp</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Close & Go Back to Journal
                </button>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-amber-900 hover:bg-amber-200 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
