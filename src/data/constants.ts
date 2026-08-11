import { Emotion, Segment, StrategyItem } from '../types';

export const PLATFORMS = [
  'Zerodha (Kite)',
  'Groww',
  'Angel One',
  'Dhan',
  'Upstox',
  'ICICI Direct',
  'Paytm Money',
  'Kotak Neo',
  'Finvasia (Shoonya)',
  '5Paisa',
  'Motilal Oswal',
  'Custom / Other'
];

export const FOREX_SYMBOLS = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'XAU/USD (Gold)',
  'XAG/USD (Silver)',
  'BTC/USD',
  'ETH/USD',
  'US30',
  'NAS100',
  'Custom'
];

export const INDICES_AND_SYMBOLS = [
  'Nifty',
  'Bank Nifty',
  'FinNifty',
  'Midcap Nifty',
  'Sensex',
  'BSE Bankex',
  'Equity / Stock',
  'Custom'
];

export const FOREX_SEGMENTS: Segment[] = [
  'Forex',
  'Crypto',
  'Indices'
];

export const SEGMENTS: Segment[] = [
  'Options',
  'Futures',
  'Equity',
  'Commodity',
  'Currency'
];

export const STRATEGIES = [
  'Option Buying - Momentum',
  'Option Buying - Breakout/Breakdown',
  'Option Buying - Scalping',
  'Option Selling - Intraday Straddle/Strangle',
  'Option Selling - Directional Spreads',
  'VWAP Bounce / Rejection',
  'CPR Reversal',
  'Support & Resistance Bounce',
  'Price Action & Candlestick Patterns',
  'Moving Average Crossover',
  'Custom / Other'
];

export const DEFAULT_STRATEGY_ITEMS: StrategyItem[] = [
  {
    id: 'strat_1',
    name: 'Option Buying - Momentum',
    description: 'Riding high volume directional breakout candles with tight stop losses.',
    category: 'Option Buying',
    timeframe: '5 min',
    targetWinRate: 65,
    riskRewardRatio: '1:2',
    rules: [
      'Enter when 5-min candle breaks intraday high with 1.5x volume average.',
      'Set stop-loss at previous candle swing low.',
      'Trail profit target when index moves 30+ points in favor.'
    ],
    createdAt: 1700000000000,
    isPreset: true
  },
  {
    id: 'strat_2',
    name: 'Option Buying - Breakout/Breakdown',
    description: 'Trading range breakouts or trendline breaches with confirmation.',
    category: 'Option Buying',
    timeframe: '15 min',
    targetWinRate: 60,
    riskRewardRatio: '1:2.5',
    rules: [
      'Wait for 15-min candle closing outside opening range (ORB).',
      'Enter on retest or instant breakout candle high breach.',
      'Keep strict SL at breakout candle midpoint.'
    ],
    createdAt: 1700000000000,
    isPreset: true
  },
  {
    id: 'strat_3',
    name: 'Option Buying - Scalping',
    description: 'Quick in-and-out momentum trades grabbing 10-20 option points.',
    category: 'Scalping',
    timeframe: '1 min',
    targetWinRate: 70,
    riskRewardRatio: '1:1.5',
    rules: [
      'Trade only between 9:15 AM - 10:30 AM or 2:30 PM - 3:15 PM.',
      'Exit immediately if premium does not move within 3 minutes.',
      'Max 2 scalps per direction per session.'
    ],
    createdAt: 1700000000000,
    isPreset: true
  },
  {
    id: 'strat_4',
    name: 'Option Selling - Intraday Straddle/Strangle',
    description: 'Non-directional delta neutral premium decay strategy on rangebound days.',
    category: 'Option Selling',
    timeframe: '15 min',
    targetWinRate: 75,
    riskRewardRatio: '1:1',
    rules: [
      'Deploy on low VIX or CPR Rangebound expected market days.',
      'Sell ATM CE & PE at 9:20 AM with 25% stop loss on individual legs.',
      'Exit both legs at 3:10 PM.'
    ],
    createdAt: 1700000000000,
    isPreset: true
  },
  {
    id: 'strat_5',
    name: 'Option Selling - Directional Spreads',
    description: 'Credit/Debit spreads reducing margin requirements and controlling max risk.',
    category: 'Option Selling',
    timeframe: '15 min',
    targetWinRate: 68,
    riskRewardRatio: '1:1.8',
    rules: [
      'Sell OTM option and buy hedge option 200 points further OTM.',
      'Hold position if market stays beyond technical support level.'
    ],
    createdAt: 1700000000000,
    isPreset: true
  },
  {
    id: 'strat_6',
    name: 'VWAP Bounce / Rejection',
    description: 'Mean reversion and trend continuation entries based on VWAP line.',
    category: 'Price Action',
    timeframe: '5 min',
    targetWinRate: 65,
    riskRewardRatio: '1:2',
    rules: [
      'Look for hammer or bullish engulfing candle touching VWAP line.',
      'Enter on next candle high breach with VWAP minus 5 points as SL.'
    ],
    createdAt: 1700000000000,
    isPreset: true
  },
  {
    id: 'strat_7',
    name: 'CPR Reversal',
    description: 'Trading reversals or breakouts at Central Pivot Range (CPR) levels.',
    category: 'Price Action',
    timeframe: '5 min',
    targetWinRate: 62,
    riskRewardRatio: '1:2',
    rules: [
      'Identify Narrow CPR (Trending) vs Wide CPR (Rangebound).',
      'Buy call on CPR bounce or put on CPR rejection.'
    ],
    createdAt: 1700000000000,
    isPreset: true
  },
  {
    id: 'strat_8',
    name: 'Support & Resistance Bounce',
    description: 'Classical technical analysis trading multi-touch key price horizontal zones.',
    category: 'Price Action',
    timeframe: '15 min',
    targetWinRate: 60,
    riskRewardRatio: '1:2',
    rules: [
      'Draw major daily and 1-hour support/resistance zones.',
      'Wait for price rejection wick before placing entry order.'
    ],
    createdAt: 1700000000000,
    isPreset: true
  }
];

export const EMOTIONS: Emotion[] = [
  'Confident',
  'Fear',
  'Greed',
  'FOMO',
  'Revenge Trade',
  'Calm',
  'Other'
];

export const DEFAULT_TRADING_RULES = [
  'Maximum 3 trades per day.',
  'Always set a hard stop-loss in the system.',
  'Never double down or revenge trade after a loss.',
  'Maximum risk per trade is 1.5% of total capital.',
  'Do not trade during low liquidity/choppy lunch hours (11:30 AM - 1:30 PM) unless scalping.',
  'Exit immediately if trade thesis is invalidated.',
  'Record detailed notes and execution rationale for every trade.'
];

export const DEFAULT_GOALS = [
  { id: '1', title: 'Monthly Net Profit', targetValue: 50000, currentValue: 0, unit: 'Currency' as const, period: 'Monthly' as const, achieved: false },
  { id: '2', title: 'Win Rate Target', targetValue: 65, currentValue: 0, unit: '%' as const, period: 'Monthly' as const, achieved: false },
  { id: '3', title: 'Disciplined Trades Executed', targetValue: 20, currentValue: 0, unit: 'Trades' as const, period: 'Monthly' as const, achieved: false }
];
