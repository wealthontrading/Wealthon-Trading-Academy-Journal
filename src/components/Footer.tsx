import React from 'react';
import { ShieldAlert, Lock } from 'lucide-react';
import { WEALTHON_LOGO_URL } from '../assets/logo';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenDisclaimer: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenDisclaimer }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* LINKS & COPYRIGHT */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 shadow-xs overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={WEALTHON_LOGO_URL}
                alt="WealthOn Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-extrabold text-white tracking-tight">WealthOn Trading Academy</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-300">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-white transition flex items-center space-x-1 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Privacy Policy & Refund Terms</span>
            </button>
            <span>•</span>
            <button
              onClick={onOpenDisclaimer}
              className="hover:text-white transition flex items-center space-x-1 cursor-pointer text-amber-400"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Important Disclaimer</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 space-y-0.5">
            <p>© WealthOn Trading Academy • All Rights Reserved.</p>
          </div>

          <div className="pt-1 text-[11px] text-slate-600 font-mono">
            Journal Today, Profit Tomorrow • Indian Options Trading Journal
          </div>
        </div>
      </div>
    </footer>
  );
};

