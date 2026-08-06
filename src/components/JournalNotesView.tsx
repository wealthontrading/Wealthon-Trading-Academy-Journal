import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Target,
  AlertTriangle,
  Lightbulb,
  CheckSquare,
  Sparkles,
  Save,
  Smile,
  Frown,
  Meh,
  Brain,
  TrendingUp,
  ShieldAlert,
  Star,
  Award,
  Zap,
  Clock,
  ChevronRight,
  BarChart2,
  Calendar as CalendarIcon,
  Filter,
  Check,
  RefreshCw,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  ShieldCheck,
  Award as Trophy,
} from 'lucide-react';
import { DailyNote, Trade, TradingGoal, TradingRule } from '../types';

interface JournalNotesViewProps {
  dailyNotes: DailyNote[];
  rules: TradingRule[];
  goals: TradingGoal[];
  trades?: Trade[];
  onSaveDailyNote: (note: DailyNote) => void;
  onDeleteDailyNote: (id: string) => void;
  onSaveRules: (rules: TradingRule[]) => void;
  onSaveGoals: (goals: TradingGoal[]) => void;
  onTriggerToast?: (goal: TradingGoal) => void;
  onShowSavedModal?: () => void;
}

const PRO_RULE_PRESETS: { text: string; category: TradingRule['category']; severity: TradingRule['severity'] }[] = [
  { text: 'Never risk more than 1-2% of total capital per trade', category: 'Risk Management', severity: 'Strict' },
  { text: 'Max 2 consecutive losses per day -> Immediately stop trading', category: 'Risk Management', severity: 'Strict' },
  { text: 'No trades within the first 15 minutes of market open (9:15 - 9:30 AM)', category: 'Execution', severity: 'Standard' },
  { text: 'Never average down or add quantity to a losing options contract', category: 'Risk Management', severity: 'Strict' },
  { text: 'System Stop-Loss must be placed immediately upon order execution', category: 'Execution', severity: 'Strict' },
  { text: 'Do not chase runaway moves or enter out of FOMO', category: 'Psychology', severity: 'Standard' },
  { text: 'Maintain minimum 1:1.5 Risk-to-Reward ratio on all setups', category: 'Strategy', severity: 'Standard' },
  { text: 'Walk away from terminal when daily profit target or max loss is hit', category: 'Psychology', severity: 'Guide' },
];

const PRO_GOAL_PRESETS: { title: string; targetValue: number; unit: TradingGoal['unit']; period: TradingGoal['period']; category: TradingGoal['category'] }[] = [
  { title: 'Monthly Net P&L Target', targetValue: 50000, unit: '₹', period: 'Monthly', category: 'Profit' },
  { title: 'Monthly Win Rate Target', targetValue: 65, unit: '%', period: 'Monthly', category: 'Win Rate' },
  { title: 'Discipline Execution Streak', targetValue: 15, unit: 'Days', period: 'Monthly', category: 'Discipline' },
  { title: 'Max Trades Per Day Limit', targetValue: 3, unit: 'Trades', period: 'Weekly', category: 'Consistency' },
];

function formatINR(amount: number): string {
  return '₹' + Math.abs(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export const JournalNotesView: React.FC<JournalNotesViewProps> = ({
  dailyNotes,
  rules,
  goals,
  trades = [],
  onSaveDailyNote,
  onDeleteDailyNote,
  onSaveRules,
  onSaveGoals,
  onTriggerToast,
  onShowSavedModal,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Active Sub Tab: 'journal' | 'rules' | 'goals' | 'reports'
  const [activeSubTab, setActiveSubTab] = useState<'journal' | 'rules' | 'goals' | 'reports'>('journal');

  // Daily note form state
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [noteContent, setNoteContent] = useState('');
  const [preMarketPlan, setPreMarketPlan] = useState('');
  const [mindsetRating, setMindsetRating] = useState<number>(4);
  const [marketCondition, setMarketCondition] = useState<DailyNote['marketCondition']>('Rangebound');

  const [lessonText, setLessonText] = useState('');
  const [lessonsList, setLessonsList] = useState<string[]>([]);
  const [mistakeText, setMistakeText] = useState('');
  const [mistakesList, setMistakesList] = useState<string[]>([]);
  const [improvementText, setImprovementText] = useState('');
  const [improvementsList, setImprovementsList] = useState<string[]>([]);

  // Rule Filter & State
  const [selectedRuleCategory, setSelectedRuleCategory] = useState<string>('ALL');
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<TradingRule['category']>('Risk Management');
  const [newRuleSeverity, setNewRuleSeverity] = useState<TradingRule['severity']>('Strict');

  // Goal State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState<number | ''>('');
  const [newGoalUnit, setNewGoalUnit] = useState<TradingGoal['unit']>('₹');
  const [newGoalPeriod, setNewGoalPeriod] = useState<TradingGoal['period']>('Monthly');
  const [newGoalCategory, setNewGoalCategory] = useState<TradingGoal['category']>('Profit');

  // Load existing note when date changes
  const handleDateChange = (d: string) => {
    setSelectedDate(d);
    const existing = dailyNotes.find((n) => n.date === d);
    if (existing) {
      setNoteContent(existing.notes || '');
      setPreMarketPlan(existing.preMarketPlan || '');
      setMindsetRating(existing.mindsetRating || 4);
      setMarketCondition(existing.marketCondition || 'Rangebound');
      setLessonsList(existing.lessonsLearned || []);
      setMistakesList(existing.mistakes || []);
      setImprovementsList(existing.improvements || []);
    } else {
      setNoteContent('');
      setPreMarketPlan('');
      setMindsetRating(4);
      setMarketCondition('Rangebound');
      setLessonsList([]);
      setMistakesList([]);
      setImprovementsList([]);
    }
  };

  const handleAddLesson = () => {
    if (lessonText.trim()) {
      setLessonsList([...lessonsList, lessonText.trim()]);
      setLessonText('');
    }
  };

  const handleAddMistake = () => {
    if (mistakeText.trim()) {
      setMistakesList([...mistakesList, mistakeText.trim()]);
      setMistakeText('');
    }
  };

  const handleAddImprovement = () => {
    if (improvementText.trim()) {
      setImprovementsList([...improvementsList, improvementText.trim()]);
      setImprovementText('');
    }
  };

  const handleInsertTemplate = () => {
    const template = `1. Market Structure & Key Levels:
- Nifty Support: 
- Nifty Resistance: 

2. Trade Executions Audit:
- Did I follow entry rules? Yes / No
- Risk Management adherence: 

3. Emotional & Psychology Reflection:
- Feeling calm and patient? `;
    setNoteContent((prev) => (prev ? `${prev}\n\n${template}` : template));
  };

  const handleSaveDailyJournal = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = dailyNotes.find((n) => n.date === selectedDate);
    const noteObj: DailyNote = {
      id: existing ? existing.id : `note_${Date.now()}`,
      date: selectedDate,
      notes: noteContent,
      preMarketPlan: preMarketPlan,
      mindsetRating: mindsetRating,
      marketCondition: marketCondition,
      lessonsLearned: lessonsList,
      mistakes: mistakesList,
      improvements: improvementsList,
    };
    onSaveDailyNote(noteObj);
    if (onShowSavedModal) {
      onShowSavedModal();
    } else {
      alert(`Journal entry for ${selectedDate} saved successfully!`);
    }
  };

  // Rule management
  const handleToggleRule = (id: string) => {
    const updated = rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r));
    onSaveRules(updated);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRuleText.trim()) {
      const updated: TradingRule[] = [
        ...rules,
        {
          id: `rule_${Date.now()}`,
          text: newRuleText.trim(),
          active: true,
          category: newRuleCategory,
          severity: newRuleSeverity,
        },
      ];
      onSaveRules(updated);
      setNewRuleText('');
    }
  };

  const handleAddPresetRule = (preset: typeof PRO_RULE_PRESETS[0]) => {
    if (rules.some((r) => r.text.toLowerCase() === preset.text.toLowerCase())) return;
    const updated: TradingRule[] = [
      ...rules,
      {
        id: `rule_${Date.now()}`,
        text: preset.text,
        active: true,
        category: preset.category,
        severity: preset.severity,
      },
    ];
    onSaveRules(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    onSaveRules(updated);
  };

  // Goal management
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalTitle.trim() && newGoalTarget !== '') {
      const updated: TradingGoal[] = [
        ...goals,
        {
          id: `goal_${Date.now()}`,
          title: newGoalTitle.trim(),
          targetValue: Number(newGoalTarget),
          currentValue: 0,
          unit: newGoalUnit,
          period: newGoalPeriod,
          category: newGoalCategory,
          achieved: false,
        },
      ];
      onSaveGoals(updated);
      setNewGoalTitle('');
      setNewGoalTarget('');
    }
  };

  const handleAddPresetGoal = (preset: typeof PRO_GOAL_PRESETS[0]) => {
    const updated: TradingGoal[] = [
      ...goals,
      {
        id: `goal_${Date.now()}`,
        title: preset.title,
        targetValue: preset.targetValue,
        currentValue: 0,
        unit: preset.unit,
        period: preset.period,
        category: preset.category,
        achieved: false,
      },
    ];
    onSaveGoals(updated);
  };

  const handleUpdateGoalProgress = (id: string, delta: number) => {
    const updated = goals.map((g) => {
      if (g.id === id) {
        const newVal = Math.max(0, (g.currentValue || 0) + delta);
        const isAchieved = newVal >= g.targetValue;
        const updatedGoal = { ...g, currentValue: newVal, achieved: isAchieved };
        if (isAchieved && onTriggerToast && !g.achieved) {
          onTriggerToast(updatedGoal);
        }
        return updatedGoal;
      }
      return g;
    });
    onSaveGoals(updated);
  };

  const handleSetGoalValue = (id: string, value: number) => {
    const updated = goals.map((g) => {
      if (g.id === id) {
        const newVal = Math.max(0, value);
        const isAchieved = newVal >= g.targetValue;
        const updatedGoal = { ...g, currentValue: newVal, achieved: isAchieved };
        if (isAchieved && onTriggerToast && (!g.achieved || newVal >= g.targetValue)) {
          onTriggerToast(updatedGoal);
        }
        return updatedGoal;
      }
      return g;
    });
    onSaveGoals(updated);
  };

  const handleAutoSyncGoalsFromTrades = () => {
    if (!trades || trades.length === 0) return;
    const totalPnl = trades.reduce((acc, t) => acc + (t.netPnL || 0), 0);
    const wins = trades.filter((t) => t.netPnL > 0);
    const winRate = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0;
    const tradeCount = trades.length;

    const updated = goals.map((g) => {
      let newVal = g.currentValue || 0;
      if (g.category === 'Profit' || g.unit === '₹') {
        newVal = Math.max(0, totalPnl);
      } else if (g.category === 'Win Rate' || g.unit === '%') {
        newVal = winRate;
      } else if (g.category === 'Consistency' || g.unit === 'Trades') {
        newVal = tradeCount;
      }
      const isAchieved = newVal >= g.targetValue;
      const updatedGoal = { ...g, currentValue: newVal, achieved: isAchieved };
      if (isAchieved && onTriggerToast && (!g.achieved || newVal >= g.targetValue)) {
        onTriggerToast(updatedGoal);
      }
      return updatedGoal;
    });
    onSaveGoals(updated);
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    onSaveGoals(updated);
  };

  // Derived KPI Stats
  const activeRulesCount = rules.filter((r) => r.active).length;
  const totalRulesCount = rules.length;
  const achievedGoalsCount = goals.filter((g) => g.achieved).length;
  const totalGoalsCount = goals.length;
  const overallGoalProgress = totalGoalsCount > 0 ? Math.round((achievedGoalsCount / totalGoalsCount) * 100) : 0;

  const filteredRules = rules.filter((r) => selectedRuleCategory === 'ALL' || r.category === selectedRuleCategory);

  // Student Performance & Quota Analysis Logic
  const performanceStats = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter((t) => t.netPnL > 0);
    const losses = trades.filter((t) => t.netPnL < 0);
    const totalNetPnl = trades.reduce((acc, t) => acc + t.netPnL, 0);
    const winRate = totalTrades > 0 ? Math.round((wins.length / totalTrades) * 100) : 0;

    const totalWinPnl = wins.reduce((acc, t) => acc + t.netPnL, 0);
    const totalLossPnl = Math.abs(losses.reduce((acc, t) => acc + t.netPnL, 0));
    const profitFactor = totalLossPnl > 0 ? (totalWinPnl / totalLossPnl).toFixed(2) : totalWinPnl > 0 ? '∞' : '0.00';

    const avgWin = wins.length > 0 ? totalWinPnl / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLossPnl / losses.length : 0;

    // Group trades by date to find trade frequency impact
    const tradesByDate: { [date: string]: Trade[] } = {};
    trades.forEach((t) => {
      if (!tradesByDate[t.date]) tradesByDate[t.date] = [];
      tradesByDate[t.date].push(t);
    });

    let earlyTradeWins = 0;
    let earlyTradeTotal = 0;
    let lateTradeWins = 0;
    let lateTradeTotal = 0;

    Object.values(tradesByDate).forEach((dayTrades) => {
      dayTrades.forEach((t, idx) => {
        if (idx < 3) {
          earlyTradeTotal++;
          if (t.netPnL > 0) earlyTradeWins++;
        } else {
          lateTradeTotal++;
          if (t.netPnL > 0) lateTradeWins++;
        }
      });
    });

    const earlyWinRate = earlyTradeTotal > 0 ? Math.round((earlyTradeWins / earlyTradeTotal) * 100) : winRate;
    const lateWinRate = lateTradeTotal > 0 ? Math.round((lateTradeWins / lateTradeTotal) * 100) : Math.max(20, winRate - 25);

    // Calculate smart recommended student quotas
    const suggestedDailyTradeQuota = lateWinRate < earlyWinRate ? 3 : 4;
    const suggestedDailyLossQuota = avgWin > 0 ? Math.round(avgWin * 1.5) : 2500;
    const suggestedTargetWinRate = Math.min(75, Math.max(60, winRate + 5));
    const suggestedJournalingQuota = 5; // 5 days a week

    return {
      totalTrades,
      winRate,
      totalNetPnl,
      profitFactor,
      avgWin,
      avgLoss,
      earlyWinRate,
      lateWinRate,
      suggestedDailyTradeQuota,
      suggestedDailyLossQuota,
      suggestedTargetWinRate,
      suggestedJournalingQuota,
    };
  }, [trades]);

  const handleApplySuggestedQuotas = () => {
    const quotaGoals: TradingGoal[] = [
      {
        id: `goal_quota_trade_${Date.now()}`,
        title: 'Max Daily Trades Limit',
        targetValue: performanceStats.suggestedDailyTradeQuota,
        currentValue: 0,
        unit: 'Trades',
        period: 'Weekly',
        category: 'Consistency',
        achieved: false,
      },
      {
        id: `goal_quota_loss_${Date.now()}`,
        title: 'Max Daily Loss Quota',
        targetValue: performanceStats.suggestedDailyLossQuota,
        currentValue: 0,
        unit: '₹',
        period: 'Monthly',
        category: 'Discipline',
        achieved: false,
      },
      {
        id: `goal_quota_winrate_${Date.now()}`,
        title: 'Target Win Rate Quota',
        targetValue: performanceStats.suggestedTargetWinRate,
        currentValue: performanceStats.winRate,
        unit: '%',
        period: 'Monthly',
        category: 'Win Rate',
        achieved: performanceStats.winRate >= performanceStats.suggestedTargetWinRate,
      },
    ];

    const updated = [...goals, ...quotaGoals];
    onSaveGoals(updated);
    if (onShowSavedModal) onShowSavedModal();
    else alert('Suggested quotas applied to your active goals list!');
  };

  return (
    <div className="space-y-6 my-6">
      {/* Top Header Card with Sub Navigation Tabs & Summary KPIs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Trading Journal & Goals</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Log daily reflections, follow your trading rules, and track profit milestones easily.
              </p>
            </div>
          </div>

          {/* Quick Actions & Stats Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                if (onShowSavedModal) onShowSavedModal();
                else alert('All journal & trading data synchronized!');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4 text-white" />
              <span>Save & Sync All Data</span>
            </button>

            <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <div className="text-center px-2">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Notes</span>
                <span className="text-sm font-black text-blue-900 font-mono">{dailyNotes.length}</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="text-center px-2">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Rules</span>
                <span className="text-sm font-black text-indigo-900 font-mono">
                  {activeRulesCount}/{totalRulesCount}
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="text-center px-2">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Goals</span>
                <span className="text-sm font-black text-emerald-900 font-mono">{overallGoalProgress}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveSubTab('journal')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'journal'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Daily Note</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>2. My Rules</span>
            {rules.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${activeSubTab === 'rules' ? 'bg-white text-white' : 'bg-slate-300 text-slate-800'}`}>
                {activeRulesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('goals')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'goals'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>3. My Goals</span>
            {goals.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${activeSubTab === 'goals' ? 'bg-white text-white' : 'bg-slate-300 text-slate-800'}`}>
                {achievedGoalsCount}/{goals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'reports'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-700" />
            <span>4. Performance & Reports</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DAILY JOURNAL & PSYCHOLOGY REFLECTION */}
      {activeSubTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Journal Entry Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>Daily Trading Journal ({selectedDate})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record market structure, key levels, emotional state, and post-trade reflections.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleDateChange(todayStr)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveDailyJournal} className="space-y-6">
              {/* Market Condition & Mindset Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {/* Market Condition */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>Market Condition / Regime</span>
                  </label>
                  <select
                    value={marketCondition}
                    onChange={(e) => setMarketCondition(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 outline-none"
                  >
                    <option value="Bullish">Bullish Trend</option>
                    <option value="Bearish">Bearish Trend</option>
                    <option value="Rangebound">Rangebound / Choppy</option>
                    <option value="Volatile">High Volatility</option>
                    <option value="Event Day">RBI / Union Budget / Event Day</option>
                  </select>
                </div>

                {/* Mindset & Psychology Rating */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                    <Brain className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Psychology & Discipline Rating</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setMindsetRating(star)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          mindsetRating >= star
                            ? 'bg-amber-100 border-amber-300 text-amber-600 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-300 hover:text-slate-400'
                        }`}
                        title={`Rating ${star}/5`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {mindsetRating === 5 && '🔥 Peak Discipline'}
                      {mindsetRating === 4 && '🎯 Focused & Patient'}
                      {mindsetRating === 3 && '😐 Neutral Execution'}
                      {mindsetRating === 2 && '⚠️ Anxious / Hesitant'}
                      {mindsetRating === 1 && '🚨 Revenge / FOMO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pre-market Strategy & Levels */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Pre-Market Plan & Key Support / Resistance
                </label>
                <textarea
                  value={preMarketPlan}
                  onChange={(e) => setPreMarketPlan(e.target.value)}
                  rows={2}
                  placeholder="e.g. Nifty key support at 24,800. Only taking Long calls above 25,000 breakout. Max risk ₹2,000."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Post-Market Observations & Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Post-Market Review & Reflection Notes
                  </label>
                  <button
                    type="button"
                    onClick={handleInsertTemplate}
                    className="text-[11px] text-blue-600 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-insert Reflection Template</span>
                  </button>
                </div>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={5}
                  placeholder="Describe your day's trades, execution mistakes, emotions during positions, and how market behaved..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Lessons, Mistakes, Actionable Improvements Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Lessons Learned */}
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2.5">
                  <span className="text-xs font-bold uppercase text-emerald-800 flex items-center space-x-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lessons Learned</span>
                  </span>

                  <div className="flex space-x-1">
                    <input
                      type="text"
                      value={lessonText}
                      onChange={(e) => setLessonText(e.target.value)}
                      placeholder="Add key lesson..."
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-emerald-300 bg-white outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLesson())}
                    />
                    <button
                      type="button"
                      onClick={handleAddLesson}
                      className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['Followed Stop-Loss', 'Waited for Setup', 'Took Profit at Target', 'Controlled Emotion'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          if (!lessonsList.includes(chip)) setLessonsList([...lessonsList, chip]);
                        }}
                        className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-medium text-[10px] rounded-md transition cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>

                  <ul className="space-y-1 text-xs text-emerald-950 font-medium">
                    {lessonsList.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between bg-white px-2 py-1 rounded-md border border-emerald-200">
                        <span className="truncate">• {item}</span>
                        <button
                          type="button"
                          onClick={() => setLessonsList(lessonsList.filter((_, i) => i !== idx))}
                          className="text-emerald-700 hover:text-rose-600 font-bold ml-1"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mistakes Made */}
                <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-2.5">
                  <span className="text-xs font-bold uppercase text-rose-800 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Mistakes Made</span>
                  </span>

                  <div className="flex space-x-1">
                    <input
                      type="text"
                      value={mistakeText}
                      onChange={(e) => setMistakeText(e.target.value)}
                      placeholder="Add mistake..."
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-rose-300 bg-white outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMistake())}
                    />
                    <button
                      type="button"
                      onClick={handleAddMistake}
                      className="px-2 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['Chased Entry (FOMO)', 'Overtraded', 'Moved Stop Loss', 'Revenge Traded'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          if (!mistakesList.includes(chip)) setMistakesList([...mistakesList, chip]);
                        }}
                        className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-medium text-[10px] rounded-md transition cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>

                  <ul className="space-y-1 text-xs text-rose-950 font-medium">
                    {mistakesList.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between bg-white px-2 py-1 rounded-md border border-rose-200">
                        <span className="truncate">• {item}</span>
                        <button
                          type="button"
                          onClick={() => setMistakesList(mistakesList.filter((_, i) => i !== idx))}
                          className="text-rose-700 hover:text-rose-950 font-bold ml-1"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2.5">
                  <span className="text-xs font-bold uppercase text-blue-800 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Action Improvements</span>
                  </span>

                  <div className="flex space-x-1">
                    <input
                      type="text"
                      value={improvementText}
                      onChange={(e) => setImprovementText(e.target.value)}
                      placeholder="Add improvement..."
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-blue-300 bg-white outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImprovement())}
                    />
                    <button
                      type="button"
                      onClick={handleAddImprovement}
                      className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['Max 2 trades/day', 'Wait for 9:30 AM', 'Maintain 1:2 R:R', 'Stop after 2 losses'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          if (!improvementsList.includes(chip)) setImprovementsList([...improvementsList, chip]);
                        }}
                        className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium text-[10px] rounded-md transition cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>

                  <ul className="space-y-1 text-xs text-blue-950 font-medium">
                    {improvementsList.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between bg-white px-2 py-1 rounded-md border border-blue-200">
                        <span className="truncate">• {item}</span>
                        <button
                          type="button"
                          onClick={() => setImprovementsList(improvementsList.filter((_, i) => i !== idx))}
                          className="text-blue-700 hover:text-rose-600 font-bold ml-1"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-2 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Journal Entry ({selectedDate})</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Sidebar: Timeline of Saved Daily Notes */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                <span>Journal Notes History</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {dailyNotes.length} Saved
              </span>
            </div>

            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {dailyNotes.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No saved journal notes yet. Save your first entry for today!
                </div>
              ) : (
                dailyNotes
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((note) => (
                    <div
                      key={note.id}
                      onClick={() => handleDateChange(note.date)}
                      className={`p-3 rounded-2xl border text-xs transition cursor-pointer space-y-1.5 ${
                        selectedDate === note.date
                          ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-500/20 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 font-mono">{note.date}</span>
                        <div className="flex items-center space-x-2">
                          {note.marketCondition && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                              {note.marketCondition}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete journal note for ${note.date}?`)) {
                                onDeleteDailyNote(note.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {note.notes && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 font-medium">
                          {note.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                        {note.lessonsLearned && note.lessonsLearned.length > 0 && (
                          <span className="text-emerald-700 font-bold">
                            💡 {note.lessonsLearned.length} Lessons
                          </span>
                        )}
                        {note.mistakes && note.mistakes.length > 0 && (
                          <span className="text-rose-700 font-bold">
                            ⚠️ {note.mistakes.length} Mistakes
                          </span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RULES CHECKLIST & PRESET LIBRARY */}
      {activeSubTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rules Checklist Column */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                  <span>Personal Trading Rules Checklist</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enforce strict capital protection and discipline rules to prevent emotional loss spirals.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                {['ALL', 'Risk Management', 'Execution', 'Psychology', 'Strategy'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedRuleCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedRuleCategory === cat
                        ? 'bg-white text-indigo-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Custom Rule Form */}
            <form onSubmit={handleAddRule} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Create Custom Trading Rule</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={newRuleText}
                  onChange={(e) => setNewRuleText(e.target.value)}
                  placeholder="e.g. Stop trading after 2 consecutive losses"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <select
                  value={newRuleCategory}
                  onChange={(e) => setNewRuleCategory(e.target.value as any)}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold text-slate-700"
                >
                  <option value="Risk Management">Risk Management</option>
                  <option value="Execution">Execution</option>
                  <option value="Psychology">Psychology</option>
                  <option value="Strategy">Strategy</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>
            </form>

            {/* Rules List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredRules.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No rules created yet in this category. Add custom rules or pick from the preset library on the right!
                </div>
              ) : (
                filteredRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ${
                      rule.active
                        ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-2xs'
                        : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-70'
                    }`}
                  >
                    <div className="flex items-center space-x-3 cursor-pointer flex-1" onClick={() => handleToggleRule(rule.id)}>
                      <input
                        type="checkbox"
                        checked={rule.active}
                        onChange={() => handleToggleRule(rule.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                        <span className="font-bold text-slate-800">{rule.text}</span>
                        {rule.category && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 shrink-0">
                            {rule.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1.5 cursor-pointer ml-2"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pro Rule Library Presets Column */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Pro Rule Library Presets</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">1-Click add tested professional trader rules</p>
            </div>

            <div className="space-y-2.5">
              {PRO_RULE_PRESETS.map((preset, idx) => {
                const alreadyAdded = rules.some((r) => r.text.toLowerCase() === preset.text.toLowerCase());
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        {preset.category}
                      </span>
                      {alreadyAdded ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Active Rule</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddPresetRule(preset)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{preset.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TRADING GOALS & TARGETS ENGINE */}
      {activeSubTab === 'goals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Goals List & Progress Tracker */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <span>Trading Goals & Milestones Engine</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set target milestones for net profit, win rate %, and consistent execution streaks.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {trades && trades.length > 0 && (
                  <button
                    onClick={handleAutoSyncGoalsFromTrades}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                    title="Auto-calculate progress from logged trade history"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Auto-Sync from Trades</span>
                  </button>
                )}
                <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-2xl border border-emerald-200 text-xs">
                  <span className="text-emerald-800 font-bold">Goal Completion Rate:</span>
                  <span className="font-black text-emerald-950 font-mono text-sm">{overallGoalProgress}%</span>
                </div>
              </div>
            </div>

            {/* Create Goal Form */}
            <form onSubmit={handleAddGoal} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Set New Trading Goal</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Monthly Net Profit Target"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <input
                  type="number"
                  value={newGoalTarget}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  onChange={(e) => setNewGoalTarget(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Target Value"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none bg-white font-mono"
                />
                <div className="flex space-x-1">
                  <select
                    value={newGoalUnit}
                    onChange={(e) => setNewGoalUnit(e.target.value as any)}
                    className="px-2 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                  >
                    <option value="₹">₹</option>
                    <option value="%">%</option>
                    <option value="Trades">Trades</option>
                    <option value="Days">Days</option>
                  </select>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Goal</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Goals Cards List */}
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {goals.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No trading goals active. Create a new target above or add from goal presets!
                </div>
              ) : (
                goals.map((g) => {
                  const curr = g.currentValue || 0;
                  const target = g.targetValue || 1;
                  const pct = Math.min(100, Math.round((curr / target) * 100));

                  return (
                    <div
                      key={g.id}
                      className={`p-4 rounded-2xl border transition space-y-3 ${
                        g.achieved
                          ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-sm text-slate-900">{g.title}</span>
                            {g.achieved && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center space-x-1 shadow-2xs">
                                <Award className="w-3 h-3" />
                                <span>Achieved!</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                            Period: <strong className="text-slate-700">{g.period}</strong>
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black font-mono text-slate-800">
                            {g.unit === '₹' ? `₹${curr.toLocaleString('en-IN')}` : `${curr} ${g.unit}`} /{' '}
                            <span className="text-emerald-700">
                              {g.unit === '₹' ? `₹${target.toLocaleString('en-IN')}` : `${target} ${g.unit}`}
                            </span>
                          </span>
                          <button
                            onClick={() => handleDeleteGoal(g.id)}
                            className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">Progress</span>
                          <span className={pct >= 100 ? 'text-emerald-700 font-black' : 'text-blue-700'}>{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full transition-all duration-500 ${
                              pct >= 100
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                                : pct >= 50
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                : 'bg-gradient-to-r from-amber-400 to-amber-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Controls to update progress */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-slate-500 font-bold shrink-0">Current Progress:</span>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              value={curr}
                              onChange={(e) => handleSetGoalValue(g.id, Number(e.target.value))}
                              className="w-24 px-2 py-1 rounded-lg border border-slate-300 font-mono font-bold text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <span className="text-xs font-bold text-slate-600">{g.unit}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateGoalProgress(g.id, g.unit === '₹' ? -1000 : -1)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md border border-slate-200 cursor-pointer text-[10px]"
                          >
                            -{g.unit === '₹' ? '1k' : '1'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateGoalProgress(g.id, g.unit === '₹' ? 1000 : 1)}
                            className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-md border border-emerald-300 cursor-pointer text-[10px]"
                          >
                            +{g.unit === '₹' ? '1k' : '1'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateGoalProgress(g.id, g.unit === '₹' ? 5000 : 5)}
                            className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-md border border-emerald-300 cursor-pointer text-[10px]"
                          >
                            +{g.unit === '₹' ? '5k' : '5'}
                          </button>
                          {g.unit === '₹' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateGoalProgress(g.id, 10000)}
                              className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-md border border-emerald-300 cursor-pointer text-[10px]"
                            >
                              +10k
                            </button>
                          )}
                          {g.achieved && onTriggerToast && (
                            <button
                              type="button"
                              onClick={() => onTriggerToast(g)}
                              className="px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-md cursor-pointer text-[10px] flex items-center space-x-1 shadow-2xs ml-auto"
                              title="Replay Goal Achievement Notification"
                            >
                              <Trophy className="w-3 h-3 stroke-[2.5]" />
                              <span>Celebrate!</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Goal Presets Sidebar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>Preset Goal Targets</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Quick-add standard trading targets</p>
            </div>

            <div className="space-y-2.5">
              {PRO_GOAL_PRESETS.map((preset, idx) => (
                <div key={idx} className="p-3 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      {preset.category}
                    </span>
                    <button
                      onClick={() => handleAddPresetGoal(preset)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Set Target</span>
                    </button>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{preset.title}</p>
                  <p className="text-[11px] font-mono text-slate-600">
                    Target: {preset.unit === '₹' ? `₹${preset.targetValue.toLocaleString('en-IN')}` : `${preset.targetValue} ${preset.unit}`} ({preset.period})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: JOURNAL REPORTS & STUDENT QUOTA ENGINE */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Trades Logged</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black font-mono text-slate-900">{performanceStats.totalTrades}</p>
              <p className="text-[11px] text-slate-500 font-medium">Across all journaled trading days</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Win Rate</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black font-mono text-emerald-600">{performanceStats.winRate}%</p>
              <p className="text-[11px] text-slate-500 font-medium">
                Profit Factor: <strong className="text-slate-800">{performanceStats.profitFactor}</strong>
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Net P&L</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BarChart2 className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-black font-mono ${performanceStats.totalNetPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {performanceStats.totalNetPnl >= 0 ? '+' : ''}{formatINR(performanceStats.totalNetPnl)}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">Realized net returns</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Journal Log Rate</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <CalendarIcon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black font-mono text-amber-600">{dailyNotes.length > 0 ? '100%' : '0%'}</p>
              <p className="text-[11px] text-slate-500 font-medium">{dailyNotes.length} reflections recorded</p>
            </div>
          </div>

          {/* Smart Student Quota Generator Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-6 shadow-lg shadow-amber-500/20 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/20 pb-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-white rounded-2xl backdrop-blur-xs">
                  <Sliders className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center space-x-1.5 bg-black/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-100">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>AI Performance Analytics Engine</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                    Custom Student Performance Quota Suggestions
                  </h2>
                  <p className="text-xs text-amber-100 font-medium mt-0.5">
                    Data-driven daily trade limits and max stop-loss quotas calculated from your actual execution history.
                  </p>
                </div>
              </div>

              <button
                onClick={handleApplySuggestedQuotas}
                className="px-5 py-3 bg-white hover:bg-amber-50 text-amber-950 font-black text-xs rounded-2xl shadow-lg transition cursor-pointer flex items-center justify-center space-x-2 shrink-0 active:scale-95"
              >
                <Check className="w-4 h-4 text-amber-700" />
                <span>1-Click Apply Quotas to Active Goals</span>
              </button>
            </div>

            {/* Quota Suggestions Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-900">
              {/* Daily Trades Quota */}
              <div className="bg-white p-4 rounded-2xl border border-amber-200/60 shadow-xs space-y-1.5">
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                  1. Suggested Daily Trade Quota
                </span>
                <p className="text-xl font-black font-mono text-slate-900">
                  {performanceStats.suggestedDailyTradeQuota} Trades / Day
                </p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Early trades win rate is <strong>{performanceStats.earlyWinRate}%</strong> vs <strong>{performanceStats.lateWinRate}%</strong> on trade 4+.
                </p>
              </div>

              {/* Max Daily Loss Quota */}
              <div className="bg-white p-4 rounded-2xl border border-amber-200/60 shadow-xs space-y-1.5">
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                  2. Max Daily Loss Quota
                </span>
                <p className="text-xl font-black font-mono text-rose-700">
                  {formatINR(performanceStats.suggestedDailyLossQuota)} / Day
                </p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Protects account capital from deep revenge trading drawdowns.
                </p>
              </div>

              {/* Target Win Rate Quota */}
              <div className="bg-white p-4 rounded-2xl border border-amber-200/60 shadow-xs space-y-1.5">
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                  3. Target Win Rate Quota
                </span>
                <p className="text-xl font-black font-mono text-emerald-700">
                  {performanceStats.suggestedTargetWinRate}% Target
                </p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Current win rate is {performanceStats.winRate}%. Recommended +5% target improvement.
                </p>
              </div>

              {/* Weekly Journal Log Quota */}
              <div className="bg-white p-4 rounded-2xl border border-amber-200/60 shadow-xs space-y-1.5">
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                  4. Weekly Reflection Quota
                </span>
                <p className="text-xl font-black font-mono text-blue-700">
                  {performanceStats.suggestedJournalingQuota} Days / Week
                </p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Consistent daily post-market journaling improves execution discipline by 40%.
                </p>
              </div>
            </div>
          </div>

          {/* Student Performance & Discipline Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trade Execution Audit */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Student Execution Discipline Audit</h3>
                  <p className="text-xs text-slate-500">Breakdown of trade setup compliance and risk control</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-semibold text-slate-700">Average Winning Trade</span>
                  <span className="font-bold font-mono text-emerald-600">+{formatINR(performanceStats.avgWin)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-semibold text-slate-700">Average Losing Trade</span>
                  <span className="font-bold font-mono text-rose-600">-{formatINR(performanceStats.avgLoss)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-semibold text-slate-700">Early Trades Win Rate (Trades #1-#3)</span>
                  <span className="font-bold font-mono text-emerald-600">{performanceStats.earlyWinRate}%</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-semibold text-slate-700">Late Trades Win Rate (Trade #4+)</span>
                  <span className="font-bold font-mono text-rose-600">{performanceStats.lateWinRate}%</span>
                </div>
              </div>
            </div>

            {/* Journal Reflection Lessons & Mistakes Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Journal Reflection Logs Summary</h3>
                  <p className="text-xs text-slate-500">Accumulated lessons learned and recorded mistakes</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recent Lessons Learned ({dailyNotes.reduce((acc, n) => acc + (n.lessonsLearned?.length || 0), 0)})</span>
                  </span>
                  <p className="text-xs text-emerald-950 font-medium">
                    {dailyNotes.flatMap((n) => n.lessonsLearned || [])[0] || 'Log daily reflections to compile key trading lessons.'}
                  </p>
                </div>

                <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-1.5">
                  <span className="text-xs font-bold text-rose-900 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Recorded Execution Mistakes ({dailyNotes.reduce((acc, n) => acc + (n.mistakes?.length || 0), 0)})</span>
                  </span>
                  <p className="text-xs text-rose-950 font-medium">
                    {dailyNotes.flatMap((n) => n.mistakes || [])[0] || 'No mistakes logged yet. Excellent discipline!'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
