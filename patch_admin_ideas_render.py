import re

with open('src/components/AdminPortal.tsx', 'r') as f:
    c = f.read()

feedback_block = r"""        \{\/\* SECTION 2: USER FEEDBACK & SATISFACTION ANALYTICS \*\/\}\n        \{\(activeAdminPage === 'all' \|\| activeAdminPage === 'feedback'\) && \(\n          <AdminFeedbackAnalytics \/>\n        \)\}"""

new_feedback_block = """        {/* SECTION 2: USER FEEDBACK & SATISFACTION ANALYTICS */}
        {(activeAdminPage === 'all' || activeAdminPage === 'feedback') && (
          <AdminFeedbackAnalytics />
        )}
        
        {/* SECTION 2.5: IDEAS & IMPROVEMENTS */}
        {activeAdminPage === 'ideas' && (
          <AdminFeedbackAnalytics defaultTypeFilter="Idea" />
        )}"""

c = re.sub(feedback_block, new_feedback_block, c)

with open('src/components/AdminPortal.tsx', 'w') as f:
    f.write(c)
