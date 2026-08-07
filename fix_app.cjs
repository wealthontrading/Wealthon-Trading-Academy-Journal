const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');
let headerTsx = fs.readFileSync('src/components/Header.tsx', 'utf8');

// Header.tsx updates
headerTsx = headerTsx.replace('onOpenSettings: () => void;', 'onOpenSettings: () => void;\n  onOpenVoiceMentor?: () => void;');
headerTsx = headerTsx.replace('onOpenSettings,\n  onOpenCustomerSupport', 'onOpenSettings,\n  onOpenVoiceMentor,\n  onOpenCustomerSupport');

const voiceMentorButton = `
            {onOpenVoiceMentor && (
              <button
                onClick={onOpenVoiceMentor}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl shadow-md transition cursor-pointer"
                title="Voice Mentor (Live)"
              >
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                <span className="text-xs font-bold">Voice Mentor</span>
              </button>
            )}
`;

headerTsx = headerTsx.replace(/\{onOpenAddTrade && \(\s*<button[\s\S]*?className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-md shadow-emerald-500\/20 transition cursor-pointer"[\s\S]*?<\/button>\s*\)\}/, match => match + voiceMentorButton);

fs.writeFileSync('src/components/Header.tsx', headerTsx);

// App.tsx updates
appTsx = appTsx.replace("import { CustomerSupportModal } from './components/CustomerSupportModal';", "import { CustomerSupportModal } from './components/CustomerSupportModal';\nimport { VoiceMentorModal } from './components/VoiceMentorModal';");

appTsx = appTsx.replace('const [isSendToMentorOpen, setIsSendToMentorOpen] = useState(false);', 'const [isSendToMentorOpen, setIsSendToMentorOpen] = useState(false);\n  const [isVoiceMentorOpen, setIsVoiceMentorOpen] = useState(false);');

appTsx = appTsx.replace('const handleOpenSendToMentor = () => setIsSendToMentorOpen(true);', 'const handleOpenSendToMentor = () => setIsSendToMentorOpen(true);\n  const handleOpenVoiceMentor = () => setIsVoiceMentorOpen(true);\n  const handleCloseVoiceMentor = () => setIsVoiceMentorOpen(false);');

appTsx = appTsx.replace('onOpenSendToMentor={handleOpenSendToMentor}', 'onOpenSendToMentor={handleOpenSendToMentor}\n          onOpenVoiceMentor={handleOpenVoiceMentor}');

appTsx = appTsx.replace('<CustomerSupportModal', '<VoiceMentorModal isOpen={isVoiceMentorOpen} onClose={handleCloseVoiceMentor} />\n\n      <CustomerSupportModal');

fs.writeFileSync('src/App.tsx', appTsx);
