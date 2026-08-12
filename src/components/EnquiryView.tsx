import React, { useState } from 'react';
import { Send, CheckCircle2, User, Mail, MessageSquare, Phone } from 'lucide-react';
import { saveFeedbackToFirestore } from '../utils/firebaseSync';
import { FeedbackItem } from '../types';

export const EnquiryView: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && message) {
      setSubmitted(true);
      
      const newEnquiry: FeedbackItem = {
        id: 'enq_' + Date.now(),
        type: 'Enquiry',
        ticketNumber: 'ENQ-' + Math.floor(1000 + Math.random() * 9000),
        userEmail: email || 'No Email',
        userName: name,
        phone: phone,
        category: 'General Experience',
        message: message,
        status: 'New',
        submittedAt: Date.now()
      };
      
      try {
        await saveFeedbackToFirestore(newEnquiry);
      } catch (err) {
        console.error("Failed to submit enquiry:", err);
      }
      
      const waText = encodeURIComponent(`New Enquiry:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`);
      window.open(`https://wa.me/918547742160?text=${waText}`, '_blank');
      
      setTimeout(() => {
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
        setSubmitted(false);
      }, 3000);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Enquiry Sent!</h3>
        <p className="text-sm text-slate-600">
          Thank you for reaching out. Our team will get back to you shortly. You have also been redirected to our WhatsApp support.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. rahul@example.com"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
        <div className="relative">
          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 9876543210"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Your Enquiry *</label>
        <div className="relative">
          <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help you?"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2"
      >
        <span>Submit Enquiry</span>
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};
