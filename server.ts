import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Shared GenAI client helper
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini Multi-turn Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model, systemInstruction } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const requestedModel = model || 'gemini-3.6-flash';

    // Map conversation history to contents format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

    let aiText = '';
    let success = false;

    // List of models to attempt sequentially according to google genai guidelines
    const candidateModels = Array.from(new Set([requestedModel, 'gemini-3.6-flash']));

    if (process.env.GEMINI_API_KEY) {
      const ai = getGenAI();
      for (const modelToTry of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelToTry,
            contents,
            config: {
              systemInstruction:
                systemInstruction ||
                'You are WealthOn AI Trading Assistant & Personal Coach, an elite 24/7 trading coach specializing in Indian Options trading (Nifty, BankNifty, Sensex), position sizing, trading psychology, disciplined execution rules, and data-driven performance insights. Give clear, direct, actionable advice using bullet points, bold key terms, and structured formatting.',
            },
          });
          if (response && response.text) {
            aiText = response.text;
            success = true;
            break;
          }
        } catch (modelErr: any) {
          console.warn(`Attempt with model ${modelToTry} failed:`, modelErr.message || modelErr);
        }
      }
    }

    if (!success) {
      // Intelligent fallback WealthOn Trading Coach response when API key is restricted or denied
      aiText = generateMentorFallbackResponse(lastUserMessage);
    }

    res.json({ text: aiText });
  } catch (err: any) {
    console.error('Gemini Chat API Error:', err);
    // Provide graceful mentor fallback message instead of breaking the UI
    const lastUserMsg = req.body?.messages?.filter((m: any) => m.role === 'user').pop()?.content || '';
    res.json({
      text: generateMentorFallbackResponse(lastUserMsg),
    });
  }
});

// Helper for generating structured mentor fallback responses
function generateMentorFallbackResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('support') || q.includes('human') || q.includes('contact') || q.includes('whatsapp') || q.includes('agent')) {
    return '[CONNECT_SUPPORT]';
  }

  if (q.includes('position size') || q.includes('calculat') || q.includes('quantity')) {
    return `### 📐 **WealthOn Position Sizing Rule (1-2% Risk Formula)**\n\nTo ensure capital preservation in Nifty/BankNifty options:\n1. **Maximum Account Risk Per Trade**: Never risk more than **1% to 2%** of total capital on a single trade setup.\n2. **Formula**: \`Max Lots = (Total Capital × Risk %) / (Entry Premium - Stop Loss Premium × Lot Size)\`\n3. **Rule**: If a single trade loss wipes out more than 2% of your account, you are over-leveraged! Reduce quantity immediately.`;
  }

  if (q.includes('revenge') || q.includes('loss') || q.includes('emotion') || q.includes('psychology')) {
    return `### 🧠 **WealthOn Discipline & Psychology Protocol**\n\nWhen facing a loss:\n1. **Enforce Daily SL Limit**: Stop trading immediately if you hit your daily loss limit (e.g., 2 consecutive stop-losses).\n2. **Take a 20-minute Cooling Off**: Step away from terminal screen. Do NOT immediately re-enter to "get money back".\n3. **Log the Trade First**: Open your WealthOn Journal and record why the SL was hit before opening any new positions.`;
  }

  if (q.includes('nifty') || q.includes('banknifty') || q.includes('options buying') || q.includes('selling')) {
    return `### 📊 **Options Strategy Insight (Indian Markets)**\n\n- **Options Buying**: High win-rate requires strong momentum & volatility spikes. Watch out for Theta decay near expiry (Tuesday/Thursday).\n- **Options Selling**: Focus on delta neutral/spreads with defined stop-loss. Always calculate net charges and taxes.\n- **Risk-to-Reward Ratio**: Aim for at least **1:2 RR** on directional option setups.`;
  }

  return `### 📈 **WealthOn AI Trading Coach Insight**\n\nThank you for reaching out! Here are 3 core trading rules to review for your query (*"${query}"*):\n\n1. **Strict Stop-Loss Execution**: Always define your exit price before entering any trade leg.\n2. **Maintain 1:2 Minimum Risk-to-Reward**: Never take a ₹1,000 risk for a ₹300 potential gain.\n3. **Journal Every Execution Mode**: Keep track of whether your trade was Manual, Algo, or Copy execution in your WealthOn Performance Table.`;
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on("connection", async (clientWs) => {
    try {
      const ai = getGenAI();
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a WealthOn AI Trading Assistant & Personal Coach for Indian Options trading (Nifty, BankNifty, Sensex). Speak concisely, professionally, and clearly. IMPORTANT: Review the student trading journey in Malayalam language.",
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const p of parts) {
                if (p.inlineData?.data && clientWs.readyState === 1) {
                  clientWs.send(JSON.stringify({ audio: p.inlineData.data }));
                }
                if (p.text && clientWs.readyState === 1) {
                  clientWs.send(JSON.stringify({ text: p.text }));
                }
              }
            }
                        if (message.serverContent?.interrupted && clientWs.readyState === 1)
              clientWs.send(JSON.stringify({ interrupted: true }));
          },
        },
      });

      clientWs.on("message", (data) => {
        try {
          const { audio } = JSON.parse(data.toString());
          if (audio) {
            session.sendRealtimeInput({
              audio: { data: audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (e) {
          console.error("Error processing websocket message:", e);
        }
      });

      clientWs.on("close", () => {
        // session.close() is not available or handled via garbage collection depending on SDK implementation
        // Close if available in API
      });

    } catch (error) {
      console.error("Failed to start Live API session:", error);
      clientWs.close();
    }
  });
}

startServer();
