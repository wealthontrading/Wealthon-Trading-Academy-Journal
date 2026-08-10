import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { saveFeedbackToFirestore } from '../utils/firebaseSync';
import { FeedbackItem, TraderProfile, UserSession } from '../types';

interface FeedbackViewProps {
  profile?: TraderProfile;
  userSession?: UserSession | null;
  defaultTab?: 'Feedback' | 'Idea';
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ profile, userSession, defaultTab = 'Feedback' }) => {
  const [feedbackType, setFeedbackType] = useState<'Feedback' | 'Complaint' | 'Idea'>(defaultTab);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackItem['category']>('General Experience');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submittedTicket, setSubmittedTicket] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let name = profile?.name || userSession?.name || '';
    let email = userSession?.email || '';
    if (name) setUserName(name);
    if (email) setUserEmail(email);
  }, [profile, userSession]);
  
  useEffect(() => {
    setFeedbackType(defaultTab);
  }, [defaultTab]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!userEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg(`Please write a short ${feedbackType.toLowerCase()} message.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketId = feedbackType === 'Complaint' ? `TKT-${Math.floor(100000 + Math.random() * 900000)}` : '';
      
      const newFeedback: FeedbackItem = {
        id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: feedbackType,
        ticketNumber: ticketId,
        userEmail: userEmail.trim().toLowerCase(),
        userName: userName.trim() || 'Student',
        phone: phone.trim(),
        rating: feedbackType === 'Feedback' ? rating : undefined,
        category,
        message: message.trim(),
        status: 'New',
        submittedAt: Date.now()
      };
      
      await saveFeedbackToFirestore(newFeedback);
      setSubmittedTicket(ticketId);
      setSubmitSuccess(true);
      setMessage('');
      setPhone('');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setErrorMsg('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 ">
        <div className="max-w-2xl mx-auto space-y-6">
          
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 flex-wrap gap-1">
            <button
              onClick={() => { setFeedbackType('Feedback'); setSubmitSuccess(false); setCategory('General Experience'); }}
              className={`flex-1 min-w-[120px] py-2 text-xs font-bold rounded-lg transition-colors ${feedbackType === 'Feedback' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Submit Feedback
            </button>
            <button
              onClick={() => { setFeedbackType('Complaint'); setSubmitSuccess(false); setCategory('Technical Issue'); }}
              className={`flex-1 min-w-[120px] py-2 text-xs font-bold rounded-lg transition-colors ${feedbackType === 'Complaint' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Lodge a Complaint
            </button>
            <button
              onClick={() => { setFeedbackType('Idea'); setSubmitSuccess(false); setCategory('Platform Features'); }}
              className={`flex-1 min-w-[120px] py-2 text-xs font-bold rounded-lg transition-colors ${feedbackType === 'Idea' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Share Idea
            </button>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center space-x-2">
              {feedbackType === 'Feedback' ? (
                <>
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                  <span>Feedback & Reviews</span>
                </>
              ) : feedbackType === 'Idea' ? (
                <>
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  <span>Share Improvement Ideas</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                  <span>Lodge a Complaint</span>
                </>
              )}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {feedbackType === 'Feedback' 
                ? 'We value your experience with WealthOn Trading Academy. Share your feedback below.'
                : feedbackType === 'Idea'
                ? 'Help us improve! Share your feature requests and ideas for the platform.'
                : 'We are sorry you faced an issue. Please describe it below, and we will resolve it promptly.'
              }
            </p>
          </div>

          {submitSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-fadeIn">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900">
                {feedbackType === 'Feedback' ? 'Thank You!' : feedbackType === 'Idea' ? 'Idea Received!' : 'Complaint Received'}
              </h3>
              <p className="text-sm text-emerald-700 font-medium">
                {feedbackType === 'Feedback' 
                  ? 'Your feedback has been submitted successfully. We appreciate your insights!'
                  : feedbackType === 'Idea'
                  ? 'Your idea has been shared with our team. We love improving based on your suggestions!'
                  : 'Your complaint has been logged. Our team will look into it.'
                }
              </p>
              {feedbackType === 'Complaint' && submittedTicket && (
                <div className="mt-4 p-3 bg-white rounded-xl border border-emerald-100  inline-block">
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Your Ticket Number</span>
                  <span className="text-lg font-black text-emerald-800 tracking-wider">{submittedTicket}</span>
                </div>
              )}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Submit Another {feedbackType}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {feedbackType === 'Feedback' && (
                <div className="space-y-2 text-center pt-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    How would you rate your experience?
                  </label>
                  <div className="flex items-center justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors duration-200 ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                              : 'fill-slate-100 text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Terrible'}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {feedbackType === 'Feedback' ? 'Feedback Category' : feedbackType === 'Idea' ? 'Idea Category' : 'Issue Category'}
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none cursor-pointer"
                  >
                    <option value="Customer Support">Customer Support</option>
                    <option value="Platform Features">Platform Features</option>
                    <option value="Trading Journal">Trading Journal</option>
                    <option value="Broker API">Broker API</option>
                    <option value="General Experience">General Experience</option>
                    {feedbackType === 'Complaint' && (
                      <>
                        <option value="Technical Issue">Technical Issue</option>
                        <option value="Billing">Billing</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                  <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {feedbackType === 'Feedback' ? 'Your Review / Message *' : feedbackType === 'Idea' ? 'Describe your idea *' : 'Describe your issue *'}
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={feedbackType === 'Feedback' ? "Tell us what you loved, or what we can improve..." : feedbackType === 'Idea' ? "I'd love to see a feature where..." : "Please describe the problem you encountered in detail..."}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition min-h-[120px] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition opacity-70 cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Phone (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="For follow-ups if needed"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{feedbackType === 'Feedback' ? 'Submit Feedback' : feedbackType === 'Idea' ? 'Submit Idea' : 'Submit Complaint'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
