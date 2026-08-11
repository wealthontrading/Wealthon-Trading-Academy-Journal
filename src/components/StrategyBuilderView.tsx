import { useMarket } from '../contexts/MarketContext';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Award,
  Zap,
  BarChart2,
  BarChart3,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
  Layers,
  Layers3,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  GitCompare,
  ArrowRight,
  Trophy,
  Activity,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { formatINR } from '../utils/calculations';
import { StrategyItem, Trade } from '../types';

interface StrategyBuilderViewProps {
  strategies: StrategyItem[];
  trades: Trade[];
  onAddStrategy: (strategy: Omit<StrategyItem, 'id' | 'createdAt'>) => void;
  onEditStrategy: (id: string, updatedFields: Partial<Omit<StrategyItem, 'id' | 'createdAt'>>) => void;
  onDeleteStrategy: (id: string) => void;
  onOpenAddTradeWithStrategy?: (strategyName: string) => void;
}

const CATEGORIES = [
  'All',
  'Option Buying',
  'Option Selling',
  'Scalping',
  'Swing',
  'Price Action',
  'Custom',
] as const;

export const StrategyBuilderView: React.FC<StrategyBuilderViewProps> = ({
  strategies,
  trades,
  onAddStrategy,
  onEditStrategy,
  onDeleteStrategy,
  onOpenAddTradeWithStrategy,
}) => {
  const { currencySymbol } = useMarket();
  // Top View Mode: 'overview' | 'single' | 'compare'
  const [viewMode, setViewMode] = useState<'overview' | 'single' | 'compare'>('overview');

  // Overview Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'winRate' | 'pnl' | 'trades' | 'name'>('pnl');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(null);
  const [strategyToDelete, setStrategyToDelete] = useState<StrategyItem | null>(null);
  const [strategyToEdit, setStrategyToEdit] = useState<StrategyItem | null>(null);

  // Single Strategy Selection
  const [selectedSingleStratName, setSelectedSingleStratName] = useState<string>('');

  // Compare Strategies Selection
  const [compareStratA, setCompareStratA] = useState<string>('');
  const [compareStratB, setCompareStratB] = useState<string>('');

  // Form State for Adding Strategy
  const [newStratName, setNewStratName] = useState('');
  const [newStratCategory, setNewStratCategory] = useState<string>('Option Buying');
  const [newStratCustomCategory, setNewStratCustomCategory] = useState('');
  const [newStratTimeframe, setNewStratTimeframe] = useState('5 min');
  const [newStratTargetWinRate, setNewStratTargetWinRate] = useState<number | ''>(65);
  const [newStratRiskReward, setNewStratRiskReward] = useState('1:2');
  const [newStratDescription, setNewStratDescription] = useState('');
  const [newStratRulesText, setNewStratRulesText] = useState('');

  // Set default strategy selections if empty
  const activeSingleStratName = useMemo(() => {
    if (selectedSingleStratName) return selectedSingleStratName;
    return strategies[0]?.name || 'Option Buying';
  }, [selectedSingleStratName, strategies]);

  const activeCompareA = useMemo(() => {
    if (compareStratA) return compareStratA;
    return strategies[0]?.name || 'Option Buying';
  }, [compareStratA, strategies]);

  const activeCompareB = useMemo(() => {
    if (compareStratB) return compareStratB;
    return strategies[1]?.name || strategies[0]?.name || 'Option Selling';
  }, [compareStratB, strategies]);

  // Helper to format duration
  const formatDuration = (minutes: number): string => {
    if (!minutes || minutes <= 0) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) {
      return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    }
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours} hr` : `${days}d`;
  };

  // 1. Compute Analytics per Strategy
  const strategyAnalytics = useMemo(() => {
    const statsMap: Record<
      string,
      {
        totalTrades: number;
        wins: number;
        losses: number;
        breakevens: number;
        totalProfit: number;
        totalLossAmount: number;
        netPnL: number;
        grossPnL: number;
        totalWinPnL: number;
        totalLossPnL: number;
        totalHoldingMinutes: number;
        holdingTimeCount: number;
        maxHoldingMinutes: number;
        pnls: number[];
        bestTrade: number;
        worstTrade: number;
        lastTradedDate: string;
      }
    > = {};

    trades.forEach((trade) => {
      const stratName = (trade.strategy || 'Unassigned').trim();

      if (!statsMap[stratName]) {
        statsMap[stratName] = {
          totalTrades: 0,
          wins: 0,
          losses: 0,
          breakevens: 0,
          totalProfit: 0,
          totalLossAmount: 0,
          netPnL: 0,
          grossPnL: 0,
          totalWinPnL: 0,
          totalLossPnL: 0,
          totalHoldingMinutes: 0,
          holdingTimeCount: 0,
          maxHoldingMinutes: 0,
          pnls: [],
          bestTrade: 0,
          worstTrade: 0,
          lastTradedDate: '',
        };
      }

      const st = statsMap[stratName];
      st.totalTrades += 1;
      st.netPnL += trade.netPnL;
      st.grossPnL += trade.grossPnL !== undefined ? trade.grossPnL : trade.netPnL;
      st.pnls.push(trade.netPnL);

      if (trade.netPnL > st.bestTrade) st.bestTrade = trade.netPnL;
      if (trade.netPnL < st.worstTrade) st.worstTrade = trade.netPnL;

      if (trade.holdingTimeMinutes && trade.holdingTimeMinutes > 0) {
        st.totalHoldingMinutes += trade.holdingTimeMinutes;
        st.holdingTimeCount += 1;
        if (trade.holdingTimeMinutes > st.maxHoldingMinutes) {
          st.maxHoldingMinutes = trade.holdingTimeMinutes;
        }
      }

      if (trade.netPnL > 0) {
        st.wins += 1;
        st.totalWinPnL += trade.netPnL;
      } else if (trade.netPnL < 0) {
        st.losses += 1;
        st.totalLossPnL += Math.abs(trade.netPnL);
      } else {
        st.breakevens += 1;
      }

      if (trade.date && (!st.lastTradedDate || trade.date > st.lastTradedDate)) {
        st.lastTradedDate = trade.date;
      }
    });

    return strategies.map((strat) => {
      const stats = statsMap[strat.name] || {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        breakevens: 0,
        totalProfit: 0,
        totalLossAmount: 0,
        netPnL: 0,
        grossPnL: 0,
        totalWinPnL: 0,
        totalLossPnL: 0,
        totalHoldingMinutes: 0,
        holdingTimeCount: 0,
        maxHoldingMinutes: 0,
        pnls: [],
        bestTrade: 0,
        worstTrade: 0,
        lastTradedDate: '',
      };

      const winRate =
        stats.totalTrades > 0
          ? Math.round((stats.wins / stats.totalTrades) * 100)
          : 0;

      const avgWin = stats.wins > 0 ? stats.totalWinPnL / stats.wins : 0;
      const avgLoss = stats.losses > 0 ? stats.totalLossPnL / stats.losses : 0;
      const profitFactor =
        stats.totalLossPnL > 0
          ? Number((stats.totalWinPnL / stats.totalLossPnL).toFixed(2))
          : stats.totalWinPnL > 0
          ? 99
          : 0;

      const expectancy =
        stats.totalTrades > 0
          ? Number(
              (
                (winRate / 100) * avgWin -
                ((100 - winRate) / 100) * avgLoss
              ).toFixed(2)
            )
          : 0;

      const holdingCount = stats.holdingTimeCount || 0;
      const avgDurationMinutes = holdingCount > 0 ? Math.round(stats.totalHoldingMinutes / holdingCount) : 0;
      const formattedAvgDuration = holdingCount > 0 ? formatDuration(avgDurationMinutes) : 'N/A';
      const formattedMaxDuration = stats.maxHoldingMinutes > 0 ? formatDuration(stats.maxHoldingMinutes) : 'N/A';

      const totalTradesCount = stats.totalTrades;
      const pnls = stats.pnls || [];
      let sharpeRatio = 0;
      let stdDevPnL = 0;

      if (totalTradesCount > 0 && pnls.length > 0) {
        const avgPnL = stats.netPnL / totalTradesCount;
        if (pnls.length > 1) {
          const variance = pnls.reduce((acc, val) => acc + Math.pow(val - avgPnL, 2), 0) / (pnls.length - 1);
          stdDevPnL = Math.round(Math.sqrt(variance));
        }
        if (stdDevPnL > 0) {
          sharpeRatio = Number((avgPnL / stdDevPnL).toFixed(2));
        } else if (avgPnL > 0) {
          sharpeRatio = 2.50;
        } else {
          sharpeRatio = 0;
        }
      }

      return {
        ...strat,
        stats: {
          ...stats,
          winRate,
          avgWin,
          avgLoss,
          profitFactor,
          expectancy,
          avgDurationMinutes,
          formattedAvgDuration,
          formattedMaxDuration,
          sharpeRatio,
          stdDevPnL,
        },
      };
    });
  }, [strategies, trades]);

  // 2. Summary Headline Metrics
  const headlineMetrics = useMemo(() => {
    const totalCount = strategies.length;

    let bestWinRateStrat = { name: 'N/A', rate: 0 };
    let mostProfitableStrat = { name: 'N/A', pnl: 0 };
    let highestPFStrat = { name: 'N/A', pf: 0 };

    strategyAnalytics.forEach((item) => {
      if (item.stats.totalTrades >= 1) {
        if (item.stats.winRate > bestWinRateStrat.rate) {
          bestWinRateStrat = { name: item.name, rate: item.stats.winRate };
        }
        if (item.stats.netPnL > mostProfitableStrat.pnl) {
          mostProfitableStrat = { name: item.name, pnl: item.stats.netPnL };
        }
        if (item.stats.profitFactor > highestPFStrat.pf) {
          highestPFStrat = { name: item.name, pf: item.stats.profitFactor };
        }
      }
    });

    return {
      totalCount,
      bestWinRateStrat,
      mostProfitableStrat,
      highestPFStrat,
    };
  }, [strategies, strategyAnalytics]);

  // 3. Filtered & Sorted Strategies List
  const filteredStrategies = useMemo(() => {
    return strategyAnalytics
      .filter((item) => {
        const matchesCategory =
          selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.rules &&
            item.rules.some((r) =>
              r.toLowerCase().includes(searchTerm.toLowerCase())
            ));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'winRate') return b.stats.winRate - a.stats.winRate;
        if (sortBy === 'pnl') return b.stats.netPnL - a.stats.netPnL;
        if (sortBy === 'trades') return b.stats.totalTrades - a.stats.totalTrades;
        return a.name.localeCompare(b.name);
      });
  }, [strategyAnalytics, selectedCategory, searchTerm, sortBy]);

  // 4. Single Strategy Deep Dive Data
  const singleStratAnalytics = useMemo(() => {
    const item = strategyAnalytics.find((s) => s.name === activeSingleStratName) || strategyAnalytics[0];
    if (!item) return null;

    const stratTrades = trades
      .filter((t) => (t.strategy || 'Unassigned').trim() === item.name)
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    let cum = 0;
    const cumulativeChartData = stratTrades.map((t, idx) => {
      cum += t.netPnL;
      return {
        tradeIndex: idx + 1,
        date: t.date,
        pnl: t.netPnL,
        cumulativePnL: cum,
        symbol: t.indexOrStock || 'N/A',
      };
    });

    // Monthly breakdown for this single strategy
    const monthlyMap: Record<string, { month: string; netPnL: number; wins: number; trades: number }> = {};
    stratTrades.forEach((t) => {
      const monthKey = t.date ? t.date.substring(0, 7) : 'Unknown';
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, netPnL: 0, wins: 0, trades: 0 };
      }
      monthlyMap[monthKey].netPnL += t.netPnL;
      monthlyMap[monthKey].trades += 1;
      if (t.netPnL > 0) monthlyMap[monthKey].wins += 1;
    });

    const monthlyChartData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    return {
      strategy: item,
      stratTrades,
      cumulativeChartData,
      monthlyChartData,
    };
  }, [strategyAnalytics, activeSingleStratName, trades]);

  // 5. Head-to-Head Comparison Data (Strategy A vs Strategy B)
  const compareData = useMemo(() => {
    const stratA = strategyAnalytics.find((s) => s.name === activeCompareA) || strategyAnalytics[0];
    const stratB = strategyAnalytics.find((s) => s.name === activeCompareB) || strategyAnalytics[1] || strategyAnalytics[0];

    if (!stratA || !stratB) return null;

    const tradesA = trades
      .filter((t) => (t.strategy || 'Unassigned').trim() === stratA.name)
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    const tradesB = trades
      .filter((t) => (t.strategy || 'Unassigned').trim() === stratB.name)
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    // Overlaid Cumulative P&L Series by trade sequence
    const maxLen = Math.max(tradesA.length, tradesB.length);
    let cumA = 0;
    let cumB = 0;
    const comparisonTrajectory: {
      tradeIndex: number;
      stratAPnL?: number;
      stratBPnL?: number;
      cumA: number;
      cumB: number;
    }[] = [];

    for (let i = 0; i < maxLen; i++) {
      if (tradesA[i]) {
        cumA += tradesA[i].netPnL;
      }
      if (tradesB[i]) {
        cumB += tradesB[i].netPnL;
      }
      comparisonTrajectory.push({
        tradeIndex: i + 1,
        stratAPnL: tradesA[i]?.netPnL,
        stratBPnL: tradesB[i]?.netPnL,
        cumA,
        cumB,
      });
    }

    // Metric winner flags
    const winnerWinRate = stratA.stats.winRate > stratB.stats.winRate ? 'A' : stratB.stats.winRate > stratA.stats.winRate ? 'B' : 'Tie';
    const winnerPnL = stratA.stats.netPnL > stratB.stats.netPnL ? 'A' : stratB.stats.netPnL > stratA.stats.netPnL ? 'B' : 'Tie';
    const winnerPF = stratA.stats.profitFactor > stratB.stats.profitFactor ? 'A' : stratB.stats.profitFactor > stratA.stats.profitFactor ? 'B' : 'Tie';
    const winnerExpectancy = stratA.stats.expectancy > stratB.stats.expectancy ? 'A' : stratB.stats.expectancy > stratA.stats.expectancy ? 'B' : 'Tie';
    const winnerSharpe = stratA.stats.sharpeRatio > stratB.stats.sharpeRatio ? 'A' : stratB.stats.sharpeRatio > stratA.stats.sharpeRatio ? 'B' : 'Tie';

    return {
      stratA,
      stratB,
      tradesA,
      tradesB,
      comparisonTrajectory,
      winners: {
        winRate: winnerWinRate,
        pnl: winnerPnL,
        pf: winnerPF,
        expectancy: winnerExpectancy,
        sharpe: winnerSharpe,
      },
    };
  }, [strategyAnalytics, activeCompareA, activeCompareB, trades]);

  // Comparison Bar Chart Data
  const chartData = useMemo(() => {
    return filteredStrategies.map((item) => ({
      name: item.name.length > 18 ? item.name.substring(0, 16) + '...' : item.name,
      fullName: item.name,
      winRate: item.stats.winRate,
      targetWinRate: item.targetWinRate || 65,
      netPnL: Math.round(item.stats.netPnL),
      trades: item.stats.totalTrades,
      profitFactor: item.stats.profitFactor,
    }));
  }, [filteredStrategies]);

  const probabilityTiers = useMemo(() => {
    const high = filteredStrategies.filter((s) => s.stats.winRate >= 60 && s.stats.totalTrades > 0);
    const medium = filteredStrategies.filter((s) => s.stats.winRate >= 40 && s.stats.winRate < 60 && s.stats.totalTrades > 0);
    const low = filteredStrategies.filter((s) => s.stats.winRate < 40 && s.stats.totalTrades > 0);

    return { high, medium, low };
  }, [filteredStrategies]);

  // Handle Submit New Strategy
  const handleCreateStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStratName.trim()) return;

    const rulesList = newStratRulesText
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const payload = {
      name: newStratName.trim(),
      category: newStratCategory === 'Custom' ? (newStratCustomCategory.trim() || 'Custom') : newStratCategory,
      timeframe: newStratTimeframe.trim() || '5 min',
      targetWinRate: newStratTargetWinRate !== '' ? Number(newStratTargetWinRate) : 65,
      riskRewardRatio: newStratRiskReward.trim() || '1:2',
      description: newStratDescription.trim(),
      rules: rulesList.length > 0 ? rulesList : ['Follow strict stop-loss.'],
    };

    if (strategyToEdit) {
      onEditStrategy(strategyToEdit.id, payload);
    } else {
      onAddStrategy(payload);
    }

    setStrategyToEdit(null);
    setNewStratName('');
    setNewStratCategory('Option Buying');
    setNewStratCustomCategory('');
    setNewStratDescription('');
    setNewStratRulesText('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Layers3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Strategy Builder & Analytics Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Build, Track & Compare Your Trading Setups
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Define execution rules, analyze single-strategy performance graphs, and run head-to-head comparisons to determine your edge.
            </p>
          </div>

          <button
            onClick={() => {
              setStrategyToEdit(null);
              setNewStratName('');
              setNewStratCategory('Option Buying');
              setNewStratCustomCategory('');
              setNewStratDescription('');
              setNewStratRulesText('');
              setIsAddModalOpen(true);
            }}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center space-x-2 shrink-0 cursor-pointer transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Strategy</span>
          </button>
        </div>

        {/* Highlight Headline Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 space-y-1">
            <span className="text-xs text-slate-400 font-medium block">Total Strategies</span>
            <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>{headlineMetrics.totalCount} Setups</span>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 space-y-1">
            <span className="text-xs text-slate-400 font-medium block">Highest Win Rate</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 truncate">
              {headlineMetrics.bestWinRateStrat.rate > 0 ? (
                <span>{headlineMetrics.bestWinRateStrat.rate}%</span>
              ) : (
                <span className="text-slate-400 text-base">No Data</span>
              )}
            </div>
            {headlineMetrics.bestWinRateStrat.name !== 'N/A' && (
              <p className="text-[11px] text-slate-400 truncate">
                {headlineMetrics.bestWinRateStrat.name}
              </p>
            )}
          </div>

          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 space-y-1">
            <span className="text-xs text-slate-400 font-medium block">Most Profitable</span>
            <div className="text-xl sm:text-2xl font-black text-blue-400 truncate">
              {headlineMetrics.mostProfitableStrat.pnl !== 0 ? (
                <span>{formatINR(headlineMetrics.mostProfitableStrat.pnl)}</span>
              ) : (
                <span className="text-slate-400 text-base">₹0</span>
              )}
            </div>
            {headlineMetrics.mostProfitableStrat.name !== 'N/A' && (
              <p className="text-[11px] text-slate-400 truncate">
                {headlineMetrics.mostProfitableStrat.name}
              </p>
            )}
          </div>

          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 space-y-1">
            <span className="text-xs text-slate-400 font-medium block">Best Profit Factor</span>
            <div className="text-xl sm:text-2xl font-black text-purple-400 truncate">
              {headlineMetrics.highestPFStrat.pf > 0 ? (
                <span>{headlineMetrics.highestPFStrat.pf}</span>
              ) : (
                <span className="text-slate-400 text-base">N/A</span>
              )}
            </div>
            {headlineMetrics.highestPFStrat.name !== 'N/A' && (
              <p className="text-[11px] text-slate-400 truncate">
                {headlineMetrics.highestPFStrat.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* View Mode Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer ${
              viewMode === 'overview'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>All Strategies Overview</span>
          </button>

          <button
            onClick={() => setViewMode('single')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer ${
              viewMode === 'single'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Single Strategy Analysis</span>
          </button>

          <button
            onClick={() => setViewMode('compare')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer ${
              viewMode === 'compare'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Head-to-Head Compare (2 Strategies)</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium px-3 hidden md:block">
          {viewMode === 'overview' && 'Showing all strategy benchmarks'}
          {viewMode === 'single' && 'Analyze detailed charts for a specific strategy'}
          {viewMode === 'compare' && 'Select two strategies to run head-to-head analysis'}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ALL STRATEGIES OVERVIEW MODE */}
      {/* ========================================================================= */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Win Ratio Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs relative overflow-hidden group">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">High Probability</h3>
                  <p className="text-xs text-slate-500 font-medium">Win Rate &ge; 60%</p>
                </div>
              </div>
              <div className="space-y-3">
                {probabilityTiers.high.length > 0 ? (
                  probabilityTiers.high.map((strat) => (
                    <div
                      key={strat.id}
                      onClick={() => {
                        setSelectedSingleStratName(strat.name);
                        setViewMode('single');
                      }}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-300 cursor-pointer transition"
                    >
                      <span className="text-xs font-bold text-slate-700 truncate mr-2">{strat.name}</span>
                      <span className="text-xs font-black text-emerald-600 shrink-0">{strat.stats.winRate}%</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 font-medium p-3 bg-slate-50 rounded-xl text-center border border-slate-100 border-dashed">
                    No strategies in this tier yet
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-xs relative overflow-hidden group">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Medium Probability</h3>
                  <p className="text-xs text-slate-500 font-medium">Win Rate 40% - 59%</p>
                </div>
              </div>
              <div className="space-y-3">
                {probabilityTiers.medium.length > 0 ? (
                  probabilityTiers.medium.map((strat) => (
                    <div
                      key={strat.id}
                      onClick={() => {
                        setSelectedSingleStratName(strat.name);
                        setViewMode('single');
                      }}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-300 cursor-pointer transition"
                    >
                      <span className="text-xs font-bold text-slate-700 truncate mr-2">{strat.name}</span>
                      <span className="text-xs font-black text-blue-600 shrink-0">{strat.stats.winRate}%</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 font-medium p-3 bg-slate-50 rounded-xl text-center border border-slate-100 border-dashed">
                    No strategies in this tier yet
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-xs relative overflow-hidden group">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Low Probability</h3>
                  <p className="text-xs text-slate-500 font-medium">Win Rate &lt; 40%</p>
                </div>
              </div>
              <div className="space-y-3">
                {probabilityTiers.low.length > 0 ? (
                  probabilityTiers.low.map((strat) => (
                    <div
                      key={strat.id}
                      onClick={() => {
                        setSelectedSingleStratName(strat.name);
                        setViewMode('single');
                      }}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-rose-300 cursor-pointer transition"
                    >
                      <span className="text-xs font-bold text-slate-700 truncate mr-2">{strat.name}</span>
                      <span className="text-xs font-black text-rose-600 shrink-0">{strat.stats.winRate}%</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 font-medium p-3 bg-slate-50 rounded-xl text-center border border-slate-100 border-dashed">
                    No strategies in this tier yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Strategy Comparison Visual Charts */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Win Rate Comparison Bar Chart */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <BarChart2 className="w-4 h-4 text-emerald-600" />
                      <span>Comparative Strategy Win Rates (%)</span>
                    </h3>
                    <p className="text-xs text-slate-500">Side-by-side analysis of Actual Win Rate vs Target Goal</p>
                  </div>
                </div>

                <div className="h-68 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-lg border border-slate-700 space-y-1.5">
                                <p className="font-bold text-slate-100 border-b border-slate-800 pb-1">{data.fullName}</p>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-slate-300">Actual Win Rate:</span>
                                  <span className="text-emerald-400 font-bold">{data.winRate}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-slate-300">Target Win Rate:</span>
                                  <span className="text-indigo-300 font-bold">{data.targetWinRate}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1 text-[11px]">
                                  <span className="text-slate-400">Trades Logged:</span>
                                  <span className="text-slate-300 font-semibold">{data.trades}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                        formatter={(value) => <span className="text-slate-700 font-medium text-xs">{value}</span>}
                      />
                      <ReferenceLine y={65} stroke="#10b981" strokeDasharray="3 3" label={{ value: '65% Target', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
                      <Bar dataKey="winRate" name="Actual Win Rate (%)" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.winRate >= entry.targetWinRate
                                ? '#10b981'
                                : entry.winRate >= 50
                                ? '#3b82f6'
                                : entry.winRate > 0
                                ? '#f59e0b'
                                : '#cbd5e1'
                            }
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="targetWinRate" name="Target Win Rate (%)" fill="#6366f1" opacity={0.35} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Net P&L Comparison Bar Chart */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span>Net P&L by Strategy (₹)</span>
                    </h3>
                    <p className="text-xs text-slate-500">Cumulative net profits generated per strategy setup</p>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-lg border border-slate-700">
                                <p className="font-bold text-slate-100">{data.fullName}</p>
                                <p
                                  className={`font-black mt-1 ${
                                    data.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  Net P&L: {formatINR(data.netPnL)}
                                </p>
                                <p className="text-slate-300">Profit Factor: {data.profitFactor}</p>
                                <p className="text-slate-400">Total Trades Logged: {data.trades}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine y={0} stroke="#94a3b8" />
                      <Bar dataKey="netPnL" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-pnl-${index}`}
                            fill={entry.netPnL >= 0 ? '#3b82f6' : '#f43f5e'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Filter & Controls Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search strategy by name, timeframe, or rules..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2 shrink-0 border-l border-slate-200 pl-3">
                  <span className="text-xs text-slate-500 font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pnl">Net P&L (High to Low)</option>
                    <option value="winRate">Win Rate (High to Low)</option>
                    <option value="trades">Total Trades Logged</option>
                    <option value="name">Strategy Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Cards List */}
          <div className="space-y-4">
            {filteredStrategies.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Layers3 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Strategies Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No strategy matches your current search filters. Create a new custom strategy or adjust filters.
                </p>
                <button
                  onClick={() => {
                    setStrategyToEdit(null);
                    setNewStratName('');
                    setNewStratCategory('Option Buying');
                    setNewStratCustomCategory('');
                    setNewStratDescription('');
                    setNewStratRulesText('');
                    setIsAddModalOpen(true);
                  }}
                  className="mt-2 inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Strategy Now</span>
                </button>
              </div>
            ) : (
              filteredStrategies.map((strat) => {
                const isExpanded = expandedStrategyId === strat.id;

                return (
                  <motion.div
                    key={strat.id}
                    layout
                    className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition duration-200 overflow-hidden"
                  >
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {strat.category || 'Custom'}
                            </span>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{strat.timeframe || '5 min'}</span>
                            </span>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              RR: {strat.riskRewardRatio || '1:2'}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                            {strat.name}
                          </h3>
                          {strat.description && (
                            <p className="text-xs text-slate-500 font-normal leading-relaxed">
                              {strat.description}
                            </p>
                          )}
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedSingleStratName(strat.name);
                              setViewMode('single');
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Analyze Charts</span>
                          </button>

                          {onOpenAddTradeWithStrategy && (
                            <button
                              onClick={() => onOpenAddTradeWithStrategy(strat.name)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Log Trade</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setStrategyToEdit(strat);
                              setNewStratName(strat.name);
                              const isStandardCategory = ['Option Buying', 'Option Selling', 'Scalping', 'Swing', 'Price Action'].includes(strat.category || '');
                              setNewStratCategory(isStandardCategory ? (strat.category || 'Option Buying') : 'Custom');
                              setNewStratCustomCategory(isStandardCategory ? '' : (strat.category || ''));
                              setNewStratTimeframe(strat.timeframe || '5 min');
                              setNewStratTargetWinRate(strat.targetWinRate || 65);
                              setNewStratRiskReward(strat.riskRewardRatio || '1:2');
                              setNewStratDescription(strat.description || '');
                              setNewStratRulesText(strat.rules?.join('\n') || '');
                              setIsAddModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                            title="Edit Strategy"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setStrategyToDelete(strat)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete Strategy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              setExpandedStrategyId(isExpanded ? null : strat.id)
                            }
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                              isExpanded
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{isExpanded ? 'Hide Rules' : 'View Quick Rules'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Metrics Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1">
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Win Ratio
                          </span>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-base font-black ${
                                strat.stats.winRate >= (strat.targetWinRate || 65)
                                  ? 'text-emerald-600'
                                  : strat.stats.winRate >= 50
                                  ? 'text-blue-600'
                                  : strat.stats.totalTrades > 0
                                  ? 'text-amber-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {strat.stats.winRate}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Target: {strat.targetWinRate || 65}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                strat.stats.winRate >= (strat.targetWinRate || 65)
                                  ? 'bg-emerald-500'
                                  : strat.stats.winRate >= 50
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(strat.stats.winRate, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1">
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Net P&L ({currencySymbol})
                          </span>
                          <span
                            className={`text-base font-black ${
                              strat.stats.netPnL > 0
                                ? 'text-emerald-600'
                                : strat.stats.netPnL < 0
                                ? 'text-rose-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {formatINR(strat.stats.netPnL)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {strat.stats.totalTrades} Trades Logged
                          </span>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1">
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Wins / Losses
                          </span>
                          <div className="flex items-center space-x-2 text-xs font-bold">
                            <span className="text-emerald-600">{strat.stats.wins}W</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-rose-600">{strat.stats.losses}L</span>
                            {strat.stats.breakevens > 0 && (
                              <span className="text-slate-400">({strat.stats.breakevens}BE)</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            Execution stats
                          </span>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1">
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Profit Factor
                          </span>
                          <span className="text-base font-black text-slate-900">
                            {strat.stats.profitFactor}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Win PnL / Loss PnL
                          </span>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1 col-span-2 sm:col-span-1">
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Avg Win / Loss
                          </span>
                          <div className="text-xs font-bold">
                            <span className="text-emerald-600">
                              +₹{Math.round(strat.stats.avgWin)}
                            </span>{' '}
                            /{' '}
                            <span className="text-rose-600">
                              -{currencySymbol}{Math.round(strat.stats.avgLoss)}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            Expectancy: ₹{strat.stats.expectancy}
                          </span>
                        </div>
                      </div>

                      {/* Setup Rules List */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-2"
                          >
                            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 space-y-2">
                              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                <BookOpen className="w-4 h-4 text-indigo-400" />
                                <span>Setup Checklist Rules</span>
                              </div>
                              {strat.rules && strat.rules.length > 0 ? (
                                <ul className="space-y-1.5 text-xs text-slate-300">
                                  {strat.rules.map((rule, idx) => (
                                    <li key={idx} className="flex items-start space-x-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                      <span>{rule}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-slate-400 italic">No checklist rules defined.</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SINGLE STRATEGY ANALYSIS MODE */}
      {/* ========================================================================= */}
      {viewMode === 'single' && (
        <div className="space-y-6">
          {/* Strategy Selection Box Bar */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Select Strategy Name to Analyze:
                </label>
                <div className="flex items-center space-x-3">
                  <select
                    value={activeSingleStratName}
                    onChange={(e) => setSelectedSingleStratName(e.target.value)}
                    className="px-4 py-3 rounded-2xl border-2 border-indigo-500/80 text-base font-black bg-indigo-50/50 text-indigo-950 focus:ring-4 focus:ring-indigo-200 outline-none cursor-pointer shadow-xs min-w-[280px]"
                  >
                    {strategies.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.category || 'Custom'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {singleStratAnalytics?.strategy && onOpenAddTradeWithStrategy && (
                <button
                  onClick={() => onOpenAddTradeWithStrategy(singleStratAnalytics.strategy.name)}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition flex items-center space-x-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Trade under "{singleStratAnalytics.strategy.name}"</span>
                </button>
              )}
            </div>
          </div>

          {singleStratAnalytics?.strategy ? (
            <div className="space-y-6">
              {/* Single Strategy Overview Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {singleStratAnalytics.strategy.category}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        Timeframe: {singleStratAnalytics.strategy.timeframe || '5 min'}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        Target RR: {singleStratAnalytics.strategy.riskRewardRatio || '1:2'}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Target Win Rate: {singleStratAnalytics.strategy.targetWinRate || 65}%
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white mt-1">
                      {singleStratAnalytics.strategy.name}
                    </h2>
                    {singleStratAnalytics.strategy.description && (
                      <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                        {singleStratAnalytics.strategy.description}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-right shrink-0">
                    <span className="text-[11px] text-slate-400 font-bold block">Actual Win Rate</span>
                    <span
                      className={`text-3xl font-black ${
                        singleStratAnalytics.strategy.stats.winRate >= (singleStratAnalytics.strategy.targetWinRate || 65)
                          ? 'text-emerald-400'
                          : singleStratAnalytics.strategy.stats.winRate >= 50
                          ? 'text-blue-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {singleStratAnalytics.strategy.stats.winRate}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {singleStratAnalytics.strategy.stats.wins} Wins / {singleStratAnalytics.strategy.stats.losses} Losses
                    </span>
                  </div>
                </div>

                {/* Key Stats Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
                    <span className="text-xs text-slate-400 font-bold block">Net P&L ({currencySymbol})</span>
                    <span
                      className={`text-xl font-black ${
                        singleStratAnalytics.strategy.stats.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatINR(singleStratAnalytics.strategy.stats.netPnL)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Gross: {formatINR(singleStratAnalytics.strategy.stats.grossPnL)}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
                    <span className="text-xs text-slate-400 font-bold block">Profit Factor</span>
                    <span className="text-xl font-black text-indigo-300">
                      {singleStratAnalytics.strategy.stats.profitFactor}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Expectancy: ₹{singleStratAnalytics.strategy.stats.expectancy}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
                    <span className="text-xs text-slate-400 font-bold block">Avg Win / Loss</span>
                    <div className="text-sm font-black">
                      <span className="text-emerald-400">+{currencySymbol}{Math.round(singleStratAnalytics.strategy.stats.avgWin)}</span>{' '}
                      <span className="text-slate-500">/</span>{' '}
                      <span className="text-rose-400">-₹{Math.round(singleStratAnalytics.strategy.stats.avgLoss)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Best: +{formatINR(singleStratAnalytics.strategy.stats.bestTrade)}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
                    <span className="text-xs text-slate-400 font-bold block">Sharpe & Duration</span>
                    <span className="text-xl font-black text-blue-300">
                      {singleStratAnalytics.strategy.stats.sharpeRatio.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Avg Hold: {singleStratAnalytics.strategy.stats.formattedAvgDuration}
                    </span>
                  </div>
                </div>

                {/* Setup Rules Checklist */}
                {singleStratAnalytics.strategy.rules && singleStratAnalytics.strategy.rules.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-xs font-bold text-indigo-300 block mb-2 uppercase tracking-wider">
                      Setup Rules & Execution Checklist:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                      {singleStratAnalytics.strategy.rules.map((rule, idx) => (
                        <div key={idx} className="flex items-start space-x-2 bg-slate-800/40 p-2 rounded-xl border border-slate-700/50">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Single Strategy Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Cumulative Equity P&L Growth Curve */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Cumulative Equity Curve (₹)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sequential profit growth for "{singleStratAnalytics.strategy.name}"
                    </p>
                  </div>

                  <div className="h-68 w-full pt-2">
                    {singleStratAnalytics.cumulativeChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={singleStratAnalytics.cumulativeChartData}
                          margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="singleCumGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="tradeIndex"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            unit=" Trade"
                          />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-lg border border-slate-700 space-y-1">
                                    <p className="font-bold text-slate-200">Trade #{data.tradeIndex} • {data.date}</p>
                                    <p className="text-slate-300">Symbol: {data.symbol}</p>
                                    <p className={`font-bold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      Trade P&L: {formatINR(data.pnl)}
                                    </p>
                                    <p className="font-black text-indigo-300 pt-1 border-t border-slate-800">
                                      Cumulative P&L: {formatINR(data.cumulativePnL)}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                          <Area
                            type="monotone"
                            dataKey="cumulativePnL"
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="url(#singleCumGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                        No trade history logged under this strategy yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart 2: Individual Trade P&L Bar Chart */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <BarChart2 className="w-4 h-4 text-indigo-600" />
                      <span>Individual Trade Performance ({currencySymbol})</span>
                    </h3>
                    <p className="text-xs text-slate-500">Profit & loss generated trade-by-trade</p>
                  </div>

                  <div className="h-68 w-full pt-2">
                    {singleStratAnalytics.cumulativeChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={singleStratAnalytics.cumulativeChartData}
                          margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="tradeIndex" tick={{ fontSize: 11, fill: '#64748b' }} unit="#" />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-lg border border-slate-700">
                                    <p className="font-bold text-slate-200">Trade #{data.tradeIndex} ({data.date})</p>
                                    <p className={`font-black ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      P&L: {formatINR(data.pnl)}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <ReferenceLine y={0} stroke="#94a3b8" />
                          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                            {singleStratAnalytics.cumulativeChartData.map((entry, index) => (
                              <Cell
                                key={`single-pnl-${index}`}
                                fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                        No trade history logged under this strategy yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Strategy Trade Log Table */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Logged Trades for "{singleStratAnalytics.strategy.name}"
                    </h3>
                    <p className="text-xs text-slate-500">
                      {singleStratAnalytics.stratTrades.length} execution logs recorded
                    </p>
                  </div>
                </div>

                {singleStratAnalytics.stratTrades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Symbol</th>
                          <th className="py-3 px-3">Segment</th>
                          <th className="py-3 px-3">Side</th>
                          <th className="py-3 px-3">Strike / Price</th>
                          <th className="py-3 px-3 text-right">Net P&L ({currencySymbol})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {singleStratAnalytics.stratTrades.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-semibold text-slate-700">{t.date}</td>
                            <td className="py-2.5 px-3 font-black text-slate-900">{t.indexOrStock || 'N/A'}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {t.segment}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  t.buyOrSell === 'Buy'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {t.buyOrSell}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{t.strikePrice || 'N/A'}</td>
                            <td
                              className={`py-2.5 px-3 text-right font-black ${
                                t.netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {formatINR(t.netPnL)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                    No trades logged under this strategy yet. Log a trade using "+ Add Trade" and select "{singleStratAnalytics.strategy.name}" as the strategy!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
              Please select a strategy from the dropdown above.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: HEAD-TO-HEAD COMPARE (2 STRATEGIES ONLY) */}
      {/* ========================================================================= */}
      {viewMode === 'compare' && compareData && (
        <div className="space-y-6">
          {/* Strategy Selection Controls for Comparison */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <GitCompare className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-black text-slate-900">
                Head-to-Head Strategy Comparison (Only 2 Strategies At One Time)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strategy A Selection Box */}
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                  <label className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                    Select Strategy A:
                  </label>
                </div>
                <select
                  value={activeCompareA}
                  onChange={(e) => setCompareStratA(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-indigo-300 font-bold text-sm bg-white text-indigo-950 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  {strategies.map((s) => (
                    <option key={`a_${s.id}`} value={s.name}>
                      {s.name} ({s.category || 'Custom'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Strategy B Selection Box */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <label className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    Select Strategy B:
                  </label>
                </div>
                <select
                  value={activeCompareB}
                  onChange={(e) => setCompareStratB(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-300 font-bold text-sm bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                >
                  {strategies.map((s) => (
                    <option key={`b_${s.id}`} value={s.name}>
                      {s.name} ({s.category || 'Custom'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Comparison Side-by-Side Metrics Table / Cards */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Head-to-Head Key Performance Benchmarks</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strategy A Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border-2 border-indigo-500/80 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md uppercase tracking-wider border border-indigo-500/30">
                      Strategy A
                    </span>
                    <h4 className="text-lg font-black text-white mt-1">{compareData.stratA.name}</h4>
                    <span className="text-xs text-slate-400">{compareData.stratA.category} • {compareData.stratA.timeframe}</span>
                  </div>
                  {compareData.winners.pnl === 'A' && (
                    <div className="p-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl flex items-center space-x-1 text-xs font-black">
                      <Trophy className="w-4 h-4 fill-amber-400" />
                      <span>Net P&L Winner</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 font-bold block">Actual Win Rate</span>
                    <span className={`text-xl font-black ${compareData.winners.winRate === 'A' ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {compareData.stratA.stats.winRate}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">{compareData.stratA.stats.wins}W / {compareData.stratA.stats.losses}L</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 font-bold block">Net P&L</span>
                    <span className={`text-xl font-black ${compareData.stratA.stats.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatINR(compareData.stratA.stats.netPnL)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{compareData.stratA.stats.totalTrades} Trades Logged</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 font-bold block">Profit Factor</span>
                    <span className={`text-lg font-black ${compareData.winners.pf === 'A' ? 'text-indigo-300' : 'text-slate-300'}`}>
                      {compareData.stratA.stats.profitFactor}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Win PnL / Loss PnL</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 font-bold block">Expectancy</span>
                    <span className="text-lg font-black text-emerald-400">
                      ₹{compareData.stratA.stats.expectancy}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Expected return / trade</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 font-bold block">Avg Win / Avg Loss</span>
                    <span className="text-xs font-bold text-slate-200">
                      +₹{Math.round(compareData.stratA.stats.avgWin)} / -{currencySymbol}{Math.round(compareData.stratA.stats.avgLoss)}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 font-bold block">Sharpe Ratio</span>
                    <span className="text-lg font-black text-blue-300">
                      {compareData.stratA.stats.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Strategy B Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border-2 border-emerald-500/80 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md uppercase tracking-wider border border-emerald-500/30">
                      Strategy B
                    </span>
                    <h4 className="text-lg font-black text-white mt-1">{compareData.stratB.name}</h4>
                    <span className="text-xs text-slate-400">{compareData.stratB.category} • {compareData.stratB.timeframe}</span>
                  </div>
                  {compareData.winners.pnl === 'B' && (
                    <div className="p-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl flex items-center space-x-1 text-xs font-black">
                      <Trophy className="w-4 h-4 fill-amber-400" />
                      <span>Net P&L Winner</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 font-bold block">Actual Win Rate</span>
                    <span className={`text-xl font-black ${compareData.winners.winRate === 'B' ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {compareData.stratB.stats.winRate}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">{compareData.stratB.stats.wins}W / {compareData.stratB.stats.losses}L</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 font-bold block">Net P&L</span>
                    <span className={`text-xl font-black ${compareData.stratB.stats.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatINR(compareData.stratB.stats.netPnL)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{compareData.stratB.stats.totalTrades} Trades Logged</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 font-bold block">Profit Factor</span>
                    <span className={`text-lg font-black ${compareData.winners.pf === 'B' ? 'text-indigo-300' : 'text-slate-300'}`}>
                      {compareData.stratB.stats.profitFactor}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Win PnL / Loss PnL</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 font-bold block">Expectancy</span>
                    <span className="text-lg font-black text-emerald-400">
                      ₹{compareData.stratB.stats.expectancy}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Expected return / trade</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 font-bold block">Avg Win / Avg Loss</span>
                    <span className="text-xs font-bold text-slate-200">
                      +₹{Math.round(compareData.stratB.stats.avgWin)} / -{currencySymbol}{Math.round(compareData.stratB.stats.avgLoss)}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 font-bold block">Sharpe Ratio</span>
                    <span className="text-lg font-black text-blue-300">
                      {compareData.stratB.stats.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cumulative Trajectory Comparison Line Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <span>Overlaid Equity Growth Trajectory (₹)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Direct trade-by-trade cumulative P&L comparison between {compareData.stratA.name} vs {compareData.stratB.name}
              </p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={compareData.comparisonTrajectory} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="tradeIndex" tick={{ fontSize: 11, fill: '#64748b' }} unit=" #" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-lg border border-slate-700 space-y-1.5">
                            <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">Trade Sequence #{data.tradeIndex}</p>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-indigo-300 font-bold">{compareData.stratA.name}:</span>
                              <span className="text-indigo-400 font-mono font-black">{formatINR(data.cumA)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-emerald-300 font-bold">{compareData.stratB.name}:</span>
                              <span className="text-emerald-400 font-mono font-black">{formatINR(data.cumB)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="cumA"
                    name={compareData.stratA.name}
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumB"
                    name={compareData.stratB.name}
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Add New Strategy Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Layers3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{strategyToEdit ? 'Edit Strategy' : 'Create Strategy'}</h3>
                    <p className="text-xs text-slate-500">{strategyToEdit ? 'Update your trading strategy details' : 'Define setup parameters and rules'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateStrategy} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Strategy Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStratName}
                    onChange={(e) => setNewStratName(e.target.value)}
                    placeholder="e.g. 5-min ORB Breakout, VWAP Rejection, CPR Scalp"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newStratCategory}
                      onChange={(e) => setNewStratCategory(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Option Buying">Option Buying</option>
                      <option value="Option Selling">Option Selling</option>
                      <option value="Scalping">Scalping</option>
                      <option value="Swing">Swing</option>
                      <option value="Price Action">Price Action</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {newStratCategory === 'Custom' && (
                      <input
                        type="text"
                        required
                        value={newStratCustomCategory}
                        onChange={(e) => setNewStratCustomCategory(e.target.value)}
                        placeholder="Enter custom category"
                        className="mt-2 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Timeframe
                    </label>
                    <input
                      type="text"
                      value={newStratTimeframe}
                      onChange={(e) => setNewStratTimeframe(e.target.value)}
                      placeholder="e.g. 1 min, 5 min, 15 min, Daily"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Win Rate (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newStratTargetWinRate}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      onChange={(e) =>
                        setNewStratTargetWinRate(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      placeholder="65"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Risk-Reward Ratio
                    </label>
                    <input
                      type="text"
                      value={newStratRiskReward}
                      onChange={(e) => setNewStratRiskReward(e.target.value)}
                      placeholder="e.g. 1:2, 1:2.5, 1:1"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={newStratDescription}
                    onChange={(e) => setNewStratDescription(e.target.value)}
                    placeholder="Brief description of entry thesis or market condition..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Execution Rules (One rule per line)
                  </label>
                  <textarea
                    rows={3}
                    value={newStratRulesText}
                    onChange={(e) => setNewStratRulesText(e.target.value)}
                    placeholder="Enter when 5-min candle closes above VWAP&#10;Set SL at swing low&#10;Trail profit after 20 points move"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    Save & Add Strategy
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Strategy Confirmation Modal Popup */}
      <AnimatePresence>
        {strategyToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
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
                    Delete Strategy Confirmation
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Are you sure you want to delete <span className="font-bold text-slate-800">"{strategyToDelete.name}"</span>?
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed font-medium">
                <span className="font-bold block text-amber-950 mb-0.5">⚠️ Permanent Action</span>
                When you delete this strategy, you cannot recover it. It will be permanently removed from Strategy Builder and from the Add Trade strategy category selection list.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStrategyToDelete(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (strategyToDelete) {
                      onDeleteStrategy(strategyToDelete.id);
                      setStrategyToDelete(null);
                    }
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Strategy</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
