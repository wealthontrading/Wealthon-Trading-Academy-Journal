import re

with open('src/components/AdminPortal.tsx', 'r') as f:
    c = f.read()

feedback_btn = r"""            <button
              type="button"
              onClick=\{\(\) => setActiveAdminPage\('feedback'\)\}
              className=\{`px-3\.5 py-2 font-bold rounded-xl transition cursor-pointer flex items-center space-x-1\.5 \$\{
                activeAdminPage === 'feedback'
                  \? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              \}`\}
            >
              <Star className="w-3\.5 h-3\.5 text-amber-500 fill-amber-500" \/>
              <span>User Feedback & Analytics<\/span>
            <\/button>"""

new_btns = """            <button
              type="button"
              onClick={() => setActiveAdminPage('feedback')}
              className={`px-3.5 py-2 font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminPage === 'feedback'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>User Feedback & Analytics</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminPage('ideas')}
              className={`px-3.5 py-2 font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminPage === 'ideas'
                  ? 'bg-purple-600 text-white font-black shadow-xs'
                  : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Ideas & Improvements</span>
            </button>"""

c = re.sub(feedback_btn, new_btns, c)

with open('src/components/AdminPortal.tsx', 'w') as f:
    f.write(c)
