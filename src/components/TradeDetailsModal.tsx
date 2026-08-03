import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, IndianRupee, Tag, Smile, FileText, Trash2, Edit2 } from 'lucide-react';
import { Trade } from '../types';
import { formatINR } from '../utils/calculations';

interface TradeDetailsModalProps {
  trade: Trade | null;
  onClose: () => void;
  onEdit: (trade: Trade) => void;
  onDelete?: (id: string) => void;
}

export const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
  trade,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!trade) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div
              className={`p-6 text-white flex items-center justify-between ${
                trade.netPnL > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                  : trade.netPnL < 0
                  ? 'bg-gradient-to-r from-rose-600 to-red-700'
                  : 'bg-gradient-to-r from-slate-700 to-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase tracking-wider font-bold opacity-80">
                    {trade.segment} Trade
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">
                    {trade.buyOrSell}
                  </span>
                </div>
                <h2 className="text-2xl font-black mt-1">
                  {trade.indexOrStock} {trade.strikePrice}
                </h2>
              </div>

              <div className="text-right">
                <div className="text-2xl font-extrabold">{formatINR(trade.netPnL)}</div>
                <span className="text-xs opacity-90">Net Realized P&L</span>
              </div>
            </div>

            {/* Details Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm text-slate-700">
              {/* Meta Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Date & Time</span>
                  <span className="font-semibold text-slate-900">{trade.date} {trade.time}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Platform</span>
                  <span className="font-semibold text-slate-900">{trade.platform || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Holding Time</span>
                  <span className="font-semibold text-slate-900">{trade.holdingTimeMinutes ? `${trade.holdingTimeMinutes} mins` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status</span>
                  <span className={`font-bold ${trade.status === 'Profit' ? 'text-emerald-600' : trade.status === 'Loss' ? 'text-rose-600' : 'text-slate-600'}`}>
                    {trade.status}
                  </span>
                </div>
              </div>

              {/* Price & Quantity Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Entry Price</span>
                  <span className="text-base font-bold text-slate-900">₹{trade.entryPrice}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Exit Price</span>
                  <span className="text-base font-bold text-slate-900">₹{trade.exitPrice}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Quantity</span>
                  <span className="text-base font-bold text-slate-900">{trade.quantity}</span>
                </div>
              </div>

              {/* Charges Breakdown */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold text-slate-700 pb-1 border-b border-slate-200">
                  <span>Gross P&L:</span>
                  <span>₹{trade.grossPnL}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Brokerage:</span>
                  <span>₹{trade.brokerage}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST & Taxes:</span>
                  <span>₹{trade.taxes}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Other Charges:</span>
                  <span>₹{trade.otherCharges}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                  <span>Net P&L:</span>
                  <span className={trade.netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {formatINR(trade.netPnL)}
                  </span>
                </div>
              </div>

              {/* Strategy, Execution Mode & Emotion */}
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Execution: {trade.tradeType || 'Manual Trading'} {trade.tradeType === 'Others' && trade.otherTradeTypeReason ? `(${trade.otherTradeTypeReason})` : ''}</span>
                </div>

                <div className="px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold text-xs rounded-lg border border-blue-200 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Strategy: {trade.strategy || 'N/A'}</span>
                </div>

                <div className="px-3 py-1.5 bg-purple-50 text-purple-700 font-semibold text-xs rounded-lg border border-purple-200 flex items-center space-x-1">
                  <Smile className="w-3.5 h-3.5" />
                  <span>Emotion: {trade.emotion || 'N/A'}</span>
                </div>
              </div>

              {/* Notes */}
              {trade.notes && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-600 uppercase flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Trade Notes</span>
                  </span>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-sm">{trade.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    onClose();
                    onEdit(trade);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Trade</span>
                </button>
                {onDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Trade</span>
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Delete Trade Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
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
                    Are you sure you want to delete this trade for <span className="font-bold text-slate-900">{trade.indexOrStock} {trade.strikePrice}</span> logged on <span className="font-bold text-slate-900">{trade.date}</span>?
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
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  No, Keep Trade
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    if (onDelete) {
                      onDelete(trade.id);
                      onClose();
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
    </>
  );
};
