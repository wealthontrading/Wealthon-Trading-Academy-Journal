export type Segment = 'Options' | 'Futures' | 'Equity' | 'Commodity' | 'Currency';

export type OptionType = 'CE' | 'PE';

export type BuySell = 'Buy' | 'Sell';

export type Emotion = 'Confident' | 'Fear' | 'Greed' | 'FOMO' | 'Revenge Trade' | 'Calm' | 'Other';

export type TradeStatus = 'Profit' | 'Loss' | 'Breakeven';

export type ExecutionMode = 'Manual Trading' | 'Algo Trading' | 'Copy Trading' | 'Others';

export interface TradeLeg {
  id: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  notes?: string;
}

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  platform: string;
  segment: Segment;
  expiryDate?: string;
  indexOrStock: string; // NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY, SENSEX, custom
  strikePrice?: string; // e.g. "25000 CE", "25000 PE", or custom
  buyOrSell: BuySell;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  brokerage: number;
  taxes: number;
  otherCharges: number;
  grossPnL: number;
  netPnL: number;
  status: TradeStatus;
  strategy: string;
  emotion: Emotion;
  tradeType?: ExecutionMode | string;
  otherTradeTypeReason?: string;
  notes?: string;
  screenshot?: string; // base64 or URL
  holdingTimeMinutes?: number;
  executionLegs?: TradeLeg[];
  createdAt: number;
}

export interface StudentAccount {
  id: string;
  email: string;
  name: string;
  password: string;
  status: 'approved' | 'pending' | 'rejected' | 'disabled';
  registeredAt: number;
  approvedAt?: number;
  expiryDate?: number;
  notes?: string;
}

export interface UserSession {
  email: string;
  role: 'student' | 'admin';
  name: string;
  plan: string; // "Active Plan - Limited"
  expiryDate?: number;
}

export interface TraderProfile {
  name: string;
  platform: string;
  instituteName?: string;
  isFirstLaunchCompleted: boolean;
  capital?: number;
}

export interface DailyNote {
  id: string;
  date: string;
  notes: string;
  lessonsLearned: string[];
  mistakes: string[];
  improvements: string[];
  mindsetRating?: number; // 1-5
  marketCondition?: 'Bullish' | 'Bearish' | 'Rangebound' | 'Volatile' | 'Event Day';
  preMarketPlan?: string;
  disciplineScore?: number;
}

export interface TradingRule {
  id: string;
  text: string;
  active: boolean;
  category?: 'Risk Management' | 'Execution' | 'Psychology' | 'Strategy';
  severity?: 'Strict' | 'Standard' | 'Guide';
}

export interface TradingGoal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: '₹' | '%' | 'Trades' | 'Days';
  period: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  achieved: boolean;
  category?: 'Profit' | 'Win Rate' | 'Discipline' | 'Consistency';
}

export interface StrategyItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  timeframe?: string;
  targetWinRate?: number;
  riskRewardRatio?: string;
  rules?: string[];
  createdAt: number;
  isPreset?: boolean;
}

export interface Withdrawal {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  amount: number;
  paymentMode?: string;
  notes?: string;
  createdAt: number;
}

export interface DashboardMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  largestWinningStreak: number;
  largestLosingStreak: number;
  currentStreak: string; // e.g. "W3" or "L2"
  totalQuantity: number;
  avgQuantity: number;
  monthlyPnL: number;
  todayPnL: number;
  totalCharges?: number;
  profitFactor: number;
  avgHoldingTimeMinutes: number;
  mostTradedIndex: string;
  mostTradedStrike: string;
  bestTradingDay: string;
  worstTradingDay: string;
  bestMonth: string;
  worstMonth: string;
  avgRiskRewardRatio: number;
}

export interface SystemMaintenanceState {
  isMaintenanceActive: boolean;
  title?: string;
  message?: string;
  reason?: string;
  estimatedDuration?: string;
  updatedAt?: number;
  updatedBy?: string;
}

export interface BrokerRequest {
  id: string;
  brokerName: string;
  customBrokerName?: string;
  userEmail: string;
  userName?: string;
  notes?: string;
  submittedAt: number;
}

export interface FeedbackItem {
  id: string;
  type: 'Feedback' | 'Complaint' | 'Idea';
  ticketNumber?: string;
  userEmail: string;
  userName?: string;
  phone?: string;
  rating?: number; // 1-5 stars, optional for complaints
  category: 'Customer Support' | 'Platform Features' | 'Trading Journal' | 'Broker API' | 'General Experience' | 'Technical Issue' | 'Billing' | 'Other';
  message: string;
  status: 'New' | 'Reviewed' | 'Resolved';
  submittedAt: number;
}


