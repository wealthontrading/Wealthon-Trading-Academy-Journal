import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  addTrade,
  addMultipleTrades,
  deleteTrade,
  exportBackupJSON,
  getStoredDailyNotes,
  getStoredGoals,
  getStoredProfile,
  getStoredRules,
  getStoredTrades,
  getStoredStrategies,
  saveStoredStrategies,
  addCustomStrategy,
  editCustomStrategy,
  deleteCustomStrategy,
  importBackupJSON,
  resetAllData,
  saveStoredDailyNotes,
  saveStoredGoals,
  saveStoredProfile,
  saveStoredRules,
  saveStoredTrades,
  seedSampleTrades,
  updateTrade,
} from './utils/storage';
import { calculateMetrics } from './utils/calculations';
import { DailyNote, StrategyItem, SystemMaintenanceState, Trade, TraderProfile, TradingGoal, TradingRule, UserSession } from './types';
import { getStoredMaintenanceState, getStoredSession, saveStoredSession } from './utils/studentStorage';
import {
  subscribeDailyNotesFromFirestore,
  subscribeMaintenanceModeFromFirestore,
  subscribeProfileFromFirestore,
  subscribeStudentsFromFirestore,
  subscribeTradesFromFirestore,
  subscribeStrategiesFromFirestore,
  subscribeRulesFromFirestore,
  subscribeGoalsFromFirestore,
} from './utils/firebaseSync';
import { MaintenanceOverlay } from './components/MaintenanceOverlay';
import { BrokerConnectionPage } from './components/BrokerConnectionPage';
import { AITradingAssistantView } from './components/AITradingAssistantView';
import { StrategyBuilderView } from './components/StrategyBuilderView';

// Components
import { Header } from './components/Header';
import { FirstLaunchModal } from './components/FirstLaunchModal';
import { DailyQuoteCard } from './components/DailyQuoteCard';
import { DashboardStats } from './components/DashboardStats';
import { TradeFormModal } from './components/TradeFormModal';
import { TradeDetailsModal } from './components/TradeDetailsModal';
import { TradeHistory } from './components/TradeHistory';
import { AnalyticsView } from './components/AnalyticsView';
import { JournalNotesView } from './components/JournalNotesView';
import { SettingsModal } from './components/SettingsModal';
import { PrivacyModal } from './components/PrivacyModal';
import { DisclaimerModal } from './components/DisclaimerModal';
import { SendToMentorModal } from './components/SendToMentorModal';
import { CustomerSupportModal } from './components/CustomerSupportModal';
import { Footer } from './components/Footer';
import { LoginModal } from './components/auth/LoginModal';
import { AdminPortal } from './components/AdminPortal';
import { JournalSavedModal } from './components/JournalSavedModal';
import { GoalToastNotification, ToastMessage, getRandomReinforcementQuote } from './components/GoalToastNotification';
import { ExecutionModePerformanceTable } from './components/ExecutionModePerformanceTable';
import { MonthlyPerformance } from './components/MonthlyPerformance';
import { Eye, ShieldCheck, ArrowLeft, Bot, Sparkles, ArrowRight, Clock } from 'lucide-react';

import { RenewalPage } from './components/RenewalPage';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => getStoredSession());
  const [viewMode, setViewMode] = useState<'student' | 'admin'>('student');

  // Maintenance State (Synced across Firestore + Local Storage)
  const [maintenanceState, setMaintenanceState] = useState<SystemMaintenanceState>(() =>
    getStoredMaintenanceState()
  );
  const [dismissAdminMaintPreview, setDismissAdminMaintPreview] = useState(false);

  useEffect(() => {
    // Firestore real-time maintenance sync
    const unsubMaint = subscribeMaintenanceModeFromFirestore((fsMaint) => {
      if (fsMaint) {
        setMaintenanceState(fsMaint);
      }
    });

    // Local custom event for same-window / same-tab instant sync
    const handleLocalMaint = (e: Event) => {
      const customEvt = e as CustomEvent<SystemMaintenanceState>;
      if (customEvt.detail) {
        setMaintenanceState(customEvt.detail);
      } else {
        setMaintenanceState(getStoredMaintenanceState());
      }
    };

    window.addEventListener('maintenance_state_changed', handleLocalMaint);

    return () => {
      unsubMaint();
      window.removeEventListener('maintenance_state_changed', handleLocalMaint);
    };
  }, []);

  // Inspection mode for Admin
  const [inspectedStudent, setInspectedStudent] = useState<{ email: string; name: string } | null>(null);

  // Active email address to scope all data reads and writes
  const activeUserEmail = inspectedStudent ? inspectedStudent.email : session?.email;

  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [profile, setProfile] = useState<TraderProfile>(() => getStoredProfile(activeUserEmail));
  const [trades, setTrades] = useState<Trade[]>(() => getStoredTrades(activeUserEmail));
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>(() => getStoredDailyNotes(activeUserEmail));
  const [rules, setRules] = useState<TradingRule[]>(() => getStoredRules(activeUserEmail));
  const [goals, setGoals] = useState<TradingGoal[]>(() => getStoredGoals(activeUserEmail));
  const [strategies, setStrategies] = useState<StrategyItem[]>(() => getStoredStrategies(activeUserEmail));

  // Reload user-scoped data whenever active user email changes and attach Firestore listeners
  useEffect(() => {
    if (activeUserEmail) {
      setProfile(getStoredProfile(activeUserEmail));
      setTrades(getStoredTrades(activeUserEmail));
      setDailyNotes(getStoredDailyNotes(activeUserEmail));
      setRules(getStoredRules(activeUserEmail));
      setGoals(getStoredGoals(activeUserEmail));
      setStrategies(getStoredStrategies(activeUserEmail));

      const unsubscribeTrades = subscribeTradesFromFirestore(activeUserEmail, (fsTrades) => {
        if (fsTrades) {
          setTrades(fsTrades);
        }
      });

      const unsubscribeNotes = subscribeDailyNotesFromFirestore(activeUserEmail, (fsNotes) => {
        if (fsNotes) {
          setDailyNotes(fsNotes);
        }
      });

      const unsubscribeProfile = subscribeProfileFromFirestore(activeUserEmail, (fsProfile) => {
        if (fsProfile) {
          setProfile(fsProfile);
        }
        setIsProfileLoaded(true);
      });

      const unsubscribeStrategies = subscribeStrategiesFromFirestore(activeUserEmail, (fsStrategies) => {
        if (fsStrategies) {
          setStrategies(fsStrategies);
        }
      });

      const unsubscribeRules = subscribeRulesFromFirestore(activeUserEmail, (fsRules) => {
        if (fsRules) {
          setRules(fsRules);
        }
      });

      const unsubscribeGoals = subscribeGoalsFromFirestore(activeUserEmail, (fsGoals) => {
        if (fsGoals) {
          setGoals(fsGoals);
        }
      });

      return () => {
        unsubscribeTrades();
        unsubscribeNotes();
        unsubscribeProfile();
        unsubscribeStrategies();
        unsubscribeRules();
        unsubscribeGoals();
      };
    }
  }, [activeUserEmail]);

  // Global real-time student account listener (keeps student list synced for login & checks access)
  useEffect(() => {
    const unsubscribeStudents = subscribeStudentsFromFirestore((studentsList) => {
      if (Array.isArray(studentsList) && session && session.role === 'student') {
        const currentEmail = session.email.trim().toLowerCase();
        const match = studentsList.find((s) => s.email.trim().toLowerCase() === currentEmail);
        if (match && (match.status === 'rejected' || match.status === 'disabled')) {
          alert(`Your account access (${session.email}) has been modified or removed by the administrator.`);
          handleLogout();
        }
      }
    });
    return () => unsubscribeStudents();
  }, [session]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'strategyBuilder' | 'analytics' | 'journal' | 'brokerConnection' | 'aiAssistant'>('dashboard');

  // Modals
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [selectedViewTrade, setSelectedViewTrade] = useState<Trade | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isCustomerSupportOpen, setIsCustomerSupportOpen] = useState(false);
  const [isSendToMentorOpen, setIsSendToMentorOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  const [initialStrategyForAddTrade, setInitialStrategyForAddTrade] = useState<string>('');

  const handleAddStrategy = (strat: Omit<StrategyItem, 'id' | 'createdAt'>) => {
    const newStrat = addCustomStrategy(strat, activeUserEmail);
    setStrategies((prev) => [newStrat, ...prev.filter((s) => s.id !== newStrat.id)]);
  };

  const handleEditStrategy = (id: string, updatedFields: Partial<Omit<StrategyItem, 'id' | 'createdAt'>>) => {
    const updated = editCustomStrategy(id, updatedFields, activeUserEmail);
    if (updated) {
      setStrategies((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  };

  const handleDeleteStrategy = (id: string) => {
    deleteCustomStrategy(id, activeUserEmail);
    setStrategies((prev) => prev.filter((s) => s.id !== id));
  };

  const handleOpenAddTradeWithStrategy = (strategyName: string) => {
    setInitialStrategyForAddTrade(strategyName);
    setTradeToEdit(null);
    setIsAddTradeOpen(true);
  };

  const handleQuickSaveAllData = () => {
    saveStoredDailyNotes(dailyNotes, activeUserEmail);
    saveStoredRules(rules, activeUserEmail);
    saveStoredGoals(goals, activeUserEmail);
    saveStoredTrades(trades, activeUserEmail);
    saveStoredStrategies(strategies, activeUserEmail);
    saveStoredProfile(profile, activeUserEmail);
    setIsSavedModalOpen(true);
  };

  // Prevent mouse wheel scrolling from changing number input values globally
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const activeEl = document.activeElement as HTMLInputElement | null;
      if (activeEl && activeEl.tagName === 'INPUT' && activeEl.type === 'number') {
        activeEl.blur();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Navigation History / Back button Effect
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').split('?')[0];
    const validTabs = ['dashboard', 'history', 'strategyBuilder', 'analytics', 'journal', 'brokerConnection', 'aiAssistant'];
    const initialTab = validTabs.includes(hash)
      ? (hash as 'dashboard' | 'history' | 'strategyBuilder' | 'analytics' | 'journal' | 'brokerConnection' | 'aiAssistant')
      : 'dashboard';

    setActiveTab(initialTab);

    const handlePopState = () => {
      const currentHash = window.location.hash.replace('#', '').split('?')[0];
      if (validTabs.includes(currentHash)) {
        setActiveTab(currentHash as 'dashboard' | 'history' | 'strategyBuilder' | 'analytics' | 'journal' | 'brokerConnection' | 'aiAssistant');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tab: 'dashboard' | 'history' | 'strategyBuilder' | 'analytics' | 'journal' | 'brokerConnection' | 'aiAssistant') => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      window.location.hash = `#${tab}`;
    }
  };

  const handleOpenAddTrade = (t?: Trade | null) => {
    if (t) setTradeToEdit(t);
    else setTradeToEdit(null);
    setIsAddTradeOpen(true);
  };

  const handleCloseAddTrade = () => {
    setIsAddTradeOpen(false);
    setTradeToEdit(null);
  };

  const handleOpenViewTrade = (t: Trade) => {
    setSelectedViewTrade(t);
  };

  const handleCloseViewTrade = () => {
    setSelectedViewTrade(null);
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  const handleOpenPrivacy = () => {
    setIsPrivacyOpen(true);
  };

  const handleClosePrivacy = () => {
    setIsPrivacyOpen(false);
  };

  const handleOpenDisclaimer = () => {
    setIsDisclaimerOpen(true);
  };

  const handleCloseDisclaimer = () => {
    setIsDisclaimerOpen(false);
  };

  const handleOpenCustomerSupport = () => {
    setIsCustomerSupportOpen(true);
  };

  const handleCloseCustomerSupport = () => {
    setIsCustomerSupportOpen(false);
  };

  const handleOpenSendToMentor = () => {
    setIsSendToMentorOpen(true);
  };


  const handleCloseSendToMentor = () => {
    setIsSendToMentorOpen(false);
  };

  // Metrics
  const metrics = useMemo(() => calculateMetrics(trades), [trades]);

  const isFirstLaunchNeeded = isProfileLoaded && !profile.isFirstLaunchCompleted && session?.role !== 'admin' && viewMode === 'student';

  const handleFirstLaunchSave = (name: string, platform: string) => {
    const updated: TraderProfile = {
      ...profile,
      name,
      platform,
      isFirstLaunchCompleted: true,
    };
    setProfile(updated);
    saveStoredProfile(updated, activeUserEmail);
  };

  const handleSaveProfile = (newProfile: TraderProfile) => {
    setProfile(newProfile);
    saveStoredProfile(newProfile, activeUserEmail);
  };

  // Trade Handlers
  const syncStrategiesFromTrades = (newTrades: Omit<Trade, 'id' | 'createdAt'>[]) => {
    setStrategies(currentStrategies => {
      let updatedStrategies = [...currentStrategies];
      const existingNames = updatedStrategies.map(s => s.name.toLowerCase().trim());
      let hasNew = false;
      
      newTrades.forEach(trade => {
        const stratName = trade.strategy?.trim();
        if (stratName && stratName.toLowerCase() !== 'unknown' && stratName !== '-' && !existingNames.includes(stratName.toLowerCase())) {
          existingNames.push(stratName.toLowerCase());
          const newStrat = addCustomStrategy({
            name: stratName,
            description: 'Auto-added from imported trades',
            isPreset: false,
          }, activeUserEmail);
          updatedStrategies = [newStrat, ...updatedStrategies.filter((s) => s.id !== newStrat.id)];
          hasNew = true;
        }
      });
      
      return hasNew ? updatedStrategies : currentStrategies;
    });
  };

  const handleSaveTrade = (tradeData: Omit<Trade, 'id' | 'createdAt'>, existingId?: string) => {
    let updatedList: Trade[];
    if (existingId) {
      updatedList = updateTrade(existingId, tradeData, activeUserEmail);
    } else {
      addTrade(tradeData, activeUserEmail);
      updatedList = getStoredTrades(activeUserEmail);
    }
    setTrades(updatedList);
    syncStrategiesFromTrades([tradeData]);
    setIsAddTradeOpen(false);
    setTradeToEdit(null);
    setIsSavedModalOpen(true);
  };

  const handleAddMultipleTrades = (tradesData: Omit<Trade, 'id' | 'createdAt'>[]) => {
    addMultipleTrades(tradesData, activeUserEmail);
    setTrades(getStoredTrades(activeUserEmail));
    syncStrategiesFromTrades(tradesData);
    setIsSavedModalOpen(true);
  };

  const handleDeleteTrade = (id: string) => {
    const updatedList = deleteTrade(id, activeUserEmail);
    setTrades(updatedList);
  };

  // Journal Handlers
  const handleSaveDailyNote = (note: DailyNote) => {
    const existingIndex = dailyNotes.findIndex((n) => n.date === note.date);
    let updated: DailyNote[];
    if (existingIndex >= 0) {
      updated = dailyNotes.map((n) => (n.date === note.date ? note : n));
    } else {
      updated = [note, ...dailyNotes];
    }
    setDailyNotes(updated);
    saveStoredDailyNotes(updated, activeUserEmail);
  };

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const triggerGoalToast = (goal: TradingGoal) => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      goal,
      quote: getRandomReinforcementQuote(),
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveRules = (newRules: TradingRule[]) => {
    setRules(newRules);
    saveStoredRules(newRules, activeUserEmail);
  };

  const handleSaveGoals = (newGoals: TradingGoal[]) => {
    newGoals.forEach((ng) => {
      const prevG = goals.find((g) => g.id === ng.id);
      const isNowAchieved = ng.achieved || (ng.targetValue > 0 && ng.currentValue >= ng.targetValue);
      const wasAchieved = prevG ? (prevG.achieved || (prevG.targetValue > 0 && prevG.currentValue >= prevG.targetValue)) : false;

      if (isNowAchieved && !wasAchieved) {
        triggerGoalToast(ng);
      }
    });

    setGoals(newGoals);
    saveStoredGoals(newGoals, activeUserEmail);
  };

  // Data Actions
  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON(activeUserEmail);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WealthOn_Journal_Backup_${activeUserEmail || 'Student'}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (jsonStr: string): boolean => {
    const success = importBackupJSON(jsonStr, activeUserEmail);
    if (success && activeUserEmail) {
      setProfile(getStoredProfile(activeUserEmail));
      setTrades(getStoredTrades(activeUserEmail));
      setDailyNotes(getStoredDailyNotes(activeUserEmail));
      setRules(getStoredRules(activeUserEmail));
      setGoals(getStoredGoals(activeUserEmail));
    }
    return success;
  };

  const handleResetJournal = () => {
    resetAllData(activeUserEmail);
    const freshProfile: TraderProfile = {
      name: session?.email ? session.email.split('@')[0] : 'Trader',
      platform: 'Zerodha (Kite)',
      isFirstLaunchCompleted: true,
    };
    saveStoredProfile(freshProfile, activeUserEmail);
    saveStoredTrades([], activeUserEmail);
    saveStoredDailyNotes([], activeUserEmail);
    saveStoredRules([], activeUserEmail);
    saveStoredGoals([], activeUserEmail);
    saveStoredStrategies([], activeUserEmail);

    setProfile(freshProfile);
    setTrades([]);
    setDailyNotes([]);
    setRules([]);
    setGoals([]);
    setStrategies([]);
    setActiveTab('dashboard');
  };

  const handleSeedSampleTrades = () => {
    const sampleList = seedSampleTrades(activeUserEmail);
    setTrades(sampleList);
  };

  const handleLogout = () => {
    setSession(null);
    setInspectedStudent(null);
    saveStoredSession(null);
  };

  // 0. If Maintenance Mode is active AND user is not in Admin Mode, show Maintenance Overlay directly
  const isAdminBypassingMaint = session?.role === 'admin' && (viewMode === 'admin' || dismissAdminMaintPreview);
  if (maintenanceState.isMaintenanceActive && !isAdminBypassingMaint) {
    return (
      <MaintenanceOverlay
        maintenanceState={maintenanceState}
        onRefreshCheck={() => setMaintenanceState(getStoredMaintenanceState())}
        isAdminPreview={session?.role === 'admin'}
        onDismissAdminPreview={() => {
          setDismissAdminMaintPreview(true);
          setViewMode('admin');
        }}
        currentSession={session}
        onLoginSuccess={(s) => {
          setSession(s);
          saveStoredSession(s);
          if (s.role === 'admin') {
            setViewMode('admin');
            setDismissAdminMaintPreview(true);
          } else {
            setViewMode('student');
          }
        }}
        onLogout={handleLogout}
      />
    );
  }

  // 1. If not logged in, render LoginModal
  if (!session) {
    return (
      <LoginModal
        onLoginSuccess={(s) => {
          setSession(s);
          saveStoredSession(s);
          setActiveTab('dashboard');
          window.history.replaceState({ tab: 'dashboard', modal: null }, '', '#dashboard');
          if (s.role === 'admin') {
            setViewMode('admin');
          } else {
            setViewMode('student');
          }
        }}
      />
    );
  }

  // 2. If admin and in admin viewMode, render AdminPortal
  if (session.role === 'admin' && viewMode === 'admin') {
    return (
      <AdminPortal
        session={session}
        onLogout={handleLogout}
        onSwitchToStudentView={() => {
          setInspectedStudent(null);
          setViewMode('student');
          setActiveTab('dashboard');
          window.history.replaceState({ tab: 'dashboard', modal: null }, '', '#dashboard');
        }}
        onInspectStudentJournal={(email, name) => {
          setInspectedStudent({ email, name });
          setViewMode('student');
          setActiveTab('dashboard');
          window.history.replaceState({ tab: 'dashboard', modal: null }, '', '#dashboard');
        }}
        trades={trades}
        onSeedSampleTrades={handleSeedSampleTrades}
        onResetData={handleResetJournal}
      />
    );
  }

  // 3. If student and expired, render RenewalPage
  if (session.role === 'student' && session.expiryDate && Date.now() > session.expiryDate) {
    return <RenewalPage session={session} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Expiry Notification Banner */}
      {session.role === 'student' && session.expiryDate && (
        (() => {
          const daysLeft = Math.ceil((session.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 30 && daysLeft > 0) {
            const isCritical = daysLeft <= 1;
            const isWarning = daysLeft <= 7 && daysLeft > 1;
            return (
              <div className={`px-4 py-2 text-xs font-bold flex items-center justify-center shadow-md ${
                isCritical ? 'bg-rose-600 text-white animate-pulse' :
                isWarning ? 'bg-amber-500 text-white' :
                'bg-indigo-600 text-white'
              }`}>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {isCritical 
                      ? 'CRITICAL ALERT: Your subscription expires tomorrow! Please contact Admin to renew.'
                      : isWarning
                      ? `WARNING: Your subscription expires in ${daysLeft} days. Please prepare to renew.`
                      : `Notice: Your subscription will expire in ${daysLeft} days.`
                    }
                  </span>
                </div>
              </div>
            );
          }
          return null;
        })()
      )}

      {/* Admin Inspection Banner */}
      {session.role === 'admin' && inspectedStudent && (
        <div className="bg-indigo-900 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-indigo-300 animate-pulse" />
            <span>
              ADMIN INSPECTION MODE: Viewing trading window for student <span className="text-indigo-200 underline">{inspectedStudent.name}</span> ({inspectedStudent.email})
            </span>
          </div>
          <button
            onClick={() => {
              setInspectedStudent(null);
              setViewMode('admin');
            }}
            className="px-3 py-1 bg-indigo-700 hover:bg-indigo-600 text-white text-[11px] rounded-lg transition cursor-pointer flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Admin Control Portal</span>
          </button>
        </div>
      )}

      {/* First Launch Modal */}
      <FirstLaunchModal isOpen={isFirstLaunchNeeded} onSave={handleFirstLaunchSave} />

      {/* Main Header */}
      <Header
        profile={profile}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenAddTrade={() => handleOpenAddTrade(null)}
        onOpenSettings={handleOpenSettings}
        onOpenCustomerSupport={handleOpenCustomerSupport}
        onOpenPrivacy={handleOpenPrivacy}
        onOpenDisclaimer={handleOpenDisclaimer}
        onOpenSendToMentor={handleOpenSendToMentor}
        userSession={{
          ...session,
          email: activeUserEmail || session.email,
        }}
        onLogout={handleLogout}
        onOpenAdminPortal={session.role === 'admin' ? () => setViewMode('admin') : undefined}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <DailyQuoteCard />
                <DashboardStats metrics={metrics} />

                {/* AI Assistant Quick Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-indigo-900/80 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition" />
                  <div className="flex items-center space-x-4 relative z-10">
                    <div className="p-3 bg-gradient-to-br from-indigo-500/30 to-blue-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30 shadow-md shrink-0">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                          <span>AI Trading Assistant</span>
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Analyze your trades & uncover performance mistakes 24/7
                      </h3>
                      <p className="text-xs text-slate-300 font-medium">
                        Chat with an AI coach that understands your win rate, position sizing, and trade psychology.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTabChange('aiAssistant')}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center space-x-2 shrink-0 cursor-pointer self-stretch md:self-auto justify-center"
                  >
                    <span>Launch AI Assistant</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <MonthlyPerformance trades={trades} />
                <ExecutionModePerformanceTable trades={trades} />
              </div>
            )}

            {activeTab === 'history' && (
              <TradeHistory
                trades={trades}
                traderName={profile.name}
                onViewTrade={handleOpenViewTrade}
                onEditTrade={(t) => handleOpenAddTrade(t)}
                onDeleteTrade={handleDeleteTrade}
                onOpenSendToMentor={handleOpenSendToMentor}
                onOpenAddTrade={() => handleOpenAddTrade(null)}
                onAddMultipleTrades={handleAddMultipleTrades}
              />
            )}

            {activeTab === 'strategyBuilder' && (
              <StrategyBuilderView
                strategies={strategies}
                trades={trades}
                onAddStrategy={handleAddStrategy}
                onEditStrategy={handleEditStrategy}
                onDeleteStrategy={handleDeleteStrategy}
                onOpenAddTradeWithStrategy={handleOpenAddTradeWithStrategy}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                trades={trades}
                metrics={metrics}
                strategies={strategies}
                onViewTrade={handleOpenViewTrade}
                onEditTrade={(t) => handleOpenAddTrade(t)}
                onDeleteTrade={handleDeleteTrade}
              />
            )}

            {activeTab === 'journal' && (
              <JournalNotesView
                dailyNotes={dailyNotes}
                rules={rules}
                goals={goals}
                trades={trades}
                onSaveDailyNote={(note) => {
                  handleSaveDailyNote(note);
                  setIsSavedModalOpen(true);
                }}
                onDeleteDailyNote={(id) => {
                  const updated = dailyNotes.filter((n) => n.id !== id);
                  setDailyNotes(updated);
                  saveStoredDailyNotes(updated, activeUserEmail);
                }}
                onSaveRules={(r) => {
                  handleSaveRules(r);
                }}
                onSaveGoals={(g) => {
                  handleSaveGoals(g);
                }}
                onTriggerToast={triggerGoalToast}
                onShowSavedModal={handleQuickSaveAllData}
              />
            )}

            {activeTab === 'brokerConnection' && (
              <BrokerConnectionPage
                userSession={
                  session
                    ? {
                        ...session,
                        email: activeUserEmail || session.email,
                      }
                    : null
                }
              />
            )}

            {activeTab === 'aiAssistant' && (
              <AITradingAssistantView
                trades={trades}
                rules={rules}
                dailyNotes={dailyNotes}
                onSaveDailyNote={(note) => {
                  handleSaveDailyNote(note);
                  setIsSavedModalOpen(true);
                }}
                profile={profile}
                onNavigateTab={handleTabChange}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <TradeFormModal
        isOpen={isAddTradeOpen}
        onClose={() => {
          handleCloseAddTrade();
          setInitialStrategyForAddTrade('');
        }}
        onSave={(data, existingId) => {
          handleSaveTrade(data, existingId);
          handleCloseAddTrade();
          setInitialStrategyForAddTrade('');
        }}
        tradeToEdit={tradeToEdit}
        defaultPlatform={profile.platform || 'Zerodha (Kite)'}
        strategiesList={strategies}
        initialStrategy={initialStrategyForAddTrade}
      />

      <TradeDetailsModal
        trade={selectedViewTrade}
        onClose={handleCloseViewTrade}
        onEdit={(t) => {
          handleCloseViewTrade();
          handleOpenAddTrade(t);
        }}
        onDelete={handleDeleteTrade}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        profile={profile}
        onClose={handleCloseSettings}
        onSaveProfile={handleSaveProfile}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetJournal={handleResetJournal}
        onSeedSampleTrades={handleSeedSampleTrades}
        onOpenAdminPortal={() => {
          handleCloseSettings();
          if (session?.role === 'admin') {
            setViewMode('admin');
          } else {
            handleLogout();
          }
        }}
      />

      <PrivacyModal isOpen={isPrivacyOpen} onClose={handleClosePrivacy} />

      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={handleCloseDisclaimer} />


      <CustomerSupportModal
        isOpen={isCustomerSupportOpen}
        onClose={handleCloseCustomerSupport}
        profile={profile}
        userSession={session}
      />

      <SendToMentorModal
        isOpen={isSendToMentorOpen}
        onClose={handleCloseSendToMentor}
        trades={trades}
        profile={profile}
        metrics={metrics}
      />

      <JournalSavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        totalTradesCount={trades.length}
        totalNotesCount={dailyNotes.length}
        activeRulesCount={rules.filter((r) => r.active).length}
        activeGoalsCount={goals.length}
        onNavigateToJournal={() => {
          handleTabChange('journal');
        }}
      />

      {/* Goal Achievement Toast Notifications */}
      <GoalToastNotification
        toasts={toasts}
        onDismiss={handleDismissToast}
        onNavigateToGoals={() => handleTabChange('journal')}
      />

      {/* Footer */}
      <Footer
        onOpenPrivacy={handleOpenPrivacy}
        onOpenDisclaimer={handleOpenDisclaimer}
      />
    </div>
  );
}
