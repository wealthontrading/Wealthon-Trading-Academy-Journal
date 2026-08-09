import re

with open('src/components/AdminFeedbackAnalytics.tsx', 'r') as f:
    c = f.read()

filter_block = r"""  // Filtered feedback list\n  const filteredFeedback = feedbackList\.filter\(\(item\) => \{\n    const matchesSearch =\n      item\.userEmail\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\|\n      \(item\.userName && item\.userName\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)\) \|\|\n      item\.message\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\);\n    const matchesStatus = statusFilter === 'all' \|\| item\.status === statusFilter;\n    const matchesRating = ratingFilter === 'all' \|\| item\.rating === ratingFilter;\n    const matchesCategory = categoryFilter === 'all' \|\| item\.category === categoryFilter;\n    return matchesSearch && matchesStatus && matchesRating && matchesCategory;\n  \}\);"""

new_filter_block = """  // Filtered feedback list
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

c = re.sub(filter_block, new_filter_block, c)

with open('src/components/AdminFeedbackAnalytics.tsx', 'w') as f:
    f.write(c)
