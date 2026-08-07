const fs = require('fs');

let content = fs.readFileSync('src/components/CustomerSupportModal.tsx', 'utf8');

// Remove the feedback tab button
content = content.replace(/<button[\s\S]*?onClick=\{\(\) => \{\s*populateUserData\(\);\s*setActiveTab\('feedback'\);\s*\}\}[\s\S]*?<\/button>/, '');

// Remove setSubmitSuccess from support tab button
content = content.replace(/onClick=\{\(\) => \{\s*setActiveTab\('support'\);\s*setSubmitSuccess\(false\);\s*\}\}/, "onClick={() => setActiveTab('support')}");

// Remove the feedback tab content
content = content.replace(/\{activeTab === 'feedback' && \([\s\S]*?\)\n\s*\}\n\s*<\/div>/, '</div>');

fs.writeFileSync('src/components/CustomerSupportModal.tsx', content);
