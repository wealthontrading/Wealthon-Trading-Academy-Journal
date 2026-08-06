import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  RefreshCw,
  BookOpen,
  TrendingUp,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Target,
  ArrowRight,
  Shield,
  MessageSquare,
  BarChart2,
  ListPlus,
  Trash2,
  Lightbulb,
} from 'lucide-react';
import { Trade, TradingRule, DailyNote, TraderProfile } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AITradingAssistantViewProps {
  trades: Trade[];
  rules: TradingRule[];
  dailyNotes: DailyNote[];
  onSaveDailyNote: (note: DailyNote) => void;
  profile: TraderProfile;
  onNavigateTab: (tab: 'dashboard' | 'history' | 'analytics' | 'journal' | 'brokerConnection' | 'aiAssistant') => void;
}

export const AITradingAssistantView: React.FC<AITradingAssistantViewProps> = ({
  trades,
  rules,
  dailyNotes,
  onSaveDailyNote,
  profile,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'journal' | 'insights'>('journal');

  // Calculate trade statistics context for AI
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.netPnL > 0);
  const losingTrades = trades.filter((t) => t.netPnL < 0);
  const winRate = totalTrades > 0 ? Math.round((winningTrades.length / totalTrades) * 100) : 0;
  const totalNetPnL = trades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
  const totalCharges = trades.reduce((sum, t) => sum + ((t.brokerage || 0) + (t.taxes || 0) + (t.otherCharges || 0)), 0);

  // Execution modes stats
  const manualTrades = trades.filter((t) => !t.tradeType || t.tradeType === 'Manual Trading');
  const algoTrades = trades.filter((t) => t.tradeType === 'Algo Trading');
  const copyTrades = trades.filter((t) => t.tradeType === 'Copy Trading');

  // Format currency helper
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // --- TAB 1: Chat State ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${profile.name || 'Trader'}! I am your **24/7 AI Trading Assistant & Coach**.\n\nI have analyzed your trading data:\n- **${totalTrades} Total Trades** logged (${winRate}% Win Rate)\n- **${formatINR(totalNetPnL)} Net P&L** across your account\n- **${rules.filter((r) => r.active).length} Active Discipline Rules**\n\nHow can I help you sharpen your execution or trading psychology today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue.trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      // Build rich context prompt for Gemini
      const tradeContext = `
Trader Context:
- Name: ${profile.name || 'Trader'}
- Academy/Institute: ${profile.instituteName || 'WealthOn Trading Academy'}
- Total Logged Trades: ${totalTrades}
- Win Rate: ${winRate}% (${winningTrades.length} Wins, ${losingTrades.length} Losses)
- Total Net P&L: ₹${totalNetPnL} (Charges: ₹${totalCharges})
- Execution Breakdown: Manual (${manualTrades.length}), Algo (${algoTrades.length}), Copy (${copyTrades.length})
- Active Trading Rules: ${rules.filter((r) => r.active).map((r) => r.text).join(', ') || 'None defined yet'}
- Recent Trades Sample: ${trades
        .slice(0, 5)
        .map((t) => `${t.indexOrStock} (${t.buyOrSell}) Net P&L: ₹${t.netPnL} [${t.tradeType || 'Manual'}]`)
        .join('; ')}
`;

      const apiMessages = [
        {
          role: 'user',
          content: `${tradeContext}\n\nUser Question: ${query}`,
        },
      ];

      let aiContent = '';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: 'gemini-3.6-flash',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.text) {
            aiContent = data.text;
          }
        }
      } catch (err) {
        console.warn('Backend chat API offline or unreachable, using local AI coach engine:', err);
      }

      if (!aiContent) {
        const name = profile.name || 'Trader';
        const q = query.toLowerCase();
        if (q.includes('win rate') || q.includes('p&l') || q.includes('performance') || q.includes('stat')) {
          aiContent = `### 📊 Performance & Win Rate Analysis for ${name}\n\n- **Total Trades Logged:** ${totalTrades}\n- **Current Win Rate:** **${winRate}%**\n- **Cumulative Net P&L:** **₹${totalNetPnL.toLocaleString('en-IN')}**\n\n**Coach Insights:**\n1. ${winRate >= 50 ? 'Your win rate is strong (>50%). Continue enforcing tight stop-loss limits to protect capital.' : 'Your win rate is below 50%. Focus on taking high-probability setups with at least 1:2 Risk-to-Reward ratio.'}\n2. **Risk Management:** Never risk more than 1-2% of total capital per trade.\n3. **Journal Discipline:** Keep logging every trade exit reason to identify recurring patterns.`;
        } else if (q.includes('revenge') || q.includes('emotion') || q.includes('discipline') || q.includes('psychology') || q.includes('rule')) {
          aiContent = `### 🧠 Psychological & Discipline Framework\n\n**3 Golden Rules to Master Trading Psychology:**\n\n1. **The 15-Minute Cooling Rule:** Never enter a new trade immediately after hitting a stop-loss. Take a 15-minute break away from charts.\n2. **Strict Daily Loss Quota:** If you hit your daily max loss limit, shut down your terminal for the rest of the session.\n3. **Trade Your Plan, Not FOMO:** Wait for clear candlestick setup confirmations. Do not chase green/red momentum candles.`;
        } else if (q.includes('banknifty') || q.includes('nifty') || q.includes('position') || q.includes('quantity') || q.includes('size')) {
          aiContent = `### 📐 Position Sizing & Risk Management Guide\n\n1. **Max Risk Per Trade:** Limit loss to 1% of total account capital.\n2. **Formula:** \`Quantity = (Capital × Max Risk %) / (Entry Price - Stop Loss Price)\`\n3. **Index Option Tip:** For Nifty/BankNifty options, fix lot size in advance. Increase lot size only after 10 consecutive profitable, disciplined trades!`;
        } else if (q.includes('mistake') || q.includes('error') || q.includes('audit')) {
          aiContent = `### ⚠️ Top Trading Mistakes Audit\n\n1. **Chasing Entries (FOMO):** Entering trades late without a defined stop loss.\n2. **Averaging Down on Losing Positions:** Adding size to a losing trade multiplies drawdown risk.\n3. **Ignoring Risk:Reward Ratios:** Taking trades where potential risk exceeds potential profit.\n4. **Overtrading:** Executing multiple trades after daily targets or loss quotas have been reached.`;
        } else {
          aiContent = `### 💡 AI Trading Coach Guidance\n\nHello **${name}**! Based on your live account data (**${totalTrades} trades logged**, **${winRate}% win rate**, Net P&L: **₹${totalNetPnL.toLocaleString('en-IN')}**):\n\n- **Execution Focus:** Consistency matters more than frequency. Quality setups over high quantity.\n- **Risk Rule:** Always calculate your stop loss before placing an order.\n- **Journaling:** Log your trade rationale in your daily notes to refine your edge!\n\nHow else can I help analyze your trading strategy today?`;
        }
      }

      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('AI Assistant Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        content: `Chat session refreshed! How can I assist your trading routine now?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // --- TAB 2: Journal Generator State ---
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'all'>('today');
  const [generatedJournal, setGeneratedJournal] = useState<{
    date: string;
    marketSummary: string;
    lessons: string[];
    mistakes: string[];
    improvements: string[];
    aiNote: string;
  } | null>(null);
  const [isGeneratingJournal, setIsGeneratingJournal] = useState(false);
  const [journalSavedSuccess, setJournalSavedSuccess] = useState(false);

  const handleGenerateJournal = async () => {
    setIsGeneratingJournal(true);
    setJournalSavedSuccess(false);

    // Filter trades based on timeframe
    let filtered = [...trades];
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedTimeframe === 'today') {
      filtered = trades.filter((t) => t.date === todayStr);
    } else if (selectedTimeframe === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = trades.filter((t) => new Date(t.date) >= sevenDaysAgo);
    }

    const tradeListText = filtered.length > 0
      ? filtered.map((t) => `- ${t.date}: ${t.indexOrStock} (${t.buyOrSell}) Entry: ₹${t.entryPrice}, Exit: ₹${t.exitPrice}, Qty: ${t.quantity}, Net P&L: ₹${t.netPnL}, Mode: ${t.tradeType || 'Manual'}`).join('\n')
      : 'No logged trades found for this period.';

    const promptText = `
Generate a structured daily trading journal entry for an Options Trader based on these logged trades:
${tradeListText}

Overall Account P&L: ₹${totalNetPnL}, Win Rate: ${winRate}%

Return JSON with this exact schema:
{
  "marketSummary": "2-3 sentences summarizing performance, execution quality, and risk management.",
  "lessons": ["3 specific positive execution lessons"],
  "mistakes": ["2-3 discipline or execution mistakes detected or potential pitfalls"],
  "improvements": ["2 actionable action items for next trading session"],
  "aiNote": "A 2-sentence encouraging coach closing word."
}
`;

    let journalObj: {
      date: string;
      marketSummary: string;
      lessons: string[];
      mistakes: string[];
      improvements: string[];
      aiNote: string;
    } | null = null;

    const totalFiltered = filtered.length;
    const wins = filtered.filter((t) => (t.netPnL || 0) > 0).length;
    const losses = filtered.filter((t) => (t.netPnL || 0) < 0).length;
    const filteredPnl = filtered.reduce((acc, t) => acc + (t.netPnL || 0), 0);
    const filteredWinRate = totalFiltered > 0 ? Math.round((wins / totalFiltered) * 100) : 0;

    let defaultSummary = '';
    if (totalFiltered === 0) {
      defaultSummary = `No trades were logged for the ${selectedTimeframe} timeframe. Market observation session maintained with patience and discipline.`;
    } else if (filteredPnl >= 0) {
      defaultSummary = `Profitable trading session (${selectedTimeframe}) logging ₹${filteredPnl.toLocaleString('en-IN')} Net P&L across ${totalFiltered} trades with a ${filteredWinRate}% win rate. Execution was controlled and risk limits were respected.`;
    } else {
      defaultSummary = `Session closed with a net loss of ₹${Math.abs(filteredPnl).toLocaleString('en-IN')} across ${totalFiltered} trades (${filteredWinRate}% win rate). Focused on capital protection and preventing drawdown escalation.`;
    }

    const defaultLessons = [
      totalFiltered > 0 ? `Logged ${totalFiltered} trade(s) with a ${filteredWinRate}% win rate.` : 'Demonstrated patience by avoiding low-probability setups during choppy price action.',
      'Waited for candlestick pattern confirmation at key support/resistance levels before entering.',
      'Maintained position sizing aligned with predefined account risk limits.'
    ];

    const defaultMistakes = [
      totalFiltered > 0 && losses > 0 ? `Encountered ${losses} losing trade(s) - ensure stop loss execution was clean without slippage.` : 'Be careful not to overtrade during range-bound market sessions.',
      'Ensure profit targets match a minimum 1:2 Risk-to-Reward ratio before entering.',
      'Avoid taking impulsive trades immediately after hitting a stop loss.'
    ];

    const defaultImprovements = [
      'Pre-define exact stop-loss and target levels before clicking buy/sell.',
      'Set price alerts at key breakout/breakdown zones to reduce screen fatigue.',
      'Stop trading for the day immediately upon reaching maximum allowed daily loss quota.'
    ];

    const defaultAiNote = filteredPnl >= 0
      ? 'Great job keeping execution disciplined and protecting capital today! Keep following your trading system.'
      : 'Drawdowns are normal in trading. Protect your capital and mental peace, review your execution, and come back sharp tomorrow.';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: promptText }],
          model: 'gemini-3.6-flash',
          systemInstruction: 'You are an AI Trading Journal Generator. Respond with structured text or valid JSON.',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.text || '';

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          journalObj = {
            date: todayStr,
            marketSummary: parsed.marketSummary || defaultSummary,
            lessons: Array.isArray(parsed.lessons) && parsed.lessons.length > 0 ? parsed.lessons : defaultLessons,
            mistakes: Array.isArray(parsed.mistakes) && parsed.mistakes.length > 0 ? parsed.mistakes : defaultMistakes,
            improvements: Array.isArray(parsed.improvements) && parsed.improvements.length > 0 ? parsed.improvements : defaultImprovements,
            aiNote: parsed.aiNote || defaultAiNote,
          };
        }
      }
    } catch (err) {
      console.warn('Backend API unavailable, fallback to local AI journal engine:', err);
    }

    if (!journalObj) {
      journalObj = {
        date: todayStr,
        marketSummary: defaultSummary,
        lessons: defaultLessons,
        mistakes: defaultMistakes,
        improvements: defaultImprovements,
        aiNote: defaultAiNote,
      };
    }

    setGeneratedJournal(journalObj);
    setIsGeneratingJournal(false);
  };

  const handleSaveToDailyJournal = () => {
    if (!generatedJournal) return;

    const newNote: DailyNote = {
      id: `ai_note_${Date.now()}`,
      date: generatedJournal.date,
      notes: `[AI Generated Journal] ${generatedJournal.marketSummary}\n\nCoach Note: ${generatedJournal.aiNote}`,
      lessonsLearned: generatedJournal.lessons,
      mistakes: generatedJournal.mistakes,
      improvements: generatedJournal.improvements,
    };

    onSaveDailyNote(newNote);
    setJournalSavedSuccess(true);
    setTimeout(() => setJournalSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 my-6">
      {/* Top Banner Card - Match User Prompt Persona & Theme */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider rounded-full shadow-xs">
                  BETA 2.0
                </span>
                <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>24/7 AI Coach • Instant Journal • Mistake Audit</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                24/7 AI Coach, Instant Journaling & Trading Mistake Audit Box [BETA]
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
                Use our integrated AI to analyze your trades, auto-generate daily journals, audit setup mistakes, and chat with your 24/7 trading coach.
              </p>
            </div>

            {/* Sub-tab Switcher Pill */}
            <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-indigo-800/60 flex items-center gap-1 self-start lg:self-center shrink-0">
              <button
                onClick={() => setActiveSubTab('chat')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer ${
                  activeSubTab === 'chat'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>24/7 AI Coach</span>
              </button>

              <button
                onClick={() => setActiveSubTab('journal')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer ${
                  activeSubTab === 'journal'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Instant Journal</span>
              </button>

              <button
                onClick={() => setActiveSubTab('insights')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer ${
                  activeSubTab === 'insights'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>Mistake Audit</span>
              </button>
            </div>
          </div>

          {/* 4 Feature Value Props Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-indigo-900/40">
            <div className="bg-slate-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-indigo-800/40 flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                Your personal trading coach, available 24/7.
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-indigo-800/40 flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                Chat with an AI that understands your trading patterns.
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-indigo-800/40 flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                Generate journal entries instantly from your trades.
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-indigo-800/40 flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                Receive clear, actionable insights to boost performance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- SUB-TAB 1: 24/7 AI COACH CHAT --- */}
      {activeSubTab === 'chat' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
          {/* Chat Header */}
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span>WealthOn AI Trading Coach</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                    WealthOn AI 3.6
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Connected to your live account ({totalTrades} trades, {winRate}% win rate)
                </p>
              </div>
            </div>

            <button
              onClick={handleClearChat}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="Clear Conversation History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-indigo-600 text-white shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? (profile.name?.charAt(0) || 'U') : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1 group">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-normal'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans space-y-2">
                      {msg.content}
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="hover:text-slate-600 transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-md mr-auto">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-none text-xs text-slate-500 font-medium flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Analyzing your trade setup & psychology...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Starter Preset Prompts */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 px-1">
              Quick Ask:
            </span>
            {[
              'Analyze my trade win rate & P&L',
              'How can I stop revenge trading?',
              'Calculate position size for BankNifty',
              'What are my top trading mistakes?',
              'Give me a 3-step discipline rule',
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-semibold text-xs rounded-lg transition shrink-0 cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask your AI Trading Coach anything (e.g. 'How can I fix my stop-loss discipline?')..."
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-2xl transition flex items-center space-x-2 shadow-md disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Ask AI</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: INSTANT JOURNAL GENERATOR --- */}
      {activeSubTab === 'journal' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Instant AI Journal Generator</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Automatically summarize trading session reflections, mistakes, and lessons directly from your logged trades.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Select Range:</span>
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                <button
                  onClick={() => setSelectedTimeframe('today')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedTimeframe === 'today' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Today's Session
                </button>
                <button
                  onClick={() => setSelectedTimeframe('week')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedTimeframe === 'week' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setSelectedTimeframe('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedTimeframe === 'all' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  All Trades
                </button>
              </div>

              <button
                onClick={handleGenerateJournal}
                disabled={isGeneratingJournal}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingJournal ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>{isGeneratingJournal ? 'Generating...' : 'Generate AI Entry'}</span>
              </button>
            </div>
          </div>

          {/* Generated Result Container */}
          {generatedJournal ? (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Session Reflection • {generatedJournal.date}
                  </span>
                  <button
                    onClick={handleSaveToDailyJournal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save to Daily Journal</span>
                  </button>
                </div>

                {journalSavedSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Successfully appended to your Daily Notes journal!</span>
                  </div>
                )}

                {/* Market Summary */}
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                    Execution & Market Summary
                  </h4>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                    {generatedJournal.marketSummary}
                  </p>
                </div>

                {/* Grid 3 Columns: Lessons, Mistakes, Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Lessons */}
                  <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 space-y-2">
                    <h5 className="text-xs font-extrabold text-emerald-900 uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>What Went Well</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
                      {generatedJournal.lessons.map((item, idx) => (
                        <li key={idx} className="bg-white p-2 rounded-lg border border-emerald-200/80">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mistakes */}
                  <div className="bg-rose-50/80 p-4 rounded-xl border border-rose-200 space-y-2">
                    <h5 className="text-xs font-extrabold text-rose-900 uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Mistakes & Risks</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-rose-950 font-medium">
                      {generatedJournal.mistakes.map((item, idx) => (
                        <li key={idx} className="bg-white p-2 rounded-lg border border-rose-200/80">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 space-y-2">
                    <h5 className="text-xs font-extrabold text-blue-900 uppercase flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tomorrow's Action Plan</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-blue-950 font-medium">
                      {generatedJournal.improvements.map((item, idx) => (
                        <li key={idx} className="bg-white p-2 rounded-lg border border-blue-200/80">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* AI Coach Word */}
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-950 flex items-start space-x-2.5">
                  <Bot className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-indigo-900 block mb-0.5">Coach Advice:</span>
                    <p>{generatedJournal.aiNote}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-extrabold text-slate-800 text-base">Generate Instant Session Reflection</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Click the button above to let AI synthesize your trade executions, win rate, and risk rules into a formatted journal entry.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUB-TAB 3: AI PERFORMANCE & MISTAKE AUDIT --- */}
      {activeSubTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Health Score Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Trading Health Score</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${winRate >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {winRate >= 50 ? 'STRONG' : 'NEEDS FOCUS'}
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-slate-900 font-mono">{winRate}%</span>
                <span className="text-xs font-bold text-slate-500">Win Rate Efficiency</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className={`h-2.5 rounded-full ${winRate >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${winRate}%` }} />
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {winRate >= 50
                  ? 'Your win rate is above 50%. Focus on keeping losing trades small by honoring stop-loss levels strictly.'
                  : 'Win rate is below 50%. Ensure you wait for higher probability setups and strictly limit losses.'}
              </p>
            </div>

            {/* Execution Efficiency Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Execution Mode Audit</span>
                <BarChart2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="space-y-2 text-xs font-bold text-slate-800">
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                  <span>Manual Executions</span>
                  <span className="font-mono text-blue-900">{manualTrades.length} Trades</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                  <span>Algo Executions</span>
                  <span className="font-mono text-indigo-900">{algoTrades.length} Trades</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                  <span>Copy Trading</span>
                  <span className="font-mono text-emerald-900">{copyTrades.length} Trades</span>
                </div>
              </div>
            </div>

            {/* Discipline Rule Status Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Active Rules Check</span>
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {rules.filter((r) => r.active).length}/{rules.length}
                </span>
                <span className="text-xs font-bold text-slate-500">Rules Active</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {rules.length > 0
                  ? 'Active rules keep emotional impulses in check during volatile market moves.'
                  : 'No discipline rules defined yet! Add rules in the Journal & Goals section.'}
              </p>
            </div>
          </div>

          {/* AI Automated Recommendations list */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span>AI Actionable Recommendations to Boost Performance</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">1</span>
                  <h4 className="font-extrabold text-slate-900 text-sm">Enforce 1:2 Minimum Risk-to-Reward Ratio</h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Ensure target reward is at least double your stop loss value. A 40% win rate with 1:2 R:R remains profitable over time.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">2</span>
                  <h4 className="font-extrabold text-slate-900 text-sm">Set Maximum Daily Loss Limit</h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Cap maximum daily loss at 2% of total capital. Step away from terminal immediately if the daily limit is reached.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center">3</span>
                  <h4 className="font-extrabold text-slate-900 text-sm">Avoid Revenge Overtrading</h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Never enter a new trade within 15 minutes of an unexpected stop-loss hit. Take a brief cooling period first.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center">4</span>
                  <h4 className="font-extrabold text-slate-900 text-sm">Daily Reflection Logging</h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Use the Instant AI Journal Generator at the end of every trading day to track execution discipline continuously.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
