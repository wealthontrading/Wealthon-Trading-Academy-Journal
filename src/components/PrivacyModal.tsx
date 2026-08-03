import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Mail, Phone, Clock, AlertCircle } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-white/10 rounded-xl">
                <Lock className="w-5 h-5 text-blue-200" />
              </div>
              <h2 className="text-lg font-bold">Privacy, Refund Policy & Support</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 text-sm text-slate-700 leading-relaxed max-h-[75vh] overflow-y-auto">
            {/* PRIVACY POLICY */}
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Privacy & Data Security</span>
              </h3>
              <p className="text-slate-600 text-xs mb-2">
                This application stores your trading journal data safely. All trades, notes, and rules remain securely saved and encrypted in your browser and account storage.
              </p>
              <ul className="space-y-1 text-slate-600 text-xs list-disc pl-5">
                <li>No trading logs are sold or shared with third parties.</li>
                <li>You maintain full control over your journal records.</li>
              </ul>
            </div>

            {/* REFUND POLICY */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
              <h3 className="font-bold text-amber-900 text-sm mb-1 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Refund & Cancellation Policy</span>
              </h3>
              <p className="text-amber-800 text-xs font-semibold">
                ⚠️ Refund is NOT available once a plan is purchased. All sales and plan activation transactions are final and non-refundable.
              </p>
            </div>

            {/* CUSTOMER SUPPORT SECTION */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>Customer Support & Queries</span>
              </h3>
              <p className="text-xs text-slate-600">
                For any issues or questions regarding your plan, subscription, or account, please mail us or contact customer care:
              </p>

              <div className="space-y-2 text-xs font-medium text-slate-800 pt-1">
                <div className="flex items-center space-x-2.5">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>Email ID:</strong> <a href="mailto:wealthonprojects@gmail.com" className="text-blue-600 underline font-semibold">wealthonprojects@gmail.com</a></span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Customer Care Support:</strong> +91 8547742160 <span className="text-emerald-600 font-semibold text-[11px]">(WhatsApp Chat Only)</span></span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Working Hours:</strong> Mon to Fri (9:00 AM to 6:00 PM)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

