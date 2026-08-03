import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Radio,
  Clock,
  Sparkles,
  PieChart,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { BrokerRequest } from '../types';
import { getStoredBrokerRequests } from '../utils/studentStorage';
import { subscribeBrokerRequestsFromFirestore } from '../utils/firebaseSync';

interface AdminBrokerAnalyticsProps {
  onInspectStudentJournal?: (email: string, name: string) => void;
}

export const AdminBrokerAnalytics: React.FC<AdminBrokerAnalyticsProps> = ({
  onInspectStudentJournal,
}) => {
  const [requests, setRequests] = useState<BrokerRequest[]>(() => getStoredBrokerRequests());

  useEffect(() => {
    const unsub = subscribeBrokerRequestsFromFirestore((allReqs) => {
      if (allReqs) {
        setRequests(allReqs);
      }
    });

    const handleLocalBrokerReqs = (e: Event) => {
      const customEvt = e as CustomEvent<BrokerRequest[]>;
      if (customEvt.detail) {
        setRequests(customEvt.detail);
      } else {
        setRequests(getStoredBrokerRequests());
      }
    };

    window.addEventListener('broker_requests_changed', handleLocalBrokerReqs);

    return () => {
      unsub();
      window.removeEventListener('broker_requests_changed', handleLocalBrokerReqs);
    };
  }, []);

  // Aggregated Stats
  const { totalRequests, uniqueBrokersCount, topBroker, brokerCounts, chartData } = useMemo(() => {
    const total = requests.length;
    const countsMap: { [key: string]: number } = {};

    requests.forEach((req) => {
      const bName =
        req.brokerName === 'Other Broker' && req.customBrokerName
          ? req.customBrokerName.trim()
          : req.brokerName;

      countsMap[bName] = (countsMap[bName] || 0) + 1;
    });

    const sortedList = Object.entries(countsMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.count - a.count);

    const top = sortedList.length > 0 ? sortedList[0].name : 'None';
    const uniqueCount = sortedList.length;

    return {
      totalRequests: total,
      uniqueBrokersCount: uniqueCount,
      topBroker: top,
      brokerCounts: countsMap,
      chartData: sortedList,
    };
  }, [requests]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl shadow-md">
            <BarChart3 className="w-6 h-6 stroke-[2.25]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-slate-900">
                Broker Demand Analytics & Market Survey
              </h2>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px] rounded-full uppercase tracking-wider">
                Student Preferences
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Aggregated survey statistics showing which brokers students use most to prioritize direct API auto-sync development.
            </p>
          </div>
        </div>

        <button
          onClick={() => setRequests(getStoredBrokerRequests())}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Survey</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Requests */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Survey Votes</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white">{totalRequests}</div>
          <span className="text-[11px] text-slate-300 mt-1 block">
            Student preferences recorded
          </span>
        </div>

        {/* Top Requested Broker */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Most Demanded Broker</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white truncate">{topBroker}</div>
          <span className="text-[11px] text-emerald-300 mt-1 block font-semibold">
            #1 Priority for Direct API Integration
          </span>
        </div>

        {/* Unique Brokers */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Brokers Requested</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{uniqueBrokersCount}</div>
          <span className="text-[11px] text-slate-300 mt-1 block">
            Distinct brokerage platforms
          </span>
        </div>
      </div>

      {/* Demand Distribution Chart & Breakdown */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Broker Popularity & Integration Priority Breakdown</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Sorted by total student votes
          </span>
        </div>

        {chartData.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
            <Radio className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold">No broker preference submissions yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              When students select their broker on the Broker Connection page, analytics will render here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chartData.map((item, idx) => {
              const count = item.count;
              const pct = parseFloat(item.percentage);

              return (
                <div
                  key={item.name}
                  className="p-4 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-6 h-6 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-amber-500 text-white shadow-xs'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {item.name}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold text-[10px] uppercase">
                          Highest Demand
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <span className="font-bold text-slate-700">
                        {count} {count === 1 ? 'Vote' : 'Votes'}
                      </span>
                      <span className="font-black text-indigo-700 font-mono w-14">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Fill Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${
                        idx === 0
                          ? 'bg-gradient-to-r from-amber-500 to-indigo-600'
                          : idx === 1
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          : 'bg-gradient-to-r from-slate-500 to-indigo-500'
                      }`}
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual Student Broker Submissions Table */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Student Broker Submissions List</h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
              {requests.length} Submissions
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Updated in real-time</span>
        </div>

        {requests.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No individual student broker submissions logged yet.</p>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3.5">Student Email & Name</th>
                    <th className="py-2.5 px-3.5">Selected Broker</th>
                    <th className="py-2.5 px-3.5">Notes / Feature Request</th>
                    <th className="py-2.5 px-3.5">Submitted On</th>
                    {onInspectStudentJournal && <th className="py-2.5 px-3.5 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {requests.map((req) => {
                    const bName =
                      req.brokerName === 'Other Broker' && req.customBrokerName
                        ? req.customBrokerName
                        : req.brokerName;

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3.5">
                          <p className="font-extrabold text-slate-900 text-xs">{req.userEmail}</p>
                          {req.userName && <p className="text-[11px] text-slate-500">{req.userName}</p>}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-[11px]">
                            <Radio className="w-3 h-3 text-indigo-600" />
                            <span>{bName}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 max-w-xs truncate text-slate-600">
                          {req.notes ? req.notes : <span className="text-slate-400 italic">No notes</span>}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-500">
                          {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        {onInspectStudentJournal && (
                          <td className="py-2.5 px-3.5 text-right">
                            <button
                              onClick={() =>
                                onInspectStudentJournal(req.userEmail, req.userName || req.userEmail.split('@')[0])
                              }
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
