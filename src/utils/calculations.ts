import { DashboardMetrics, Trade } from '../types';

export function calculateMetrics(trades: Trade[]): DashboardMetrics {
  const initialMetrics: DashboardMetrics = {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    breakevenTrades: 0,
    totalProfit: 0,
    totalLoss: 0,
    netPnL: 0,
    winRate: 0,
    avgProfit: 0,
    avgLoss: 0,
    bestTrade: 0,
    worstTrade: 0,
    largestWinningStreak: 0,
    largestLosingStreak: 0,
    currentStreak: '0',
    totalQuantity: 0,
    avgQuantity: 0,
    monthlyPnL: 0,
    todayPnL: 0,
    profitFactor: 0,
    avgHoldingTimeMinutes: 0,
    mostTradedIndex: 'N/A',
    mostTradedStrike: 'N/A',
    bestTradingDay: 'N/A',
    worstTradingDay: 'N/A',
    bestMonth: 'N/A',
    worstMonth: 'N/A',
    avgRiskRewardRatio: 0,
  };

  if (!trades || trades.length === 0) {
    return initialMetrics;
  }

  // Sort trades chronologically
  const sortedTrades = [...trades].sort((a, b) => {
    const timeA = a && a.date ? new Date(`${a.date}T${a.time || '00:00'}`).getTime() : 0;
    const timeB = b && b.date ? new Date(`${b.date}T${b.time || '00:00'}`).getTime() : 0;
    return (Number.isFinite(timeA) ? timeA : 0) - (Number.isFinite(timeB) ? timeB : 0);
  });

  const totalTrades = sortedTrades.length;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let bestTrade = -Infinity;
  let worstTrade = Infinity;
  let totalQuantity = 0;
  let totalHoldingMinutes = 0;
  let holdingTimeCount = 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

  let todayPnL = 0;
  let monthlyPnL = 0;

  const indexCounts: Record<string, number> = {};
  const strikeCounts: Record<string, number> = {};
  const dayOfWeekPnL: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };
  const monthPnL: Record<string, number> = {};

  // Streak calculations
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let curWinStreak = 0;
  let curLossStreak = 0;
  let lastStreakType: 'W' | 'L' | null = null;
  let lastStreakCount = 0;

  let totalWinPnLForRR = 0;
  let totalLossPnLForRR = 0;

  for (const trade of sortedTrades) {
    const net = Number.isFinite(trade.netPnL) ? trade.netPnL : 0;
    totalQuantity += Number.isFinite(trade.quantity) ? trade.quantity : 0;

    if (trade.holdingTimeMinutes && trade.holdingTimeMinutes > 0) {
      totalHoldingMinutes += trade.holdingTimeMinutes;
      holdingTimeCount++;
    }

    if (net > 0) {
      winningTrades++;
      totalProfit += net;
      totalWinPnLForRR += net;
      if (net > bestTrade) bestTrade = net;

      // Streaks
      curWinStreak++;
      curLossStreak = 0;
      if (curWinStreak > maxWinStreak) maxWinStreak = curWinStreak;

      lastStreakType = 'W';
      lastStreakCount = curWinStreak;
    } else if (net < 0) {
      losingTrades++;
      const absLoss = Math.abs(net);
      totalLoss += absLoss;
      totalLossPnLForRR += absLoss;
      if (net < worstTrade) worstTrade = net;

      // Streaks
      curLossStreak++;
      curWinStreak = 0;
      if (curLossStreak > maxLossStreak) maxLossStreak = curLossStreak;

      lastStreakType = 'L';
      lastStreakCount = curLossStreak;
    } else {
      breakevenTrades++;
      curWinStreak = 0;
      curLossStreak = 0;
    }

    // Today & Monthly PnL
    if (trade.date === todayStr) {
      todayPnL += net;
    }
    if (trade.date.startsWith(currentMonthStr)) {
      monthlyPnL += net;
    }

    // Counts for most traded index & strike
    if (trade.indexOrStock) {
      indexCounts[trade.indexOrStock] = (indexCounts[trade.indexOrStock] || 0) + 1;
    }
    if (trade.strikePrice) {
      const strikeKey = `${trade.indexOrStock} ${trade.strikePrice}`.trim();
      strikeCounts[strikeKey] = (strikeCounts[strikeKey] || 0) + 1;
    }

    // Day of week
    const tradeDateObj = new Date(`${trade.date}T12:00:00`);
    const dayName = tradeDateObj.toLocaleDateString('en-US', { weekday: 'long' });
    if (dayOfWeekPnL[dayName] !== undefined) {
      dayOfWeekPnL[dayName] += net;
    }

    // Monthly breakdown
    const mKey = trade.date.substring(0, 7); // YYYY-MM
    monthPnL[mKey] = (monthPnL[mKey] || 0) + net;
  }

  const netPnL = totalProfit - totalLoss;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const avgProfit = winningTrades > 0 ? totalProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
  const avgQuantity = totalTrades > 0 ? Math.round(totalQuantity / totalTrades) : 0;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;

  // Most traded index
  let mostTradedIndex = 'N/A';
  let maxIdxCount = 0;
  Object.entries(indexCounts).forEach(([idx, cnt]) => {
    if (cnt > maxIdxCount) {
      maxIdxCount = cnt;
      mostTradedIndex = idx;
    }
  });

  // Most traded strike
  let mostTradedStrike = 'N/A';
  let maxStrikeCount = 0;
  Object.entries(strikeCounts).forEach(([stk, cnt]) => {
    if (cnt > maxStrikeCount) {
      maxStrikeCount = cnt;
      mostTradedStrike = stk;
    }
  });

  // Best & Worst trading day
  let bestTradingDay = 'N/A';
  let maxDayPnL = -Infinity;
  let worstTradingDay = 'N/A';
  let minDayPnL = Infinity;

  Object.entries(dayOfWeekPnL).forEach(([day, pnl]) => {
    if (pnl > maxDayPnL) {
      maxDayPnL = pnl;
      bestTradingDay = day;
    }
    if (pnl < minDayPnL) {
      minDayPnL = pnl;
      worstTradingDay = day;
    }
  });
  if (maxDayPnL === 0 && minDayPnL === 0) {
    bestTradingDay = 'N/A';
    worstTradingDay = 'N/A';
  }

  // Best & Worst month
  let bestMonth = 'N/A';
  let maxMPnL = -Infinity;
  let worstMonth = 'N/A';
  let minMPnL = Infinity;

  Object.entries(monthPnL).forEach(([mKey, pnl]) => {
    const formattedM = new Date(`${mKey}-01T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    if (pnl > maxMPnL) {
      maxMPnL = pnl;
      bestMonth = formattedM;
    }
    if (pnl < minMPnL) {
      minMPnL = pnl;
      worstMonth = formattedM;
    }
  });

  if (Object.keys(monthPnL).length === 0) {
    bestMonth = 'N/A';
    worstMonth = 'N/A';
  }

  // Current streak representation
  let currentStreak = '0';
  if (lastStreakType && lastStreakCount > 0) {
    currentStreak = `${lastStreakCount} ${lastStreakType === 'W' ? 'Win' : 'Loss'}${lastStreakCount > 1 ? 's' : ''} (${lastStreakType}${lastStreakCount})`;
  }

  // Average Risk Reward ratio
  const avgRR = avgLoss > 0 ? avgProfit / avgLoss : avgProfit > 0 ? avgProfit : 0;

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    totalProfit,
    totalLoss,
    netPnL,
    winRate,
    avgProfit,
    avgLoss,
    bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
    worstTrade: worstTrade === Infinity ? 0 : worstTrade,
    largestWinningStreak: maxWinStreak,
    largestLosingStreak: maxLossStreak,
    currentStreak,
    totalQuantity,
    avgQuantity,
    monthlyPnL,
    todayPnL,
    profitFactor,
    avgHoldingTimeMinutes: holdingTimeCount > 0 ? Math.round(totalHoldingMinutes / holdingTimeCount) : 0,
    mostTradedIndex,
    mostTradedStrike,
    bestTradingDay,
    worstTradingDay,
    bestMonth,
    worstMonth,
    avgRiskRewardRatio: avgRR,
  };
}

export function estimateIndianCharges(
  segment: string,
  buySell: string,
  entryPrice: number,
  exitPrice: number,
  quantity: number
): { brokerage: number; taxes: number; totalCharges: number } {
  if (!entryPrice || !exitPrice || !quantity) {
    return { brokerage: 20, taxes: 0, totalCharges: 20 };
  }

  const buyVal = entryPrice * quantity;
  const sellVal = exitPrice * quantity;
  const totalTurnover = buyVal + sellVal;

  // Standard Zerodha flat brokerage ₹20 per executed order (2 sides = ₹40)
  const brokerage = 40;

  let stt = 0;
  let stampDuty = 0;

  if (segment === 'Options') {
    // STT is 0.1% on sell side premium
    stt = sellVal * 0.001;
    // Stamp duty 0.003% on buy side
    stampDuty = buyVal * 0.00003;
  } else if (segment === 'Futures') {
    // STT 0.02% on sell side
    stt = sellVal * 0.0002;
    stampDuty = buyVal * 0.00002;
  } else {
    // Equity Intraday
    stt = sellVal * 0.00025;
    stampDuty = buyVal * 0.00003;
  }

  // Exchange turnover charge (~0.035% for options)
  const exchangeCharge = totalTurnover * 0.00035;

  // SEBI turnover fee ₹10 per crore
  const sebiFee = totalTurnover * 0.0000001;

  // GST 18% on (Brokerage + Exchange Charge + SEBI fee)
  const gst = (brokerage + exchangeCharge + sebiFee) * 0.18;

  const totalTaxes = Math.round((stt + stampDuty + exchangeCharge + sebiFee + gst) * 100) / 100;
  const totalCharges = Math.round((brokerage + totalTaxes) * 100) / 100;

  return {
    brokerage,
    taxes: totalTaxes,
    totalCharges,
  };
}

export let globalMarketType: 'Indian' | 'Forex' = 'Indian';
export function setGlobalMarketType(type: 'Indian' | 'Forex') {
  globalMarketType = type;
}

export function formatINR(amount: number): string {
  const safeAmount = Number.isNaN(Number(amount)) || amount === undefined || amount === null ? 0 : Number(amount);
  const isNegative = safeAmount < 0;
  const absVal = Math.abs(safeAmount);
  
  if (globalMarketType === 'Forex') {
    const converted = absVal;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(converted);
    return isNegative ? `-${formatted}` : formatted;
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(absVal);

  return isNegative ? `-${formatted}` : formatted;
}
