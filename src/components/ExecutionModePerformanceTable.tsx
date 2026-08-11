import React, { useState } from 'react';
import { Trade } from '../types';
import { Cpu, User, Copy, Layers, HelpCircle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Scale, BarChart2 } from 'lucide-react';

interface ExecutionModePerformanceTableProps {
  trades: Trade[];
}

export interface ModeMetrics {
  modeName: string;
  category: string;
  icon: React.ReactNode;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number;
  totalQuantity: number;
  grossPnL: number;
  totalCharges: number;
  netPnL: number;
  avgNetPnL: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
}

export const ExecutionModePerformanceTable: React.FC<ExecutionModePerformanceTableProps> = ({ trades }) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Manual' | 'Algo' | 'Copy' | 'Multi-Leg'>('All');

  // Compute stats grouped by execution mode
  const getModeStats = (): ModeMetrics[] => {
    const modesMap: Record<string, {
      category: string;
      icon: React.ReactNode;
      badgeBg: string;
      badgeText: string;
      badgeBorder: string;
      trades: Trade[];
    }> = {
      'Manual Trading': {
        category: 'Manual',
        icon: <User className="w-4 h-4 text-blue-600" />,
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-800',
        badgeBorder: 'border-blue-200',
        trades: [],
      },
      'Algo Trading': {
        category: 'Algo',
        icon: <Cpu className="w-4 h-4 text-purple-600" />,
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-800',
        badgeBorder: 'border-purple-200',
        trades: [],
      },
      'Copy Trading': {
        category: 'Copy',
        icon: <Copy className="w-4 h-4 text-emerald-600" />,
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-800',
        badgeBorder: 'border-emerald-200',
        trades: [],
      },
      'Multi-Leg Execution': {
        category: 'Multi-Leg',
        icon: <Layers className="w-4 h-4 text-indigo-600" />,
        badgeBg: 'bg-indigo-50',
        badgeText: 'text-indigo-800',
        badgeBorder: 'border-indigo-200',
        trades: [],
      },
      'Others': {
        category: 'Others',
        icon: <HelpCircle className="w-4 h-4 text-slate-600" />,
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-800',
        badgeBorder: 'border-slate-300',
        trades: [],
      },
    };

    trades.forEach((trade) => {
      // Check if it's multi-leg execution first
      if (trade.executionLegs && trade.executionLegs.length > 1) {
        modesMap['Multi-Leg Execution'].trades.push(trade);
      } else {
        const typeStr = (trade.tradeType || 'Manual Trading').trim();
        if (modesMap[typeStr]) {
          modesMap[typeStr].trades.push(trade);
        } else if (typeStr.toLowerCase().includes('algo')) {
          modesMap['Algo Trading'].trades.push(trade);
        } else if (typeStr.toLowerCase().includes('copy')) {
          modesMap['Copy Trading'].trades.push(trade);
        } else if (typeStr.toLowerCase().includes('manual')) {
          modesMap['Manual Trading'].trades.push(trade);
        } else {
          modesMap['Others'].trades.push(trade);
        }
      }
    });

    return Object.entries(modesMap).map(([modeName, info]) => {
      const modeTrades = info.trades;
      const totalTrades = modeTrades.length;
      let winCount = 0;
      let lossCount = 0;
      let breakevenCount = 0;
      let grossPnL = 0;
      let totalCharges = 0;
      let netPnL = 0;
      let totalQuantity = 0;
      let winningGross = 0;
      let losingGross = 0;
      let bestTrade = 0;
      let worstTrade = 0;

      modeTrades.forEach((t) => {
        const net = Number.isFinite(t.netPnL) ? t.netPnL : 0;
        const gross = Number.isFinite(t.grossPnL) ? t.grossPnL : 0;
        const charges = (t.brokerage || 0) + (t.taxes || 0) + (t.otherCharges || 0);

        netPnL += net;
        grossPnL += gross;
        totalCharges += charges;
        totalQuantity += t.quantity || 0;

        if (net > 0) {
          winCount++;
          winningGross += gross;
          if (net > bestTrade) bestTrade = net;
        } else if (net < 0) {
          lossCount++;
          losingGross += Math.abs(gross);
          if (net < worstTrade) worstTrade = net;
        } else {
          breakevenCount++;
        }
      });

      const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
      const avgNetPnL = totalTrades > 0 ? netPnL / totalTrades : 0;
      const profitFactor = losingGross > 0 ? winningGross / losingGross : winningGross > 0 ? 99.9 : 0;

      return {
        modeName,
        category: info.category,
        icon: info.icon,
        badgeBg: info.badgeBg,
        badgeText: info.badgeText,
        badgeBorder: info.badgeBorder,
        totalTrades,
        winCount,
        lossCount,
        breakevenCount,
        winRate,
        totalQuantity,
        grossPnL,
        totalCharges,
        netPnL,
        avgNetPnL,
        profitFactor,
        bestTrade,
        worstTrade,
      };
    });
  };

  const modeMetrics = getModeStats();
  const activeMetrics = modeMetrics.filter((m) => {
    if (selectedFilter === 'All') return true;
    return m.category === selectedFilter;
  });

  // Calculate totals across all active execution modes
  const totalTradesCount = modeMetrics.reduce((acc, curr) => acc + curr.totalTrades, 0);
  const totalNetPnL = modeMetrics.reduce((acc, curr) => acc + curr.netPnL, 0);
  const totalChargesAll = modeMetrics.reduce((acc, curr) => acc + curr.totalCharges, 0);
  const bestMode = [...modeMetrics].sort((a, b) => b.netPnL - a.netPnL)[0];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden my-6">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600/30 border border-indigo-400/30 rounded-xl text-indigo-300">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">Execution Mode Performance</h3>
              <p className="text-xs text-indigo-200/80 font-medium">
                Analysis of P&L, Win Rate & Efficiency across Manual, Algo, Copy & Multi-Leg Trading
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700 self-start md:self-auto text-xs">
          {(['All', 'Manual', 'Algo', 'Copy', 'Multi-Leg'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedFilter === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Top Highlights Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Logged Trades</span>
          <span className="text-base sm:text-lg font-extrabold text-slate-900">{totalTradesCount}</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Overall Net P&L</span>
          <span className={`text-base sm:text-lg font-extrabold ${totalNetPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalNetPnL >= 0 ? '+' : ''}₹{totalNetPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Charges Paid</span>
          <span className="text-base sm:text-lg font-extrabold text-amber-700">
            ₹{totalChargesAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Top Performing Mode</span>
          <span className="text-sm sm:text-base font-extrabold text-indigo-700 truncate block">
            {bestMode && bestMode.totalTrades > 0 ? bestMode.modeName : 'N/A'}
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 text-[11px]">
            <tr>
              <th className="py-3 px-4">Execution Mode</th>
              <th className="py-3 px-3 text-center">Trades</th>
              <th className="py-3 px-3 text-center">Win / Loss</th>
              <th className="py-3 px-3 text-center">Win Rate</th>
              <th className="py-3 px-3 text-right">Total Qty</th>
              <th className="py-3 px-3 text-right">Charges (₹)</th>
              <th className="py-3 px-3 text-right">Gross P&L (₹)</th>
              <th className="py-3 px-4 text-right">Net P&L (₹)</th>
              <th className="py-3 px-3 text-right">Avg / Trade</th>
              <th className="py-3 px-3 text-center">Profit Factor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium">
            {activeMetrics.map((m) => {
              const isPositive = m.netPnL >= 0;
              return (
                <tr key={m.modeName} className="hover:bg-slate-50 transition">
                  {/* Mode Name */}
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <span className={`p-1.5 rounded-lg border ${m.badgeBg} ${m.badgeBorder} ${m.badgeText}`}>
                        {m.icon}
                      </span>
                      <div>
                        <span className="block text-xs font-extrabold text-slate-900">{m.modeName}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {m.totalTrades === 0 ? 'No trades logged' : `${m.totalTrades} execution${m.totalTrades > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Trades Count */}
                  <td className="py-3.5 px-3 text-center font-extrabold text-slate-800">{m.totalTrades}</td>

                  {/* Win / Loss Breakdown */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="inline-flex items-center space-x-1 text-[11px] font-bold">
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {m.winCount}W
                      </span>
                      <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {m.lossCount}L
                      </span>
                      {m.breakevenCount > 0 && (
                        <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {m.breakevenCount}BE
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Win Rate */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`font-extrabold ${m.winRate >= 50 ? 'text-emerald-700' : m.winRate > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                        {m.winRate.toFixed(1)}%
                      </span>
                      <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${m.winRate >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(100, Math.max(0, m.winRate))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Total Quantity */}
                  <td className="py-3.5 px-3 text-right font-semibold text-slate-700">
                    {m.totalQuantity.toLocaleString('en-IN')}
                  </td>

                  {/* Total Charges */}
                  <td className="py-3.5 px-3 text-right font-medium text-amber-700">
                    ₹{m.totalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Gross P&L */}
                  <td className={`py-3.5 px-3 text-right font-bold ${m.grossPnL >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {m.grossPnL >= 0 ? '+' : ''}₹{m.grossPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Net P&L */}
                  <td className="py-3.5 px-4 text-right">
                    <span className={`inline-flex items-center font-extrabold px-2.5 py-1 rounded-lg text-xs ${
                      isPositive
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 text-emerald-600" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 text-rose-600" />}
                      {isPositive ? '+' : ''}₹{m.netPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* Avg Net per Trade */}
                  <td className={`py-3.5 px-3 text-right font-semibold ${m.avgNetPnL >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {m.avgNetPnL >= 0 ? '+' : ''}₹{m.avgNetPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Profit Factor */}
                  <td className="py-3.5 px-3 text-center font-extrabold text-slate-800">
                    {m.totalTrades > 0 ? m.profitFactor.toFixed(2) : '-'}
                  </td>
                </tr>
              );
            })}

            {activeMetrics.every((m) => m.totalTrades === 0) && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500 font-medium">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <BarChart2 className="w-8 h-8 text-slate-300" />
                    <span>No trades logged for the selected execution mode filter yet.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Note */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="flex items-center space-x-1">
          <Scale className="w-3.5 h-3.5 text-indigo-500" />
          <span>Execution modes automatically organize trades based on single-leg, multi-leg averaging, algo, and copy execution tags.</span>
        </span>
        <span className="font-semibold text-slate-600">Updated Live from Journal Logs</span>
      </div>
    </div>
  );
};
