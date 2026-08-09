with open('src/components/AdminFeedbackAnalytics.tsx', 'r') as f:
    lines = f.readlines()

out = []
skip = False
for line in lines:
    if line.startswith('  // Filtered feedback list'):
        skip = True
        out.append("""  // Filtered feedback list
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
""")
        continue
    
    if skip and line.strip() == '});':
        skip = False
        continue
        
    if not skip:
        out.append(line)

with open('src/components/AdminFeedbackAnalytics.tsx', 'w') as f:
    f.writelines(out)
