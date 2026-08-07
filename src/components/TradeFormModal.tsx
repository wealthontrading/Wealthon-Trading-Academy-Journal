import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  PlusCircle,
  Calculator,
  Image as ImageIcon,
  Sparkles,
  Info,
  IndianRupee,
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { EMOTIONS, INDICES_AND_SYMBOLS, SEGMENTS } from '../data/constants';
import { BuySell, Emotion, ExecutionMode, OptionType, Segment, StrategyItem, Trade, TradeLeg } from '../types';
import { estimateIndianCharges } from '../utils/calculations';

interface LegState {
  id: string;
  entryPrice: number | '';
  exitPrice: number | '';
  quantity: number | '';
}

interface TradeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tradeData: Omit<Trade, 'id' | 'createdAt'>, existingId?: string) => void;
  tradeToEdit?: Trade | null;
  defaultPlatform: string;
  strategiesList?: StrategyItem[];
  initialStrategy?: string;
}

export const TradeFormModal: React.FC<TradeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tradeToEdit,
  defaultPlatform,
  strategiesList = [],
  initialStrategy = '',
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().slice(0, 5);

  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(timeStr);
  const [platform, setPlatform] = useState(defaultPlatform);
  const [segment, setSegment] = useState<Segment>('Options');
  const [expiryDate, setExpiryDate] = useState('');
  const [indexOrStock, setIndexOrStock] = useState('Nifty');
  const [stockName, setStockName] = useState('RELIANCE');
  const [customIndex, setCustomIndex] = useState('');
  const [strikeVal, setStrikeVal] = useState('25000');
  const [optionType, setOptionType] = useState<OptionType>('CE');
  const [buyOrSell, setBuyOrSell] = useState<BuySell>('Buy');

  // Execution legs / tranches for a single trade
  const [legs, setLegs] = useState<LegState[]>([
    { id: 'leg_1', entryPrice: '', exitPrice: '', quantity: '' },
  ]);

  const [brokerage, setBrokerage] = useState<number | ''>('');
  const [taxes, setTaxes] = useState<number | ''>('');
  const [otherCharges, setOtherCharges] = useState<number | ''>('');
  const [strategy, setStrategy] = useState<string>('');
  const [customStrategy, setCustomStrategy] = useState('');
  const [emotion, setEmotion] = useState<Emotion | ''>('');
  const [customEmotion, setCustomEmotion] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [holdingTimeMinutes, setHoldingTimeMinutes] = useState<number | ''>('');
  const [tradeType, setTradeType] = useState<ExecutionMode>('Manual Trading');
  const [otherTradeTypeReason, setOtherTradeTypeReason] = useState('');

  const availableStrategies = useMemo(() => {
    const customNames = (strategiesList || []).map((s) => s.name);
    const combined = Array.from(new Set([...customNames]));
    const filtered = combined.filter((s) => s !== 'Custom / Other' && s !== 'Other');
    return [...filtered, 'Custom / Other'];
  }, [strategiesList]);

  useEffect(() => {
    if (tradeToEdit) {
      setDate(tradeToEdit.date);
      setTime(tradeToEdit.time || timeStr);
      setPlatform(tradeToEdit.platform || defaultPlatform);
      setSegment(tradeToEdit.segment);
      setExpiryDate(tradeToEdit.expiryDate || '');
      if (INDICES_AND_SYMBOLS.includes(tradeToEdit.indexOrStock)) {
        setIndexOrStock(tradeToEdit.indexOrStock);
      } else if (tradeToEdit.indexOrStock.toUpperCase() === 'NIFTY') {
        setIndexOrStock('Nifty');
      } else if (tradeToEdit.indexOrStock.toUpperCase() === 'BANKNIFTY') {
        setIndexOrStock('Bank Nifty');
      } else if (tradeToEdit.indexOrStock.toUpperCase() === 'FINNIFTY') {
        setIndexOrStock('FinNifty');
      } else if (tradeToEdit.indexOrStock.toUpperCase() === 'MIDCPNIFTY' || tradeToEdit.indexOrStock.toUpperCase() === 'MIDCAP NIFTY') {
        setIndexOrStock('Midcap Nifty');
      } else if (tradeToEdit.indexOrStock.toUpperCase() === 'SENSEX') {
        setIndexOrStock('Sensex');
      } else if (tradeToEdit.indexOrStock.toUpperCase() === 'BANKEX' || tradeToEdit.indexOrStock.toUpperCase() === 'BSE BANKEX') {
        setIndexOrStock('BSE Bankex');
      } else if (tradeToEdit.segment === 'Equity' || tradeToEdit.indexOrStock === 'Equity / Stock') {
        setIndexOrStock('Equity / Stock');
        setStockName(tradeToEdit.indexOrStock);
      } else {
        setIndexOrStock('Equity / Stock');
        setStockName(tradeToEdit.indexOrStock);
      }

      // Parse strike e.g. "25000 CE"
      if (tradeToEdit.strikePrice) {
        const parts = tradeToEdit.strikePrice.split(' ');
        if (parts.length >= 2 && (parts[1] === 'CE' || parts[1] === 'PE')) {
          setStrikeVal(parts[0]);
          setOptionType(parts[1] as OptionType);
        } else {
          setStrikeVal(tradeToEdit.strikePrice);
        }
      }

      setBuyOrSell(tradeToEdit.buyOrSell);

      // Populate legs
      if (tradeToEdit.executionLegs && tradeToEdit.executionLegs.length > 0) {
        setLegs(
          tradeToEdit.executionLegs.map((l, i) => ({
            id: l.id || `leg_${i + 1}`,
            entryPrice: l.entryPrice,
            exitPrice: l.exitPrice,
            quantity: l.quantity,
          }))
        );
      } else {
        setLegs([
          {
            id: 'leg_1',
            entryPrice: tradeToEdit.entryPrice ?? '',
            exitPrice: tradeToEdit.exitPrice ?? '',
            quantity: tradeToEdit.quantity ?? '',
          },
        ]);
      }

      setBrokerage(tradeToEdit.brokerage !== undefined && tradeToEdit.brokerage !== null ? tradeToEdit.brokerage : '');
      setTaxes(tradeToEdit.taxes !== undefined && tradeToEdit.taxes !== null ? tradeToEdit.taxes : '');
      setOtherCharges(tradeToEdit.otherCharges !== undefined && tradeToEdit.otherCharges !== null ? tradeToEdit.otherCharges : '');

      if (availableStrategies.includes(tradeToEdit.strategy) && tradeToEdit.strategy !== 'Custom / Other') {
        setStrategy(tradeToEdit.strategy);
        setCustomStrategy('');
      } else {
        setStrategy('Custom / Other');
        setCustomStrategy(tradeToEdit.strategy || '');
      }

      if (EMOTIONS.includes(tradeToEdit.emotion as Emotion) && tradeToEdit.emotion !== 'Other') {
        setEmotion(tradeToEdit.emotion as Emotion);
        setCustomEmotion('');
      } else {
        setEmotion('Other');
        setCustomEmotion(tradeToEdit.emotion || '');
      }

      setNotes(tradeToEdit.notes || '');
      setScreenshot(tradeToEdit.screenshot || '');
      setHoldingTimeMinutes(tradeToEdit.holdingTimeMinutes !== undefined && tradeToEdit.holdingTimeMinutes !== null ? tradeToEdit.holdingTimeMinutes : '');

      if (tradeToEdit.tradeType) {
        const validModes: ExecutionMode[] = ['Manual Trading', 'Algo Trading', 'Copy Trading', 'Others'];
        if (validModes.includes(tradeToEdit.tradeType as ExecutionMode)) {
          setTradeType(tradeToEdit.tradeType as ExecutionMode);
        } else {
          setTradeType('Others');
        }
      } else {
        setTradeType('Manual Trading');
      }
      setOtherTradeTypeReason(tradeToEdit.otherTradeTypeReason || '');
    } else {
      setDate(todayStr);
      setTime(new Date().toTimeString().slice(0, 5));
      setPlatform(defaultPlatform);
      setSegment('Options');
      setIndexOrStock('Nifty');
      setStockName('RELIANCE');
      setBuyOrSell('Buy');
      setLegs([{ id: 'leg_1', entryPrice: '', exitPrice: '', quantity: '' }]);
      setBrokerage('');
      setTaxes('');
      setOtherCharges('');
      if (initialStrategy && availableStrategies.includes(initialStrategy)) {
        setStrategy(initialStrategy);
        setCustomStrategy('');
      } else {
        setStrategy('');
        setCustomStrategy('');
      }
      setEmotion('');
      setCustomEmotion('');
      setNotes('');
      setScreenshot('');
      setHoldingTimeMinutes('');
      setTradeType('Manual Trading');
      setOtherTradeTypeReason('');
    }
  }, [tradeToEdit, isOpen, defaultPlatform]);

  if (!isOpen) return null;

  // Auto-calculated Gross & Net PnL across execution legs
  const calculatedLegs = legs.map((leg, index) => {
    const e = Number(leg.entryPrice) || 0;
    const x = Number(leg.exitPrice) || 0;
    const q = Number(leg.quantity) || 0;
    const gross = buyOrSell === 'Buy' ? (x - e) * q : (e - x) * q;
    return { ...leg, index, e, x, q, gross };
  });

  const totalQuantity = calculatedLegs.reduce((acc, l) => acc + l.q, 0);
  const totalGrossPnL = calculatedLegs.reduce((acc, l) => acc + l.gross, 0);

  const totalEntryVal = calculatedLegs.reduce((acc, l) => acc + l.e * l.q, 0);
  const totalExitVal = calculatedLegs.reduce((acc, l) => acc + l.x * l.q, 0);

  const weightedAvgEntry = totalQuantity > 0 ? totalEntryVal / totalQuantity : (calculatedLegs[0]?.e || 0);
  const weightedAvgExit = totalQuantity > 0 ? totalExitVal / totalQuantity : (calculatedLegs[0]?.x || 0);

  const grossPnL = totalGrossPnL;
  const netPnL = grossPnL - (Number(brokerage) || 0) - (Number(taxes) || 0) - (Number(otherCharges) || 0);
  const status = netPnL > 0 ? 'Profit' : netPnL < 0 ? 'Loss' : 'Breakeven';

  const handleAutoEstimateTaxes = () => {
    const est = estimateIndianCharges(segment, buyOrSell, weightedAvgEntry, weightedAvgExit, totalQuantity);
    setBrokerage(est.brokerage);
    setTaxes(est.taxes);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('File size exceeds 3MB limit. Please upload a smaller screenshot.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const buildTradeObj = (): Omit<Trade, 'id' | 'createdAt'> => {
    let selectedSymbol = indexOrStock;
    let finalStrike = '';

    if (indexOrStock === 'Equity / Stock') {
      selectedSymbol = stockName.trim() || 'RELIANCE';
      finalStrike = 'N/A';
    } else if (indexOrStock === 'Custom') {
      selectedSymbol = customIndex.trim() || 'CUSTOM';
      finalStrike = segment === 'Options' ? `${strikeVal.trim()} ${optionType}`.trim() : strikeVal.trim();
    } else {
      selectedSymbol = indexOrStock;
      finalStrike = segment === 'Options' ? `${strikeVal.trim()} ${optionType}`.trim() : strikeVal.trim();
    }

    const finalStrategy = (strategy === 'Custom / Other' || strategy === 'Other')
      ? (customStrategy.trim() || 'Custom / Other')
      : strategy;

    const finalEmotion = (emotion === 'Other')
      ? ((customEmotion.trim() || 'Other') as Emotion)
      : (emotion as Emotion);

    const safeWeightedEntry = Number.isFinite(weightedAvgEntry) ? weightedAvgEntry : 0;
    const safeWeightedExit = Number.isFinite(weightedAvgExit) ? weightedAvgExit : 0;
    const safeGross = Number.isFinite(grossPnL) ? grossPnL : 0;
    const safeNet = Number.isFinite(netPnL) ? netPnL : 0;

    const executionLegsData: TradeLeg[] = calculatedLegs.map((l, idx) => ({
      id: l.id || `leg_${idx + 1}`,
      entryPrice: Number((Number.isFinite(l.e) ? l.e : 0).toFixed(2)),
      exitPrice: Number((Number.isFinite(l.x) ? l.x : 0).toFixed(2)),
      quantity: Number.isFinite(l.q) ? l.q : 0,
    }));

    return {
      date,
      time,
      platform,
      segment,
      expiryDate,
      indexOrStock: selectedSymbol,
      strikePrice: finalStrike,
      buyOrSell,
      entryPrice: Number(safeWeightedEntry.toFixed(2)),
      exitPrice: Number(safeWeightedExit.toFixed(2)),
      quantity: Number.isFinite(totalQuantity) ? totalQuantity : 0,
      brokerage: Number(brokerage) || 0,
      taxes: Number(taxes) || 0,
      otherCharges: Number(otherCharges) || 0,
      grossPnL: Number(safeGross.toFixed(2)),
      netPnL: Number(safeNet.toFixed(2)),
      status,
      strategy: finalStrategy,
      emotion: finalEmotion,
      tradeType,
      otherTradeTypeReason: tradeType === 'Others' ? otherTradeTypeReason.trim() : '',
      notes,
      screenshot,
      holdingTimeMinutes: Number(holdingTimeMinutes) || 0,
      executionLegs: executionLegsData,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!strategy) {
      alert('Please select a Strategy Used.');
      return;
    }
    if (!emotion) {
      alert('Please select an Emotion State.');
      return;
    }
    if (totalQuantity <= 0) {
      alert('Please enter a valid quantity for your trade execution leg.');
      return;
    }
    const tradeObj = buildTradeObj();
    onSave(tradeObj, tradeToEdit?.id);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl my-8 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-xl">
                <PlusCircle className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {tradeToEdit ? 'Edit Trade Entry' : 'Add New Trade'}
                </h2>
                <p className="text-xs text-blue-100">
                  Fill in your execution parameters and emotions for journal logging.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body - Scrollable */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">

            {/* Live Calculation Banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                netPnL > 0
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : netPnL < 0
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div>
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">
                  Live P&L Preview
                </span>
                <div className="text-2xl font-black mt-0.5">
                  ₹{(netPnL ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs opacity-90 mt-0.5">
                  Gross P&L: ₹{(grossPnL ?? 0).toLocaleString('en-IN')} | Total Charges: ₹
                  {(Number(brokerage || 0) + Number(taxes || 0) + Number(otherCharges || 0)).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                    status === 'Profit'
                      ? 'bg-emerald-200 text-emerald-900'
                      : status === 'Loss'
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {status}
                </span>

                <button
                  type="button"
                  onClick={handleAutoEstimateTaxes}
                  className="px-3 py-1.5 bg-white shadow-xs hover:shadow-sm border border-slate-300 text-xs font-semibold text-slate-700 rounded-lg flex items-center space-x-1 cursor-pointer transition"
                >
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  <span>Auto Estimate Charges</span>
                </button>
              </div>
            </div>

            {/* Execution Type Section (4 Options Checkbox/Radio Selection) */}
            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Trade Execution Type / Mode *</span>
                </label>
                <span className="text-[11px] text-blue-700 font-medium">Select 1 option</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['Manual Trading', 'Algo Trading', 'Copy Trading', 'Others'] as ExecutionMode[]).map((mode, idx) => (
                  <label
                    key={mode}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition text-xs font-bold select-none ${
                      tradeType === mode
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tradeType === mode}
                      onChange={() => setTradeType(mode)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 accent-blue-600 cursor-pointer"
                    />
                    <span>{idx + 1}. {mode}</span>
                  </label>
                ))}
              </div>

              {/* If 'Others' is selected, show column/input for typing the reason */}
              {tradeType === 'Others' && (
                <div className="pt-2 border-t border-blue-200/80 mt-2">
                  <label className="block text-xs font-semibold text-blue-950 mb-1">
                    Type the Reason / Details for selecting &quot;Others&quot; *
                  </label>
                  <input
                    type="text"
                    value={otherTradeTypeReason}
                    onChange={(e) => setOtherTradeTypeReason(e.target.value)}
                    placeholder="Type the reason e.g., Paper Trade, Advisory Signal, Grid Automation..."
                    className="w-full px-3.5 py-2 rounded-xl border border-blue-300 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              )}
            </div>

            {/* Row 1: Date, Time, Segment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Trade Date *</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Trade Time *</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trading Segment *</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as Segment)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {SEGMENTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Index/Equity, Strike Price / Option Type OR Stock Name, Buy/Sell */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Index / Equity *</label>
                <select
                  value={indexOrStock}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIndexOrStock(val);
                    if (val === 'Equity / Stock') {
                      setSegment('Equity');
                    } else if (val !== 'Custom' && segment === 'Equity') {
                      setSegment('Options');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                >
                  {INDICES_AND_SYMBOLS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
                {indexOrStock === 'Custom' && (
                  <input
                    type="text"
                    value={customIndex}
                    onChange={(e) => setCustomIndex(e.target.value)}
                    placeholder="e.g. BANKEX, CRUDEOIL"
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                )}
              </div>

              {indexOrStock === 'Equity / Stock' || segment === 'Equity' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Name / Symbol *</label>
                  <input
                    type="text"
                    value={stockName}
                    onChange={(e) => setStockName(e.target.value)}
                    placeholder="e.g. RELIANCE, HDFCBANK, INFY..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Strike & Option Type *</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={strikeVal}
                      onChange={(e) => setStrikeVal(e.target.value)}
                      placeholder="e.g. 25000"
                      className="w-2/3 px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                      required
                    />
                    <div className="flex w-1/3 rounded-xl border border-slate-300 overflow-hidden text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setOptionType('CE')}
                        className={`flex-1 transition ${
                          optionType === 'CE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        CE
                      </button>
                      <button
                        type="button"
                        onClick={() => setOptionType('PE')}
                        className={`flex-1 transition ${
                          optionType === 'PE' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        PE
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Buy / Sell Side *</label>
                <div className="flex rounded-xl border border-slate-300 overflow-hidden text-sm font-bold h-[38px]">
                  <button
                    type="button"
                    onClick={() => setBuyOrSell('Buy')}
                    className={`flex-1 transition ${
                      buyOrSell === 'Buy' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuyOrSell('Sell')}
                    className={`flex-1 transition ${
                      buyOrSell === 'Sell' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Sell
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Executions & Tranches (Entry Price, Exit Price, Quantity) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-800 tracking-wider block">
                    Entry, Exit & Quantity {legs.length > 1 ? `(${legs.length} Execution Tranches)` : ''}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Enter your trade execution prices. Click &quot;+ Add More Execution Leg&quot; if you exited or entered in partial tranches for this single trade.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLegs([
                      ...legs,
                      {
                        id: 'leg_' + Date.now(),
                        entryPrice: legs[legs.length - 1]?.entryPrice || '',
                        exitPrice: '',
                        quantity: '',
                      },
                    ]);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition cursor-pointer flex items-center space-x-1 self-start sm:self-auto shrink-0 shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-blue-200" />
                  <span>+ Add More Execution Leg</span>
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {legs.map((leg, index) => {
                  const legPnL = calculatedLegs[index]?.gross || 0;
                  return (
                    <div key={leg.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      {legs.length > 1 && (
                        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
                          <span className="font-extrabold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                            Execution Leg {index + 1}
                          </span>
                          <div className="flex items-center space-x-3">
                            <span className={`font-mono font-bold ${legPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              Leg P&L: ₹{legPnL.toLocaleString('en-IN')}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (legs.length === 1) return;
                                setLegs(legs.filter((l) => l.id !== leg.id));
                              }}
                              className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              title="Remove this execution leg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Entry Price (₹) * {legs.length > 1 ? `Leg #${index + 1}` : ''}
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            value={leg.entryPrice}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setLegs(legs.map((l) => (l.id === leg.id ? { ...l, entryPrice: val } : l)));
                            }}
                            placeholder="e.g. 150.25"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Exit Price (₹) * {legs.length > 1 ? `Leg #${index + 1}` : ''}
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            value={leg.exitPrice}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setLegs(legs.map((l) => (l.id === leg.id ? { ...l, exitPrice: val } : l)));
                            }}
                            placeholder="e.g. 185.50"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Quantity (Lots/Units) * {legs.length > 1 ? `Leg #${index + 1}` : ''}
                          </label>
                          <input
                            type="number"
                            value={leg.quantity}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setLegs(legs.map((l) => (l.id === leg.id ? { ...l, quantity: val } : l)));
                            }}
                            placeholder="e.g. 100"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-900"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {legs.length > 1 && (
                <div className="p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                  <div>
                    <span>Total Tranche Qty: </span>
                    <span className="font-bold text-slate-900">{totalQuantity} units</span>
                  </div>
                  <div>
                    <span>Weighted Avg Entry: </span>
                    <span className="font-bold text-slate-900">₹{weightedAvgEntry.toFixed(2)}</span>
                  </div>
                  <div>
                    <span>Weighted Avg Exit: </span>
                    <span className="font-bold text-slate-900">₹{weightedAvgExit.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Brokerage & GST Amount Breakdown (Entered as Total) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-800 tracking-wider block">
                    Brokerage & GST Charges (Entered as Total)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Enter the total brokerage and GST charges for trade execution. No separate broker page required.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAutoEstimateTaxes}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer flex items-center space-x-1 self-start sm:self-auto shrink-0 shadow-2xs"
                >
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  <span>Auto-Estimate Total Charges</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Brokerage (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={brokerage}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    onChange={(e) => setBrokerage(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 40"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total GST & STT (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={taxes}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    onChange={(e) => setTaxes(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 25"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Other Total Charges (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={otherCharges}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    onChange={(e) => setOtherCharges(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 0"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Strategy, Emotion, Holding Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Strategy Used</label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>Select Strategy...</option>
                  {availableStrategies.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {(strategy === 'Custom / Other' || strategy === 'Other') && (
                  <input
                    type="text"
                    value={customStrategy}
                    onChange={(e) => setCustomStrategy(e.target.value)}
                    placeholder="Type strategy / reason..."
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emotion State</label>
                <select
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value as Emotion)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>Select Emotion...</option>
                  {EMOTIONS.map((em) => (
                    <option key={em} value={em}>
                      {em}
                    </option>
                  ))}
                </select>
                {emotion === 'Other' && (
                  <input
                    type="text"
                    value={customEmotion}
                    onChange={(e) => setCustomEmotion(e.target.value)}
                    placeholder="Type emotion / reason..."
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Holding Time (Minutes)</label>
                <input
                  type="number"
                  value={holdingTimeMinutes}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  onChange={(e) => setHoldingTimeMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Type holding time (e.g. 15)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Row 6: Trade Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trade Rationale & Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your entry setup, stop loss level, market structure, or lessons from this trade..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                {tradeToEdit ? 'Update Trade' : 'Save Trade'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
