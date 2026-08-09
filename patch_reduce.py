import re

with open('src/components/AdminFeedbackAnalytics.tsx', 'r') as f:
    c = f.read()

reduce_str = "(feedbackList.reduce((acc, curr) => acc + curr.rating, 0) / totalSubmissions).toFixed(1)"
new_reduce = "(feedbackList.reduce((acc, curr) => acc + (curr.rating || 0), 0) / totalSubmissions).toFixed(1)"
c = c.replace(reduce_str, new_reduce)

positive_str = "const positiveSubmissions = feedbackList.filter((f) => f.rating >= 4).length;"
new_positive = "const positiveSubmissions = feedbackList.filter((f) => f.rating && f.rating >= 4).length;"
c = c.replace(positive_str, new_positive)

with open('src/components/AdminFeedbackAnalytics.tsx', 'w') as f:
    f.write(c)
