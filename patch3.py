with open('src/components/AdminFeedbackAnalytics.tsx', 'r') as f:
    c = f.read()

import re

ui_block = r"                    \{\/\* Star Rating Badge \*\/\}\n                    <div className=\"px-2\.5 py-1 bg-amber-50 border border-amber-200 rounded-full flex items-center space-x-1 shrink-0\">\n                      <Star className=\"w-3\.5 h-3\.5 text-amber-500 fill-amber-500\" \/>\n                      <span className=\"font-extrabold text-amber-900 text-xs\">\{item\.rating\}\.0<\/span>\n                    <\/div>\n                  <\/div>\n                  \{\/\* Category & Status Badges \*\/\}\n                  <div className=\"flex flex-wrap items-center gap-1\.5\">\n                    <span className=\"px-2\.5 py-0\.5 bg-slate-100 text-slate-800 text-\[10px\] font-extrabold rounded-md border border-slate-200\">\n                      \{item\.category\}\n                    <\/span>"

new_ui = """                    {/* Star Rating Badge / Ticket Number */}
                    {item.type === 'Complaint' ? (
                      <div className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-1 shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-extrabold text-rose-900 text-[10px]">{item.ticketNumber}</span>
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
                      item.type === 'Complaint' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {item.type === 'Complaint' ? 'Complaint' : 'Feedback'}: {item.category}
                    </span>"""

c = re.sub(ui_block, new_ui, c)

with open('src/components/AdminFeedbackAnalytics.tsx', 'w') as f:
    f.write(c)
