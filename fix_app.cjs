const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
const importPattern = `import { JournalNotesView } from './components/JournalNotesView';`;
if (code.includes(importPattern)) {
    code = code.replace(importPattern, importPattern + `\nimport { FeedbackView } from './components/FeedbackView';`);
}

// Add tab to validTabs type / initial state
// Let's check how activeTab is defined.
// const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'strategyBuilder' | 'analytics' | 'journal' | 'aiAssistant' | 'brokerConnection'>(...)

code = code.replace(
  /useState<'dashboard' \| 'history' \| 'strategyBuilder' \| 'analytics' \| 'journal' \| 'aiAssistant' \| 'brokerConnection'>/g, 
  "useState<'dashboard' | 'history' | 'strategyBuilder' | 'analytics' | 'journal' | 'aiAssistant' | 'brokerConnection' | 'feedback'>"
);

// Add to nav bar
// { id: 'brokerConnection', label: 'Broker Connection', Icon: Radio },
// We need to add Feedback to the tabs list
const tabsPattern = `              { id: 'brokerConnection', label: 'Broker Connection', Icon: Radio },`;
const newTab = `              { id: 'brokerConnection', label: 'Broker Connection', Icon: Radio },\n              { id: 'feedback', label: 'Feedback & Reviews', Icon: MessageSquare },`;
if (code.includes(tabsPattern)) {
    code = code.replace(tabsPattern, newTab);
}

// Ensure MessageSquare is imported from lucide-react in App.tsx
// if not, add it to the import { ... } from 'lucide-react';
if (!code.includes('MessageSquare') && code.includes("from 'lucide-react'")) {
    code = code.replace("from 'lucide-react';", ", MessageSquare } from 'lucide-react';");
}

// Render FeedbackView in the main view
const brokerViewPattern = `            {activeTab === 'brokerConnection' && (
              <BrokerConnectionPage
                userSession={
                  session
                    ? {
                        ...session,
                        email: activeUserEmail || session.email,
                      }
                    : null
                }
              />
            )}`;

const feedbackViewRender = `            {activeTab === 'brokerConnection' && (
              <BrokerConnectionPage
                userSession={
                  session
                    ? {
                        ...session,
                        email: activeUserEmail || session.email,
                      }
                    : null
                }
              />
            )}
            {activeTab === 'feedback' && (
              <FeedbackView profile={profile} userSession={session} />
            )}`;

if (code.includes(brokerViewPattern)) {
    code = code.replace(brokerViewPattern, feedbackViewRender);
} else {
    console.log("brokerViewPattern NOT found");
}

fs.writeFileSync('src/App.tsx', code);
