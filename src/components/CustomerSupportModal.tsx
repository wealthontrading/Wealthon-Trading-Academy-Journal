import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  Clock,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HeartHandshake,
  Loader2,
  Bot,
  RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Logo } from './Logo';
import { FeedbackItem, TraderProfile, UserSession } from '../types';

interface CustomerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: TraderProfile;
  userSession?: UserSession | null;
  initialTab?: 'support' | 'renew';
}

export const CustomerSupportModal: React.FC<CustomerSupportModalProps> = ({
  isOpen,
  onClose,
  profile,
  userSession,
  initialTab = 'support'
}) => {
  const [activeTab, setActiveTab] = useState<'support' | 'renew'>(initialTab);

  // Chat Support State
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: "Hello! I'm the WealthOn 24/7 Support Bot. How can I help you with the website or your account today? If you need to speak to a human, just let me know." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  
  useEffect(() => {
    if (isOpen) {
      
      if (initialTab) {
        setActiveTab(initialTab);
      }
      setShowWhatsApp(false); // Reset whatsapp view on open
    }
  }, [isOpen, profile, userSession, initialTab]);

  // 10 minute timeout to show whatsapp
  useEffect(() => {
    let timer: any;
    if (isOpen && activeTab === 'support' && !showWhatsApp) {
      timer = setTimeout(() => {
        setShowWhatsApp(true);
      }, 10 * 60 * 1000); // 10 minutes
    }
    return () => clearTimeout(timer);
  }, [isOpen, activeTab, showWhatsApp]);
  const quickQuestions = [
    "How to log a trade?",
    "What is the pricing?",
    "Connect to human agent"
  ];

  const sendChatMessage = async (text: string) => {
    if (!text.trim() || isChatLoading) return;
    
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsChatLoading(true);

    try {
      const systemInstruction = `You are WealthOn Support Bot, a 24/7 customer support AI. Help the user with any website problems, trading journal queries, or general academy questions. If the user asks for a human, customer support agent, contact, WhatsApp, or says they want to connect to support, you MUST reply exactly with the text: [CONNECT_SUPPORT]. Keep your responses concise and helpful.`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { role: 'user', content: text }],
          model: 'gemini-2.0-flash',
          systemInstruction,
        }),
      });

      const data = await res.json();
      const aiReply = data.text || 'Sorry, I am having trouble connecting to the server.';

      if (aiReply.includes('[CONNECT_SUPPORT]') || text.toLowerCase().includes('support') || text.toLowerCase().includes('human') || text.toLowerCase().includes('agent')) {
        setShowWhatsApp(true);
        setChatMessages((prev) => [...prev, { role: 'model', content: "I'm connecting you to our WhatsApp Customer Support team now." }]);
      } else {
        setChatMessages((prev) => [...prev, { role: 'model', content: aiReply }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      if (text.toLowerCase().includes('support') || text.toLowerCase().includes('human') || text.toLowerCase().includes('agent')) {
         setShowWhatsApp(true);
      } else {
         setChatMessages((prev) => [...prev, { role: 'model', content: "An error occurred while connecting. Please try again or ask for human support." }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      await sendChatMessage(chatInput.trim());
    }
  };


  const phoneNum = '+91 8547742160';
  const rawPhone = '918547742160';
  const email = 'wealthonprojects@gmail.com';

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return '🌟 Excellent! Loved the Experience';
      case 4:
        return '👍 Very Good! Smooth & Helpful';
      case 3:
        return '👌 Average - Needs Minor Tweaks';
      case 2:
        return '😐 Below Expectation - Improvement Needed';
      case 1:
        return '😞 Poor - Encountered Issues';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <Logo className="text-3xl" />
              <div>
                <h2 className="text-lg font-black tracking-tight flex items-center space-x-2">
                  <span>Customer Support & Feedback</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold rounded-full">
                    Official Support
                  </span>
                </h2>
                <p className="text-xs text-slate-300">WealthOn Trading Academy Helpline</p>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center border-b border-slate-200 px-6 pt-2 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('support')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'support'
                  ? 'border-blue-600 text-blue-700 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Chat Support</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('renew')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'renew'
                  ? 'border-indigo-600 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Renew Plan</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {activeTab === 'support' && (
              <div className="space-y-6">
                {!showWhatsApp ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-slate-50 shadow-sm" style={{ height: '400px' }}>
                    <div className="p-3 bg-white border-b border-slate-200 flex items-center space-x-2 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">WealthOn 24/7 Support Bot</h3>
                        <p className="text-[10px] text-slate-500">Ask any questions or request a human agent</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white rounded-br-none' 
                              : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                          }`}>
                            <div className="markdown-body prose-sm prose-p:my-1 prose-ul:my-1">
                              <ReactMarkdown>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-xs font-medium">Typing...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="px-4 pb-2 pt-1 overflow-x-auto flex space-x-2 no-scrollbar shrink-0">
                      {quickQuestions.map((q, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => sendChatMessage(q)}
                          disabled={isChatLoading}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-200 hover:bg-blue-100 transition whitespace-nowrap cursor-pointer disabled:opacity-50"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type your issue here..."
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={isChatLoading || !chatInput.trim()}
                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50/80 rounded-2xl border border-emerald-200/80 space-y-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-500/20">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                            Customer Care Support (WhatsApp Chat Only)
                          </span>
                          <h3 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight mt-0.5">
                            {phoneNum}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <a
                        href={`https://wa.me/${rawPhone}?text=Hello%20WealthOn%20Support,%20I%20need%20assistance%20with%20my%20trading%20journal.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Start WhatsApp Chat (+91 8547742160)</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </a>
                    </div>
                  </div>
                )}


                {/* Support Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center space-x-2 text-blue-600 mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700">Email Support</span>
                    </div>
                    <a
                      href={`mailto:${email}`}
                      className="text-xs font-bold text-blue-700 hover:underline break-all block"
                    >
                      {email}
                    </a>
                    <p className="text-[11px] text-slate-500">24h Response Time</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center space-x-2 text-amber-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700">Working Hours</span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-800">Mon to Fri (9:00 AM - 6:00 PM)</p>
                    <p className="text-[11px] text-slate-500">Indian Standard Time (IST)</p>
                  </div>
                </div>

                {/* Quick Assistance Notes */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                  <h4 className="font-extrabold text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>How can we help you today?</span>
                  </h4>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                    <li>Student Login & Password Reset Assistance</li>
                    <li>Broker Connection setup (Zerodha, AngelOne, Dhan, Groww, Upstox)</li>
                    <li>Trading Journal Report export for Mentors</li>
                    <li>Limited Plan Activation Verification</li>
                  </ul>
                </div>

              </div>
            )}

            {activeTab === 'renew' && (
              <div className="space-y-6">
                {/* Renew Team Contact */}
                <div className="p-5 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-slate-50 rounded-2xl border border-indigo-300/80 space-y-3.5 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-md shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900 block">
                          Account Renewal Support
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                          Need to renew your limited plan?
                        </h4>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Connect with our dedicated Renewal Team via WhatsApp. We will automatically include your account details for faster processing.
                  </p>
                  <a
                    href={`https://wa.me/918547742160?text=${encodeURIComponent(`Hi Renew Team, I would like to renew my WealthOn Trading Academy account. My details are:\nName: ${userSession?.name || ''}\nEmail: ${userSession?.email || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Contact Renew Team on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <div className="flex items-center space-x-2">
              <Logo className="text-base" />
              <span className="font-bold text-slate-700">WealthOn Trading Academy</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
