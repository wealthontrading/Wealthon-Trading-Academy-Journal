import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Zap,
  IndianRupee,
  Layers,
  Calendar,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  BarChart,
  Percent,
  Wallet,
  Target,
  CheckCircle2
} from 'lucide-react';
import { DashboardMetrics, TradingGoal, Trade } from '../types';
import { formatINR } from '../utils/calculations';

interface DashboardStatsProps {
  metrics: DashboardMetrics;
  goals?: TradingGoal[];
  trades?: Trade[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ metrics, goals = [], trades = [] }) => {
  const monthlyGoalsToDisplay = useMemo(() => {
    const monthlyGoals = goals.filter(g => g.period === 'Monthly');
    
    if (monthlyGoals.length === 0) return [];
    
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthTrades = trades.filter(t => t.date.startsWith(currentMonthStr));
    
    const currentMonthNetPnL = currentMonthTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    const currentMonthTradeCount = currentMonthTrades.length;
    const winningTradesCount = currentMonthTrades.filter(t => (t.netPnL || 0) > 0).length;
    const currentMonthWinRate = currentMonthTradeCount > 0 ? (winningTradesCount / currentMonthTradeCount) * 100 : 0;
    
    return monthlyGoals.map(goal => {
      let computedValue = goal.currentValue || 0;
      
      // Auto-calculate for known categories based on current month's trades
      if (goal.category === 'Profit' || goal.unit === '₹') {
        computedValue = currentMonthNetPnL;
      } else if (goal.category === 'Win Rate' || goal.unit === '%') {
        computedValue = currentMonthWinRate;
      } else if (goal.category === 'Consistency' || goal.unit === 'Trades') {
        computedValue = currentMonthTradeCount;
      }
      
      // Don't let negative profit go below 0 for progress bar logic
      if (computedValue < 0 && goal.targetValue > 0) computedValue = 0;
      
      return { ...goal, computedValue };
    });
  }, [goals, trades]);

  const cards = [
    {
      title: 'Net P&L',
      value: formatINR(metrics.netPnL),
      subText: metrics.totalTrades > 0 ? `From ${metrics.totalTrades} total trades` : 'No trades recorded',
      icon: IndianRupee,
      color: metrics.netPnL >= 0 ? 'emerald' : 'rose',
      highlight: true,
    },
    {
      title: "Today's P&L",
      value: formatINR(metrics.todayPnL),
      subText: 'Realized intraday P&L',
      icon: Activity,
      color: metrics.todayPnL >= 0 ? 'emerald' : 'rose',
      highlight: true,
    },
    {
      title: 'Monthly P&L',
      value: formatINR(metrics.monthlyPnL),
      subText: 'Current calendar month',
      icon: Calendar,
      color: metrics.monthlyPnL >= 0 ? 'emerald' : 'rose',
      highlight: true,
    },
    {
      title: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      subText: `${metrics.winningTrades} W / ${metrics.losingTrades} L`,
      icon: Percent,
      color: metrics.winRate >= 50 ? 'emerald' : 'amber',
      highlight: true,
    },
    {
      title: 'Total Trades',
      value: metrics.totalTrades.toString(),
      subText: `${metrics.breakevenTrades} Breakeven`,
      icon: BarChart,
      color: 'blue',
    },
    {
      title: 'Winning Trades',
      value: metrics.winningTrades.toString(),
      subText: 'Green trades',
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      title: 'Losing Trades',
      value: metrics.losingTrades.toString(),
      subText: 'Red trades',
      icon: TrendingDown,
      color: 'rose',
    },
    {
      title: 'Total Profit',
      value: formatINR(metrics.totalProfit),
      subText: 'Sum of winning trades',
      icon: ArrowUpRight,
      color: 'emerald',
    },
    {
      title: 'Total Loss',
      value: formatINR(metrics.totalLoss),
      subText: 'Sum of losing trades',
      icon: ArrowDownRight,
      color: 'rose',
    },
    {
      title: 'Average Profit',
      value: formatINR(metrics.avgProfit),
      subText: 'Per winning trade',
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      title: 'Average Loss',
      value: formatINR(metrics.avgLoss),
      subText: 'Per losing trade',
      icon: TrendingDown,
      color: 'rose',
    },
    {
      title: 'Best Trade',
      value: formatINR(metrics.bestTrade),
      subText: 'Highest single gain',
      icon: Award,
      color: 'emerald',
    },
    {
      title: 'Worst Trade',
      value: formatINR(metrics.worstTrade),
      subText: 'Largest single loss',
      icon: TrendingDown,
      color: 'rose',
    },
    {
      title: 'Largest Winning Streak',
      value: `${metrics.largestWinningStreak} Trades`,
      subText: 'Max consecutive wins',
      icon: Flame,
      color: 'emerald',
    },
    {
      title: 'Largest Losing Streak',
      value: `${metrics.largestLosingStreak} Trades`,
      subText: 'Max consecutive losses',
      icon: Flame,
      color: 'rose',
    },
    {
      title: 'Current Streak',
      value: metrics?.currentStreak || '0',
      subText: 'Ongoing momentum',
      icon: Zap,
      color: (metrics?.currentStreak || '').includes('Win') || (metrics?.currentStreak || '').includes('W') ? 'emerald' : 'amber',
    },
    {
      title: 'Total Quantity',
      value: (metrics?.totalQuantity ?? 0).toLocaleString('en-IN'),
      subText: 'Total lots/units traded',
      icon: Layers,
      color: 'indigo',
    },
    {
      title: 'Average Quantity',
      value: (metrics?.avgQuantity ?? 0).toLocaleString('en-IN'),
      subText: 'Avg size per trade',
      icon: Layers,
      color: 'indigo',
    },
  ];

  return (
    <div className="space-y-4 my-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <BarChart className="w-5 h-5 text-blue-600" />
          <span>Dashboard Performance Statistics</span>
        </h2>
        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
          Realtime Local Data
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;

          // Color themes
          let cardBg = 'bg-white border-slate-200';
          let iconBg = 'bg-slate-100 text-slate-600';
          let valueColor = 'text-slate-900';

          if (card.color === 'emerald') {
            iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
            if (card.highlight && metrics.netPnL > 0) {
              cardBg = 'bg-gradient-to-br from-emerald-50/70 to-white border-emerald-200';
            }
            valueColor = 'text-emerald-700';
          } else if (card.color === 'rose') {
            iconBg = 'bg-rose-50 text-rose-600 border border-rose-200';
            if (card.highlight && metrics.netPnL < 0) {
              cardBg = 'bg-gradient-to-br from-rose-50/70 to-white border-rose-200';
            }
            valueColor = 'text-rose-700';
          } else if (card.color === 'indigo' || card.color === 'blue') {
            iconBg = 'bg-blue-50 text-blue-600 border border-blue-200';
            valueColor = 'text-blue-900';
          }

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.35), ease: 'easeOut' }}
              className={`p-4 rounded-xl border shadow-xs transition duration-200 hover:shadow-md ${cardBg}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2 rounded-lg ${iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3">
                <div className={`text-xl sm:text-2xl font-extrabold tracking-tight ${valueColor}`}>
                  {card.value}
                </div>
                <p className="text-xs text-slate-500 mt-1">{card.subText}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Monthly Goals Progress Section */}
      {monthlyGoalsToDisplay.length > 0 && (
        <div className="mt-8 pt-8 border-t border-slate-200">
          <div className="flex items-center space-x-2 mb-6">
            <Target className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Monthly Goals Progress</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monthlyGoalsToDisplay.map((goal, idx) => {
              const isLimit = goal.title.toLowerCase().includes('limit') || goal.title.toLowerCase().includes('max');
              const progressPercentage = Math.min(Math.max((goal.computedValue / goal.targetValue) * 100, 0), 100);
              const isAchieved = isLimit ? goal.computedValue <= goal.targetValue : goal.computedValue >= goal.targetValue;
              const isBreached = isLimit && goal.computedValue > goal.targetValue;
              
              let progressColor = 'bg-blue-500';
              if (isBreached) {
                progressColor = 'bg-rose-500';
              } else if (!isLimit && isAchieved) {
                progressColor = 'bg-emerald-500';
              } else if (isLimit) {
                if (progressPercentage > 90) progressColor = 'bg-rose-400';
                else if (progressPercentage > 75) progressColor = 'bg-amber-400';
                else progressColor = 'bg-emerald-400';
              } else {
                if (progressPercentage > 75) progressColor = 'bg-indigo-500';
                else if (progressPercentage > 40) progressColor = 'bg-blue-400';
                else progressColor = 'bg-slate-400';
              }

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{goal.title}</h4>
                      <p className="text-xs text-slate-500">{goal.category}</p>
                    </div>
                    {isBreached ? (
                      <span className="flex items-center space-x-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md">
                        <span>Limit Breached</span>
                      </span>
                    ) : (!isLimit && isAchieved) ? (
                      <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Achieved</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                        {progressPercentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3 mb-2">
                    <motion.div 
                      className={`h-full ${progressColor} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 + (idx * 0.05) }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-600">
                      {isLimit ? 'Current: ' : ''}{goal.unit === '₹' ? formatINR(goal.computedValue) : `${goal.computedValue.toLocaleString()} ${goal.unit !== '%' ? goal.unit : ''}${goal.unit === '%' ? '%' : ''}`}
                    </span>
                    <span className="text-slate-400">
                      {isLimit ? 'Limit: ' : 'Target: '}{goal.unit === '₹' ? formatINR(goal.targetValue) : `${goal.targetValue.toLocaleString()} ${goal.unit !== '%' ? goal.unit : ''}${goal.unit === '%' ? '%' : ''}`}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
