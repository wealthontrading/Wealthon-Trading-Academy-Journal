import React, { useState, useEffect } from 'react';
import {
  Radio,
  Zap,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Server,
  TrendingUp,
} from 'lucide-react';
import { BrokerRequest, UserSession } from '../types';
import { getStoredBrokerRequests, saveStoredBrokerRequest } from '../utils/studentStorage';
import { subscribeBrokerRequestsFromFirestore } from '../utils/firebaseSync';

interface BrokerConnectionPageProps {
  userSession?: UserSession | null;
}

const POPULAR_BROKERS = [
  { name: 'Zerodha (Kite)', tag: 'Popular', color: 'from-blue-600 to-indigo-700' },
  { name: 'Angel One', tag: 'Popular', color: 'from-orange-500 to-amber-600' },
  { name: 'Groww', tag: 'Popular', color: 'from-emerald-500 to-teal-600' },
  { name: 'Upstox', tag: 'Popular', color: 'from-purple-600 to-indigo-600' },
  { name: 'Dhan', tag: 'Fast API', color: 'from-green-600 to-emerald-700' },
  { name: 'ICICI Direct', tag: 'Bank Broker', color: 'from-rose-600 to-red-700' },
  { name: 'Kotak Securities', tag: 'Bank Broker', color: 'from-red-600 to-rose-700' },
  { name: '5Paisa', tag: 'Discount', color: 'from-sky-500 to-blue-600' },
  { name: 'Fyers', tag: 'Pro Traders', color: 'from-blue-700 to-cyan-600' },
  { name: 'Alice Blue', tag: 'Discount', color: 'from-indigo-600 to-blue-700' },
  { name: 'Paytm Money', tag: 'Mobile', color: 'from-cyan-600 to-blue-600' },
  { name: 'Motilal Oswal', tag: 'Full Service', color: 'from-amber-600 to-yellow-700' },
  { name: 'Other Broker', tag: 'Custom', color: 'from-slate-700 to-slate-900' },
];

export const BrokerConnectionPage: React.FC<BrokerConnectionPageProps> = ({ userSession }) => {
  const userEmail = userSession?.email || 'student@tradejournal.in';
  const userName = userSession?.name || 'Student';

  const [selectedBroker, setSelectedBroker] = useState<string>('Zerodha (Kite)');
  const [customBroker, setCustomBroker] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [existingRequest, setExistingRequest] = useState<BrokerRequest | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load existing submission for this student
  useEffect(() => {
    const checkLocal = () => {
      const allReqs = getStoredBrokerRequests();
      const userReq = allReqs.find(
        (r) => r.userEmail && r.userEmail.toLowerCase() === userEmail.toLowerCase()
      );
      if (userReq) {
        setExistingRequest(userReq);
        setSelectedBroker(userReq.brokerName);
        if (userReq.customBrokerName) setCustomBroker(userReq.customBrokerName);
        if (userReq.notes) setNotes(userReq.notes);
      }
    };

    checkLocal();

    const unsub = subscribeBrokerRequestsFromFirestore((allReqs) => {
      const userReq = allReqs.find(
        (r) => r.userEmail && r.userEmail.toLowerCase() === userEmail.toLowerCase()
      );
      if (userReq) {
        setExistingRequest(userReq);
        setSelectedBroker(userReq.brokerName);
        if (userReq.customBrokerName) setCustomBroker(userReq.customBrokerName);
        if (userReq.notes) setNotes(userReq.notes);
      }
    });

    return () => unsub();
  }, [userEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBroker) return;
    if (selectedBroker === 'Other Broker' && !customBroker.trim()) {
      alert('Please specify your broker name.');
      return;
    }

    setIsSubmitting(true);

    const newReq: BrokerRequest = {
      id: `${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_req`,
      brokerName: selectedBroker,
      customBrokerName: selectedBroker === 'Other Broker' ? customBroker.trim() : undefined,
      userEmail,
      userName,
      notes: notes.trim() || undefined,
      submittedAt: Date.now(),
    };

    saveStoredBrokerRequest(newReq);
    setExistingRequest(newReq);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
    }, 400);
  };

  const currentDisplayBrokerName =
    existingRequest?.brokerName === 'Other Broker' && existingRequest.customBrokerName
      ? existingRequest.customBrokerName
      : existingRequest?.brokerName || selectedBroker;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-black uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Feature Coming Soon</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center space-x-2">
              <Radio className="w-7 h-7 text-indigo-400 shrink-0" />
              <span>Broker Direct API Connection</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Direct API auto-synchronization for instant trade imports is currently under active development.
              Please vote for your primary broker below to help our engineering team prioritize direct broker integration!
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl text-xs space-y-2 shrink-0 w-full md:w-auto">
            <div className="flex items-center space-x-2 text-indigo-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Direct Sync Benefits</span>
            </div>
            <ul className="text-slate-300 space-y-1 pl-1 text-[11px]">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Zero manual entry errors</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Auto-fetch buy/sell prices & charges</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Encrypted 256-bit API keys protection</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Grid: Form & Broker Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Survey Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Select Your Trading Broker</h2>
              <p className="text-xs text-slate-500">
                Which broker do you execute your daily trades on?
              </p>
            </div>
          </div>

          {/* Submission Feedback Alert */}
          {submittedSuccess && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-900 text-xs space-y-1 animate-fadeIn">
              <div className="font-extrabold flex items-center space-x-2 text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Preference Saved Successfully!</span>
              </div>
              <p className="text-emerald-700 leading-relaxed pt-1">
                Thank you! Your request for <strong>{currentDisplayBrokerName}</strong> has been registered.
                Our team will prioritize <strong>{currentDisplayBrokerName}</strong> integration. Direct connection will be available soon!
              </p>
            </div>
          )}

          {existingRequest && !submittedSuccess && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Current Recorded Preference</span>
                <span>
                  You requested integration for <strong>{currentDisplayBrokerName}</strong>. You can update your choice anytime below.
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Broker Selection Options Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Choose Primary Broker *
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {POPULAR_BROKERS.map((item) => {
                  const isSelected = selectedBroker === item.name;
                  return (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => {
                        setSelectedBroker(item.name);
                        setSubmittedSuccess(false);
                      }}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-semibold">{item.tag}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs block leading-tight">{item.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Broker Field if "Other" selected */}
            {selectedBroker === 'Other Broker' && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specify Broker Name *
                </label>
                <input
                  type="text"
                  required
                  value={customBroker}
                  onChange={(e) => setCustomBroker(e.target.value)}
                  placeholder="Enter your broker name (e.g. Sharekhan, Espresso, SAS Online)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-slate-800 font-medium"
                />
              </div>
            )}

            {/* Optional Notes / Feedback */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Additional Notes or Feature Wish (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. I trade index options on mobile app, or I use multiple sub-accounts..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-slate-800"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Recording Preference...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {existingRequest ? 'Update Broker Preference' : 'Submit Broker Preference'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Information & Roadmap */}
        <div className="lg:col-span-5 space-y-5">
          {/* Status Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white border border-indigo-800 shadow-md">
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Direct Sync Roadmap</span>
            </div>

            <h3 className="text-lg font-extrabold text-white mb-2">
              How Broker Integration Will Work
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Once direct API sync is enabled, your daily trades will automatically sync straight into your WealthOn Trading Journal without requiring manual entry or CSV upload.
            </p>

            <div className="space-y-3 pt-2 border-t border-indigo-800/80">
              <div className="flex items-start space-x-3 text-xs">
                <span className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <span className="font-bold text-slate-100 block">Select Broker & Enter API Key</span>
                  <span className="text-slate-400 text-[11px]">Secure read-only credentials generated from broker portal.</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <span className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <span className="font-bold text-slate-100 block">Automatic End-Of-Day Fetch</span>
                  <span className="text-slate-400 text-[11px]">Trades, brokerage charges, STT & net P&L auto-calculate.</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <span className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <span className="font-bold text-slate-100 block">Review & Add Emotions/Notes</span>
                  <span className="text-slate-400 text-[11px]">Focus purely on trading psychology and performance analysis.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Help Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800 flex items-center space-x-2 text-sm">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Need Custom CSV or Import Assistance?</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              If your broker exports trade books in Excel or CSV, you can import them anytime directly into your journal using the bulk trade feature!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
