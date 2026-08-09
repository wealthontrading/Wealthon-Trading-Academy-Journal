import re

with open('src/components/AdminFeedbackAnalytics.tsx', 'r') as f:
    c = f.read()

# Add Idea to type filter
type_filter = """              <option value="all">Type: All</option>
              <option value="Feedback">Feedback</option>
              <option value="Complaint">Complaint</option>
            </select>"""
new_type_filter = """              <option value="all">Type: All</option>
              <option value="Feedback">Feedback</option>
              <option value="Complaint">Complaint</option>
              <option value="Idea">Idea</option>
            </select>"""
c = c.replace(type_filter, new_type_filter)

# Fix Category & Status Badges
badge_block = r"""                  \{\/\* Category & Status Badges \*\/\}\n                  <div className=\"flex flex-wrap items-center gap-1\.5\">\n                    <span className=\"px-2\.5 py-0\.5 bg-slate-100 text-slate-800 text-\[10px\] font-extrabold rounded-md border border-slate-200\">\n                      \{item\.category\}\n                    <\/span>"""

new_badge_block = """                  {/* Category & Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md border ${
                      item.type === 'Complaint' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                      item.type === 'Idea' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {item.type === 'Complaint' ? 'Complaint' : item.type === 'Idea' ? 'Idea' : 'Feedback'}: {item.category}
                    </span>"""

c = re.sub(badge_block, new_badge_block, c)

with open('src/components/AdminFeedbackAnalytics.tsx', 'w') as f:
    f.write(c)
