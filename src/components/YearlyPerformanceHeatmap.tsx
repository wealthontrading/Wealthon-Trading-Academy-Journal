import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, TrendingUp, TrendingDown, IndianRupee, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Trade } from '../types';
import { useMarket } from '../contexts/MarketContext';
import { formatINR } from '../utils/calculations';

interface YearlyPerformanceHeatmapProps {
  trades: Trade[];
}

export const YearlyPerformanceHeatmap: React.FC<YearlyPerformanceHeatmapProps> = ({ trades }) => {
  const { marketType } = useMarket();
  const CurrencyIcon = marketType === 'Forex' ? DollarSign : IndianRupee;
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    trades.forEach((t) => {
      if (t.date) {
        const year = parseInt(t.date.substring(0, 4), 10);
        if (!isNaN(year)) years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [trades]);

  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      monthName: new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      netPnL: 0,
      tradeCount: 0,
      winningTrades: 0,
      losingTrades: 0,
    }));

    trades.forEach((t) => {
      if (!t.date) return;
      const tYear = parseInt(t.date.substring(0, 4), 10);
      if (tYear === selectedYear) {
        const tMonth = parseInt(t.date.substring(5, 7), 10) - 1;
        if (tMonth >= 0 && tMonth < 12) {
          data[tMonth].netPnL += (t.netPnL || 0);
          data[tMonth].tradeCount += 1;
          if ((t.netPnL || 0) > 0) data[tMonth].winningTrades += 1;
          else if ((t.netPnL || 0) < 0) data[tMonth].losingTrades += 1;
        }
      }
    });

    return data;
  }, [trades, selectedYear]);

  const handlePrevYear = () => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1]);
    }
  };

  const handleNextYear = () => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1]);
    }
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 shadow-2xs">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Yearly Performance Heatmap</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Visualize your most profitable trading months at a glance for {selectedYear}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 self-start md:self-auto">
          <button
            onClick={handlePrevYear}
            disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
            className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer disabled:opacity-50"
            title="Previous Year"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-lg border border-slate-700 min-w-[80px] text-center">
            {selectedYear}
          </span>
          <button
            onClick={handleNextYear}
            disabled={availableYears.indexOf(selectedYear) === 0}
            className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer disabled:opacity-50"
            title="Next Year"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {monthlyData.map((data) => {
          let dayBg = 'bg-slate-50 border-slate-200 text-slate-700';
          if (data.tradeCount > 0) {
            if (data.netPnL > 0) {
              dayBg = 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold shadow-sm';
            } else if (data.netPnL < 0) {
              dayBg = 'bg-rose-50/90 border-rose-300 text-rose-950 font-bold shadow-sm';
            } else {
              dayBg = 'bg-slate-200/90 border-slate-300 text-slate-900 font-bold shadow-sm';
            }
          }

          return (
            <div
              key={data.month}
              className={`min-h-[80px] p-3 rounded-2xl border flex flex-col justify-between transition-all ${dayBg}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-black uppercase tracking-wider opacity-80">
                  {data.monthName}
                </span>
                {data.tradeCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-black/10 font-extrabold shadow-2xs">
                    {data.tradeCount} trades
                  </span>
                )}
              </div>

              {data.tradeCount > 0 ? (
                <div className="mt-2 flex flex-col">
                  <span className={`text-base truncate font-black font-mono tracking-tight block ${data.netPnL > 0 ? 'text-emerald-700' : data.netPnL < 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                    {data.netPnL > 0 ? '+' : ''}{formatINR(data.netPnL)}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] font-semibold opacity-75 uppercase tracking-wide">
                    <span className="text-emerald-600">{data.winningTrades}W</span>
                    <span className="text-rose-600">{data.losingTrades}L</span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs font-semibold text-slate-400">
                  No trades
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
