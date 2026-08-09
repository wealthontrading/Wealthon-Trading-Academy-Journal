import re

with open('src/components/AdminFeedbackAnalytics.tsx', 'r') as f:
    content = f.read()

# Add a type filter
filters_ui = """            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Type: All</option>
              <option value="Feedback">Feedback</option>
              <option value="Complaint">Complaint</option>
            </select>
"""
content = re.sub(r'(\{\/\* Status Filter \*\/)', filters_ui + r'\1', content)

# Add state
states = """  const [statusFilter, setStatusFilter] = useState<'all' | 'New' | 'Reviewed' | 'Resolved'>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | number>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');"""
content = re.sub(r'const \[statusFilter.*setCategoryFilter.*?;', states, content, flags=re.DOTALL)

# Add logic for filtering
logic = """  const filteredFeedback = feedbackList.filter(item => {
    const matchesSearch = item.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.ticketNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || item.rating === ratingFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesType = typeFilter === 'all' || (item.type || 'Feedback') === typeFilter;
    
    return matchesSearch && matchesStatus && matchesRating && matchesCategory && matchesType;
  }).sort((a, b) => b.submittedAt - a.submittedAt);"""
content = re.sub(r'const filteredFeedback = feedbackList\.filter.*?\.sort\(\(a, b\) => b\.submittedAt - a\.submittedAt\);', logic, content, flags=re.DOTALL)

# Modify render card
card = """                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900 text-sm">{item.userName || 'Student'}</span>
                        <span className="text-[11px] font-mono text-slate-500">({item.userEmail})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">{formattedDate}</span>
                    </div>
                    {/* Star Rating Badge / Ticket Number */}
                    {item.type === 'Complaint' ? (
                      <div className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-1 shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-extrabold text-rose-900 text-[10px]">{item.ticketNumber}</span>
                      </div>
                    ) : item.rating && (
                      <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full flex items-center space-x-1 shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-extrabold text-amber-900 text-xs">{item.rating}.0</span>
                      </div>
                    )}
                  </div>
                  {/* Category & Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md border ${
                      item.type === 'Complaint' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {item.type === 'Complaint' ? 'Complaint' : 'Feedback'}: {item.category}
                    </span>"""

content = re.sub(r'<div className="space-y-0\.5">.*?\{item\.category\}\s*</span>', card, content, flags=re.DOTALL)

with open('src/components/AdminFeedbackAnalytics.tsx', 'w') as f:
    f.write(content)
