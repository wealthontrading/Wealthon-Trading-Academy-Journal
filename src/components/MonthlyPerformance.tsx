import React, { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Percent,
  BarChart2,
  IndianRupee,
  Award,
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import { Trade } from '../types';
import { formatINR } from '../utils/calculations';

interface MonthlyPerformanceProps {
  trades: Trade[];
}

export const MonthlyPerformance: React.FC<MonthlyPerformanceProps> = ({ trades }) => {
  // Current month in YYYY-MM format
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Available months from trades data + current month
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>([currentMonthKey]);
    trades.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthsSet.add(t.date.substring(0, 7));
      }
    });
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a)); // Newest first
  }, [trades, currentMonthKey]);

  // Filter trades for selected month
  const monthlyTrades = useMemo(() => {
    return trades.filter((t) => t.date && t.date.startsWith(selectedMonth));
  }, [trades, selectedMonth]);

  // Calculate Monthly Metrics
  const metrics = useMemo(() => {
    const totalTrades = monthlyTrades.length;
    let winningTrades = 0;
    let losingTrades = 0;
    let breakevenTrades = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let netPnL = 0;
    let grossPnL = 0;
    let totalCharges = 0;
    let bestTrade = 0;
    let worstTrade = 0;

    monthlyTrades.forEach((t, idx) => {
      const net = t.netPnL ?? 0;
      const gross = t.grossPnL ?? 0;
      const charges = (t.brokerage || 0) + (t.taxes || 0) + (t.otherCharges || 0);

      netPnL += net;
      grossPnL += gross;
      totalCharges += charges;

      if (idx === 0) {
        bestTrade = net;
        worstTrade = net;
      } else {
        if (net > bestTrade) bestTrade = net;
        if (net < worstTrade) worstTrade = net;
      }

      if (net > 0) {
        winningTrades++;
        totalProfit += net;
      } else if (net < 0) {
        losingTrades++;
        totalLoss += Math.abs(net);
      } else {
        breakevenTrades++;
      }
    });

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const avgProfit = winningTrades > 0 ? totalProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
    const avgTradePnL = totalTrades > 0 ? netPnL / totalTrades : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      breakevenTrades,
      winRate,
      totalProfit,
      totalLoss,
      netPnL,
      grossPnL,
      totalCharges,
      bestTrade: totalTrades > 0 ? bestTrade : 0,
      worstTrade: totalTrades > 0 ? worstTrade : 0,
      avgProfit,
      avgLoss,
      profitFactor,
      avgTradePnL,
    };
  }, [monthlyTrades]);

  // Formatting date for display (e.g. "July 2026")
  const formatMonthLabel = (yearMonth: string) => {
    const [y, m] = yearMonth.split('-');
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    const currentIndex = availableMonths.indexOf(selectedMonth);
    if (currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1]);
    } else {
      // Calculate previous month chronologically
      const [y, m] = selectedMonth.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(prevKey);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = availableMonths.indexOf(selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1]);
    } else {
      // Calculate next month chronologically
      const [y, m] = selectedMonth.split('-').map(Number);
      const nextDate = new Date(y, m, 1);
      const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(nextKey);
    }
  };

  const isCurrentMonth = selectedMonth === currentMonthKey;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden my-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold tracking-tight text-white">
                Monthly Performance
              </h2>
              {isCurrentMonth && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full uppercase tracking-wider">
                  Current Month
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Performance summary & statistics for {formatMonthLabel(selectedMonth)}
            </p>
          </div>
        </div>

        {/* Month Navigation & Selector */}
        <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 self-start md:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {availableMonths.map((mKey) => (
              <option key={mKey} value={mKey}>
                {formatMonthLabel(mKey)} {mKey === currentMonthKey ? '(Current)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isCurrentMonth
                ? 'opacity-40 text-slate-500 cursor-not-allowed'
                : 'hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Highlights Cards Grid */}
      <div className="p-5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Monthly Net P&L */}
          <div
            className={`p-5 rounded-2xl border transition duration-200 shadow-xs relative overflow-hidden ${
              metrics.netPnL > 0
                ? 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 border-emerald-200'
                : metrics.netPnL < 0
                ? 'bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 border-rose-200'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <IndianRupee className="w-4 h-4 text-blue-600" />
                <span>Monthly Net P&L</span>
              </span>
              <div
                className={`p-2 rounded-xl border ${
                  metrics.netPnL >= 0
                    ? 'bg-emerald-100/70 text-emerald-700 border-emerald-300'
                    : 'bg-rose-100/70 text-rose-700 border-rose-300'
                }`}
              >
                {metrics.netPnL >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
              </div>
            </div>

            <div className="mt-1">
              <div
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  metrics.netPnL > 0
                    ? 'text-emerald-700'
                    : metrics.netPnL < 0
                    ? 'text-rose-700'
                    : 'text-slate-800'
                }`}
              >
                {formatINR(metrics.netPnL)}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-200/80">
                <div>
                  <span className="text-slate-400 font-medium">Gross P&L:</span>
                  <div
                    className={`font-bold ${
                      metrics.grossPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatINR(metrics.grossPnL)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Est. Charges:</span>
                  <div className="font-bold text-slate-700">
                    {formatINR(metrics.totalCharges)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Monthly Win Rate */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <Percent className="w-4 h-4 text-indigo-600" />
                <span>Monthly Win Rate</span>
              </span>
              <div
                className={`p-2 rounded-xl border ${
                  metrics.winRate >= 50
                    ? 'bg-emerald-100/70 text-emerald-700 border-emerald-300'
                    : 'bg-amber-100/70 text-amber-700 border-amber-300'
                }`}
              >
                <Percent className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-1">
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {metrics.winRate.toFixed(1)}%
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  ({metrics.winningTrades} Wins / {metrics.losingTrades} Losses)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, metrics.winRate))}%` }}
                  />
                  <div
                    className="bg-rose-400 h-full transition-all duration-500"
                    style={{
                      width: `${
                        metrics.totalTrades > 0
                          ? (metrics.losingTrades / metrics.totalTrades) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500 font-medium">
                <span>Profit Factor: <strong className="text-slate-800">{metrics.profitFactor === 999 ? '∞' : metrics.profitFactor.toFixed(2)}</strong></span>
                <span>Avg Trade: <strong className={metrics.avgTradePnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatINR(metrics.avgTradePnL)}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 3: Monthly Trade Count */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span>Monthly Trades</span>
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-1">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {metrics.totalTrades}{' '}
                <span className="text-xs font-bold text-slate-400 uppercase tracking-normal">
                  Trades Executed
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5 text-center pt-3 border-t border-slate-100">
                <div className="bg-emerald-50/80 border border-emerald-200/60 p-1.5 rounded-xl">
                  <div className="flex items-center justify-center space-x-1 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Wins</span>
                  </div>
                  <div className="font-extrabold text-sm text-emerald-800 mt-0.5">
                    {metrics.winningTrades}
                  </div>
                </div>

                <div className="bg-rose-50/80 border border-rose-200/60 p-1.5 rounded-xl">
                  <div className="flex items-center justify-center space-x-1 text-[10px] font-bold text-rose-700">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    <span>Losses</span>
                  </div>
                  <div className="font-extrabold text-sm text-rose-800 mt-0.5">
                    {metrics.losingTrades}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-1.5 rounded-xl">
                  <div className="flex items-center justify-center space-x-1 text-[10px] font-bold text-slate-600">
                    <MinusCircle className="w-3 h-3 text-slate-400" />
                    <span>Breakeven</span>
                  </div>
                  <div className="font-extrabold text-sm text-slate-700 mt-0.5">
                    {metrics.breakevenTrades}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-semibold block text-[11px]">Total Profit</span>
            <span className="text-emerald-700 font-extrabold text-sm flex items-center space-x-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>{formatINR(metrics.totalProfit)}</span>
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-semibold block text-[11px]">Total Loss</span>
            <span className="text-rose-700 font-extrabold text-sm flex items-center space-x-1 mt-0.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              <span>{formatINR(metrics.totalLoss)}</span>
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-semibold block text-[11px]">Best Single Trade</span>
            <span className="text-emerald-700 font-extrabold text-sm flex items-center space-x-1 mt-0.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>{formatINR(metrics.bestTrade)}</span>
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-semibold block text-[11px]">Worst Single Trade</span>
            <span className="text-rose-700 font-extrabold text-sm flex items-center space-x-1 mt-0.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              <span>{formatINR(metrics.worstTrade)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
