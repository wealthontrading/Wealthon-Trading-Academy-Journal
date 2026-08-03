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
  Bot
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { WEALTHON_LOGO_URL } from '../assets/logo';
import { saveFeedbackToFirestore } from '../utils/firebaseSync';
import { FeedbackItem, TraderProfile, UserSession } from '../types';

interface CustomerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: TraderProfile;
  userSession?: UserSession | null;
  initialTab?: 'support' | 'feedback';
}

export const CustomerSupportModal: React.FC<CustomerSupportModalProps> = ({
  isOpen,
  onClose,
  profile,
  userSession,
  initialTab = 'support'
}) => {
  const [activeTab, setActiveTab] = useState<'support' | 'feedback'>(initialTab);

  // Chat Support State
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: "Hello! I'm the WealthOn 24/7 Support Bot. How can I help you with the website or your account today? If you need to speak to a human, just let me know." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Feedback form state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackItem['category']>('Customer Support');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const populateUserData = () => {
    let name = profile?.name || userSession?.name || '';
    let email = userSession?.email || '';
    let ph = '';

    try {
      const sessData = localStorage.getItem('trading_journal_user_session');
      if (sessData) {
        const sess = JSON.parse(sessData);
        if (!email && sess.email) email = sess.email;
        if (!name && sess.name) name = sess.name;
        if (!ph && sess.phone) ph = sess.phone;
      }
      if (!email) {
        const activeEmail = localStorage.getItem('trading_journal_active_email');
        if (activeEmail) email = activeEmail;
      }
    } catch {
      // no-op
    }

    if (email) setUserEmail(email);
    if (name) setUserName(name);
    if (ph) setPhone(ph);
  };

  useEffect(() => {
    if (isOpen) {
      populateUserData();
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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setIsChatLoading(true);

    try {
      const systemInstruction = `You are WealthOn Support Bot, a 24/7 customer support AI. Help the user with any website problems, trading journal queries, or general academy questions. If the user asks for a human, customer support agent, contact, WhatsApp, or says they want to connect to support, you MUST reply exactly with the text: [CONNECT_SUPPORT]. Keep your responses concise and helpful.`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { role: 'user', content: userText }],
          model: 'gemini-3.6-flash',
          systemInstruction,
        }),
      });

      const data = await res.json();
      const aiReply = data.text || 'Sorry, I am having trouble connecting to the server.';

      if (aiReply.includes('[CONNECT_SUPPORT]') || userText.toLowerCase().includes('support') || userText.toLowerCase().includes('human')) {
        setShowWhatsApp(true);
        setChatMessages((prev) => [...prev, { role: 'model', content: "I'm connecting you to our WhatsApp Customer Support team now." }]);
      } else {
        setChatMessages((prev) => [...prev, { role: 'model', content: aiReply }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      if (userText.toLowerCase().includes('support') || userText.toLowerCase().includes('human')) {
         setShowWhatsApp(true);
      } else {
         setChatMessages((prev) => [...prev, { role: 'model', content: "An error occurred while connecting. Please try again or ask for human support." }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const phoneNum = '+91 8547742160';
  const rawPhone = '918547742160';
  const email = 'wealthonprojects@gmail.com';

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!userEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!message.trim()) {
      setErrorMsg('Please write a short feedback or review message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newFeedback: FeedbackItem = {
        id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userEmail: userEmail.trim().toLowerCase(),
        userName: userName.trim() || 'Student',
        phone: phone.trim() || undefined,
        rating,
        category,
        message: message.trim(),
        status: 'New',
        submittedAt: Date.now()
      };
      await saveFeedbackToFirestore(newFeedback);
      setSubmitSuccess(true);
      setMessage('');
      setPhone('');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setErrorMsg('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={WEALTHON_LOGO_URL}
                  alt="WealthOn Logo"
                  className="w-full h-full object-contain"
                />
              </div>
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
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-5 pt-3 bg-slate-100 border-b border-slate-200 flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('support');
                setSubmitSuccess(false);
              }}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'support'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Helpline & WhatsApp Chat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                populateUserData();
                setActiveTab('feedback');
              }}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'feedback'
                  ? 'border-amber-500 text-amber-800 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Submit Feedback & Review</span>
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

                {/* DIRECT REVIEW & FEEDBACK CALLOUT CARD INSIDE SUPPORT PAGE */}
                <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 rounded-2xl border border-amber-300/80 space-y-3.5 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-amber-500 text-slate-950 rounded-xl shadow-md shrink-0">
                        <Star className="w-5 h-5 fill-slate-950" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                          Student Feedback & Review
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                          How is your experience with WealthOn?
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    We value your review! Click the button below to rate your experience and submit your feedback. Your name and email will be pre-filled automatically.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      populateUserData();
                      setActiveTab('feedback');
                      setSubmitSuccess(false);
                    }}
                    className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Star className="w-4 h-4 fill-slate-950" />
                    <span>⭐ Write a Review & Submit Feedback</span>
                  </button>
                </div>

                {/* Support Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
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

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
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
                    <li>Lifetime License Plan Activation Verification</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="space-y-5">
                {submitSuccess ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4">
                    <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-emerald-950">Thank You for Your Feedback!</h3>
                      <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                        Your review has been submitted directly to the WealthOn Admin Team. It will appear live in the Admin Portal Analytics dashboard!
                      </p>
                    </div>
                    <div className="pt-2 flex justify-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setSubmitSuccess(false)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                      >
                        Submit Another Feedback
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Close Modal
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitFeedback} className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-indigo-50 border border-amber-200 rounded-2xl flex items-center space-x-3">
                      <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-sm shrink-0">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Your Opinion Shapes Our Platform</h3>
                        <p className="text-xs text-slate-600">
                          Rate your experience and share suggestions. Feedback updates live in our Admin Portal!
                        </p>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* Star Rating Picker */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                        Overall Rating *
                      </label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (hoverRating || rating);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 cursor-pointer transition transform hover:scale-110 focus:outline-none"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  isFilled
                                    ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                    : 'text-slate-300 fill-slate-100'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs font-extrabold text-amber-700">
                        {getRatingLabel(hoverRating || rating)}
                      </p>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                        Feedback Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as FeedbackItem['category'])}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                      >
                        <option value="Customer Support">Customer Support Experience</option>
                        <option value="Platform Features">Platform Features & Usability</option>
                        <option value="Trading Journal">Trading Journal & P&L Log</option>
                        <option value="Broker API">Broker API & Connectivity</option>
                        <option value="General Experience">General Experience & Academy Content</option>
                      </select>
                    </div>

                    {/* User Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">Your Email Address *</label>
                          {userEmail && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                              ✓ Auto-added
                            </span>
                          )}
                        </div>
                        <input
                          type="email"
                          required
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="student@academy.com"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">Your Name (Optional)</label>
                          {userName && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                              ✓ Auto-added
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Phone Number (Optional)</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                      />
                    </div>

                    {/* Message Area */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                        Detailed Feedback & Review Message *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us what you liked or what we can improve in the trading journal..."
                        className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Submitting Feedback...' : 'Send Feedback to Admin Portal'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded bg-white p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                <img src={WEALTHON_LOGO_URL} alt="WealthOn Logo" className="w-full h-full object-contain" />
              </div>
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
