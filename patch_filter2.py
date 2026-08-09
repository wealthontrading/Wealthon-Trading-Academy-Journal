with open('src/components/AdminFeedbackAnalytics.tsx', 'r') as f:
    c = f.read()

import re
old_block = r"""  // Filtered feedback list
  const filteredFeedback = feedbackList.filter((item) => {
    const matchesSearch =
      item.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.userName && item.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || item.rating === ratingFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesRating && matchesCategory;
  });"""

new_block = """  // Filtered feedback list
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
  }).sort((a, b) => b.submittedAt - a.submittedAt);"""

c = c.replace(old_block, new_block)

with open('src/components/AdminFeedbackAnalytics.tsx', 'w') as f:
    f.write(c)
