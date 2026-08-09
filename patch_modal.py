import re

with open('src/components/CustomerSupportModal.tsx', 'r') as f:
    c = f.read()

sidebar_btn = r"""            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer \$\{
                activeTab === 'feedback'
                  \? 'border-indigo-600 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              \}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback & Complaints</span>
            </button>"""

new_sidebar = """            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'feedback'
                  ? 'border-indigo-600 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback & Complaints</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('idea')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'idea'
                  ? 'border-indigo-600 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Share Ideas</span>
            </button>"""

c = re.sub(sidebar_btn, new_sidebar, c)

content_tab = r"""            \{activeTab === 'feedback' && \(
              <FeedbackView profile=\{profile\} userSession=\{userSession\} />
            \)\}"""

new_content = """            {activeTab === 'feedback' && (
              <FeedbackView profile={profile} userSession={userSession} defaultTab="Feedback" />
            )}

            {activeTab === 'idea' && (
              <FeedbackView profile={profile} userSession={userSession} defaultTab="Idea" />
            )}"""

c = re.sub(content_tab, new_content, c)

with open('src/components/CustomerSupportModal.tsx', 'w') as f:
    f.write(c)
