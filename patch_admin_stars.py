import re

with open('src/components/AdminFeedbackAnalytics.tsx', 'r') as f:
    c = f.read()

star_block = r"""                    \{\/\* Star Rating Badge \*\/\}\n                    <div className=\"px-2\.5 py-1 bg-amber-50 border border-amber-200 rounded-full flex items-center space-x-1 shrink-0\">\n                      <Star className=\"w-3\.5 h-3\.5 text-amber-500 fill-amber-500\" \/>\n                      <span className=\"font-extrabold text-amber-900 text-xs\">\{item\.rating\}\.0<\/span>\n                    <\/div>"""

new_star_block = """                    {/* Badge */}
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
                    ) : null}"""

c = re.sub(star_block, new_star_block, c)

with open('src/components/AdminFeedbackAnalytics.tsx', 'w') as f:
    f.write(c)
