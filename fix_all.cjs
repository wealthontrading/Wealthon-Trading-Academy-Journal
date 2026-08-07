const fs = require('fs');

// 1. App.tsx: Remove voice mentor
let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

// Imports
appTsx = appTsx.replace("import { VoiceMentorModal } from './components/VoiceMentorModal';\n", "");

// State
appTsx = appTsx.replace("  const [isVoiceMentorOpen, setIsVoiceMentorOpen] = useState(false);\n", "");

// Handlers
appTsx = appTsx.replace(/  const handleOpenVoiceMentor = \(\) => \{\n    setIsVoiceMentorOpen\(true\);\n  \};\n\n  const handleCloseVoiceMentor = \(\) => \{\n    setIsVoiceMentorOpen\(false\);\n  \};\n/g, "");

// Header props
appTsx = appTsx.replace(/          onOpenVoiceMentor=\{handleOpenVoiceMentor\}\n/g, "");

// Modal tag
appTsx = appTsx.replace(/      <VoiceMentorModal isOpen=\{isVoiceMentorOpen\} onClose=\{handleCloseVoiceMentor\} \/>\n/g, "");
appTsx = appTsx.replace(/      <VoiceMentorModal isOpen=\{isVoiceMentorOpen\} onClose=\{handleCloseVoiceMentor\} \/>/g, "");

fs.writeFileSync('src/App.tsx', appTsx);

// 2. Header.tsx: Remove voice mentor
let headerTsx = fs.readFileSync('src/components/Header.tsx', 'utf8');

headerTsx = headerTsx.replace("  onOpenVoiceMentor?: () => void;\n", "");
headerTsx = headerTsx.replace("  onOpenVoiceMentor,\n", "");

const voiceMentorButtonRegex = / *\{onOpenVoiceMentor && \([\s\S]*?<\/button>\n *\)\}\n/g;
headerTsx = headerTsx.replace(voiceMentorButtonRegex, "");

fs.writeFileSync('src/components/Header.tsx', headerTsx);

// 3. CustomerSupportModal.tsx: Fix tabs
let supportModal = fs.readFileSync('src/components/CustomerSupportModal.tsx', 'utf8');

const replacement = `            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center border-b border-slate-200 px-6 pt-2 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('support')}
              className={\`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer \${
                activeTab === 'support'
                  ? 'border-blue-600 text-blue-700 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }\`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Chat Support</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className={\`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer \${
                activeTab === 'feedback'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }\`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('renew')}
              className={\`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer \${
                activeTab === 'renew'
                  ? 'border-indigo-600 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }\`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Renew Plan</span>
            </button>
          </div>`;

const searchRegex = / *<\/div>\n *\n *<button\n *type="button"\n *onClick=\{\(\) => setActiveTab\('renew'\)\}[\s\S]*?<\/button>\n *<\/div>/g;

supportModal = supportModal.replace(searchRegex, replacement);

fs.writeFileSync('src/components/CustomerSupportModal.tsx', supportModal);

