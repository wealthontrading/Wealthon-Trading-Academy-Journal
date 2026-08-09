with open('src/components/AdminFeedbackAnalytics.tsx', 'r') as f:
    c = f.read()

import re

ui_block = r"            \{\/\* Category Filter \*\/\}\n            <select\n              value=\{categoryFilter\}\n              onChange=\{\(e\) => setCategoryFilter\(e\.target\.value\)\}\n              className=\"px-3 py-1\.5 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white focus:ring-2 focus:ring-amber-500 outline-none\"\n            >\n              <option value=\"all\">Category: All</option>\n              <option value=\"Customer Support\">Customer Support</option>\n              <option value=\"Platform Features\">Platform Features</option>\n              <option value=\"Trading Journal\">Trading Journal</option>\n              <option value=\"Broker API\">Broker API</option>\n              <option value=\"General Experience\">General Experience</option>\n            </select>"

new_ui = """            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Category: All</option>
              <option value="Customer Support">Customer Support</option>
              <option value="Platform Features">Platform Features</option>
              <option value="Trading Journal">Trading Journal</option>
              <option value="Broker API">Broker API</option>
              <option value="General Experience">General Experience</option>
            </select>
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Type: All</option>
              <option value="Feedback">Feedback</option>
              <option value="Complaint">Complaint</option>
            </select>"""

c = re.sub(ui_block, new_ui, c)

with open('src/components/AdminFeedbackAnalytics.tsx', 'w') as f:
    f.write(c)
