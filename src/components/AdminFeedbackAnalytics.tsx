import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Star,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Download,
  Phone,
  Mail,
  User,
  Sparkles,
  PieChart as PieIcon,
  MessageCircle,
  ThumbsUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { FeedbackItem } from '../types';
import {
  getStoredFeedback,
  subscribeFeedbackFromFirestore,
  updateFeedbackStatusInFirestore,
  deleteFeedbackFromFirestore
} from '../utils/firebaseSync';

interface AdminFeedbackAnalyticsProps {
  defaultTypeFilter?: string;
}

export const AdminFeedbackAnalytics: React.FC<AdminFeedbackAnalyticsProps> = ({ defaultTypeFilter = 'all' }) => {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'New' | 'Reviewed' | 'Resolved'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>(defaultTypeFilter);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Initial fetch from local storage
    setFeedbackList(getStoredFeedback());

    // Subscribe to Firestore live updates
    const unsubscribe = subscribeFeedbackFromFirestore((updatedList) => {
      setFeedbackList(updatedList);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filtered feedback list
  const filteredFeedback = feedbackList.filter((item) => {
    const matchesSearch =
      item.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.userName && item.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.ticketNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || item.rating === ratingFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesType = typeFilter === 'all' || (item.type || 'Feedback') === typeFilter;
    return matchesSearch && matchesStatus && matchesRating && matchesCategory && matchesType;
  }).sort((a, b) => b.submittedAt - a.submittedAt);

  // Calculate Metrics
  const totalSubmissions = feedbackList.length;
  const newCount = feedbackList.filter((f) => f.status === 'New').length;
  const reviewedCount = feedbackList.filter((f) => f.status === 'Reviewed').length;
  const resolvedCount = feedbackList.filter((f) => f.status === 'Resolved').length;

  const feedbackOnly = feedbackList.filter(f => f.type === 'Feedback' || f.rating);
  const avgRating =
    feedbackOnly.length > 0
      ? (feedbackOnly.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedbackOnly.length).toFixed(1)
      : '0.0';

  const positiveSubmissions = feedbackList.filter((f) => f.rating && f.rating >= 4).length;
  const satisfactionRate =
    totalSubmissions > 0 ? Math.round((positiveSubmissions / totalSubmissions) * 100) : 0;

  // Chart Data 1: Star Rating Distribution
  const ratingDistribution = [
    { rating: '5 Stars', stars: 5, count: feedbackList.filter((f) => f.rating === 5).length, color: '#10b981' },
    { rating: '4 Stars', stars: 4, count: feedbackList.filter((f) => f.rating === 4).length, color: '#3b82f6' },
    { rating: '3 Stars', stars: 3, count: feedbackList.filter((f) => f.rating === 3).length, color: '#f59e0b' },
    { rating: '2 Stars', stars: 2, count: feedbackList.filter((f) => f.rating === 2).length, color: '#f97316' },
    { rating: '1 Star', stars: 1, count: feedbackList.filter((f) => f.rating === 1).length, color: '#ef4444' }
  ];

  // Chart Data 2: Category Breakdown
  const categoriesMap = new Map<string, number>();
  feedbackList.forEach((item) => {
    const cat = item.category || 'General Experience';
    categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + 1);
  });

  const categoryColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
  const categoryChartData = Array.from(categoriesMap.entries()).map(([name, value], index) => ({
    name,
    value,
    color: categoryColors[index % categoryColors.length]
  }));

  const handleUpdateStatus = async (id: string, newStatus: 'New' | 'Reviewed' | 'Resolved') => {
    try {
      await updateFeedbackStatusInFirestore(id, newStatus);
      setBannerNotice({ type: 'success', text: `Feedback status updated to ${newStatus}!` });
      setTimeout(() => setBannerNotice(null), 3000);
    } catch {
      setBannerNotice({ type: 'error', text: 'Failed to update feedback status.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this feedback item?')) {
      try {
        await deleteFeedbackFromFirestore(id);
        setBannerNotice({ type: 'success', text: 'Feedback deleted successfully.' });
        setTimeout(() => setBannerNotice(null), 3000);
      } catch {
        setBannerNotice({ type: 'error', text: 'Failed to delete feedback.' });
      }
    }
  };

  const handleExportCSV = () => {
    if (feedbackList.length === 0) return;
    const headers = ['ID', 'Submitted At', 'Email', 'Name', 'Phone', 'Rating', 'Category', 'Status', 'Message'];
    const rows = feedbackList.map((f) => [
      f.id,
      new Date(f.submittedAt).toLocaleString(),
      f.userEmail,
      f.userName || '',
      f.phone || '',
      f.rating,
      f.category,
      f.status,
      `"${f.message.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WealthOn_Feedback_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-8">
      {/* Top Section Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500 rounded-xl text-slate-950 shadow-sm">
              <Star className="w-5 h-5 fill-slate-950" />
            </div>
            <h3 className="text-xl font-black text-slate-900">User Feedback & Satisfaction Analytics</h3>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-mono font-extrabold text-[10px] rounded-full uppercase tracking-wider flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
              <span>LIVE UPDATING</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time feedback collection from student support sessions. Analytics charts update automatically as new reviews arrive.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExportCSV}
            disabled={feedbackList.length === 0}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Feedback CSV</span>
          </button>
        </div>
      </div>

      {/* Banner Notice */}
      {bannerNotice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <span>{bannerNotice.text}</span>
          <button onClick={() => setBannerNotice(null)} className="font-extrabold text-sm px-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Avg Rating */}
        <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 rounded-2xl border border-amber-200 space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-black uppercase tracking-wider">Average Rating</span>
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2 pt-1">
            <span className="text-3xl font-black text-slate-900">{avgRating}</span>
            <span className="text-xs font-bold text-slate-500">/ 5.0 Stars</span>
          </div>
          <div className="flex items-center space-x-1 pt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= Math.round(Number(avgRating))
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-slate-300 fill-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card 2: Total Feedback */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Total Submissions</span>
            <MessageSquare className="w-4 h-4" />
          </div>
          <p className="text-3xl font-black text-slate-900 pt-1">{totalSubmissions}</p>
          <p className="text-[11px] font-semibold text-slate-500">All-time feedback received</p>
        </div>

        {/* Card 3: Satisfaction Rate */}
        <div className="p-5 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-black uppercase tracking-wider">Satisfaction Rate</span>
            <ThumbsUp className="w-4 h-4" />
          </div>
          <p className="text-3xl font-black text-emerald-950 pt-1">{satisfactionRate}%</p>
          <p className="text-[11px] font-bold text-emerald-800">{positiveSubmissions} Positive Reviews (4-5★)</p>
        </div>

        {/* Card 4: New / Pending Action */}
        <div className="p-5 bg-indigo-50/80 rounded-2xl border border-indigo-200 space-y-1">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-[11px] font-black uppercase tracking-wider">New Action Items</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-3xl font-black text-indigo-950 pt-1">{newCount}</p>
          <p className="text-[11px] font-bold text-indigo-800">Requires Admin Review</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Star Rating Breakdown Bar Chart */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>Rating Breakdown Distribution</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-500">{totalSubmissions} Total</span>
          </div>

          <div className="h-52 w-full">
            {totalSubmissions === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No feedback data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistribution} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <XAxis type="number" allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="rating" stroke="#64748b" fontSize={11} fontWeight="bold" width={60} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${value} Submissions`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Feedback Category Distribution Pie Chart */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-indigo-500" />
              <span>Feedback Category Volume</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-500">{categoryChartData.length} Categories</span>
          </div>

          <div className="h-52 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No category data available.
              </div>
            ) : (
              <>
                <div className="h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => [`${val} feedback(s)`, 'Volume']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full sm:w-1/2 space-y-1.5 text-xs">
                  {categoryChartData.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="font-bold text-slate-700 text-[11px] truncate max-w-[120px]">{cat.name}</span>
                      </div>
                      <span className="font-extrabold text-slate-900 font-mono text-[11px]">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback by email, student name, or keyword..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none bg-white"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Status: All ({totalSubmissions})</option>
              <option value="New">Status: New ({newCount})</option>
              <option value="Reviewed">Status: Reviewed ({reviewedCount})</option>
              <option value="Resolved">Status: Resolved ({resolvedCount})</option>
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Stars: All Ratings</option>
              <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
              <option value="4">4 Stars ⭐⭐⭐⭐</option>
              <option value="3">3 Stars ⭐⭐⭐</option>
              <option value="2">2 Stars ⭐⭐</option>
              <option value="1">1 Star ⭐</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Category: All</option>
              <option value="Customer Support">Customer Support</option>
              <option value="Platform Features">Platform Features</option>
              <option value="Trading Journal">Trading Journal</option>
              <option value="Broker API">Broker API</option>
              <option value="General Experience">General Experience</option>
            </select>
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Type: All</option>
              <option value="Feedback">Feedback</option>
              <option value="Complaint">Complaint</option>
              <option value="Idea">Idea</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Submissions Cards & Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-blue-600" />
            <span>Student Feedback Logs ({filteredFeedback.length})</span>
          </h4>
        </div>

        {filteredFeedback.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-3xl text-slate-400 text-xs space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-extrabold text-slate-600">No student feedback found matching your criteria.</p>
            <p className="text-[11px] text-slate-400">Students can submit feedback anytime inside the Support modal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeedback.map((item) => {
              const formattedDate = new Date(item.submittedAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
              });

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition shadow-2xs space-y-3 ${
                    item.status === 'New'
                      ? 'bg-amber-50/40 border-amber-200 shadow-amber-500/5'
                      : item.status === 'Reviewed'
                      ? 'bg-blue-50/30 border-blue-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Top Row: User & Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900 text-sm">{item.userName || 'Student'}</span>
                        <span className="text-[11px] font-mono text-slate-500">({item.userEmail})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">{formattedDate}</span>
                    </div>

                    {/* Badge */}
                    {item.type === 'Complaint' && item.ticketNumber ? (
                      <div className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-1 shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-extrabold text-rose-900 text-[10px]">{item.ticketNumber}</span>
                      </div>
                    ) : item.type === 'Idea' ? (
                      <div className="px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg flex items-center space-x-1 shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span className="font-extrabold text-purple-900 text-[10px]">Idea</span>
                      </div>
                    ) : item.rating ? (
                      <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full flex items-center space-x-1 shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-extrabold text-amber-900 text-xs">{item.rating}.0</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Category & Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md border ${
                      item.type === 'Complaint' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                      item.type === 'Idea' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {item.type === 'Complaint' ? 'Complaint' : item.type === 'Idea' ? 'Idea' : 'Feedback'}: {item.category}
                    </span>

                    {item.status === 'New' && (
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-mono font-black text-[10px] rounded-full uppercase tracking-wider animate-pulse">
                        🔴 New
                      </span>
                    )}
                    {item.status === 'Reviewed' && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-full uppercase">
                        🔵 Reviewed
                      </span>
                    )}
                    {item.status === 'Resolved' && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase">
                        🟢 Resolved
                      </span>
                    )}
                  </div>

                  {/* Message Box */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed">
                    &quot;{item.message}&quot;
                  </div>

                  {/* Contact Info & Actions */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                    <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                      {item.phone && (
                        <a
                          href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                            item.userName || ''
                          )},%20thank%20you%20for%20your%20feedback%20on%20WealthOn!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-lg flex items-center space-x-1 cursor-pointer"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    {/* Status Action Buttons */}
                    <div className="flex items-center space-x-1.5">
                      {item.status !== 'Reviewed' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.id, 'Reviewed')}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-bold rounded-lg cursor-pointer"
                        >
                          Mark Reviewed
                        </button>
                      )}

                      {item.status !== 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.id, 'Resolved')}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer shadow-2xs"
                        >
                          Mark Resolved
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete feedback"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
