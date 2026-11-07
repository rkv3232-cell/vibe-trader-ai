import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSystemPrompt, TRADING_MODES, REPOSITORIES_REGISTRY } from './tradingEngine.js';
import { autonomousBot } from './autonomousTrader.js';
import { traderMemory } from './traderMemory.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper: Call Gemini API (with automatic model fallback & retry)
async function callGemini(messages, imageBase64 = null, customSystemPrompt = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  // Tested active models with full quota & vision
  const models = [
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite'
  ];

  const contents = [];

  for (const msg of messages) {
    const role = msg.role === 'user' ? 'user' : 'model';
    const parts = [{ text: msg.content }];
    contents.push({ role, parts });
  }

  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts.unshift({
        inline_data: {
          mime_type: mimeType,
          data: cleanBase64
        }
      });
    } else {
      contents.push({
        role: 'user',
        parts: [
          { inline_data: { mime_type: mimeType, data: cleanBase64 } },
          { text: 'Analyze this trading chart.' }
        ]
      });
    }
  }

  const payload = {
    contents,
    system_instruction: {
      parts: [{ text: customSystemPrompt || getSystemPrompt(TRADING_MODES.HEDGE_FUND) }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  };

  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const reply = candidate?.content?.parts?.map(p => p.text).join('') || 'Koi response generate nahi ho paya.';
        return reply;
      } else {
        const errText = await response.text();
        console.warn(`Gemini model ${model} status ${response.status}:`, errText);
        lastError = new Error(`Gemini ${model} error: ${response.status} - ${errText}`);
      }
    } catch (e) {
      console.warn(`Gemini model ${model} network error:`, e.message);
      lastError = e;
    }
  }

  // If Gemini has temporary issues, seamless fallback to OpenRouter Nemotron Super VL!
  console.warn('Gemini models unavailable, falling back to OpenRouter Nemotron VL...', lastError?.message);
  try {
    return await callOpenRouter(messages, 'nvidia/nemotron-3.5-super-vl:free', customSystemPrompt, imageBase64);
  } catch (openRouterErr) {
    console.warn('OpenRouter fallback failed, trying Groq...', openRouterErr?.message);
    try {
      return await callGroq(messages, 'openai/gpt-oss-120b', customSystemPrompt);
    } catch (groqErr) {
      throw lastError || openRouterErr || groqErr;
    }
  }
}

// Helper: Call OpenRouter (Supports Multimodal Images & Text)
async function callOpenRouter(messages, model = 'nvidia/nemotron-3.5-super-vl:free', customSystemPrompt = null, imageBase64 = null) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const formattedMessages = [
    { role: 'system', content: customSystemPrompt || getSystemPrompt(TRADING_MODES.HEDGE_FUND) }
  ];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLastUser = (i === messages.length - 1 && msg.role === 'user');

    if (isLastUser && imageBase64) {
      const imgUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
      formattedMessages.push({
        role: 'user',
        content: [
          { type: 'text', text: msg.content || 'Analyze this trading chart.' },
          { type: 'image_url', image_url: { url: imgUrl } }
        ]
      });
    } else {
      formattedMessages.push({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content
      });
    }
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'VibeTrader AI'
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'OpenRouter error');
  return data.choices[0].message.content;
}

// Helper: Call Groq (Ultra-Fast LLM for instant text responses)
async function callGroq(messages, model = 'openai/gpt-oss-120b', customSystemPrompt = null) {
  const apiKey = process.env.GROQ_API_KEY;
  const formattedMessages = [
    { role: 'system', content: customSystemPrompt || getSystemPrompt(TRADING_MODES.HEDGE_FUND) }
  ];

  for (const msg of messages) {
    formattedMessages.push({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content
    });
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Groq error');
  return data.choices[0].message.content;
}

// Clean & format text specifically for warm, natural, human-sounding Sarvam AI Hindi TTS
function prepareTextForTTS(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  // 1. If response has a dedicated voice section "Bhai Ki Awaaz", prioritize that!
  const voiceMatch = rawText.match(/🗣️?\s*\[?Bhai Ki Awaaz[^\]:]*\]?:?\s*([\s\S]*?)(?=(\n\n[#*📊]|$))/i);
  let text = voiceMatch ? voiceMatch[1].trim() : rawText;

  // 2. Remove markdown tables (lines containing |)
  text = text.split('\n').filter(line => !line.includes('|')).join(' ');

  // 3. Remove markdown syntax, headers, bullets, emojis
  text = text
    .replace(/^#+\s+/gm, '')
    .replace(/[*_`~>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[0-9]+\.\s+/gm, '')
    .replace(/^[-•*]\s+/gm, '')
    .replace(/🟢|🔴|📊|📈|📉|🎯|🛡️|💡|⚖️|🐂|🐻|🧠|🛑|⏳|✅|❌/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

  // 4. Expand abbreviations so Sarvam pronounces them naturally in Hindi
  text = text
    .replace(/\bEMA\b/gi, 'E M A')
    .replace(/\bSMA\b/gi, 'S M A')
    .replace(/\bRSI\b/gi, 'R S I')
    .replace(/\bSL\b/gi, 'Stop Loss')
    .replace(/\bTP\b/gi, 'Target')
    .replace(/\bR:R\b/gi, 'Risk to Reward')
    .replace(/\b1:2\b/g, 'ek is to do')
    .replace(/\b1:3\b/g, 'ek is to teen')
    .replace(/\bBOS\b/gi, 'Breakout')
    .replace(/\bCHoCH\b/gi, 'Trend badlav')
    .replace(/\bXAUUSD\b/gi, 'Gold')
    .replace(/\s+/g, ' ')
    .trim();

  // 5. Cleanly truncate to first 2-3 complete sentences (~380 chars)
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 0) {
    let result = '';
    for (const s of sentences) {
      if ((result + s).length <= 420) {
        result += s;
      } else {
        break;
      }
    }
    if (result.trim()) return result.trim();
  }

  return text.slice(0, 380);
}

// Helper: Call Sarvam AI TTS (Hindi Voice)
async function generateSarvamAudio(text, speaker = 'shubh', pace = 1.0) {
  const apiKey = process.env.SARVAM_API_KEY;
  const cleanText = prepareTextForTTS(text);
  if (!cleanText) return null;

  const response = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: [cleanText],
      target_language_code: 'hi-IN',
      speaker: speaker || 'shubh',
      pace: Number(pace) || 1.0,
      model: 'bulbul:v3'
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Sarvam TTS error:', err);
    return null;
  }

  const data = await response.json();
  if (data.audios && data.audios[0]) {
    return data.audios[0];
  }
  return null;
}

// Hook Gemini AI caller into Autonomous Trader for post-mortems
autonomousBot.setGeminiCaller(callGemini);

// Route: Main Chat (Text + Image with 24-Repo Multi-Agent Trading Engine)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, image, modelProvider = 'gemini', tradingMode = 'hedge_fund', speaker = 'shubh', pace = 1.0 } = req.body;
    const systemPrompt = getSystemPrompt(tradingMode);

    let reply = '';
    if (image || modelProvider === 'gemini') {
      reply = await callGemini(messages, image, systemPrompt);
    } else if (modelProvider === 'groq') {
      reply = await callGroq(messages, 'openai/gpt-oss-120b', systemPrompt);
    } else {
      reply = await callOpenRouter(messages, 'nvidia/nemotron-3.5-super-vl:free', systemPrompt, image);
    }

    // Auto-generate clear voice audio in parallel for instant playback
    let audio = null;
    try {
      audio = await generateSarvamAudio(reply, speaker, pace || 1.0);
    } catch (e) {
      console.warn('Voice generation warning:', e.message);
    }

    res.json({ reply, audio, tradingMode });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route: 24-Repository Registry
app.get('/api/repos', (req, res) => {
  res.json({
    total: REPOSITORIES_REGISTRY.length,
    repositories: REPOSITORIES_REGISTRY
  });
});

// Route: Quantitative Backtesting Simulation Engine (kernc/backtesting.py & freqtrade math)
app.post('/api/backtest-simulate', (req, res) => {
  try {
    const {
      initialCapital = 100000,
      winRate = 0.55,
      riskRewardRatio = 2.0,
      riskPerTradePct = 0.01,
      totalTrades = 40
    } = req.body;

    let capital = Number(initialCapital);
    let peakCapital = capital;
    let maxDrawdownPct = 0;
    let wins = 0;
    let losses = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    const equityCurve = [{ trade: 0, equity: Math.round(capital), drawDown: 0 }];

    for (let i = 1; i <= totalTrades; i++) {
      const riskAmount = capital * Number(riskPerTradePct);
      const isWin = Math.random() < Number(winRate);

      if (isWin) {
        wins++;
        const gain = riskAmount * Number(riskRewardRatio);
        capital += gain;
        totalProfit += gain;
      } else {
        losses++;
        capital -= riskAmount;
        totalLoss += riskAmount;
      }

      if (capital > peakCapital) {
        peakCapital = capital;
      }
      const dd = ((peakCapital - capital) / peakCapital) * 100;
      if (dd > maxDrawdownPct) {
        maxDrawdownPct = dd;
      }

      equityCurve.push({
        trade: i,
        equity: Math.round(capital),
        drawDown: Number(dd.toFixed(2)),
        isWin
      });
    }

    const profitFactor = totalLoss > 0 ? (totalProfit / totalLoss).toFixed(2) : 'Inf';
    const totalReturnPct = (((capital - initialCapital) / initialCapital) * 100).toFixed(2);
    const calculatedWinRate = ((wins / totalTrades) * 100).toFixed(1);

    res.json({
      initialCapital,
      finalEquity: Math.round(capital),
      totalReturnPct: Number(totalReturnPct),
      winRate: Number(calculatedWinRate),
      wins,
      losses,
      profitFactor: Number(profitFactor) || profitFactor,
      maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
      equityCurve
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route: Text To Speech (Voice output)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, speaker = 'shubh', pace = 1.25 } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const audioBase64 = await generateSarvamAudio(text, speaker, pace);
    if (!audioBase64) {
      return res.status(500).json({ error: 'Could not generate audio' });
    }

    res.json({ audio: audioBase64 });
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route: Live Screen Vision (Real-time chart watch with Natural Pro-Trader Mentor Voice)
app.post('/api/screen-analyze', async (req, res) => {
  try {
    const { image, speaker = 'shubh', pace = 1.0, prompt } = req.body;
    if (!image) return res.status(400).json({ error: 'Image frame is required' });

    const screenPrompt = `Tu live user (Raj, 16 saal ka student paper trader) ki TradingView screen live dekh raha hai jaise uska bada bhai/pro trader uske paas baith kar chart dekh raha ho.

ZAROORI RULES (NUMBERS AUR BHASHA):
1. EXACT NUMBERS PADHO: Screen par right-hand side ki Price Scale, current candle price (jaise 4,046.38 ya ₹24,520), timeframe (5m/15m) ko dhyan se zoom karke dekh aur exact digits bol. Koi number andaze (guess) se mat bolna.
2. AAM, NATURAL BHASHA MEIN BAAT KAR:
   - Mechanical checklist (jaise "1. Market Structure..." ya "2. Bull trap...") bilkul mat bolna.
   - Bilkul aam bolchaal ki pyari Hinglish mein direct bol jaise dost ya bada bhai bolta hai.
3. SACHHA AUR CLEAR SUGGESTION DE:
   - Current Price kya chal raha hai.
   - Abhi kya karna hai: Buy kare, Sell kare, ya Shaant baith kar Wait kare (aur kyu).
   - Safe Stop Loss aur Target ke exact numbers batao (1:2 Risk to Reward).

Format: Sirf 2-3 natural, warm sentences mein bol, taaki voice sunte hi Raj ko turant samajh aa jaye.
Example: "Raj bhai, abhi Gold 4,046.38 par chal raha hai. 5 minute chart par 20 EMA ke upar green candle ban rahi hai lekin 4,050 par resistance hai. Abhi jaldi-bazi mein trade mat le. Thoda ruk ja, jab price 4,043 tak dip de aur wahan se support le, tab hum 4,039 ke stop loss ke saath buy karenge."`;

    const userMessageContent = prompt
      ? `Raj ne screen dekh kar pucha: "${prompt}". Screen ko dhyan se dekh kar exact numbers aur normal bhasha mein direct suggestion do.`
      : 'Screen scan karo aur exact current price dekh kar Raj ko aam bhasha mein live suggestion do.';

    const messages = [
      { role: 'user', content: userMessageContent }
    ];

    const reply = await callGemini(messages, image, screenPrompt);

    let audio = null;
    try {
      audio = await generateSarvamAudio(reply, speaker, pace || 1.0);
    } catch (e) {
      console.warn('Live voice generation skipped:', e.message);
    }

    res.json({ reply, audio });
  } catch (err) {
    console.error('Screen analyze error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 24/7 AUTONOMOUS HUMAN TRADER BOT ENDPOINTS
// ==========================================

// GET Bot State
app.get('/api/bot/state', (req, res) => {
  res.json(autonomousBot.getState());
});

// POST Start 24/7 Bot
app.post('/api/bot/start', (req, res) => {
  autonomousBot.start();
  res.json({ success: true, message: 'Autonomous Trader Started', state: autonomousBot.getState() });
});

// POST Stop / Pause 24/7 Bot
app.post('/api/bot/stop', (req, res) => {
  autonomousBot.stop();
  res.json({ success: true, message: 'Autonomous Trader Paused', state: autonomousBot.getState() });
});

// POST Reset Virtual Capital to ₹100,000
app.post('/api/bot/reset', (req, res) => {
  autonomousBot.reset();
  res.json({ success: true, message: 'Virtual Capital Reset to ₹100,000', state: autonomousBot.getState() });
});

// POST Switch Active Asset (e.g. XAUUSD, BTCUSDT)
app.post('/api/bot/set-asset', (req, res) => {
  const { assetKey } = req.body;
  autonomousBot.setAsset(assetKey);
  res.json({ success: true, state: autonomousBot.getState() });
});

// POST Close Current Open Trade manually at market
app.post('/api/bot/close-position', (req, res) => {
  if (autonomousBot.activePosition) {
    autonomousBot.closePosition('MANUAL_CLOSE', autonomousBot.livePrice);
  }
  res.json({ success: true, state: autonomousBot.getState() });
});

// ==========================================
// AI EXPERIENCE & TRAINING BRAIN ENDPOINTS
// ==========================================

// GET Trader Experience Memory State
app.get('/api/bot/memory', (req, res) => {
  res.json(traderMemory.getState());
});

// POST Train AI with User Coaching Feedback (Raj Trains AI)
app.post('/api/bot/train', async (req, res) => {
  try {
    const { feedback } = req.body;
    if (!feedback) return res.status(400).json({ error: 'Feedback text is required' });

    const result = await traderMemory.trainWithRajCoaching(feedback, callGemini);
    // Queue brotherly voice announcement
    autonomousBot.latestAnnouncement = result.replyToRaj;
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Bot training error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST Toggle Learned Rule Active/Inactive
app.post('/api/bot/rule/toggle', (req, res) => {
  const { ruleId } = req.body;
  const updatedRule = traderMemory.toggleRule(ruleId);
  res.json({ success: true, rule: updatedRule, memory: traderMemory.getState() });
});

// DELETE User-Trained Rule
app.delete('/api/bot/rule/:id', (req, res) => {
  const removed = traderMemory.deleteRule(req.params.id);
  res.json({ success: true, removed, memory: traderMemory.getState() });
});

// Production: Serve static built frontend from /dist for 24/7 Cloud Hosting
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`🚀 VibeTrader AI Backend running on http://localhost:${PORT}`);

  // 24/7 Anti-Sleep Keep-Alive: Ping self every 8 minutes so Render free tier NEVER sleeps!
  const publicUrl = process.env.RENDER_EXTERNAL_URL || 'https://vibe-trader-ai.onrender.com';
  if (publicUrl) {
    console.log(`⚡ 24/7 Keep-Alive Service initialized for: ${publicUrl}`);
    setInterval(async () => {
      try {
        const pingUrl = `${publicUrl}/api/bot/state`;
        const res = await fetch(pingUrl, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          console.log(`[KEEP-ALIVE] Pinged ${pingUrl} at ${new Date().toLocaleTimeString('en-IN')} - 24/7 Render Awake!`);
        }
      } catch (e) {
        // Silent ignore
      }
    }, 8 * 60 * 1000); // 8 minutes (Render sleeps after 15 mins)
  }
});
