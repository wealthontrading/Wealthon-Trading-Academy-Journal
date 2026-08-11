import React from 'react';
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
} from 'lucide-react';
import { DashboardMetrics } from '../types';
import { formatINR } from '../utils/calculations';

interface DashboardStatsProps {
  metrics: DashboardMetrics;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ metrics }) => {
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
    </div>
  );
};
