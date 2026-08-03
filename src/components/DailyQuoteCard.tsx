import React, { useState, useEffect } from 'react';
import { Quote, Sparkles } from 'lucide-react';
import { get15MinQuote } from '../data/quotes';

export const DailyQuoteCard: React.FC = () => {
  const [quote, setQuote] = useState(() => get15MinQuote());

  useEffect(() => {
    // Check and update quote every 15 seconds to catch 15-minute boundary accurately
    const interval = setInterval(() => {
      setQuote(get15MinQuote());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-900/60 relative overflow-hidden my-6 group">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-500 group-hover:bg-indigo-500/20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-blue-500/10 rounded-2xl text-indigo-400 mt-0.5 shrink-0 border border-indigo-500/30 shadow-md">
            <Quote className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-300 flex items-center space-x-1.5 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800/80">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span>Discipline Quote</span>
              </span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-slate-100 italic leading-relaxed tracking-wide">
              &ldquo;{quote}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
