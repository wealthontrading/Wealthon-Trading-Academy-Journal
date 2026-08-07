const fs = require('fs');

let modal = fs.readFileSync('src/components/VoiceMentorModal.tsx', 'utf8');

// Replace imports
modal = modal.replace(
  "import { X, Mic, MicOff, Loader2 } from 'lucide-react';",
  "import { X, Mic, MicOff, Loader2, MessageSquare } from 'lucide-react';"
);

// Add state for chat
modal = modal.replace(
  "const [isConnecting, setIsConnecting] = useState(false);",
  "const [isConnecting, setIsConnecting] = useState(false);\n  const [chatLog, setChatLog] = useState<{role: string, text: string}[]>([]);\n  const recognitionRef = useRef<any>(null);"
);

// Add stop logic for recognition
modal = modal.replace(
  "setIsConnecting(false);",
  "setIsConnecting(false);\n    if (recognitionRef.current) {\n      try { recognitionRef.current.stop(); } catch(e){}\n    }"
);

// Create the recognition object on startRecording
modal = modal.replace(
  "setIsRecording(true);",
  `setIsRecording(true);
        // Setup Speech Recognition for User transcription
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          // You can change lang if needed
          recognition.lang = 'ml-IN'; 
          recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            if (transcript.trim()) {
              setChatLog(prev => [...prev, { role: 'user', text: transcript }]);
            }
          };
          recognition.start();
          recognitionRef.current = recognition;
        }`
);

// Handle text messages from websocket
modal = modal.replace(
  "if (msg.interrupted) {",
  `if (msg.text) {
          setChatLog(prev => {
            const newLog = [...prev];
            const last = newLog[newLog.length - 1];
            if (last && last.role === 'mentor') {
              last.text += msg.text;
            } else {
              newLog.push({ role: 'mentor', text: msg.text });
            }
            return newLog;
          });
        }
        if (msg.interrupted) {`
);

// Add chat box to UI
const uiReplacement = `
        <div className="flex flex-col sm:flex-row h-full">
          <div className="p-8 flex flex-col items-center justify-center flex-1 min-w-0">
            <div className="mb-8 relative">
              <div className={\`absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 \${isRecording ? 'animate-pulse' : 'hidden'}\`}></div>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isConnecting}
                className={\`relative z-10 w-24 h-24 flex items-center justify-center rounded-full shadow-lg transition-all \${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/40' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/40'
                }\`}
              >
                {isConnecting ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
            </div>
            
            <div className="text-center space-y-2">
              <p className="font-semibold text-slate-800 text-lg">
                {isConnecting 
                  ? 'Connecting to Mentor...' 
                  : isRecording 
                    ? 'Listening...' 
                    : 'Tap to Speak'}
              </p>
              <p className="text-sm text-slate-500 px-4">
                {isRecording 
                  ? 'Speak in Malayalam to review your trading journey. The mentor will reply in voice.' 
                  : 'Get personalized feedback and psychological support in Malayalam.'}
              </p>
            </div>
          </div>
          
          <div className="w-full sm:w-1/2 border-t sm:border-t-0 sm:border-l border-slate-100 bg-slate-50 flex flex-col max-h-[350px] sm:max-h-[500px]">
            <div className="p-4 border-b border-slate-200 flex items-center space-x-2 bg-white">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-700 text-sm">Live Transcript</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatLog.length === 0 ? (
                <div className="text-center text-slate-400 text-xs mt-10">
                  Transcripts will appear here...
                </div>
              ) : (
                chatLog.map((msg, idx) => (
                  <div key={idx} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
                    <div className={\`max-w-[85%] rounded-2xl px-4 py-2 text-sm \${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}\`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
`;

modal = modal.replace(/<div className="p-8 flex flex-col items-center justify-center">[\s\S]*?<\/motion\.div>/, uiReplacement);

// Make the modal wider to fit the chat
modal = modal.replace('w-full max-w-md overflow-hidden', 'w-full max-w-3xl overflow-hidden');


fs.writeFileSync('src/components/VoiceMentorModal.tsx', modal);
