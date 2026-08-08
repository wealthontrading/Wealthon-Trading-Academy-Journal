const fs = require('fs');

let code = fs.readFileSync('src/components/CustomerSupportModal.tsx', 'utf8');

// 1. Remove feedback state
const feedbackStatePattern = /\s*\/\/ Feedback form state[\s\S]*?const \[errorMsg, setErrorMsg\] = useState<string \| null>\(null\);/;
code = code.replace(feedbackStatePattern, '');

// 2. Remove handleSubmitFeedback
const handleSubmitFeedbackPattern = /\s*const handleSubmitFeedback = async \(e: React\.FormEvent\) => \{[\s\S]*?setIsSubmitting\(false\);\n    \}\n  \};/;
code = code.replace(handleSubmitFeedbackPattern, '');

// 3. Remove saveFeedbackToFirestore import
code = code.replace(/import \{ saveFeedbackToFirestore \} from '\.\.\/utils\/firebaseSync';\n/, '');

// 4. Update tab state initialType
code = code.replace(/initialTab\?: 'support' \| 'feedback' \| 'renew';/g, "initialTab?: 'support' | 'renew';");
code = code.replace(/useState<'support' \| 'feedback' \| 'renew'>/g, "useState<'support' | 'renew'>");

// 5. Change chat logic to use sendChatMessage function and add quick questions
const quickQuestions = `
  const quickQuestions = [
    "How to log a trade?",
    "What is the pricing?",
    "Connect to human agent"
  ];

  const sendChatMessage = async (text: string) => {
    if (!text.trim() || isChatLoading) return;
    
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsChatLoading(true);

    try {
      const systemInstruction = \`You are WealthOn Support Bot, a 24/7 customer support AI. Help the user with any website problems, trading journal queries, or general academy questions. If the user asks for a human, customer support agent, contact, WhatsApp, or says they want to connect to support, you MUST reply exactly with the text: [CONNECT_SUPPORT]. Keep your responses concise and helpful.\`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { role: 'user', content: text }],
          model: 'gemini-2.5-flash',
          systemInstruction,
        }),
      });

      const data = await res.json();
      const aiReply = data.text || 'Sorry, I am having trouble connecting to the server.';

      if (aiReply.includes('[CONNECT_SUPPORT]') || text.toLowerCase().includes('support') || text.toLowerCase().includes('human') || text.toLowerCase().includes('agent')) {
        setShowWhatsApp(true);
        setChatMessages((prev) => [...prev, { role: 'model', content: "I'm connecting you to our WhatsApp Customer Support team now." }]);
      } else {
        setChatMessages((prev) => [...prev, { role: 'model', content: aiReply }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      if (text.toLowerCase().includes('support') || text.toLowerCase().includes('human') || text.toLowerCase().includes('agent')) {
         setShowWhatsApp(true);
      } else {
         setChatMessages((prev) => [...prev, { role: 'model', content: "An error occurred while connecting. Please try again or ask for human support." }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      await sendChatMessage(chatInput.trim());
    }
  };
`;

const handleChatSubmitPattern = /\s*const handleChatSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?setIsChatLoading\(false\);\n    \}\n  \};/;
code = code.replace(handleChatSubmitPattern, quickQuestions);

// Add quick questions UI inside chat Messages block
const chatInputFormStr = `                    <form onSubmit={handleChatSubmit}`;
const newChatInputFormStr = `                    <div className="px-4 pb-2 pt-1 overflow-x-auto flex space-x-2 no-scrollbar shrink-0">
                      {quickQuestions.map((q, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => sendChatMessage(q)}
                          disabled={isChatLoading}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-200 hover:bg-blue-100 transition whitespace-nowrap cursor-pointer disabled:opacity-50"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    <form onSubmit={handleChatSubmit}`;
code = code.replace(chatInputFormStr, newChatInputFormStr);

// 6. Remove the "Student Feedback & Review" button block inside support view.
const reviewBlockStart = `                {/* DIRECT REVIEW & FEEDBACK CALLOUT CARD INSIDE SUPPORT PAGE */}`;
const reviewBlockPattern = /\s*\{\/\* DIRECT REVIEW & FEEDBACK CALLOUT CARD INSIDE SUPPORT PAGE \*\/\}[\s\S]*?<\/div>/;
code = code.replace(reviewBlockPattern, '');

// 7. Remove Feedback Tab button
const feedbackTabPattern = /\s*<button\s*type="button"\s*onClick=\{\(\) => setActiveTab\('feedback'\)\}[\s\S]*?<\/span>\s*<\/button>/;
code = code.replace(feedbackTabPattern, '');


fs.writeFileSync('src/components/CustomerSupportModal.tsx', code);
