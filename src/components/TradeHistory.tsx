import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Send,
  Plus,
  PlusCircle,
  Upload,
} from 'lucide-react';
import { Trade } from '../types';
import { formatINR } from '../utils/calculations';
import { useMarket } from '../contexts/MarketContext';
import { SEGMENTS, FOREX_SEGMENTS } from '../data/constants';
import { exportTradesToExcel, exportTradesToPDF, printTradeHistory } from '../utils/export';

interface TradeHistoryProps {
  trades: Trade[];
  traderName: string;
  onViewTrade: (trade: Trade) => void;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  onOpenSendToMentor?: () => void;
  onOpenAddTrade?: () => void;
  onAddMultipleTrades?: (trades: Omit<Trade, 'id' | 'createdAt'>[]) => void;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({
  trades,
  traderName,
  onViewTrade,
  onEditTrade,
  onDeleteTrade,
  onOpenSendToMentor,
  onOpenAddTrade,
  onAddMultipleTrades,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        
        if (rawData.length < 2) {
          alert('File appears to be empty or missing data rows.');
          return;
        }

        const headers = (rawData[0] as string[]).map(h => h ? h.toString().toLowerCase().trim() : '');
        
        const getIndex = (possibleNames: string[]) => {
          for (let name of possibleNames) {
            let idx = headers.findIndex(h => h === name.toLowerCase());
            if (idx !== -1) return idx;
          }
          for (let name of possibleNames) {
            let idx = headers.findIndex(h => h.replace(/[^a-z0-9 ]/g, '').trim() === name.replace(/[^a-z0-9 ]/g, '').trim());
            if (idx !== -1) return idx;
          }
          for (let name of possibleNames) {
            let idx = headers.findIndex(h => h.includes(name.toLowerCase()));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const idxDate = getIndex(['date']);
        const idxTime = getIndex(['time', 'hour']);
        const idxPlatform = getIndex(['platform', 'broker']);
        const idxSegment = getIndex(['segment', 'type']);
        const idxSymbol = getIndex(['symbol', 'index', 'stock', 'ticker', 'instrument']);
        const idxStrike = getIndex(['strike']);
        const idxSide = getIndex(['side', 'buy', 'sell', 'action']);
        const idxEntry = getIndex(['entry', 'buy price', 'entry price']);
        const idxExit = getIndex(['exit', 'sell price', 'exit price']);
        const idxQty = getIndex(['qty', 'quantity']);
        const idxGross = getIndex(['gross pnl', 'gross', 'pnl']);
        const idxBrokerage = getIndex(['brokerage']);
        const idxTaxes = getIndex(['taxes', 'tax', 'charges', 'total charges']);
        const idxNet = getIndex(['net pnl', 'net']);
        const idxStrategy = getIndex(['strategy', 'setup']);
        const idxEmotion = getIndex(['emotion', 'mindset']);
        const idxNotes = getIndex(['rationale', 'reason', 'note', 'trade rationale']);
        
        if (idxDate === -1 || idxSymbol === -1) {
          alert('Could not find mandatory columns: Date and Symbol.');
          return;
        }

        const parseNumber = (val: any) => {
          if (val === undefined || val === null || val === '') return 0;
          if (typeof val === 'number') return val;
          const str = String(val);
          const isNegative = str.includes('-') || (str.includes('(') && str.includes(')'));
          const cleanStr = str.replace(/[^0-9.]+/g, '');
          let parsed = parseFloat(cleanStr);
          if (isNaN(parsed)) return 0;
          return isNegative ? -parsed : parsed;
        };

        const parseDate = (val: any) => {
          if (!val) return new Date().toISOString().split('T')[0];
          const str = String(val).trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
          
          const parts = str.split(/[-/]/);
          if (parts.length === 3) {
            let year = parts[2];
            let month = parts[1];
            let day = parts[0];
            
            if (parts[0].length === 4) {
               year = parts[0];
               month = parts[1];
               day = parts[2];
            } else if (parts[2].length === 4 || parts[2].length === 2) {
               if (parts[2].length === 2) year = "20" + parts[2];
               if (parseInt(parts[0]) > 12) {
                  day = parts[1];
                  month = parts[0];
               } else if (parseInt(parts[1]) > 12) {
                  month = parts[0];
                  day = parts[1];
               }
            }
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          const d = new Date(str);
          if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
          return new Date().toISOString().split('T')[0];
        };

        const newTrades: Omit<Trade, 'id' | 'createdAt'>[] = [];
        
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i] as any[];
          if (!row || row.length === 0 || row[idxDate] === undefined) continue;
          
          let dateStr = parseDate(row[idxDate]);
          
          const entryPrice = parseNumber(row[idxEntry]);
          const exitPrice = parseNumber(row[idxExit]);
          const qty = parseNumber(row[idxQty]);
          
          let gross = parseNumber(row[idxGross]);
          if (gross === 0 && row[idxGross] === undefined) {
             const side = String(row[idxSide] || 'Buy').toLowerCase();
             if (side.includes('sell')) {
               gross = (entryPrice - exitPrice) * qty;
             } else {
               gross = (exitPrice - entryPrice) * qty;
             }
          }
          
          let net = parseNumber(row[idxNet]);
          if (net === 0 && row[idxNet] === undefined) net = gross;

          newTrades.push({
            date: dateStr,
            time: (idxTime !== -1 && row[idxTime] !== undefined) ? String(row[idxTime]) : '12:00',
            platform: (idxPlatform !== -1 && row[idxPlatform]) ? String(row[idxPlatform]) : 'Imported',
            segment: (idxSegment !== -1 && row[idxSegment]) ? String(row[idxSegment]) as any : 'Options',
            indexOrStock: String(row[idxSymbol] || 'Unknown'),
            strikePrice: (idxStrike !== -1 && row[idxStrike]) ? String(row[idxStrike]) : undefined,
            buyOrSell: (idxSide !== -1 && String(row[idxSide]).toLowerCase().includes('sell')) ? 'Sell' : 'Buy',
            entryPrice,
            exitPrice,
            quantity: qty,
            brokerage: idxBrokerage !== -1 ? parseNumber(row[idxBrokerage]) : 0,
            taxes: idxTaxes !== -1 ? parseNumber(row[idxTaxes]) : 0,
            otherCharges: 0,
            grossPnL: gross,
            netPnL: net,
            status: net > 0 ? 'Profit' : net < 0 ? 'Loss' : 'Breakeven',
            strategy: (idxStrategy !== -1 && row[idxStrategy]) ? String(row[idxStrategy]) : 'Unknown',
            emotion: (idxEmotion !== -1 && row[idxEmotion]) ? String(row[idxEmotion]) as any : 'Neutral',
            notes: (idxNotes !== -1 && row[idxNotes]) ? String(row[idxNotes]) : '',
          });
        }

        if (newTrades.length > 0 && onAddMultipleTrades) {
          onAddMultipleTrades(newTrades);
          alert(`Successfully imported ${newTrades.length} trades.`);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse the file. Please ensure it is a valid CSV or Excel file.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentLiveMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentLiveYear = String(new Date().getFullYear());

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDayDate, setSelectedDayDate] = useState('');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState(currentLiveMonth);
  const [selectedYear, setSelectedYear] = useState(currentLiveYear);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Profit' | 'Loss' | 'Breakeven'>('ALL');
  const { marketType, currencySymbol } = useMarket();
  const currentSegments = marketType === 'Forex' ? FOREX_SEGMENTS : SEGMENTS;
  const [segmentFilter, setSegmentFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'date' | 'netPnL' | 'quantity' | 'entryPrice'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Derive unique years & months from trades
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add(currentLiveYear);
    trades.forEach((t) => {
      if (t.date) years.add(t.date.substring(0, 4));
    });
    return Array.from(years).sort().reverse();
  }, [trades, currentLiveYear]);

  const monthsList = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Filtering
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        t.indexOrStock.toLowerCase().includes(searchLower) ||
        (t.strikePrice && t.strikePrice.toLowerCase().includes(searchLower)) ||
        (t.strategy && t.strategy.toLowerCase().includes(searchLower)) ||
        (t.notes && t.notes.toLowerCase().includes(searchLower));

      // Specific Day / Date
      const dayDateMatch = !selectedDayDate || t.date === selectedDayDate;

      // Day of Week
      let dayOfWeekMatch = true;
      if (selectedDayOfWeek !== 'ALL') {
        const d = new Date(t.date + 'T00:00:00');
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[d.getDay()];
        dayOfWeekMatch = dayName === selectedDayOfWeek;
      }

      // Month & Year
      const yearMatch = selectedYear === 'ALL' || t.date.startsWith(selectedYear);
      const monthMatch = selectedMonth === 'ALL' || t.date.substring(5, 7) === selectedMonth;

      // Status
      const statusMatch = statusFilter === 'ALL' || t.status === statusFilter;

      // Segment
      const segmentMatch = segmentFilter === 'ALL' || t.segment === segmentFilter;

      return matchSearch && dayDateMatch && dayOfWeekMatch && yearMatch && monthMatch && statusMatch && segmentMatch;
    });
  }, [trades, searchTerm, selectedDayDate, selectedDayOfWeek, selectedMonth, selectedYear, statusFilter, segmentFilter]);

  // Sorting
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'date') {
        valA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
        valB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTrades, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedTrades.length / pageSize) || 1;
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTrades.slice(start, start + pageSize);
  }, [sortedTrades, currentPage, pageSize]);

  const toggleSort = (field: 'date' | 'netPnL' | 'quantity' | 'entryPrice') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-4 my-6">
      {/* Top Filter & Export Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search symbol, strike, strategy or notes..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Export & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenSendToMentor && (
              <button
                onClick={onOpenSendToMentor}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                title="Send Trading Journal Report to Mentor / Academy"
              >
                <Send className="w-4 h-4 text-indigo-600" />
                <span>Send to Mentor</span>
              </button>
            )}

            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Import Trades</span>
            </button>

            <button
              onClick={() => exportTradesToExcel(filteredTrades, traderName)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export to Excel</span>
            </button>

            <button
              onClick={() => exportTradesToPDF(filteredTrades, traderName)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Export to PDF</span>
            </button>

            <button
              onClick={printTradeHistory}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* ALWAYS SHOW DAY / DATE FILTER FIRST */}
          <div className="col-span-2 sm:col-span-1 bg-blue-50/70 p-2 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-blue-900 font-bold text-[11px] flex items-center space-x-1">
                <span>📅 Day / Date Filter</span>
              </label>
              {(selectedDayDate || selectedDayOfWeek !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDayDate('');
                    setSelectedDayOfWeek('ALL');
                    setCurrentPage(1);
                  }}
                  className="text-[10px] text-blue-700 hover:underline font-bold"
                >
                  Clear Day
                </button>
              )}
            </div>
            <div className="space-y-1">
              <input
                type="date"
                value={selectedDayDate}
                onChange={(e) => {
                  setSelectedDayDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-1.5 rounded-lg border border-blue-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
              />
              <select
                value={selectedDayOfWeek}
                onChange={(e) => {
                  setSelectedDayOfWeek(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-1 rounded-lg border border-blue-200 bg-white font-medium text-slate-700 text-[11px]"
              >
                <option value="ALL">All Days of Week</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Month Filter</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
            >
              <option value="ALL">All Months</option>
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Year Filter</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
            >
              <option value="ALL">All Years</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Result Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="Profit">Profit Only 🟢</option>
              <option value="Loss">Loss Only 🔴</option>
              <option value="Breakeven">Breakeven ⚪</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Segment</label>
            <select
              value={segmentFilter}
              onChange={(e) => {
                setSegmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
            >
              <option value="ALL">All Segments</option>
              {currentSegments.map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Trade History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <th
                  onClick={() => toggleSort('date')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Date / Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Platform</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Segment</th>
                <th className="py-3 px-3">Symbol</th>
                <th className="py-3 px-3">Strike</th>
                <th className="py-3 px-3">Side</th>
                <th
                  onClick={() => toggleSort('entryPrice')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Entry</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Exit</th>
                <th
                  onClick={() => toggleSort('quantity')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Qty</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Gross P&L</th>
                <th
                  onClick={() => toggleSort('netPnL')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Net P&L</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedTrades.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600">No trades found matching your search or filters.</p>
                    {onOpenAddTrade && (
                      <button
                        onClick={onOpenAddTrade}
                        className="mt-3 inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4 text-blue-200" />
                        <span>+ Log New Trade</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedTrades.map((t) => {
                  const execType = t.tradeType || 'Manual Trading';
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 transition duration-150 text-slate-800"
                    >
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold">{t.date}</div>
                        <div className="text-[10px] text-slate-500">{t.time || '--:--'}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">{t.platform || '-'}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            execType === 'Algo Trading'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : execType === 'Copy Trading'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : execType === 'Others'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                          title={execType === 'Others' && t.otherTradeTypeReason ? `Reason: ${t.otherTradeTypeReason}` : execType}
                        >
                          {execType}
                          {execType === 'Others' && t.otherTradeTypeReason ? ` (${t.otherTradeTypeReason})` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {t.segment}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {t.indexOrStock}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono">{t.strikePrice || '-'}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            t.buyOrSell === 'Buy'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.buyOrSell}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono">{currencySymbol}{t.entryPrice}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono">{currencySymbol}{t.exitPrice}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono">{t.quantity}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                        ₹{t.grossPnL}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-extrabold font-mono">
                        <span className={t.netPnL > 0 ? 'text-emerald-600' : t.netPnL < 0 ? 'text-rose-600' : 'text-slate-600'}>
                          {formatINR(t.netPnL)}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            t.status === 'Profit'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'Loss'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onViewTrade(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="View Trade"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditTrade(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title="Edit Trade"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTradeToDelete(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Trade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing {Math.min((currentPage - 1) * pageSize + 1, sortedTrades.length)} to{' '}
              {Math.min(currentPage * pageSize, sortedTrades.length)} of {sortedTrades.length} trades
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Trade Confirmation Modal */}
      <AnimatePresence>
        {tradeToDelete && (
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
                    if (tradeToDelete) {
                      onDeleteTrade(tradeToDelete.id);
                      setTradeToDelete(null);
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
