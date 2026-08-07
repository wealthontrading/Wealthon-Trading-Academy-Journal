import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
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
          <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-white rounded-xl">
                <ShieldAlert className="w-5 h-5 text-amber-100" />
              </div>
              <h2 className="text-lg font-bold">Important Disclaimer</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-3.5 text-sm text-slate-700 leading-relaxed">
            <p className="font-bold text-slate-900">
              WealthOn Trading Academy (Journal Today, Profit Tomorrow) is an educational trading journal only.
            </p>

            <ul className="space-y-2 text-slate-600 list-disc pl-5 text-xs font-medium">
              <li>We are <strong>NOT SEBI Registered</strong>.</li>
              <li>We do <strong>NOT</strong> recommend any stock, option, future, commodity, or other financial instrument.</li>
              <li>We do <strong>NOT</strong> provide investment advice or trading calls.</li>
              <li>We do <strong>NOT</strong> guarantee profits or returns.</li>
              <li>Trading in the stock market involves substantial risk.</li>
              <li>Please trade responsibly and at your own discretion.</li>
            </ul>

            <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-xs font-semibold flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Options and derivative trading carry high risk of financial loss. Manage your risk strictly.</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-amber-700 transition cursor-pointer"
            >
              I Understand & Agree
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
