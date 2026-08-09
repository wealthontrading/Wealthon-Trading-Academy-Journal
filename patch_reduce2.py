import re

with open('src/components/AdminFeedbackAnalytics.tsx', 'r') as f:
    c = f.read()

reduce_str = """  const avgRating =
    totalSubmissions > 0
      ? (feedbackList.reduce((acc, curr) => acc + (curr.rating || 0), 0) / totalSubmissions).toFixed(1)
      : '0.0';"""

new_reduce = """  const feedbackOnly = feedbackList.filter(f => f.type === 'Feedback' || f.rating);
  const avgRating =
    feedbackOnly.length > 0
      ? (feedbackOnly.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedbackOnly.length).toFixed(1)
      : '0.0';"""

c = c.replace(reduce_str, new_reduce)

with open('src/components/AdminFeedbackAnalytics.tsx', 'w') as f:
    f.write(c)
