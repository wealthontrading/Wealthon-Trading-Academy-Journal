import { useMarket } from '../contexts/MarketContext';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, CheckCircle2, X, Target, ArrowRight, Award, Zap } from 'lucide-react';
import { TradingGoal } from '../types';

export interface ToastMessage {
  id: string;
  goal: TradingGoal;
  quote: string;
}

interface GoalToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  onNavigateToGoals?: () => void;
}

const POSITIVE_REINFORCEMENTS = [
  "Outstanding discipline! Staying true to your targets is the hallmark of a professional trader.",
  "Target achieved! Consistency over high risk is how long-term wealth is built.",
  "Brilliant execution! You hit your goal with focus and emotion control. Keep it up!",
  "Milestone unlocked! Celebrate this victory and protect your capital for the next session.",
  "Phenomenal work! Successful journaling and risk management yield consistent growth.",
  "You conquered your goal! Master your mindset, respect your stop-losses, and stay systematic."
];

export const getRandomReinforcementQuote = () => {
  const index = Math.floor(Math.random() * POSITIVE_REINFORCEMENTS.length);
  return POSITIVE_REINFORCEMENTS[index];
};

export const GoalToastNotification: React.FC<GoalToastNotificationProps> = ({
  toasts,
  onDismiss,
  onNavigateToGoals,
}) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <GoalToastCard
            key={toast.id}
            toast={toast}
            onDismiss={() => onDismiss(toast.id)}
            onNavigateToGoals={onNavigateToGoals}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface GoalToastCardProps {
  toast: ToastMessage;
  onDismiss: () => void;
  onNavigateToGoals?: () => void;
}

const GoalToastCard: React.FC<GoalToastCardProps> = ({ toast, onDismiss, onNavigateToGoals }) => {
  const { currencySymbol } = useMarket();
  const { goal, quote } = toast;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 7000; // 7 seconds duration
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onDismiss]);

  const formattedCurr = goal.unit === 'Currency' ? `${currencySymbol}${(goal.currentValue || 0).toLocaleString('en-IN')}` : `${goal.currentValue} ${goal.unit}`;
  const formattedTarget = goal.unit === 'Currency' ? `${currencySymbol}${(goal.targetValue || 0).toLocaleString('en-IN')}` : `${goal.targetValue} ${goal.unit}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="pointer-events-auto bg-slate-900 border-2 border-emerald-400/80 text-white rounded-2xl shadow-2xl overflow-hidden relative"
    >
      {/* Top Banner Accent */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 px-4 py-1.5 flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-950">
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 fill-emerald-950 animate-spin" style={{ animationDuration: '3s' }} />
          <span>Milestone Reached • Positive Reinforcement</span>
        </div>
        <button
          onClick={onDismiss}
          className="p-0.5 rounded-full hover:bg-emerald-700/30 text-emerald-950 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
            <Trophy className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black rounded-md uppercase tracking-wider">
                Goal Achieved
              </span>
              <span className="text-[10px] text-amber-400 font-bold flex items-center space-x-1">
                <Zap className="w-3 h-3 fill-amber-400" />
                <span>100%+ Met</span>
              </span>
            </div>

            <h4 className="text-base font-black text-white truncate mt-1">
              {goal.title}
            </h4>

            <div className="flex items-center space-x-2 text-xs font-mono font-bold mt-0.5 text-slate-300">
              <span className="text-emerald-400">{formattedCurr}</span>
              <span>/</span>
              <span>{formattedTarget}</span>
            </div>
          </div>
        </div>

        {/* Positive Reinforcement Quote Card */}
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs text-emerald-100 italic leading-relaxed flex items-start space-x-2">
          <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>&ldquo;{quote}&rdquo;</span>
        </div>

        {/* Action Button */}
        {onNavigateToGoals && (
          <button
            onClick={() => {
              onNavigateToGoals();
              onDismiss();
            }}
            className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-md cursor-pointer"
          >
            <Target className="w-4 h-4" />
            <span>View Goals in Journal Tab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Progress Bar Timer */}
      <div className="w-full bg-slate-800 h-1.5 overflow-hidden">
        <div
          className="bg-emerald-400 h-full transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};
