import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  Award,
  Calendar as CalendarIcon,
  Clock,
  Crosshair,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
  Eye,
  Edit2,
  Trash2,
  ListFilter,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Bot,
  UserCheck,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { DashboardMetrics, Trade, StrategyItem } from '../types';
import { formatINR, calculateMetrics } from '../utils/calculations';
import { YearlyPerformanceHeatmap } from './YearlyPerformanceHeatmap';

interface AnalyticsViewProps {
  trades: Trade[];
  metrics: DashboardMetrics;
  strategies?: StrategyItem[];
  onViewTrade?: (trade: Trade) => void;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (id: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  trades: allTrades,
  metrics: overallMetrics,
  strategies = [],
  onViewTrade,
  onEditTrade,
  onDeleteTrade,
}) => {
  const [selectedStrategyFilter, setSelectedStrategyFilter] = useState<string>('All');
  
  // Filter trades based on selected strategy
  const trades = useMemo(() => {
    if (selectedStrategyFilter === 'All') return allTrades;
    return allTrades.filter(t => t.strategy === selectedStrategyFilter);
  }, [allTrades, selectedStrategyFilter]);

  // Recalculate metrics if filtered
  const metrics = useMemo(() => {
    if (selectedStrategyFilter === 'All') return overallMetrics;
    return calculateMetrics(trades);
  }, [trades, selectedStrategyFilter, overallMetrics]);

  // Calendar Heat Map Month selection
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date());
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [selectedDayOrdersDate, setSelectedDayOrdersDate] = useState<string | null>(null);

  // Pie Chart Data
  const pieData = useMemo(() => {
    return [
      { name: 'Winning Trades', value: metrics.winningTrades, color: '#10b981' },
      { name: 'Losing Trades', value: metrics.losingTrades, color: '#f43f5e' },
      { name: 'Breakeven', value: metrics.breakevenTrades, color: '#64748b' },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  // Trade Execution Type / Mode Analytics
  const executionModeAnalytics = useMemo(() => {
    const modes = ['Manual Trading', 'Algo Trading', 'Copy Trading', 'Others'] as const;
    const modeStatsMap: Record<
      string,
      {
        mode: string;
        count: number;
        wins: number;
        losses: number;
        breakevens: number;
        grossPnL: number;
        charges: number;
        netPnL: number;
        reasons: string[];
      }
    > = {
      'Manual Trading': { mode: 'Manual Trading', count: 0, wins: 0, losses: 0, breakevens: 0, grossPnL: 0, charges: 0, netPnL: 0, reasons: [] },
      'Algo Trading': { mode: 'Algo Trading', count: 0, wins: 0, losses: 0, breakevens: 0, grossPnL: 0, charges: 0, netPnL: 0, reasons: [] },
      'Copy Trading': { mode: 'Copy Trading', count: 0, wins: 0, losses: 0, breakevens: 0, grossPnL: 0, charges: 0, netPnL: 0, reasons: [] },
      'Others': { mode: 'Others', count: 0, wins: 0, losses: 0, breakevens: 0, grossPnL: 0, charges: 0, netPnL: 0, reasons: [] },
    };

    trades.forEach((t) => {
      let modeName = (t.tradeType as string) || 'Manual Trading';
      if (!modeStatsMap[modeName]) {
        modeName = 'Others';
      }
      const stat = modeStatsMap[modeName];
      stat.count += 1;
      if (t.netPnL > 0) stat.wins += 1;
      else if (t.netPnL < 0) stat.losses += 1;
      else stat.breakevens += 1;

      stat.grossPnL += t.grossPnL || 0;
      const chg = (t.brokerage || 0) + (t.taxes || 0) + (t.otherCharges || 0);
      stat.charges += chg;
      stat.netPnL += t.netPnL || 0;

      if (t.otherTradeTypeReason && !stat.reasons.includes(t.otherTradeTypeReason)) {
        stat.reasons.push(t.otherTradeTypeReason);
      }
    });

    const totalTradesCount = trades.length || 1;

    const list = modes.map((mode) => {
      const data = modeStatsMap[mode];
      const winRate = data.count > 0 ? (data.wins / data.count) * 100 : 0;
      const sharePct = (data.count / totalTradesCount) * 100;
      const avgNetPnL = data.count > 0 ? data.netPnL / data.count : 0;
      return {
        ...data,
        winRate,
        sharePct,
        avgNetPnL,
      };
    });

    const activeModes = list.filter((m) => m.count > 0);
    const mostUsedMode = [...activeModes].sort((a, b) => b.count - a.count)[0] || null;
    const bestWinRateMode = [...activeModes].sort((a, b) => b.winRate - a.winRate)[0] || null;
    const mostProfitableMode = [...activeModes].sort((a, b) => b.netPnL - a.netPnL)[0] || null;

    const barChartData = list.map((m) => ({
      mode: m.mode,
      'Net P&L': Math.round(m.netPnL),
      'Charges': Math.round(m.charges),
    }));

    const pieChartData = list
      .filter((m) => m.count > 0)
      .map((m) => {
        let color = '#2563eb';
        if (m.mode === 'Algo Trading') color = '#8b5cf6';
        if (m.mode === 'Copy Trading') color = '#06b6d4';
        if (m.mode === 'Others') color = '#f59e0b';
        return {
          name: m.mode,
          value: m.count,
          color,
        };
      });

    return {
      list,
      mostUsedMode,
      bestWinRateMode,
      mostProfitableMode,
      barChartData,
      pieChartData,
    };
  }, [trades]);

  // Equity Curve Data
  const equityCurveData = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    const sorted = [...trades].sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

    let cumulativePnL = 0;
    return sorted.map((t, idx) => {
      cumulativePnL += t.netPnL;
      return {
        tradeNo: `T${idx + 1}`,
        date: t.date,
        netPnL: t.netPnL,
        cumulativePnL,
      };
    });
  }, [trades]);

  // Monthly Bar Chart Data
  const monthlyBarData = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    const monthlyMap: Record<string, { profit: number; loss: number; net: number }> = {};

    trades.forEach((t) => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { profit: 0, loss: 0, net: 0 };
      }
      if (t.netPnL > 0) monthlyMap[monthKey].profit += t.netPnL;
      else if (t.netPnL < 0) monthlyMap[monthKey].loss += Math.abs(t.netPnL);
      monthlyMap[monthKey].net += t.netPnL;
    });

    return Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mKey, data]) => {
        const dateObj = new Date(`${mKey}-01T12:00:00`);
        const formattedMonth = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return {
          month: formattedMonth,
          Profit: data.profit,
          Loss: data.loss,
          Net: data.net,
        };
      });
  }, [trades]);

  // Selected Day trades for Modal
  const selectedDayTrades = useMemo(() => {
    if (!selectedDayOrdersDate) return [];
    return trades.filter((t) => t.date === selectedDayOrdersDate);
  }, [trades, selectedDayOrdersDate]);

  const selectedDaySummary = useMemo(() => {
    if (!selectedDayOrdersDate) return { count: 0, grossPnL: 0, totalCharges: 0, netPnL: 0, wins: 0, losses: 0 };
    const dayTrades = trades.filter((t) => t.date === selectedDayOrdersDate);
    const grossPnL = dayTrades.reduce((sum, t) => sum + (t.grossPnL || 0), 0);
    const totalCharges = dayTrades.reduce((sum, t) => sum + ((t.brokerage || 0) + (t.taxes || 0) + (t.otherCharges || 0)), 0);
    const netPnL = dayTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    const wins = dayTrades.filter((t) => t.netPnL > 0).length;
    const losses = dayTrades.filter((t) => t.netPnL < 0).length;
    return { count: dayTrades.length, grossPnL, totalCharges, netPnL, wins, losses };
  }, [trades, selectedDayOrdersDate]);

  const formattedSelectedDateDisplay = useMemo(() => {
    if (!selectedDayOrdersDate) return '';
    const dObj = new Date(`${selectedDayOrdersDate}T12:00:00`);
    return dObj.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [selectedDayOrdersDate]);
  const calendarData = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Map trades for this month
    const dailyPnLMap: Record<number, { pnl: number; count: number }> = {};

    trades.forEach((t) => {
      const tDate = new Date(`${t.date}T12:00:00`);
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        const day = tDate.getDate();
        if (!dailyPnLMap[day]) dailyPnLMap[day] = { pnl: 0, count: 0 };
        dailyPnLMap[day].pnl += t.netPnL;
        dailyPnLMap[day].count += 1;
      }
    });

    const days = [];
    // Blank padding days
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ dayNumber: null, pnl: 0, count: 0 });
    }
    // Actual month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = dailyPnLMap[day] || { pnl: 0, count: 0 };
      days.push({ dayNumber: day, pnl: dayData.pnl, count: dayData.count });
    }

    return days;
  }, [trades, currentCalendarDate]);

  const monthStats = useMemo(() => {
    let totalPnl = 0;
    let winDays = 0;
    let lossDays = 0;
    let totalOrders = 0;
    calendarData.forEach((d) => {
      if (d.dayNumber !== null && d.count > 0) {
        totalPnl += d.pnl;
        totalOrders += d.count;
        if (d.pnl > 0) winDays++;
        else if (d.pnl < 0) lossDays++;
      }
    });
    return { totalPnl, winDays, lossDays, totalOrders };
  }, [calendarData]);

  const monthYearHeader = currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
  };
  const resetToCurrentMonth = () => {
    setCurrentCalendarDate(new Date());
  };

  return (
    <div className="space-y-6 my-6">
      <YearlyPerformanceHeatmap trades={trades} />

      {/* 1. TOP FEATURED PROMINENT CALENDAR HEAT MAP VIEW */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {/* Calendar Header with Title & Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-200 shadow-2xs">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Trading Heat Map Calendar</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Daily P&L performance overview. Click any date to view full executed orders.
                </p>
              </div>
            </div>
          </div>

          {/* Month Navigation & Summary Badges */}
          <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
            {/* Strategy Filter */}
            <div className="flex items-center">
              <select
                value={selectedStrategyFilter}
                onChange={(e) => setSelectedStrategyFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All">All Strategies</option>
                {strategies?.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Month Net P&L Summary */}
            <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-1.5 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Month P&L:</span>
              <span className={`font-black font-mono text-sm ${monthStats.totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatINR(monthStats.totalPnl)}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-600 font-bold">{monthStats.winDays} Green</span>
              <span className="text-slate-300">|</span>
              <span className="text-rose-600 font-bold">{monthStats.lossDays} Red</span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-slate-700 transition cursor-pointer active:scale-95"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={resetToCurrentMonth}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs rounded-xl font-bold text-xs text-slate-900 transition cursor-pointer"
                title="Jump to Current Live Month"
              >
                {monthYearHeader}
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-slate-700 transition cursor-pointer active:scale-95"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wider text-slate-600 py-2.5 bg-slate-100/70 rounded-2xl border border-slate-200/80">
          <span>Sunday</span>
          <span>Monday</span>
          <span>Tuesday</span>
          <span>Wednesday</span>
          <span>Thursday</span>
          <span>Friday</span>
          <span>Saturday</span>
        </div>

        {/* Medium Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-xs">
          {calendarData.map((d, idx) => {
            if (d.dayNumber === null) {
              return <div key={idx} className="min-h-[64px] sm:min-h-[72px] bg-slate-50/40 rounded-2xl border border-slate-100"></div>;
            }

            const year = currentCalendarDate.getFullYear();
            const month = currentCalendarDate.getMonth();
            const formattedMonth = String(month + 1).padStart(2, '0');
            const formattedDay = String(d.dayNumber).padStart(2, '0');
            const cellDateStr = `${year}-${formattedMonth}-${formattedDay}`;

            let dayBg = 'bg-slate-50/90 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300';
            if (d.count > 0) {
              if (d.pnl > 0) dayBg = 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-sm';
              else if (d.pnl < 0) dayBg = 'bg-rose-50/90 border-rose-300 text-rose-950 font-bold hover:bg-rose-100 hover:border-rose-400 hover:shadow-sm';
              else dayBg = 'bg-slate-200/90 border-slate-300 text-slate-900 font-bold hover:bg-slate-300';
            }

            return (
              <button
                key={idx}
                onClick={() => setSelectedDayOrdersDate(cellDateStr)}
                className={`min-h-[64px] sm:min-h-[72px] p-2 sm:p-2.5 rounded-2xl border flex flex-col justify-between transition-all text-left cursor-pointer group shadow-2xs ${dayBg}`}
                title={d.count > 0 ? `Click to view ${d.count} orders for ${cellDateStr} (${formatINR(d.pnl)})` : `Click to view ${cellDateStr}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs sm:text-sm font-black text-slate-800 group-hover:scale-110 transition-transform">
                    {d.dayNumber}
                  </span>
                  {d.count > 0 && (
                    <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg bg-black/10 text-slate-900 font-extrabold shadow-2xs">
                      {d.count} {d.count === 1 ? 'trade' : 'trades'}
                    </span>
                  )}
                </div>

                {d.count > 0 ? (
                  <div className="mt-1 text-center">
                    <span className={`text-xs sm:text-sm truncate font-black font-mono tracking-tight block ${d.pnl > 0 ? 'text-emerald-700' : d.pnl < 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                      {d.pnl > 0 ? `+${formatINR(d.pnl)}` : formatINR(d.pnl)}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-center block">
                    + Log Trades
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Insights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Most Traded Index</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">{metrics.mostTradedIndex}</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Most Traded Strike</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">{metrics.mostTradedStrike}</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Avg Holding Time</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {metrics.avgHoldingTimeMinutes > 0 ? `${metrics.avgHoldingTimeMinutes} Mins` : 'N/A'}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Avg Risk-Reward</span>
            <div className="text-lg font-black text-emerald-700 mt-0.5">
              1 : {metrics.avgRiskRewardRatio.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Insights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Best Trading Day</span>
          <div className="text-base font-bold text-emerald-600 mt-1">{metrics.bestTradingDay}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Worst Trading Day</span>
          <div className="text-base font-bold text-rose-600 mt-1">{metrics.worstTradingDay}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Best Month</span>
          <div className="text-base font-bold text-emerald-600 mt-1">{metrics.bestMonth}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Worst Month</span>
          <div className="text-base font-bold text-rose-600 mt-1">{metrics.worstMonth}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve Line Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Cumulative Equity Curve</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Growth of net trading capital over time</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {formatINR(metrics.netPnL)}
            </span>
          </div>

          <div className="h-64 w-full">
            {equityCurveData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No trades logged yet to display equity curve.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="tradeNo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), 'Cumulative Net P&L']}
                    labelFormatter={(label, items) => {
                      if (items && items[0]) {
                        return `${label} (${items[0].payload.date})`;
                      }
                      return label;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativePnL"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#equityGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Profit vs Loss Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              <span>Profit vs Loss Distribution</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Win/Loss ratio breakdown</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-slate-400 text-sm">No trade data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} Trades`, 'Count']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Monthly Profit & Loss Breakdown</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Gross gains vs gross losses by month</p>
        </div>

        <div className="h-64 w-full">
          {monthlyBarData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No monthly data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [formatINR(Number(val)), 'Amount']} />
                <Legend />
                <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Loss" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Trade Execution Type / Mode Analytics Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Trade Execution Type & Mode Analytics</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Performance breakdown by Manual Trading, Algo Trading, Copy Trading, and Others
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              Total Logged: {trades.length} Trades
            </span>
          </div>
        </div>

        {/* Top Highlight Cards for Execution Modes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              Most Used Execution Mode
            </span>
            <div className="text-lg font-black text-slate-900 mt-1 flex items-center justify-between">
              <span>{executionModeAnalytics.mostUsedMode?.mode || 'N/A'}</span>
              <span className="text-xs font-mono bg-blue-200 text-blue-900 px-2 py-0.5 rounded-md font-bold">
                {executionModeAnalytics.mostUsedMode ? `${executionModeAnalytics.mostUsedMode.count} Trades (${executionModeAnalytics.mostUsedMode.sharePct.toFixed(0)}%)` : '0 Trades'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              Most Profitable Mode
            </span>
            <div className="text-lg font-black text-emerald-900 mt-1 flex items-center justify-between">
              <span>{executionModeAnalytics.mostProfitableMode?.mode || 'N/A'}</span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {executionModeAnalytics.mostProfitableMode ? formatINR(executionModeAnalytics.mostProfitableMode.netPnL) : '₹0'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50/50 rounded-xl border border-purple-200">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
              Highest Win-Rate Mode
            </span>
            <div className="text-lg font-black text-purple-900 mt-1 flex items-center justify-between">
              <span>{executionModeAnalytics.bestWinRateMode?.mode || 'N/A'}</span>
              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                {executionModeAnalytics.bestWinRateMode ? `${executionModeAnalytics.bestWinRateMode.winRate.toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Charts Grid: Bar Chart & Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Bar Chart: Net P&L by Mode */}
          <div className="lg:col-span-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                Net P&L vs Charges Comparison (By Execution Mode)
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">Realized P&L in ₹</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={executionModeAnalytics.barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="mode" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val: any) => [formatINR(Number(val)), 'Amount']} />
                  <Legend />
                  <Bar dataKey="Net P&L" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Charges" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Mode Share */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                Execution Mode Volume Share
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Distribution of total logged orders</p>
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              {executionModeAnalytics.pieChartData.length === 0 ? (
                <div className="text-slate-400 text-xs">No execution mode data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={executionModeAnalytics.pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {executionModeAnalytics.pieChartData.map((entry, index) => (
                        <Cell key={`exec-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val} Trades`, 'Volume']} />
                    <Legend verticalAlign="bottom" height={30} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Execution Mode Performance Breakdown Table */}
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-3">
            Execution Mode Performance Table
          </h4>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Execution Mode</th>
                  <th className="py-3 px-3 text-center">Trades Logged</th>
                  <th className="py-3 px-3 text-center">Win / Loss</th>
                  <th className="py-3 px-3">Win Rate</th>
                  <th className="py-3 px-3 text-right">Gross P&L</th>
                  <th className="py-3 px-3 text-right">Charges Paid</th>
                  <th className="py-3 px-3 text-right">Net Realized P&L</th>
                  <th className="py-3 px-3 text-right">Avg P&L / Trade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {executionModeAnalytics.list.map((m) => {
                  let badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
                  let IconComp = Layers;
                  if (m.mode === 'Algo Trading') {
                    badgeBg = 'bg-purple-50 text-purple-700 border-purple-200';
                    IconComp = Cpu;
                  } else if (m.mode === 'Copy Trading') {
                    badgeBg = 'bg-cyan-50 text-cyan-800 border-cyan-200';
                    IconComp = UserCheck;
                  } else if (m.mode === 'Others') {
                    badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
                    IconComp = Sparkles;
                  }

                  return (
                    <tr key={m.mode} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-2">
                          <span className={`p-1.5 rounded-lg border ${badgeBg}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{m.mode}</span>
                            {m.mode === 'Others' && m.reasons.length > 0 && (
                              <span className="text-[10px] text-slate-500 block truncate max-w-[180px]" title={m.reasons.join(', ')}>
                                Reasons: {m.reasons.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                        {m.count} <span className="text-[10px] font-normal text-slate-400">({m.sharePct.toFixed(0)}%)</span>
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="text-emerald-600 font-bold">{m.wins}W</span> / <span className="text-rose-600 font-bold">{m.losses}L</span>
                        {m.breakevens > 0 && <span className="text-slate-400 text-[10px]"> ({m.breakevens}BE)</span>}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap min-w-[120px]">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, m.winRate))}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 font-mono text-[11px]">{m.winRate.toFixed(0)}%</span>
                        </div>
                      </td>

                      <td className={`py-3.5 px-3 text-right font-mono font-semibold ${m.grossPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatINR(m.grossPnL)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                        ₹{m.charges.toLocaleString('en-IN')}
                      </td>

                      <td className={`py-3.5 px-3 text-right font-mono font-black ${m.netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatINR(m.netPnL)}
                      </td>

                      <td className={`py-3.5 px-3 text-right font-mono text-xs font-bold ${m.avgNetPnL >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatINR(m.avgNetPnL)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Data Modal Window on Calendar Date Click */}
      <AnimatePresence>
        {selectedDayOrdersDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div
                className={`p-5 sm:p-6 text-white flex items-center justify-between ${
                  selectedDaySummary.netPnL > 0
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800'
                    : selectedDaySummary.netPnL < 0
                    ? 'bg-gradient-to-r from-rose-600 via-red-700 to-rose-800'
                    : 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white">
                      Order Book Details
                    </span>
                    <span className="text-xs text-white/90 font-medium">
                      {formattedSelectedDateDisplay}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black mt-1 flex items-center gap-2">
                    <span>Date: {selectedDayOrdersDate}</span>
                  </h2>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xl sm:text-2xl font-black">
                      {formatINR(selectedDaySummary.netPnL)}
                    </div>
                    <span className="text-xs opacity-90">Daily Net Realized P&L</span>
                  </div>

                  <button
                    onClick={() => setSelectedDayOrdersDate(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Day Summary Metric Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 font-medium block">Total Executed Orders</span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block">
                    {selectedDaySummary.count} {selectedDaySummary.count === 1 ? 'Trade' : 'Trades'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 font-medium block">Gross Realized P&L</span>
                  <span className={`text-base font-black mt-0.5 block ${selectedDaySummary.grossPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatINR(selectedDaySummary.grossPnL)}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 font-medium block">Total Brokerage & GST</span>
                  <span className="text-base font-black text-slate-700 mt-0.5 block">
                    ₹{(selectedDaySummary?.totalCharges ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 font-medium block">Net Realized P&L</span>
                  <span className={`text-base font-black mt-0.5 block ${selectedDaySummary.netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatINR(selectedDaySummary.netPnL)}
                  </span>
                </div>
              </div>

              {/* Modal Body: Trades Table */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                {selectedDayTrades.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-3">
                    <ListFilter className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No orders recorded on {selectedDayOrdersDate}</p>
                    <p className="text-xs text-slate-400">You can add trades for this date using the "+ Add Trade" button in the header.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-600 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-3">Time</th>
                          <th className="py-3 px-3">Instrument / Strike</th>
                          <th className="py-3 px-3">Type</th>
                          <th className="py-3 px-3 text-right">Entry / Exit</th>
                          <th className="py-3 px-3 text-right">Qty</th>
                          <th className="py-3 px-3 text-right">Gross P&L</th>
                          <th className="py-3 px-3 text-right">Charges</th>
                          <th className="py-3 px-3 text-right">Net P&L</th>
                          <th className="py-3 px-3">Strategy</th>
                          <th className="py-3 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedDayTrades.map((t) => {
                          const isWin = t.netPnL > 0;
                          const isLoss = t.netPnL < 0;
                          const totalCharges = (t.brokerage || 0) + (t.taxes || 0) + (t.otherCharges || 0);

                          return (
                            <tr key={t.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                                {t.time || '--:--'}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>{t.indexOrStock}</span>
                                  {t.strikePrice && <span className="text-slate-500 text-[11px] font-normal">{t.strikePrice}</span>}
                                </div>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    t.buyOrSell === 'Buy'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {t.buyOrSell}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                                <div>₹{t.entryPrice} → ₹{t.exitPrice}</div>
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                                {t.quantity}
                              </td>
                              <td className={`py-3 px-3 text-right font-semibold font-mono whitespace-nowrap ${t.grossPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatINR(t.grossPnL)}
                              </td>
                              <td className="py-3 px-3 text-right text-slate-500 font-mono whitespace-nowrap">
                                ₹{(totalCharges ?? 0).toLocaleString('en-IN')}
                              </td>
                              <td
                                className={`py-3 px-3 text-right font-black font-mono whitespace-nowrap ${
                                  isWin ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-600'
                                }`}
                              >
                                {formatINR(t.netPnL)}
                              </td>
                              <td className="py-3 px-3 text-slate-600 text-[11px] max-w-[120px] truncate">
                                {t.strategy || 'N/A'}
                              </td>
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center space-x-1">
                                  {onViewTrade && (
                                    <button
                                      onClick={() => {
                                        setSelectedDayOrdersDate(null);
                                        onViewTrade(t);
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                      title="View Trade Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                  {onEditTrade && (
                                    <button
                                      onClick={() => {
                                        setSelectedDayOrdersDate(null);
                                        onEditTrade(t);
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                      title="Edit Trade"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  {onDeleteTrade && (
                                    <button
                                      onClick={() => {
                                        setTradeToDelete(t);
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="Delete Trade"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Showing orders executed on {selectedDayOrdersDate}</span>
                <button
                  onClick={() => setSelectedDayOrdersDate(null)}
                  className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Trade Confirmation Modal */}
      <AnimatePresence>
        {tradeToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-start space-x-3">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Delete Trade Confirmation
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Are you sure you want to delete this trade for <span className="font-bold text-slate-900">{tradeToDelete.indexOrStock} {tradeToDelete.strikePrice}</span> logged on <span className="font-bold text-slate-900">{tradeToDelete.date}</span>?
                  </p>
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed font-medium">
                <span className="font-bold block text-rose-950 mb-0.5">⚠️ Permanent Deletion</span>
                When you click Yes, all data associated with this trade will be permanently removed across all pages, metrics, and history.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTradeToDelete(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  No, Keep Trade
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (tradeToDelete && onDeleteTrade) {
                      onDeleteTrade(tradeToDelete.id);
                      setTradeToDelete(null);
                      setSelectedDayOrdersDate(null);
                    }
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Trade</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
