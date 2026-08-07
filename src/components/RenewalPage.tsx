import React from 'react';
import { UserSession } from '../types';
import { Clock, LogOut, MessageSquare } from 'lucide-react';

interface RenewalPageProps {
  session: UserSession;
  onLogout: () => void;
}

export const RenewalPage: React.FC<RenewalPageProps> = ({ session, onLogout }) => {
  const handleWhatsAppContact = () => {
    const text = `Hi Renew Team, I would like to renew my WealthOn Trading Academy account. My details are:\nName: ${session.name}\nEmail: ${session.email}`;
    const url = `https://wa.me/918547742160?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Account Expired</h1>
        <p className="text-slate-600 mb-6 text-sm">
          Hi {session.name}, your 1-year Limited Plan has expired. 
          To continue accessing your trading journal, old data, and profile, please renew your subscription.
        </p>

        <button
          onClick={handleWhatsAppContact}
          className="w-full py-3 mb-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Contact Renew Team on WhatsApp</span>
        </button>

        <button
          onClick={onLogout}
          className="mt-2 text-slate-500 hover:text-slate-800 text-sm font-semibold flex items-center justify-center space-x-2 mx-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
