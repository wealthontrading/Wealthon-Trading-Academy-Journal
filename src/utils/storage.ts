import { DEFAULT_GOALS, DEFAULT_STRATEGY_ITEMS, DEFAULT_TRADING_RULES } from '../data/constants';
import { DailyNote, ExecutionMode, StrategyItem, Trade, TraderProfile, TradingGoal, TradingRule, Withdrawal } from '../types';
import {
  deleteTradeFromFirestore,
  saveDailyNoteToFirestore,
  saveProfileToFirestore,
  saveStrategyToFirestore,
  saveTradeToFirestore,
  deleteStrategyFromFirestore,
  deleteDailyNoteFromFirestore,
  saveRuleToFirestore,
  saveGoalToFirestore,
} from './firebaseSync';

const STORAGE_KEYS = {
  PROFILE: 'trading_journal_profile',
  TRADES: 'trading_journal_trades',
  DAILY_NOTES: 'trading_journal_daily_notes',
  RULES: 'trading_journal_rules',
  GOALS: 'trading_journal_goals',
  WITHDRAWALS: 'trading_journal_withdrawals',
  STRATEGIES: 'trading_journal_strategies',
};

function getScopedKey(baseKey: string, userEmail?: string): string {
  if (!userEmail) return baseKey;
  const cleanEmail = userEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${baseKey}_${cleanEmail}`;
}

// Profile
export function getStoredProfile(userEmail?: string): TraderProfile {
  const key = getScopedKey(STORAGE_KEYS.PROFILE, userEmail);
  const data = localStorage.getItem(key);
  if (!data) {
    return {
      name: '',
      platform: '',
      instituteName: 'WealthOn Trading Academy',
      isFirstLaunchCompleted: false,
      theme: 'light',
    };
  }
  try {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      instituteName: parsed.instituteName || 'WealthOn Trading Academy',
    };
  } catch {
    return {
      name: '',
      platform: '',
      instituteName: 'WealthOn Trading Academy',
      isFirstLaunchCompleted: false,
      theme: 'light',
    };
  }
}

export function saveStoredProfile(profile: TraderProfile, userEmail?: string): void {
  const key = getScopedKey(STORAGE_KEYS.PROFILE, userEmail);
  localStorage.setItem(key, JSON.stringify(profile));
  saveProfileToFirestore(profile, userEmail);
}

// Trades
export function getStoredTrades(userEmail?: string): Trade[] {
  const key = getScopedKey(STORAGE_KEYS.TRADES, userEmail);
  const data = localStorage.getItem(key);
  if (!data) {
    return [];
  }
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveStoredTrades(trades: Trade[], userEmail?: string): void {
  const key = getScopedKey(STORAGE_KEYS.TRADES, userEmail);
  localStorage.setItem(key, JSON.stringify(trades));
}

export function addTrade(trade: Omit<Trade, 'id' | 'createdAt'>, userEmail?: string): Trade {
  const trades = getStoredTrades(userEmail);
  const newTrade: Trade = {
    ...trade,
    id: 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    createdAt: Date.now(),
  };
  const updated = [newTrade, ...trades];
  saveStoredTrades(updated, userEmail);
  saveTradeToFirestore(newTrade, userEmail);
  return newTrade;
}

export function updateTrade(id: string, updatedFields: Partial<Trade>, userEmail?: string): Trade[] {
  const trades = getStoredTrades(userEmail);
  const updated = trades.map((t) => (t.id === id ? { ...t, ...updatedFields } : t));
  saveStoredTrades(updated, userEmail);
  const matched = updated.find((t) => t.id === id);
  if (matched) {
    saveTradeToFirestore(matched, userEmail);
  }
  return updated;
}

export function deleteTrade(id: string, userEmail?: string): Trade[] {
  const trades = getStoredTrades(userEmail);
  const updated = trades.filter((t) => t.id !== id);
  saveStoredTrades(updated, userEmail);
  deleteTradeFromFirestore(id);
  return updated;
}

// Daily Notes
export function getStoredDailyNotes(userEmail?: string): DailyNote[] {
  const key = getScopedKey(STORAGE_KEYS.DAILY_NOTES, userEmail);
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveStoredDailyNotes(notes: DailyNote[], userEmail?: string): void {
  const key = getScopedKey(STORAGE_KEYS.DAILY_NOTES, userEmail);
  localStorage.setItem(key, JSON.stringify(notes));
  if (Array.isArray(notes)) {
    notes.forEach((note) => saveDailyNoteToFirestore(note, userEmail));
  }
}

// Trading Rules
export function getStoredRules(userEmail?: string): TradingRule[] {
  const key = getScopedKey(STORAGE_KEYS.RULES, userEmail);
  const data = localStorage.getItem(key);
  if (!data) {
    const defaults = DEFAULT_TRADING_RULES.map((text, idx) => ({
      id: `rule_${idx + 1}`,
      text,
      active: true,
    }));
    saveStoredRules(defaults, userEmail);
    return defaults;
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveStoredRules(rules: TradingRule[], userEmail?: string): void {
  const key = getScopedKey(STORAGE_KEYS.RULES, userEmail);
  localStorage.setItem(key, JSON.stringify(rules));
  if (Array.isArray(rules)) {
    rules.forEach((rule) => saveRuleToFirestore(rule, userEmail));
  }
}

// Trading Goals
export function getStoredGoals(userEmail?: string): TradingGoal[] {
  const key = getScopedKey(STORAGE_KEYS.GOALS, userEmail);
  const data = localStorage.getItem(key);
  if (!data) {
    saveStoredGoals(DEFAULT_GOALS, userEmail);
    return DEFAULT_GOALS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_GOALS;
  }
}

export function saveStoredGoals(goals: TradingGoal[], userEmail?: string): void {
  const key = getScopedKey(STORAGE_KEYS.GOALS, userEmail);
  localStorage.setItem(key, JSON.stringify(goals));
  if (Array.isArray(goals)) {
    goals.forEach((goal) => saveGoalToFirestore(goal, userEmail));
  }
}

// Profit Withdrawals
export function getStoredWithdrawals(userEmail?: string): Withdrawal[] {
  const key = getScopedKey(STORAGE_KEYS.WITHDRAWALS, userEmail);
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredWithdrawals(withdrawals: Withdrawal[], userEmail?: string): void {
  const key = getScopedKey(STORAGE_KEYS.WITHDRAWALS, userEmail);
  localStorage.setItem(key, JSON.stringify(withdrawals));
}

export function addWithdrawal(withdrawal: Omit<Withdrawal, 'id' | 'createdAt'>, userEmail?: string): Withdrawal {
  const list = getStoredWithdrawals(userEmail);
  const newWithdrawal: Withdrawal = {
    ...withdrawal,
    id: 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    createdAt: Date.now(),
  };
  const updated = [newWithdrawal, ...list];
  saveStoredWithdrawals(updated, userEmail);
  return newWithdrawal;
}

export function deleteWithdrawal(id: string, userEmail?: string): Withdrawal[] {
  const list = getStoredWithdrawals(userEmail);
  const updated = list.filter((w) => w.id !== id);
  saveStoredWithdrawals(updated, userEmail);
  return updated;
}

// Full Backup & Restore & Reset
export function exportBackupJSON(userEmail?: string): string {
  const backupData = {
    version: '1.0',
    userEmail: userEmail || 'Student',
    exportedAt: new Date().toISOString(),
    profile: getStoredProfile(userEmail),
    trades: getStoredTrades(userEmail),
    dailyNotes: getStoredDailyNotes(userEmail),
    rules: getStoredRules(userEmail),
    goals: getStoredGoals(userEmail),
    withdrawals: getStoredWithdrawals(userEmail),
  };
  return JSON.stringify(backupData, null, 2);
}

export function importBackupJSON(jsonStr: string, userEmail?: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.profile) saveStoredProfile(data.profile, userEmail);
    if (Array.isArray(data.trades)) saveStoredTrades(data.trades, userEmail);
    if (Array.isArray(data.dailyNotes)) saveStoredDailyNotes(data.dailyNotes, userEmail);
    if (Array.isArray(data.rules)) saveStoredRules(data.rules, userEmail);
    if (Array.isArray(data.goals)) saveStoredGoals(data.goals, userEmail);
    if (Array.isArray(data.withdrawals)) saveStoredWithdrawals(data.withdrawals, userEmail);
    return true;
  } catch (err) {
    console.error('Import failed:', err);
    return false;
  }
}

export function resetAllData(userEmail?: string): void {
  // Clear from Firestore first
  const trades = getStoredTrades(userEmail);
  const notes = getStoredDailyNotes(userEmail);
  const strategies = getStoredStrategies(userEmail);

  trades.forEach(t => deleteTradeFromFirestore(t.id));
  notes.forEach(n => deleteDailyNoteFromFirestore(n.date, userEmail));
  strategies.forEach(s => deleteStrategyFromFirestore(s.id, userEmail));

  // Clear from localStorage
  localStorage.removeItem(getScopedKey(STORAGE_KEYS.PROFILE, userEmail));
  localStorage.removeItem(getScopedKey(STORAGE_KEYS.TRADES, userEmail));
  localStorage.removeItem(getScopedKey(STORAGE_KEYS.DAILY_NOTES, userEmail));
  localStorage.removeItem(getScopedKey(STORAGE_KEYS.RULES, userEmail));
  localStorage.removeItem(getScopedKey(STORAGE_KEYS.GOALS, userEmail));
  localStorage.removeItem(getScopedKey(STORAGE_KEYS.WITHDRAWALS, userEmail));
  localStorage.removeItem(getScopedKey(STORAGE_KEYS.STRATEGIES, userEmail));
}

export function seedSampleTrades(userEmail?: string): Trade[] {
  const today = new Date();
  const sampleTradesList: Trade[] = [];

  const strategies = [
    'Option Buying - Momentum',
    'Option Buying - Scalping',
    'CPR Reversal',
    'VWAP Bounce / Rejection',
    'Option Selling - Intraday Straddle/Strangle',
  ];

  for (let i = 20; i >= 0; i--) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() - i);
    if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue;

    const dateStr = dateObj.toISOString().split('T')[0];
    const isWin = Math.random() > 0.35;
    const index = Math.random() > 0.5 ? 'NIFTY' : 'BANKNIFTY';
    const strikeBase = index === 'NIFTY' ? 24500 + Math.floor(Math.random() * 10) * 50 : 51500 + Math.floor(Math.random() * 10) * 100;
    const optionType = Math.random() > 0.5 ? 'CE' : 'PE';
    const strike = `${strikeBase} ${optionType}`;

    const quantity = index === 'NIFTY' ? 75 : 30;
    const entryPrice = Math.floor(80 + Math.random() * 120);
    const priceChange = isWin ? Math.floor(20 + Math.random() * 40) : -Math.floor(12 + Math.random() * 25);
    const exitPrice = Math.max(5, entryPrice + priceChange);

    const grossPnL = (exitPrice - entryPrice) * quantity;
    const brokerage = 40;
    const taxes = Math.round(grossPnL > 0 ? grossPnL * 0.02 + 30 : 25);
    const netPnL = grossPnL - brokerage - taxes;
    const status = netPnL > 0 ? 'Profit' : netPnL < 0 ? 'Loss' : 'Breakeven';

    const executionTypes: ExecutionMode[] = ['Manual Trading', 'Algo Trading', 'Copy Trading', 'Others'];
    const selectedExec = executionTypes[i % executionTypes.length];
    const otherReason = selectedExec === 'Others' ? 'Paper Trading Signal' : undefined;

    sampleTradesList.push({
      id: `sample_${i}_${Date.now()}`,
      date: dateStr,
      time: `${9 + Math.floor(Math.random() * 6)}:${Math.floor(Math.random() * 50).toString().padStart(2, '0')}`,
      platform: 'Zerodha (Kite)',
      segment: 'Options',
      indexOrStock: index,
      strikePrice: strike,
      buyOrSell: 'Buy',
      entryPrice,
      exitPrice,
      quantity,
      brokerage,
      taxes,
      otherCharges: 0,
      grossPnL,
      netPnL,
      status,
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      emotion: isWin ? 'Confident' : Math.random() > 0.5 ? 'FOMO' : 'Fear',
      tradeType: selectedExec,
      otherTradeTypeReason: otherReason,
      notes: isWin ? 'Nice momentum breakout on 5min chart.' : 'Entered late near resistance level.',
      holdingTimeMinutes: Math.floor(5 + Math.random() * 45),
      createdAt: Date.now() - i * 86400000,
    });
  }

  saveStoredTrades(sampleTradesList, userEmail);
  return sampleTradesList;
}

// ----------------------------------------------------
// STRATEGIES STORAGE
// ----------------------------------------------------
export function getStoredStrategies(userEmail?: string): StrategyItem[] {
  const key = getScopedKey(STORAGE_KEYS.STRATEGIES, userEmail);
  const data = localStorage.getItem(key);
  if (!data) {
    return [];
  }
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveStoredStrategies(strategies: StrategyItem[], userEmail?: string): void {
  const key = getScopedKey(STORAGE_KEYS.STRATEGIES, userEmail);
  localStorage.setItem(key, JSON.stringify(strategies));
  if (Array.isArray(strategies)) {
    strategies.forEach((st) => saveStrategyToFirestore(st, userEmail));
  }
}

export function addCustomStrategy(
  strategy: Omit<StrategyItem, 'id' | 'createdAt'>,
  userEmail?: string
): StrategyItem {
  const strategies = getStoredStrategies(userEmail);
  const newStrategy: StrategyItem = {
    ...strategy,
    id: 'strat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: Date.now(),
    isPreset: false,
  };
  const updated = [newStrategy, ...strategies];
  saveStoredStrategies(updated, userEmail);
  saveStrategyToFirestore(newStrategy, userEmail);
  return newStrategy;
}

export function editCustomStrategy(
  id: string,
  updatedFields: Partial<Omit<StrategyItem, 'id' | 'createdAt'>>,
  userEmail?: string
): StrategyItem | null {
  const strategies = getStoredStrategies(userEmail);
  const index = strategies.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const updatedStrategy = { ...strategies[index], ...updatedFields };
  strategies[index] = updatedStrategy;
  saveStoredStrategies(strategies, userEmail);
  saveStrategyToFirestore(updatedStrategy, userEmail);
  return updatedStrategy;
}

export function deleteCustomStrategy(id: string, userEmail?: string): void {
  const strategies = getStoredStrategies(userEmail);
  const updated = strategies.filter((s) => s.id !== id);
  saveStoredStrategies(updated, userEmail);
  deleteStrategyFromFirestore(id, userEmail);
}
