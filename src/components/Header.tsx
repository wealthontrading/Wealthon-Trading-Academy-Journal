import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Calendar, User, ShieldCheck, Settings, Plus, BarChart3, BookOpen, ShieldAlert, GraduationCap, Send, CheckCircle2, Radio, Link2, Bot, Sparkles, Headphones, Layers3 } from 'lucide-react';
import { TraderProfile, UserSession } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  profile: TraderProfile;
  activeTab: 'dashboard' | 'history' | 'strategyBuilder' | 'analytics' | 'journal' | 'brokerConnection' | 'aiAssistant';
  setActiveTab: (tab: 'dashboard' | 'history' | 'strategyBuilder' | 'analytics' | 'journal' | 'brokerConnection' | 'aiAssistant') => void;
  onOpenAddTrade: () => void;
  onOpenSettings: () => void;
  onOpenCustomerSupport?: () => void;
  onOpenPrivacy?: () => void;
  onOpenDisclaimer?: () => void;
  onOpenSendToMentor?: () => void;
  userSession?: UserSession | null;
  onLogout?: () => void;
  onOpenAdminPortal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeTab,
  setActiveTab,
  onOpenAddTrade,
  onOpenSettings,
  onOpenCustomerSupport,
  onOpenPrivacy,
  onOpenDisclaimer,
  onOpenSendToMentor,
  userSession,
  onLogout,
  onOpenAdminPortal,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // 12-hour format with seconds (e.g., 09:45:23 PM)
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
      setTimeStr(`${formattedHours}:${minutes}:${seconds} ${ampm}`);

      // Date string format e.g. 26 July 2026
      const day = now.getDate();
      const month = now.toLocaleDateString('en-IN', { month: 'long' });
      const year = now.getFullYear();
      setDateStr(`${day} ${month} ${year}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Info Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Main Title & Branding */}
          <div>
            <div className="flex items-center space-x-3.5">
              <Logo className="text-3xl" />
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    {profile.instituteName || 'WealthOn Trading Academy'}
                  </span>
                  
                  {/* Student Dashboard Active Plan - Limited Badge */}
                  <span className="text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active Plan - Limited</span>
                  </span>

                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" title="System Active"></span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Journal Today, Profit Tomorrow
                </h1>
              </div>
            </div>

            {/* Sub-details: Trader Name, Platform, Date & Live Clock */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs sm:text-sm text-slate-600 font-medium">
              <div className="flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-800">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold">
                  {profile.name ? (
                    <>
                      <span>{profile.name}</span>
                      {userSession?.email && (
                        <span className="text-slate-500 font-normal ml-1">({userSession.email})</span>
                      )}
                    </>
                  ) : (
                    userSession?.email || 'Student'
                  )}
                </span>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="ml-1 text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline bg-rose-50 px-1.5 py-0.5 rounded cursor-pointer"
                    title="Switch student account or log out"
                  >
                    Switch
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>{profile.platform || 'Zerodha (Kite)'}</span>
              </div>

              <div className="flex items-center space-x-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{dateStr}</span>
              </div>

              <div className="flex items-center space-x-1.5 font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold tracking-wider">{timeStr}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-end md:self-auto">
            {onOpenAdminPortal && (
              <button
                onClick={onOpenAdminPortal}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                title="Switch to Admin Control Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admin Portal</span>
              </button>
            )}

            {onOpenSendToMentor && (
              <button
                onClick={onOpenSendToMentor}
                className="py-2.5 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs sm:text-sm rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                title="Send Trading Journal Report to Mentor / Academy"
              >
                <Send className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Send to Mentor</span>
                <span className="sm:hidden">Mentor</span>
              </button>
            )}

            {onOpenCustomerSupport && (
              <button
                onClick={onOpenCustomerSupport}
                className="py-2.5 px-3 sm:px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs sm:text-sm rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                title="Customer Care Support (+91 8547742160)"
              >
                <Headphones className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Support</span>
              </button>
            )}

            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition flex items-center justify-center cursor-pointer"
              title="Settings & Data Management"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenAddTrade}
              className="py-2.5 px-4 sm:px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Trade</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between overflow-x-auto no-scrollbar">
          <nav className="flex space-x-1.5 min-w-max p-1 bg-slate-100 rounded-xl relative">
            {[
              { id: 'dashboard', label: 'Dashboard', Icon: BarChart3 },
              { id: 'history', label: 'Trade History', Icon: Clock },
              { id: 'strategyBuilder', label: 'Strategy Builder', Icon: Layers3 },
              { id: 'analytics', label: 'Analytics & Charts', Icon: BarChart3 },
              { id: 'journal', label: 'Journal & Goals', Icon: BookOpen },
              { id: 'aiAssistant', label: 'AI Assistant', Icon: Bot, badge: 'BETA', isGradient: true },
              { id: 'brokerConnection', label: 'Broker Connection', Icon: Radio },
            ].map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.Icon;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center space-x-2 cursor-pointer z-10 ${
                    isActive
                      ? item.isGradient
                        ? 'text-white font-bold'
                        : 'text-blue-700 font-bold'
                      : item.id === 'aiAssistant'
                      ? 'text-indigo-700 hover:text-indigo-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeHeaderTabPill"
                      className={`absolute inset-0 rounded-lg shadow-2xs -z-10 ${
                        item.isGradient
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-indigo-500/20'
                          : 'bg-white border border-slate-200 shadow-xs'
                      }`}
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}

                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive && !item.isGradient ? 'text-blue-600 scale-105' : ''}`} />
                  <span>{item.label}</span>

                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider transition-colors ${
                        isActive ? 'bg-white text-white' : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
