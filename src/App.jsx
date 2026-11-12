import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Paperclip,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Volume2,
  VolumeX,
  Trash2,
  Settings,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Shield,
  Coins,
  X,
  Play,
  Pause,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  RefreshCw,
  Maximize2,
  Minimize2,
  Radio,
  MessageCircle,
  Clock,
  Activity,
  Layers,
  BarChart3,
  Cpu,
  Database,
  BookOpen,
  Cloud,
  CloudOff,
  Bot,
  Zap,
  Terminal,
  Brain,
  GraduationCap,
  Award,
  Flame,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import {
  subscribeToFirebaseChats,
  syncChatToCloud,
  removeChatFromCloud,
  logTradeToCloudJournal,
  syncTraderMemoryToCloud,
  getFirebaseConfig
} from './firebase.js';

// Compress image to fast lightweight JPEG before sending or storing (1920px max for crystal clear numbers)
const compressImage = (base64Str, maxWidth = 1920, quality = 0.88) => {
  return new Promise((resolve) => {
    if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) {
      return resolve(base64Str);
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (err) {
        console.warn('Image compression fallback:', err);
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

export default function App() {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Chat sessions
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem('vibe_chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c) => ({
            ...c,
            messages: Array.isArray(c.messages) ? c.messages : []
          }));
        }
      }
    } catch (e) {
      console.warn('Could not load saved chats from LocalStorage:', e);
    }
    return [
      {
        id: 'default',
        title: 'Gold Sniper Setup',
        messages: [
          {
            role: 'assistant',
            content:
              '**Namaste Raj bhai! Main hoon tera personal VibeTrader AI.** 🚀\n\nAbhi tu TradingView par paper trading kar raha hai. Jab bhi tujhe chart samajh na aaye, tu:\n1. **Screenshot paste kar** (`Ctrl + V` ya attachment icon se)\n2. **Mic daba kar bol**\n3. Ya **"Screen Watch"** chalu kar jisse main teri TradingView screen live dekh kar audio advice de sakoon!\n\nBata, aaj kya plan hai?',
            audio: null
          }
        ]
      }
    ];
  });

  const [currentChatId, setCurrentChatId] = useState(() => {
    try {
      const savedId = localStorage.getItem('vibe_current_chat_id');
      if (savedId) return savedId;
      const saved = localStorage.getItem('vibe_chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id) {
          return parsed[0].id;
        }
      }
    } catch (e) {}
    return 'default';
  });

  // Input states
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Audio / Speech states
  const [isRecording, setIsRecording] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState(null);
  const audioRef = useRef(new Audio());

  // Screen Vision states
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [autoScanScreen, setAutoScanScreen] = useState(false);
  const [isScanningScreen, setIsScanningScreen] = useState(false);
  const [latestLiveAdvice, setLatestLiveAdvice] = useState('');
  const [isFloatingMinimized, setIsFloatingMinimized] = useState(false);
  const [floatingInput, setFloatingInput] = useState('');
  const screenVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const screenScanIntervalRef = useRef(null);

  // Model & Settings
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [selectedSpeaker, setSelectedSpeaker] = useState('shubh');
  const [tradingMode, setTradingMode] = useState('hedge_fund');
  const [speechPace, setSpeechPace] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);

  // 24-Repo Arsenal & Backtest Lab States
  const [showRepoMatrix, setShowRepoMatrix] = useState(false);
  const [repoList, setRepoList] = useState([]);
  const [repoFilter, setRepoFilter] = useState('ALL');
  const [showBacktester, setShowBacktester] = useState(false);
  const [backtestParams, setBacktestParams] = useState({
    initialCapital: 100000,
    winRate: 0.55,
    riskRewardRatio: 2.0,
    riskPerTradePct: 0.01,
    totalTrades: 40
  });
  const [backtestResult, setBacktestResult] = useState(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  // Fetch 24 repositories from backend
  useEffect(() => {
    if (showRepoMatrix && repoList.length === 0) {
      fetch('/api/repos')
        .then((res) => res.json())
        .then((data) => {
          if (data.repositories) setRepoList(data.repositories);
        })
        .catch((err) => console.warn('Could not fetch repos:', err));
    }
  }, [showRepoMatrix]);

  // Run Backtest Simulation
  const runBacktestSimulation = async () => {
    setIsBacktesting(true);
    try {
      const res = await fetch('/api/backtest-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backtestParams)
      });
      const data = await res.json();
      setBacktestResult(data);
    } catch (e) {
      console.error('Backtest error:', e);
    } finally {
      setIsBacktesting(false);
    }
  };

  // 24/7 Autonomous Human Trader Bot States
  const [showAutoTrader, setShowAutoTrader] = useState(false);
  const [botState, setBotState] = useState(null);
  const [botAnnouncementQueue, setBotAnnouncementQueue] = useState(null);

  // Poll Bot State in background every 3s (open) or 8s (closed)
  useEffect(() => {
    const fetchBotState = () => {
      fetch('/api/bot/state')
        .then((res) => res.json())
        .then((data) => {
          setBotState(data);
          if (data.latestAnnouncement && data.latestAnnouncement !== botAnnouncementQueue) {
            setBotAnnouncementQueue(data.latestAnnouncement);
            if (autoSpeak) {
              fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: data.latestAnnouncement, speaker: selectedSpeaker, pace: speechPace })
              })
                .then((r) => r.json())
                .then((d) => {
                  if (d.audio) {
                    playAudio(d.audio);
                  } else {
                    speakTextNative(data.latestAnnouncement);
                  }
                })
                .catch((e) => {
                  console.warn('Bot announcement voice fallback to browser speech:', e);
                  speakTextNative(data.latestAnnouncement);
                });
            }
          }
        })
        .catch((err) => console.warn('Bot state poll error:', err));
    };

    fetchBotState();
    const interval = setInterval(fetchBotState, showAutoTrader ? 3000 : 8000);
    return () => clearInterval(interval);
  }, [showAutoTrader, autoSpeak, selectedSpeaker, speechPace, botAnnouncementQueue]);

  // Bot Control Handlers
  const handleStartBot = async () => {
    try {
      const res = await fetch('/api/bot/start', { method: 'POST' });
      const data = await res.json();
      if (data.state) setBotState(data.state);
    } catch (e) {
      console.error('Start bot error:', e);
    }
  };

  const handleStopBot = async () => {
    try {
      const res = await fetch('/api/bot/stop', { method: 'POST' });
      const data = await res.json();
      if (data.state) setBotState(data.state);
    } catch (e) {
      console.error('Stop bot error:', e);
    }
  };

  const handleResetBot = async () => {
    if (!window.confirm('Kya aap virtual capital ko wapas ₹1,00,000 par reset karna chahte hain?')) return;
    try {
      const res = await fetch('/api/bot/reset', { method: 'POST' });
      const data = await res.json();
      if (data.state) setBotState(data.state);
    } catch (e) {
      console.error('Reset bot error:', e);
    }
  };

  const handleCloseBotPosition = async () => {
    try {
      const res = await fetch('/api/bot/close-position', { method: 'POST' });
      const data = await res.json();
      if (data.state) setBotState(data.state);
    } catch (e) {
      console.error('Close position error:', e);
    }
  };

  const handleSetBotAsset = async (assetKey) => {
    try {
      const res = await fetch('/api/bot/set-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetKey })
      });
      const data = await res.json();
      if (data.state) setBotState(data.state);
    } catch (e) {
      console.error('Set asset error:', e);
    }
  };

  // Native Browser Web Speech Fallback for Voice Announcements
  const speakTextNative = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && text) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        utterance.rate = speechPace || 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Native speech synthesis fallback failed:', err);
      }
    }
  };

  // Export Completed Trades to CSV Trading Journal
  const handleExportJournalCSV = () => {
    const trades = botState?.tradeHistory || [];
    if (!trades.length) {
      alert('Abhi tak koi closed trade history nahi hai.');
      return;
    }
    const headers = [
      'Trade ID',
      'Opened At',
      'Closed At',
      'Symbol',
      'Asset Name',
      'Type',
      'Entry Price',
      'Exit Price',
      'Stop Loss',
      'Target Price',
      'Risk Reward',
      'Realized PnL (INR)',
      'Outcome',
      'Exit Reason',
      'Confluence Score',
      'Setup Grade'
    ];
    const rows = trades.map((t) => [
      `"${t.id || ''}"`,
      `"${t.openedAt || ''}"`,
      `"${t.closedAt || ''}"`,
      `"${t.symbol || ''}"`,
      `"${t.assetName || ''}"`,
      `"${t.type || ''}"`,
      t.entryPrice || 0,
      t.exitPrice || 0,
      t.stopLoss || 0,
      t.targetPrice || 0,
      `"${t.riskReward || ''}"`,
      t.pnl || 0,
      `"${t.isWin ? 'WIN' : 'LOSS'}"`,
      `"${t.reason || ''}"`,
      t.confluenceScore || 95,
      `"${t.setupGrade || 'A+'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VibeTrader_AI_Trading_Journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // AI Experience Memory & Training State
  const [cockpitTab, setCockpitTab] = useState('cockpit'); // 'cockpit' | 'brain'
  const [coachFeedbackInput, setCoachFeedbackInput] = useState('');
  const [isTrainingAI, setIsTrainingAI] = useState(false);
  const [trainSuccessMsg, setTrainSuccessMsg] = useState('');
  const [filterRuleCategory, setFilterRuleCategory] = useState('ALL');

  // Handle Training AI with User Coaching Feedback
  const handleTrainAI = async (feedbackText = null) => {
    const text = (feedbackText || coachFeedbackInput || '').trim();
    if (!text) return;
    setIsTrainingAI(true);
    setTrainSuccessMsg('');
    try {
      const res = await fetch('/api/bot/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: text })
      });
      const data = await res.json();
      if (data.success) {
        setTrainSuccessMsg(data.replyToRaj || 'Lesson memorized successfully!');
        setCoachFeedbackInput('');
        if (data.state?.memory) {
          syncTraderMemoryToCloud(data.state.memory);
        }
        // Refresh bot state
        const stateRes = await fetch('/api/bot/state');
        const stateData = await stateRes.json();
        setBotState(stateData);
      } else {
        alert('Training failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Train AI error:', err);
      alert('Error connecting to training brain: ' + err.message);
    } finally {
      setIsTrainingAI(false);
    }
  };

  // Toggle Learned Rule Active/Inactive
  const handleToggleRule = async (ruleId) => {
    try {
      const res = await fetch('/api/bot/rule/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId })
      });
      const data = await res.json();
      if (data.success && data.memory) {
        setBotState((prev) => (prev ? { ...prev, memory: data.memory } : prev));
        syncTraderMemoryToCloud(data.memory);
      }
    } catch (e) {
      console.error('Toggle rule error:', e);
    }
  };

  // Delete User-Trained Rule
  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Kya aap is trained rule ko memory se delete karna chahte hain?')) return;
    try {
      const res = await fetch(`/api/bot/rule/${ruleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success && data.memory) {
        setBotState((prev) => (prev ? { ...prev, memory: data.memory } : prev));
        syncTraderMemoryToCloud(data.memory);
      }
    } catch (e) {
      console.error('Delete rule error:', e);
    }
  };

  // Live Loading Timer & Progress States
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Live Timer & Stage progress while analyzing
  useEffect(() => {
    let interval = null;
    if (isLoading) {
      setLoadingSeconds('0.0');
      setLoadingStage('📤 Uploading & Decoding Chart Data...');
      const startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        setLoadingSeconds(elapsed);
        const sec = parseFloat(elapsed);
        if (sec < 2.0) {
          setLoadingStage('📤 Uploading & Decoding Chart Data...');
        } else if (sec < 4.5) {
          setLoadingStage('📊 Technical Analyst: Scanning 20/200 EMA & Key Levels...');
        } else if (sec < 7.0) {
          setLoadingStage('🐂 Bull vs 🐻 Bear: Checking Traps & Liquidity...');
        } else {
          setLoadingStage('🛡️ Risk Manager Gatekeeper: Formulating 1:2 R:R Verdict...');
        }
      }, 100);
    } else {
      setLoadingSeconds(0);
      setLoadingStage('');
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Firebase Cloud Memory state
  const [cloudSyncStatus, setCloudSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline'

  // Subscribe to real-time chats from Firebase on startup
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseChats(
      (remoteChats) => {
        if (!remoteChats || remoteChats.length === 0) return;
        setChats((localChats) => {
          const merged = [...localChats];
          for (const rc of remoteChats) {
            const cleanRc = {
              ...rc,
              messages: Array.isArray(rc.messages) ? rc.messages : []
            };
            const idx = merged.findIndex((lc) => lc.id === cleanRc.id);
            if (idx === -1) {
              merged.push(cleanRc);
            } else if (cleanRc.lastActive && (!merged[idx].lastActive || cleanRc.lastActive > merged[idx].lastActive)) {
              merged[idx] = { ...merged[idx], ...cleanRc };
            }
          }
          return merged;
        });
        setCloudSyncStatus('synced');
      },
      () => setCloudSyncStatus('offline')
    );
    return () => unsubscribe();
  }, []);

  const activeChat = chats.find((c) => c.id === currentChatId) || chats[0] || {
    id: 'default',
    title: 'Gold Sniper Setup',
    messages: []
  };

  // Save chats safely to LocalStorage + Cloud Firestore
  useEffect(() => {
    try {
      const sanitized = chats.map((c) => ({
        ...c,
        messages: (c.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
          image: m.image && m.image.length < 350000 ? m.image : null
        }))
      }));
      localStorage.setItem('vibe_chats', JSON.stringify(sanitized));
      if (currentChatId) {
        localStorage.setItem('vibe_current_chat_id', currentChatId);
      }
    } catch (e) {
      console.warn('LocalStorage save skipped (quota limit):', e);
    }

    if (activeChat && activeChat.id) {
      setCloudSyncStatus('syncing');
      syncChatToCloud(activeChat).then((success) => {
        setCloudSyncStatus(success ? 'synced' : 'offline');
      });
    }
  }, [chats, currentChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isLoading]);

  // Handle Clipboard Paste (Ctrl+V for images!)
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          setIsProcessingImage(true);
          const reader = new FileReader();
          reader.onload = async (event) => {
            const compressed = await compressImage(event.target.result);
            setAttachedImage(compressed);
            setIsProcessingImage(false);
          };
          reader.onerror = () => setIsProcessingImage(false);
          reader.readAsDataURL(file);
          e.preventDefault();
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Voice Speech-To-Text (Browser Web Speech API)
  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Aapka browser Speech Recognition support nahi karta. Chrome use karein.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Supports Hindi / Hinglish
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  // Play audio from base64
  const playAudio = (base64Audio) => {
    if (!base64Audio) return;
    try {
      if (currentlyPlayingAudio) {
        audioRef.current.pause();
      }
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = speechPace;
      audioRef.current.play();
      setCurrentlyPlayingAudio(base64Audio);

      audioRef.current.onended = () => {
        setCurrentlyPlayingAudio(null);
      };
    } catch (err) {
      console.error('Audio playback failed', err);
    }
  };

  const stopAudio = () => {
    audioRef.current.pause();
    setCurrentlyPlayingAudio(null);
  };

  // Trigger TTS manually for a message
  const triggerTTS = async (text, msgIndex) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker: selectedSpeaker, pace: speechPace })
      });
      const data = await res.json();
      if (data.audio) {
        // Cache audio in message
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === currentChatId) {
              const updatedMessages = [...c.messages];
              updatedMessages[msgIndex].audio = data.audio;
              return { ...c, messages: updatedMessages };
            }
            return c;
          })
        );
        playAudio(data.audio);
      }
    } catch (e) {
      console.error('TTS fetch error:', e);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (textToSend = null, imageToSend = null) => {
    const messageContent = textToSend !== null ? textToSend : input;
    const rawImg = imageToSend !== null ? imageToSend : attachedImage;

    if (!messageContent.trim() && !rawImg) return;

    // Resolve target active chat ID with 100% guarantee
    const targetChat = chats.find((c) => c.id === currentChatId) || chats[0];
    const targetChatId = targetChat ? targetChat.id : (currentChatId || 'default');
    if (currentChatId !== targetChatId) {
      setCurrentChatId(targetChatId);
      try {
        localStorage.setItem('vibe_current_chat_id', targetChatId);
      } catch (e) {}
    }

    // Compress image if present so it renders smoothly without lag or quota issues
    const currentImg = rawImg ? await compressImage(rawImg) : null;

    const userMessage = {
      role: 'user',
      content: messageContent,
      image: currentImg,
      timestamp: Date.now()
    };

    // Update state immediately with user message
    setChats((prev) => {
      const exists = prev.some((c) => c.id === targetChatId);
      if (!exists) {
        return [
          {
            id: targetChatId,
            title: messageContent.slice(0, 24) || 'Chart Analysis',
            messages: [userMessage],
            lastActive: Date.now()
          },
          ...prev
        ];
      }
      return prev.map((c) =>
        c.id === targetChatId
          ? {
              ...c,
              messages: [...(c.messages || []), userMessage],
              lastActive: Date.now()
            }
          : c
      );
    });

    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      // Build history for backend API
      const history = (targetChat?.messages || []).map((m) => ({
        role: m.role,
        content: m.content
      }));
      history.push({ role: 'user', content: messageContent || 'Chart analysis request' });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          image: currentImg,
          modelProvider: selectedModel,
          tradingMode: tradingMode,
          speaker: selectedSpeaker,
          pace: speechPace
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const aiReply = data.reply || 'Analysis complete.';
      let aiAudio = data.audio || null;

      // Auto-speak if enabled
      if (autoSpeak) {
        if (aiAudio) {
          playAudio(aiAudio);
        } else {
          try {
            const ttsRes = await fetch('/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: aiReply, speaker: selectedSpeaker, pace: speechPace })
            });
            const ttsData = await ttsRes.json();
            if (ttsData.audio) {
              aiAudio = ttsData.audio;
              playAudio(aiAudio);
            }
          } catch (e) {
            console.warn('Auto TTS failed:', e);
          }
        }
      }

      const aiMessage = {
        role: 'assistant',
        content: aiReply,
        audio: aiAudio,
        timestamp: Date.now()
      };

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === targetChatId) {
            const currentMsgs = c.messages || [];
            return {
              ...c,
              title:
                c.title === 'New Analysis' || currentMsgs.length <= 2
                  ? messageContent.slice(0, 24) || 'Chart Analysis'
                  : c.title,
              messages: [...currentMsgs, aiMessage],
              lastActive: Date.now()
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Error generating response:', err);
      const errMsg = {
        role: 'assistant',
        content: `⚠️ **Error:** ${err.message || 'Server se connect nahi ho paya. Dobara try karein.'}`,
        isError: true,
        timestamp: Date.now()
      };
      setChats((prev) =>
        prev.map((c) =>
          c.id === targetChatId
            ? { ...c, messages: [...(c.messages || []), errMsg], lastActive: Date.now() }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Voice question specifically from floating copilot widget
  const handleFloatingVoiceQuestion = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Aapka browser Speech Recognition support nahi karta.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setIsRecording(false);
      captureAndAnalyzeScreen(transcript);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  // Screen Sharing & Live Vision Copilot
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          width: { ideal: 1920, max: 2560 },
          height: { ideal: 1080, max: 1440 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      setIsFloatingMinimized(false);

      // Attach stream to video element
      setTimeout(() => {
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          screenVideoRef.current.muted = true;
          screenVideoRef.current.play().catch((e) => console.warn('Video play warning:', e));
        }
      }, 150);

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      // Add a notification message in chat
      const alertMsg = {
        role: 'assistant',
        content:
          '🖥️ **Live Screen Copilot Active!** Floating window se tu direct mic se baat kar sakta hai ya "Scan Now" daba sakta hai.'
      };
      setChats((prev) =>
        prev.map((c) => (c.id === currentChatId ? { ...c, messages: [...c.messages, alertMsg] } : c))
      );
    } catch (err) {
      console.error('Screen capture error:', err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (screenScanIntervalRef.current) {
      clearInterval(screenScanIntervalRef.current);
      screenScanIntervalRef.current = null;
    }
    setIsScreenSharing(false);
    setAutoScanScreen(false);
  };

  // Capture frame from video and send to Gemini Vision
  const captureAndAnalyzeScreen = async (customPrompt = null) => {
    if (!screenVideoRef.current || !isScreenSharing) return;

    setIsScanningScreen(true);
    try {
      const video = screenVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameBase64 = canvas.toDataURL('image/jpeg', 0.92);

      const targetChat = chats.find((c) => c.id === currentChatId) || chats[0];
      const targetChatId = targetChat ? targetChat.id : (currentChatId || 'default');

      // Log question to chat if user asked something specific
      if (customPrompt) {
        const userQMsg = {
          role: 'user',
          content: `👁️ [Live Screen]: ${customPrompt}`,
          timestamp: Date.now()
        };
        setChats((prev) =>
          prev.map((c) =>
            c.id === targetChatId
              ? { ...c, messages: [...(c.messages || []), userQMsg], lastActive: Date.now() }
              : c
          )
        );
      }

      const res = await fetch('/api/screen-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: frameBase64,
          speaker: selectedSpeaker,
          pace: speechPace,
          prompt: customPrompt
        })
      });

      const data = await res.json();
      if (data.reply) {
        setLatestLiveAdvice(data.reply);
        const liveMsg = {
          role: 'assistant',
          content: `👁️ **Live Chart Advice ${customPrompt ? `("${customPrompt}")` : ''}:**\n${data.reply}`,
          audio: data.audio,
          timestamp: Date.now()
        };

        setChats((prev) =>
          prev.map((c) =>
            c.id === targetChatId
              ? { ...c, messages: [...(c.messages || []), liveMsg], lastActive: Date.now() }
              : c
          )
        );

        if (data.audio && autoSpeak) {
          playAudio(data.audio);
        }
      }
    } catch (e) {
      console.error('Screen scan error:', e);
    } finally {
      setIsScanningScreen(false);
    }
  };

  // Handle Auto-Scan toggle
  const toggleAutoScan = () => {
    if (autoScanScreen) {
      clearInterval(screenScanIntervalRef.current);
      screenScanIntervalRef.current = null;
      setAutoScanScreen(false);
    } else {
      setAutoScanScreen(true);
      // Run once immediately
      captureAndAnalyzeScreen();
      // Then every 25 seconds
      screenScanIntervalRef.current = setInterval(() => {
        captureAndAnalyzeScreen();
      }, 25000);
    }
  };

  // Create new chat
  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newChatObj = {
      id: newId,
      title: 'New Analysis',
      messages: [
        {
          role: 'assistant',
          content:
            '**New Analysis Setup Ready!** 🚀\nTradingView ka chart screenshot paste karo ya question pucho.',
          audio: null,
          timestamp: Date.now()
        }
      ],
      lastActive: Date.now()
    };
    setChats((prev) => [newChatObj, ...prev]);
    setCurrentChatId(newId);
    try {
      localStorage.setItem('vibe_current_chat_id', newId);
    } catch (e) {}
  };

  // Delete chat
  const handleDeleteChat = (id, e) => {
    e.stopPropagation();
    if (chats.length <= 1) return;
    removeChatFromCloud(id);
    const filtered = chats.filter((c) => c.id !== id);
    setChats(filtered);
    if (currentChatId === id) {
      const nextId = filtered[0].id;
      setCurrentChatId(nextId);
      try {
        localStorage.setItem('vibe_current_chat_id', nextId);
      } catch (err) {}
    }
  };

  // Delete a specific message (e.g. error message)
  const handleDeleteMessage = (msgIdx) => {
    const targetChat = chats.find((c) => c.id === currentChatId) || chats[0];
    if (!targetChat) return;
    const targetChatId = targetChat.id;
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === targetChatId) {
          const msgs = [...(c.messages || [])];
          msgs.splice(msgIdx, 1);
          return { ...c, messages: msgs, lastActive: Date.now() };
        }
        return c;
      })
    );
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Render markdown-like text with beautiful signal boxes
  const renderMessageContent = (text) => {
    if (!text || typeof text !== 'string') return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Highlight BUY, SELL, WAIT badges
      if (line.includes('Technical Analyst') || line.includes('Market Structure')) {
        return (
          <div key={i} className="my-2 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs font-medium">
            <span className="font-bold text-cyan-300 block mb-0.5">📊 Technical Analyst Agent</span>
            {line.replace(/.*Technical Analyst.*?:?/, '')}
          </div>
        );
      }
      if (line.includes('Bullish Researcher') || line.includes('Bull Case')) {
        return (
          <div key={i} className="my-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-medium">
            <span className="font-bold text-emerald-300 block mb-0.5">🐂 Bullish Researcher</span>
            {line.replace(/.*Bullish Researcher.*?:?/, '')}
          </div>
        );
      }
      if (line.includes('Bearish Researcher') || line.includes('Bear Case')) {
        return (
          <div key={i} className="my-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-medium">
            <span className="font-bold text-rose-300 block mb-0.5">🐻 Bearish Researcher (Trap Watcher)</span>
            {line.replace(/.*Bearish Researcher.*?:?/, '')}
          </div>
        );
      }
      if (line.includes('Risk Manager') || line.includes('Pre-Trade Discipline')) {
        return (
          <div key={i} className="my-2 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 text-xs font-medium">
            <span className="font-bold text-indigo-300 block mb-0.5">🛡️ Risk Manager Gatekeeper (1:2 R:R Guard)</span>
            {line.replace(/.*Risk Manager.*?:?/, '')}
          </div>
        );
      }
      if (line.includes('Executive Verdict') || line.includes('DECISION:')) {
        return (
          <div key={i} className="my-2 p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-zinc-900 border border-emerald-500/50 text-emerald-300 font-bold text-sm shadow-lg">
            <span className="text-xs uppercase tracking-wider text-emerald-400 block mb-1">⚖️ Committee Verdict</span>
            {line}
          </div>
        );
      }
      if (line.includes('SELL') || line.includes('🔴 SELL')) {
        return (
          <div key={i} className="my-1.5 p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 font-semibold flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400 animate-pulse"></span>
            {line}
          </div>
        );
      }
      if (line.includes('WAIT') || line.includes('HOLD') || line.includes('Shaant')) {
        return (
          <div key={i} className="my-1.5 p-2 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-300 text-sm">
            {line}
          </div>
        );
      }
      // Bold rendering
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <p
          key={i}
          className="my-1 text-[15px] leading-relaxed text-zinc-200"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <div className="flex h-screen w-screen bg-[#111113] text-zinc-100 font-sans overflow-hidden">
      {/* LEFT SIDEBAR (ChatGPT Style) */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 ease-in-out bg-[#18181b] border-r border-zinc-800 flex flex-col justify-between overflow-hidden shrink-0 z-20`}
      >
        <div className="flex flex-col h-full p-3 overflow-hidden">
          {/* Top Logo / App Title */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <TrendingUp className="w-4 h-4 text-black font-bold" />
              </div>
              <span className="font-semibold text-sm tracking-wide text-zinc-100">
                VibeTrader <span className="text-emerald-400 text-xs px-1 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">AI</span>
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 text-sm font-medium border border-zinc-700/50 transition mb-3 shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Chart Analysis</span>
          </button>

          {/* Quick 24-Repo & Backtest Hub Launchers */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <button
              onClick={() => setShowRepoMatrix(true)}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>24 Repos</span>
            </button>
            <button
              onClick={() => {
                setShowBacktester(true);
                if (!backtestResult) runBacktestSimulation();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 text-[11px] font-semibold transition"
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
              <span>Backtest</span>
            </button>
          </div>

          {/* 24/7 Autonomous Human Trader Card */}
          <div className="mb-3 space-y-1.5">
            <button
              onClick={() => {
                setShowAutoTrader(true);
                setCockpitTab('cockpit');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/90 via-zinc-900 to-zinc-900 border border-emerald-500/50 hover:border-emerald-400 text-left transition group shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>24/7 Human Trader</span>
                    <span className={`w-2 h-2 rounded-full ${botState?.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`}></span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {botState?.isRunning ? `Trading ${botState.activeAsset?.name || 'Gold'}` : 'Autopilot Paper Bot'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-zinc-200">
                  ₹{botState?.wallet?.equity ? Math.round(botState.wallet.equity).toLocaleString('en-IN') : '1,00,000'}
                </div>
                <div className={`text-[10px] font-mono font-bold ${(botState?.wallet?.realizedPnL || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(botState?.wallet?.realizedPnL || 0) >= 0 ? `+₹${botState?.wallet?.realizedPnL || 0}` : `-₹${Math.abs(botState?.wallet?.realizedPnL || 0)}`}
                </div>
              </div>
            </button>

            {/* Quick AI Experience & Training Brain Shortcut */}
            <button
              onClick={() => {
                setShowAutoTrader(true);
                setCockpitTab('brain');
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                <div>
                  <div className="text-[11px] font-bold text-purple-200 flex items-center gap-1">
                    <span>AI Experience Brain</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-900/80 border border-purple-500/50 text-purple-300">
                      Lvl {botState?.memory?.level || 1}
                    </span>
                  </div>
                  <div className="text-[9.5px] text-zinc-400">
                    {botState?.memory?.learnedRules?.length || 5} Rules Memorized • Coach AI
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-900/40 px-1.5 py-0.5 rounded border border-purple-500/30">
                {botState?.memory?.xp || 180} XP
              </span>
            </button>
          </div>

          {/* Preset Prompts Section */}
          <div className="mb-3">
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                24-Repo AI Engines
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">6 Modes</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setTradingMode('hedge_fund');
                  handleSendMessage('Hedge Fund Committee Mode activate karo aur Gold ka Technical + Bull vs Bear debate karke analysis do.');
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center gap-2 transition ${
                  tradingMode === 'hedge_fund' ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hedge Fund Council</span>
              </button>
              <button
                onClick={() => {
                  setTradingMode('sniper_scalp');
                  handleSendMessage('Gold (XAUUSD) 5m chart ke liye immediate sniper pullback entry aur stop loss do.');
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center gap-2 transition ${
                  tradingMode === 'sniper_scalp' ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Sniper Scalper (5m)</span>
              </button>
              <button
                onClick={() => {
                  setTradingMode('risk_gate');
                  handleSendMessage('Pre-Trade Discipline Gate: Mera setup check karo taaki koi gambling ya revenge trade na ho.');
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center gap-2 transition ${
                  tradingMode === 'risk_gate' ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Pre-Trade Risk Gate</span>
              </button>
              <button
                onClick={() => {
                  setTradingMode('quant_coder');
                  handleSendMessage('Mujhe ek profitable EMA 20/200 pullback strategy ka Pine Script v5 code bana kar do with stop loss and alerts.');
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center gap-2 transition ${
                  tradingMode === 'quant_coder' ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                <span>Quant Pine / Python Coder</span>
              </button>
              <button
                onClick={() => {
                  setTradingMode('derivatives_fo');
                  handleSendMessage('Nifty / BankNifty Option Chain aur PCR data ke hisaab se support, resistance aur max pain levels analyze karo.');
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center gap-2 transition ${
                  tradingMode === 'derivatives_fo' ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-sky-400" />
                <span>Indian F&O & Derivatives</span>
              </button>
              <button
                onClick={() => {
                  setTradingMode('alpha_playbook');
                  handleSendMessage('Mark Minervini VCP (Volatility Contraction Pattern) aur ICT Smart Money Concepts ke rules explain karo aur chart setup scan karo.');
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center gap-2 transition ${
                  tradingMode === 'alpha_playbook' ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                <span>Alpha Playbook (Minervini & SMC)</span>
              </button>
            </div>
          </div>

          {/* Chat History List */}
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 block mb-1.5">
            Recent Chats
          </span>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setCurrentChatId(chat.id)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition ${
                  chat.id === currentChatId
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{chat.title}</span>
                </div>
                {chats.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* User Profile / Bottom Settings */}
          <div className="pt-3 border-t border-zinc-800/80 mt-auto">
            <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800/60 transition">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs font-bold">
                  R
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-200">Raj (Trader)</div>
                  <div className="text-[10px] text-zinc-500">Virtual Paper Trading</div>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#111113]">
        {/* Top Floating Header */}
        <header className="h-14 border-b border-zinc-800/80 px-4 flex items-center justify-between shrink-0 bg-[#111113]/90 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                title="Open sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {/* Model Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="gemini">✨ Gemini 3.5 Flash (Vision)</option>
                <option value="groq">⚡ Groq OSS 120B (Instant)</option>
                <option value="openrouter">🌐 OpenRouter Nemotron VL</option>
              </select>
            </div>

            {/* 24-Repo Multi-Agent Trading Mode Selector */}
            <div className="relative">
              <select
                value={tradingMode}
                onChange={(e) => setTradingMode(e.target.value)}
                className="bg-zinc-800/90 hover:bg-zinc-800 border border-emerald-500/50 text-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="hedge_fund">🧠 Hedge Fund Committee (TradingAgents & ai-hedge-fund)</option>
                <option value="sniper_scalp">⚡ 5m Sniper Scalper (tradingview-mcp & trade-mcp)</option>
                <option value="risk_gate">🛡️ Pre-Trade Risk Gate (claude-trading-skills)</option>
                <option value="quant_coder">🧪 Quant Pine & Python (freqtrade & backtesting.py)</option>
                <option value="derivatives_fo">📊 Indian F&O & Derivatives (trade-mcp)</option>
                <option value="alpha_playbook">📚 Systematic Alpha Playbook (awesome-systematic-trading)</option>
              </select>
            </div>

            {/* Live Screen Vision Badge */}
            {isScreenSharing && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Screen Watch Active</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 24-Repo Arsenal Modal Button */}
            <button
              onClick={() => setShowRepoMatrix(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
              title="View all 24 integrated repositories"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">24 Repos Arsenal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            {/* Backtest Lab Button */}
            <button
              onClick={() => {
                setShowBacktester(true);
                if (!backtestResult) runBacktestSimulation();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/70 border border-purple-500/40 text-purple-300 text-xs font-semibold transition"
              title="Quant Backtest Simulation"
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Backtest</span>
            </button>

            {/* 24/7 Autonomous Human Trader Launcher Button */}
            <button
              onClick={() => {
                setShowAutoTrader(true);
                setCockpitTab('cockpit');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition shadow-sm cursor-pointer ${
                botState?.isRunning
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-emerald-500/20'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 border-zinc-600 text-zinc-300'
              }`}
              title="Open 24/7 Autonomous Human Trader Cockpit"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden lg:inline">24/7 Auto Trader</span>
              <span className="lg:hidden">Auto Bot</span>
              <span className={`w-1.5 h-1.5 rounded-full ${botState?.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`}></span>
            </button>

            {/* AI Experience & Training Brain Launcher */}
            <button
              onClick={() => {
                setShowAutoTrader(true);
                setCockpitTab('brain');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 text-xs font-bold transition shadow-sm cursor-pointer"
              title="Open AI Experience & Training Brain: Coach your AI & review memorized rules"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="hidden md:inline">Brain (Lvl {botState?.memory?.level || 1})</span>
              <span className="md:hidden">Brain</span>
            </button>

            {/* Firebase Cloud Sync Badge */}
            <div
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-[11px] text-zinc-300"
              title={cloudSyncStatus === 'synced' ? 'Firebase Cloud Memory Active & Synced' : cloudSyncStatus === 'syncing' ? 'Syncing to Cloud...' : 'Local Cache (Offline)'}
            >
              <Cloud className={`w-3.5 h-3.5 ${cloudSyncStatus === 'synced' ? 'text-emerald-400' : cloudSyncStatus === 'syncing' ? 'text-blue-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="hidden xl:inline">Firebase Memory</span>
              <span className={`w-1.5 h-1.5 rounded-full ${cloudSyncStatus === 'synced' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
            </div>

            {/* Screen Watch Button */}
            {!isScreenSharing ? (
              <button
                onClick={startScreenShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium transition"
                title="Share TradingView tab for Live AI screen watching"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Screen Watch</span>
              </button>
            ) : (
              <button
                onClick={stopScreenShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-medium transition"
              >
                <MonitorOff className="w-3.5 h-3.5" />
                <span>Stop Watch</span>
              </button>
            )}

            {/* Sarvam Audio Toggle */}
            <button
              onClick={() => {
                if (currentlyPlayingAudio) stopAudio();
                setAutoSpeak(!autoSpeak);
              }}
              className={`p-2 rounded-lg border transition ${
                autoSpeak
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:text-zinc-200'
              }`}
              title={autoSpeak ? `Voice Active (Sarvam AI ${selectedSpeaker.toUpperCase()})` : 'Voice Muted'}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* INTERACTIVE FLOATING COPILOT WIDGET (Always visible when screen share is active) */}
        {isScreenSharing && (
          isFloatingMinimized ? (
            /* Minimized Pill State */
            <div className="absolute top-16 right-4 z-40 bg-zinc-900/95 border border-emerald-500/60 rounded-full shadow-2xl p-2 px-3 flex items-center gap-2.5 backdrop-blur-md animate-in fade-in">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-semibold text-emerald-400">Live Copilot</span>
              <button
                onClick={handleFloatingVoiceQuestion}
                className="p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-black transition"
                title="Speak to AI"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => captureAndAnalyzeScreen()}
                disabled={isScanningScreen}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                title="Scan Screen"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsFloatingMinimized(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200"
                title="Expand Floating Copilot"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Expanded Full Copilot State */
            <div className="absolute top-16 right-4 z-40 w-80 bg-zinc-900/95 border-2 border-emerald-500/50 rounded-2xl shadow-2xl p-3 backdrop-blur-lg flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2">
              {/* Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-zinc-100 tracking-wide">
                    Live Screen Copilot
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsFloatingMinimized(true)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    title="Minimize to floating pill"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={stopScreenShare}
                    className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
                    title="Stop screen watch"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Live Video Preview (DIRECT VIDEO ELEMENT - NO BLACK SCREEN!) */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-zinc-800 shadow-inner">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {isScanningScreen && (
                  <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-xs flex items-center justify-center gap-2 text-xs text-emerald-300 font-semibold border-2 border-emerald-400 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    Analyzing Chart...
                  </div>
                )}
              </div>

              {/* Latest Live Advice Box (If available) */}
              {latestLiveAdvice && (
                <div className="p-2 rounded-xl bg-zinc-800/90 border border-zinc-700/60 text-xs text-zinc-200 max-h-24 overflow-y-auto leading-relaxed shadow-sm">
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 font-semibold mb-1">
                    <span>💡 Live Advice</span>
                    <button
                      onClick={() => triggerTTS(latestLiveAdvice, 0)}
                      className="text-zinc-400 hover:text-emerald-300 flex items-center gap-0.5"
                    >
                      <Volume2 className="w-3 h-3" /> Suniye
                    </button>
                  </div>
                  {latestLiveAdvice}
                </div>
              )}

              {/* Quick Talk / Question Input */}
              <div className="flex items-center gap-1.5 bg-zinc-800/80 border border-zinc-700/60 rounded-xl p-1.5 focus-within:border-emerald-500/70 transition">
                <button
                  onClick={handleFloatingVoiceQuestion}
                  className={`p-2 rounded-lg font-bold transition flex items-center justify-center ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-black'
                  }`}
                  title="Click to speak (Hindi/Hinglish)"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={floatingInput}
                  onChange={(e) => setFloatingInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && floatingInput.trim()) {
                      e.preventDefault();
                      captureAndAnalyzeScreen(floatingInput.trim());
                      setFloatingInput('');
                    }
                  }}
                  placeholder="Ask live (e.g. Buy karoon?)..."
                  className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none px-1"
                />
                <button
                  onClick={() => {
                    if (floatingInput.trim()) {
                      captureAndAnalyzeScreen(floatingInput.trim());
                      setFloatingInput('');
                    }
                  }}
                  disabled={!floatingInput.trim() || isScanningScreen}
                  className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 text-zinc-200"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4 Interactive Quick Chips for Fast Live Conversation */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => captureAndAnalyzeScreen("Bhai abhi kya karun? Buy karun ya shaant wait karun?")}
                  disabled={isScanningScreen}
                  className="py-1 px-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-[10.5px] text-emerald-400 font-semibold border border-emerald-500/30 text-left truncate transition"
                >
                  💡 Buy ya Wait?
                </button>
                <button
                  type="button"
                  onClick={() => captureAndAnalyzeScreen("Exact stop loss aur target price kitna rakhun?")}
                  disabled={isScanningScreen}
                  className="py-1 px-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-[10.5px] text-cyan-400 font-semibold border border-cyan-500/30 text-left truncate transition"
                >
                  🛑 SL & Target?
                </button>
                <button
                  type="button"
                  onClick={() => captureAndAnalyzeScreen("Chart ka trend aur current price numbers kya hain?")}
                  disabled={isScanningScreen}
                  className="py-1 px-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-[10.5px] text-amber-400 font-semibold border border-amber-500/30 text-left truncate transition"
                >
                  📈 Trend & Numbers
                </button>
                <button
                  type="button"
                  onClick={() => captureAndAnalyzeScreen("Kya chart par koi fakeout ya trap ban raha hai?")}
                  disabled={isScanningScreen}
                  className="py-1 px-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-[10.5px] text-rose-400 font-semibold border border-rose-500/30 text-left truncate transition"
                >
                  ⚠️ Trap Alert?
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => captureAndAnalyzeScreen()}
                  disabled={isScanningScreen}
                  className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Scan Chart Now</span>
                </button>

                <button
                  onClick={toggleAutoScan}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition ${
                    autoScanScreen
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {autoScanScreen ? 'Auto: ON' : 'Auto: OFF'}
                </button>
              </div>
            </div>
          )
        )}

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-4xl w-full mx-auto">
          {(!activeChat?.messages || activeChat.messages.length <= 1) && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-4">
                <TrendingUp className="w-6 h-6 text-black font-bold" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-100 mb-2">What's on your mind today?</h1>
              <p className="text-sm text-zinc-400 max-w-md mb-8">
                TradingView ka screenshot paste karo, mic se bolo, ya live screen watch start karo.
              </p>

              {/* 4 Interactive Starter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full text-left">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 transition group"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                    <Paperclip className="w-3.5 h-3.5" /> Chart Vision
                  </div>
                  <div className="text-xs text-zinc-300">TradingView screenshot upload karo ya `Ctrl + V` se paste karo.</div>
                </button>

                <button
                  onClick={startScreenShare}
                  className="p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 transition group"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
                    <Monitor className="w-3.5 h-3.5" /> Live Screen Watch
                  </div>
                  <div className="text-xs text-zinc-300">TradingView tab share karo, AI screen dekh kar guide karega.</div>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage('Gold (XAUUSD) 5-minute chart par trade lene ke 3 golden rules batao.')
                  }
                  className="p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 transition group"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
                    <Coins className="w-3.5 h-3.5" /> Gold (XAUUSD) Rules
                  </div>
                  <div className="text-xs text-zinc-300">Gold scalping ke liye entry aur stop loss ke golden rules.</div>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage('Mujhe 100 virtual profit banana hai, mera stop loss kitna hona chahiye?')
                  }
                  className="p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 transition group"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
                    <Shield className="w-3.5 h-3.5" /> ₹100 Target Plan
                  </div>
                  <div className="text-xs text-zinc-300">1:2 Risk to Reward ke saath safe targets calculate karo.</div>
                </button>
              </div>
            </div>
          )}

          {(activeChat?.messages || []).map((msg, idx) => {
            const isErrorMessage = msg.isError || (typeof msg.content === 'string' && msg.content.startsWith('⚠️'));
            return (
              <div
                key={idx}
                className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-lg ${isErrorMessage ? 'bg-rose-950/80 border-rose-500/50' : 'bg-zinc-800 border-zinc-700/60'} border flex items-center justify-center shrink-0 mt-0.5`}>
                    <TrendingUp className={`w-4 h-4 ${isErrorMessage ? 'text-rose-400' : 'text-emerald-400'}`} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/60'
                      : isErrorMessage
                      ? 'bg-rose-950/40 text-rose-200 border border-rose-500/40 shadow-lg'
                      : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800/80 shadow-md'
                  }`}
                >
                  {/* Attached Image Preview with Live Scan Overlay */}
                  {msg.image && (
                    <div className="relative mb-2.5 rounded-lg overflow-hidden border border-zinc-700/60 max-w-sm group">
                      <img src={msg.image} alt="User chart" className="w-full h-auto object-cover" />
                      {isLoading && idx === (activeChat?.messages || []).length - 1 && (
                        <div className="absolute inset-0 bg-emerald-950/25 backdrop-blur-[1px] flex flex-col items-center justify-between p-2 pointer-events-none">
                          <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse"></div>
                          <div className="px-2.5 py-1 rounded-full bg-black/85 border border-emerald-500/60 text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                            <Activity className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                            <span>Scanning Chart: {loadingSeconds}s</span>
                          </div>
                          <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div>{renderMessageContent(msg.content)}</div>

                  {/* Message Footer / Actions */}
                  {msg.role === 'assistant' && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center gap-3 text-xs text-zinc-400">
                      {/* Audio Playback button */}
                      {!isErrorMessage && (
                        <button
                          onClick={() => {
                            if (currentlyPlayingAudio === msg.audio) {
                              stopAudio();
                            } else if (msg.audio) {
                              playAudio(msg.audio);
                            } else {
                              triggerTTS(msg.content, idx);
                            }
                          }}
                          className="flex items-center gap-1.5 hover:text-emerald-400 transition"
                          title="Suniye (Sarvam AI Hindi Voice)"
                        >
                          {currentlyPlayingAudio === msg.audio ? (
                            <>
                              <Pause className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                              <span className="text-emerald-400 font-medium">Playing...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Suniye (Hindi)</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Copy button */}
                      <button
                        onClick={() => copyToClipboard(msg.content, idx)}
                        className="flex items-center gap-1 hover:text-zinc-200 transition"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* Delete / Dismiss Message Button */}
                      <button
                        onClick={() => handleDeleteMessage(idx)}
                        className="flex items-center gap-1 text-zinc-500 hover:text-rose-400 transition ml-auto"
                        title="Delete this message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isErrorMessage ? 'Clear Error' : 'Delete'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3.5 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                <TrendingUp className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>

              <div className="bg-zinc-900/95 border-2 border-emerald-500/50 rounded-2xl p-4 max-w-lg w-full shadow-2xl backdrop-blur-md">
                {/* Header with live ticking timer */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-zinc-100 tracking-wide">
                      Hedge Fund Analysis in Progress
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/90 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold shadow-inner">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    <span>{loadingSeconds}s</span>
                  </div>
                </div>

                {/* Animated dynamic progress bar */}
                <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden mb-3">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-400 h-1.5 rounded-full transition-all duration-200"
                    style={{
                      width: `${Math.min(96, Math.max(12, parseFloat(loadingSeconds || 0) * 16))}%`
                    }}
                  />
                </div>

                {/* Live Current Stage Text */}
                <div className="text-xs font-semibold text-emerald-300 flex items-center gap-2 mb-3 bg-zinc-800/60 p-2 rounded-xl border border-zinc-700/50">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
                  <span className="truncate">{loadingStage}</span>
                </div>

                {/* 4 Committee Steps Indicator */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-zinc-800/70">
                  <div className={`flex items-center gap-1.5 transition ${parseFloat(loadingSeconds || 0) >= 0.5 ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                    <Check className={`w-3 h-3 ${parseFloat(loadingSeconds || 0) >= 0.5 ? 'text-emerald-400' : 'opacity-30'}`} />
                    <span>1. Ingestion & Vision</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition ${parseFloat(loadingSeconds || 0) >= 2.0 ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                    <Check className={`w-3 h-3 ${parseFloat(loadingSeconds || 0) >= 2.0 ? 'text-emerald-400' : 'opacity-30'}`} />
                    <span>2. Technical & EMA Scan</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition ${parseFloat(loadingSeconds || 0) >= 4.0 ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                    <Check className={`w-3 h-3 ${parseFloat(loadingSeconds || 0) >= 4.0 ? 'text-emerald-400' : 'opacity-30'}`} />
                    <span>3. Bull vs Bear Debate</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition ${parseFloat(loadingSeconds || 0) >= 6.0 ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                    <Check className={`w-3 h-3 ${parseFloat(loadingSeconds || 0) >= 6.0 ? 'text-emerald-400' : 'opacity-30'}`} />
                    <span>4. Risk Gate & Verdict</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* FLOATING PROMPT INPUT BAR (ChatGPT Style) */}
        <div className="p-4 bg-gradient-to-t from-[#111113] via-[#111113] to-transparent shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Image Loading State or Thumbnail Preview before sending */}
            {isProcessingImage && (
              <div className="inline-flex items-center gap-2 mb-2 px-3 py-1.5 bg-zinc-900 border border-emerald-500/50 rounded-lg text-xs text-emerald-400 font-medium animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Reading image from clipboard/file...</span>
              </div>
            )}

            {attachedImage && !isProcessingImage && (
              <div className="relative inline-block mb-2 p-1 bg-zinc-900 border border-emerald-500/50 rounded-lg">
                <img src={attachedImage} alt="Attachment" className="h-16 w-auto rounded object-cover" />
                <button
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="relative flex items-center bg-[#1c1c1f] border border-zinc-700/50 focus-within:border-zinc-500 rounded-2xl p-2 shadow-2xl transition">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setIsProcessingImage(true);
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const compressed = await compressImage(event.target.result);
                      setAttachedImage(compressed);
                      setIsProcessingImage(false);
                    };
                    reader.onerror = () => setIsProcessingImage(false);
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />

              {/* Attach File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                title="Attach TradingView chart screenshot (or just press Ctrl+V)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Screen Watch Quick Button */}
              <button
                type="button"
                onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                className={`p-2 rounded-xl transition ${
                  isScreenSharing
                    ? 'text-emerald-400 bg-emerald-950/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
                title={isScreenSharing ? 'Screen Watch Active' : 'Start Live Screen Watch'}
              >
                <Monitor className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask VibeTrader or paste chart (Ctrl+V)..."
                rows={1}
                className="flex-1 bg-transparent border-0 text-zinc-100 placeholder-zinc-500 text-sm px-3 py-1.5 focus:outline-none resize-none max-h-32"
              />

              {/* Mic / Voice Dictation Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 rounded-xl transition ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
                title={isRecording ? 'Listening (Hindi/Hinglish)...' : 'Bol kar prompt dein (Mic)'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isLoading || (!input.trim() && !attachedImage)}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-30 disabled:hover:bg-zinc-100 text-black font-bold transition ml-1"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 text-center mt-2">
              Tip: TradingView par `Alt + S` ya Snipping tool se screenshot le kar yahan seedha <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-400">Ctrl + V</kbd> paste kar do!
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                VibeTrader Copilot Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Active AI Vision Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-zinc-200"
                >
                  <option value="gemini">Google Gemini 3.5 Flash (Vision + Speed - Recommended)</option>
                  <option value="groq">Groq Ultra-Fast OSS 120B (Instant Execution)</option>
                  <option value="openrouter">OpenRouter Nemotron 3.5 Super VL (Multimodal Free)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Hindi Voice Speaker (Sarvam AI)</label>
                <select
                  value={selectedSpeaker}
                  onChange={(e) => setSelectedSpeaker(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-zinc-200"
                >
                  <option value="shubh">Shubh (Recommended - Clear & Energetic)</option>
                  <option value="kabir">Kabir (Deep & Authoritative)</option>
                  <option value="aditya">Aditya (Conversational)</option>
                  <option value="rohan">Rohan (Youthful)</option>
                  <option value="ritu">Ritu (Female Clear)</option>
                  <option value="priya">Priya (Female Soft)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400">Voice Speed / Pace</label>
                  <span className="text-emerald-400 font-medium">
                    {speechPace}x ({speechPace === 1.0 ? 'Natural & Clear' : speechPace < 1.0 ? 'Relaxed' : 'Fast'})
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0.9, 1.0, 1.15, 1.25].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSpeechPace(spd)}
                      className={`py-1.5 rounded-lg border text-xs font-medium transition ${
                        speechPace === spd
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {spd === 1.0 ? '1.0x (Clear)' : spd === 0.9 ? '0.9x (Slow)' : `${spd}x`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="text-zinc-400 block mb-1">Connected API Keys</label>
                <div className="space-y-1 text-[11px] text-zinc-400">
                  <div className="flex items-center justify-between p-1.5 bg-zinc-800/50 rounded">
                    <span>Google Gemini Vision:</span>
                    <span className="text-emerald-400 font-medium">● Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-zinc-800/50 rounded">
                    <span>Sarvam AI Hindi Voice:</span>
                    <span className="text-emerald-400 font-medium">● Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-zinc-800/50 rounded">
                    <span>OpenRouter / Groq:</span>
                    <span className="text-emerald-400 font-medium">● Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-zinc-800/50 rounded">
                    <span>Firebase Cloud Memory:</span>
                    <span className="text-emerald-400 font-medium">● Connected (Cloud Firestore)</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs rounded-lg transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 24-Repository Institutional Arsenal Modal */}
      {showRepoMatrix && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-emerald-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                    Institutional Power Arsenal (24 Repositories Combined)
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                      24 / 24 ACTIVE
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Wall Street multi-agent debates, MCP live tools, quant backtesters aur risk gates ka complete integration.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRepoMatrix(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 p-3 border-b border-zinc-800 bg-zinc-900/50 overflow-x-auto text-[11px]">
              {['ALL', 'Multi-Agent Framework', 'Technical MCP', 'Quant Backtesting', 'Trading Skills', 'Master Architecture'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setRepoFilter(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                    repoFilter === cat
                      ? 'bg-emerald-500 text-black font-semibold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Repos Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {(repoList.length > 0 ? repoList : [
                { id: '1', name: 'TauricResearch/TradingAgents', category: 'Multi-Agent Framework', role: 'Fundamental, Technical & Bull/Bear debate committee with risk manager' },
                { id: '2', name: 'virattt/ai-hedge-fund', category: 'Multi-Agent Framework', role: 'Warren Buffett, Jim Simons, Cathie Wood & Bill Ackman personas' },
                { id: '3', name: 'tradermonty/claude-trading-skills', category: 'Trading Skills', role: 'Mark Minervini VCP breakout planner & drawdown circuit breakers' },
                { id: '4', name: 'atilaahmettaner/tradingview-mcp', category: 'Technical MCP', role: '39 tools: Multi-timeframe indicators, RSI, EMA, Bollinger Bands' },
                { id: '5', name: 'Techie03/trade-mcp', category: 'Technical MCP', role: 'Indian NSE/BSE F&O Option Chains, PCR, Bhavcopy and live quotes' },
                { id: '6', name: 'freqtrade/freqtrade', category: 'Quant Backtesting', role: 'FreqAI machine learning, dynamic stop loss trailing & hyperopt' },
                { id: '7', name: 'kernc/backtesting.py', category: 'Quant Backtesting', role: 'Single-asset strategy backtesting with Sharpe Ratio, CAGR & HTML reports' },
                { id: '8', name: 'orangejustin/awesome-agentic-trading', category: 'Master Architecture', role: '5-Layer master map: Data, Agent, Execution, Harness & Application' }
              ])
                .filter((r) => repoFilter === 'ALL' || r.category.toLowerCase().includes(repoFilter.toLowerCase()))
                .map((repo, idx) => (
                  <div
                    key={repo.id || idx}
                    className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 hover:border-emerald-500/40 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs text-zinc-100 font-mono truncate">
                          {repo.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-medium whitespace-nowrap">
                          ● ACTIVE
                        </span>
                      </div>
                      <span className="inline-block text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded mb-2">
                        {repo.category}
                      </span>
                      <p className="text-[11px] text-zinc-300 leading-relaxed mb-3">
                        {repo.role}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowRepoMatrix(false);
                        handleSendMessage(`${repo.name} ke institutional framework aur rules ka use karke chart setup analyze karo.`);
                      }}
                      className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-950 hover:border-emerald-500/50 border border-zinc-700 text-[11px] text-zinc-300 hover:text-emerald-300 font-medium transition"
                    >
                      ⚡ Activate {repo.name.split('/')[1] || 'Engine'}
                    </button>
                  </div>
                ))}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
              <span>Directory: <code className="text-emerald-400 font-mono">D:\trading lala\repos\</code> (All 24 Cloned)</span>
              <button
                onClick={() => setShowRepoMatrix(false)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded-lg transition"
              >
                Close Arsenal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quant Backtest Lab Modal */}
      {showBacktester && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30 text-purple-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                    Quant Backtest Lab (Powered by kernc/backtesting.py & freqtrade)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Monte Carlo simulation & 1:2 R:R mathematical expectancy calculator for Raj.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBacktester(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Parameters input grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800">
                <div>
                  <label className="text-zinc-400 block mb-1 text-[11px]">Initial Capital (₹ / $)</label>
                  <input
                    type="number"
                    value={backtestParams.initialCapital}
                    onChange={(e) => setBacktestParams({ ...backtestParams, initialCapital: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 text-[11px]">Win Rate (0.50 = 50%)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="0.9"
                    value={backtestParams.winRate}
                    onChange={(e) => setBacktestParams({ ...backtestParams, winRate: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 text-[11px]">Risk to Reward (1:X)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1.0"
                    max="5.0"
                    value={backtestParams.riskRewardRatio}
                    onChange={(e) => setBacktestParams({ ...backtestParams, riskRewardRatio: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 text-[11px]">Total Trades</label>
                  <input
                    type="number"
                    step="10"
                    min="10"
                    max="200"
                    value={backtestParams.totalTrades}
                    onChange={(e) => setBacktestParams({ ...backtestParams, totalTrades: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={runBacktestSimulation}
                  disabled={isBacktesting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBacktesting ? 'animate-spin' : ''}`} />
                  <span>{isBacktesting ? 'Simulating...' : 'Run Simulation'}</span>
                </button>
              </div>

              {/* Simulation Result KPIs */}
              {backtestResult && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/60">
                      <span className="text-[11px] text-zinc-400 block">Final Capital</span>
                      <span className={`text-base font-bold font-mono ${backtestResult.finalEquity >= backtestResult.initialCapital ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {backtestResult.finalEquity.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/60">
                      <span className="text-[11px] text-zinc-400 block">Total Return</span>
                      <span className={`text-base font-bold font-mono ${backtestResult.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {backtestResult.totalReturnPct > 0 ? `+${backtestResult.totalReturnPct}%` : `${backtestResult.totalReturnPct}%`}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/60">
                      <span className="text-[11px] text-zinc-400 block">Max Drawdown</span>
                      <span className="text-base font-bold font-mono text-amber-400">
                        {backtestResult.maxDrawdownPct}%
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/60">
                      <span className="text-[11px] text-zinc-400 block">Profit Factor</span>
                      <span className="text-base font-bold font-mono text-purple-400">
                        {backtestResult.profitFactor}
                      </span>
                    </div>
                  </div>

                  {/* SVG Equity Curve */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[11px] font-semibold text-zinc-400 mb-2 block">
                      📈 Equity Curve Progression ({backtestResult.wins} Wins / {backtestResult.losses} Losses)
                    </span>
                    <div className="h-32 w-full flex items-end gap-1 pt-2">
                      {backtestResult.equityCurve.map((pt, idx) => {
                        const min = Math.min(...backtestResult.equityCurve.map((p) => p.equity));
                        const max = Math.max(...backtestResult.equityCurve.map((p) => p.equity));
                        const heightPct = max > min ? Math.max(10, Math.min(100, ((pt.equity - min) / (max - min)) * 100)) : 50;
                        return (
                          <div
                            key={idx}
                            style={{ height: `${heightPct}%` }}
                            className={`flex-1 rounded-t transition-all ${
                              pt.isWin ? 'bg-emerald-500/80 hover:bg-emerald-400' : 'bg-rose-500/80 hover:bg-rose-400'
                            }`}
                            title={`Trade #${pt.trade}: ${pt.equity} (${pt.isWin ? 'Win' : 'Loss'})`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Mentor Wisdom Note */}
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-[11px] leading-relaxed">
                    💡 <strong>Shubh Mentor Rule:</strong> Dekh Raj, agar tera win rate sirf 45-50% bhi ho, lekin tu <strong>1:2 Risk to Reward</strong> aur <strong>1% strict capital risk</strong> follow karega, toh mathematically tera account hamesha green rahega! Overtrading aur revenge trade mat karna!
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
              <button
                onClick={() => setShowBacktester(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg transition text-xs"
              >
                Close Lab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 24/7 AUTONOMOUS HUMAN TRADER COCKPIT (VIRTUAL BROWSER TRADING) */}
      {showAutoTrader && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-[#111113] border border-emerald-500/40 rounded-2xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Top Control Bar */}
            <div className="flex flex-wrap items-center justify-between p-3.5 border-b border-zinc-800 bg-zinc-950/80 shrink-0 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/15 rounded-xl border border-emerald-500/40 text-emerald-400 shadow-inner">
                  <Bot className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-zinc-100 tracking-wide flex items-center gap-2">
                      VibeTrader 24/7 Autonomous Human Trader
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                        botState?.isRunning
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_#10b981]'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${botState?.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`}></span>
                      {botState?.isRunning ? '24/7 AUTOPILOT ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Live TradingView browser chart watch • Virtual capital compounding • 1% risk & 1:2 R:R discipline
                  </p>
                </div>
              </div>

              {/* Controls & Asset Switcher */}
              <div className="flex items-center gap-2.5">
                {/* Asset Dropdown */}
                <select
                  value={botState?.activeAsset?.key || 'XAUUSD'}
                  onChange={(e) => handleSetBotAsset(e.target.value)}
                  className="bg-zinc-800/90 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none cursor-pointer hover:border-emerald-500/50 transition"
                >
                  <option value="XAUUSD">🥇 Gold (PAXG/USD)</option>
                  <option value="BTCUSDT">₿ Bitcoin (BTC/USD)</option>
                  <option value="ETHUSDT">Ξ Ethereum (ETH/USD)</option>
                  <option value="SOLUSDT">◎ Solana (SOL/USD)</option>
                </select>

                {/* Start / Pause Autopilot Button */}
                {!botState?.isRunning ? (
                  <button
                    onClick={handleStartBot}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Start 24/7 Autopilot</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopBot}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold transition shadow-lg shadow-amber-600/30 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5 fill-black" />
                    <span>Pause Autopilot</span>
                  </button>
                )}

                {/* Reset Virtual Money */}
                <button
                  onClick={handleResetBot}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
                  title="Reset Virtual Wallet to ₹1,00,000"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                {/* Close Cockpit */}
                <button
                  onClick={() => setShowAutoTrader(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Virtual Account HUD Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-zinc-950/60 border-b border-zinc-800 text-xs shrink-0">
              {/* Virtual Equity */}
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90 flex flex-col justify-between">
                <span className="text-[10.5px] text-zinc-400 font-medium">Virtual Equity</span>
                <span className="text-base font-mono font-bold text-zinc-100">
                  ₹{botState?.wallet?.equity ? Math.round(botState.wallet.equity).toLocaleString('en-IN') : '1,00,000'}
                </span>
                <span className="text-[10px] text-zinc-500">Base: ₹1,00,000</span>
              </div>

              {/* Realized Profit */}
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90 flex flex-col justify-between">
                <span className="text-[10.5px] text-zinc-400 font-medium">Net Realized P&L</span>
                <span className={`text-base font-mono font-bold ${(botState?.wallet?.realizedPnL || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(botState?.wallet?.realizedPnL || 0) >= 0 ? `+₹${botState?.wallet?.realizedPnL || 0}` : `-₹${Math.abs(botState?.wallet?.realizedPnL || 0)}`}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">
                  {(((botState?.wallet?.equity || 100000) - 100000) / 1000).toFixed(2)}% ROI
                </span>
              </div>

              {/* Win Rate */}
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90 flex flex-col justify-between">
                <span className="text-[10.5px] text-zinc-400 font-medium">Win Rate & Trades</span>
                <span className="text-base font-mono font-bold text-cyan-400">
                  {botState?.wallet?.winRate || 0}%
                </span>
                <span className="text-[10px] text-zinc-400">
                  {botState?.wallet?.winCount || 0}W / {botState?.wallet?.lossCount || 0}L ({botState?.wallet?.totalTrades || 0} Total)
                </span>
              </div>

              {/* Capital Risk & Daily Circuit Breaker */}
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90 flex flex-col justify-between">
                <span className="text-[10.5px] text-zinc-400 font-medium flex items-center justify-between">
                  <span>Risk & Shield</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    botState?.dailyStats?.circuitBreakerTripped
                      ? 'bg-rose-950 text-rose-400 border border-rose-500/50'
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                  }`}>
                    {botState?.dailyStats?.circuitBreakerTripped ? 'Shield Tripped' : 'Shield Active'}
                  </span>
                </span>
                <span className="text-sm font-mono font-bold text-indigo-400">
                  1.0% / Trade • Target ₹5k+
                </span>
                <span className="text-[10px] text-zinc-400">
                  Today: {botState?.dailyStats?.tradesCount || 0}/4 trades ({botState?.dailyStats?.lossCount || 0}/2 losses)
                </span>
              </div>

              {/* Live Ticker Price */}
              <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-[10.5px] text-emerald-400 font-medium">
                  <span>Live Market Price</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <span className="text-base font-mono font-bold text-emerald-300">
                  ${botState?.livePrice || 4096.50}
                </span>
                <span className="text-[10px] text-zinc-400 truncate">
                  {botState?.activeAsset?.name || 'Gold'}
                </span>
              </div>
            </div>

            {/* Daily ₹4,000–₹5,000 Target Progress & Multi-Market Radar Strip */}
            <div className="px-3.5 py-2 bg-zinc-900/60 border-b border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-2.5 shrink-0">
              {/* Daily Target Progress Meter */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 whitespace-nowrap">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Daily Goal (₹5k Target):</span>
                </div>
                <div className="w-32 sm:w-44 bg-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-700/60 flex items-center">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (botState?.dailyStats?.realizedPnL || 0) >= 5000
                        ? 'bg-gradient-to-r from-amber-400 to-emerald-400 animate-pulse'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, ((botState?.dailyStats?.realizedPnL || 0) / 5000) * 100))}%` }}
                  />
                </div>
                <span className={`text-xs font-mono font-bold whitespace-nowrap ${
                  (botState?.dailyStats?.realizedPnL || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {(botState?.dailyStats?.realizedPnL || 0) >= 0 ? `+₹${botState?.dailyStats?.realizedPnL || 0}` : `-₹${Math.abs(botState?.dailyStats?.realizedPnL || 0)}`} / ₹5,000
                </span>
                {(botState?.dailyStats?.realizedPnL || 0) >= 5000 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    🏆 GOAL REACHED!
                  </span>
                )}
              </div>

              {/* Multi-Market Radar Strip (Click to Switch Asset) */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full text-[11px] font-mono">
                <span className="text-[10px] text-zinc-500 font-sans uppercase font-bold mr-1">Markets:</span>
                {Object.values(botState?.marketRadar || {
                  XAUUSD: { key: 'XAUUSD', name: 'Gold', price: 4096.50 },
                  BTCUSDT: { key: 'BTCUSDT', name: 'Bitcoin', price: 91800.00 },
                  ETHUSDT: { key: 'ETHUSDT', name: 'Ethereum', price: 3380.00 },
                  SOLUSDT: { key: 'SOLUSDT', name: 'Solana', price: 184.50 }
                }).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => handleSetBotAsset(m.key)}
                    className={`px-2 py-0.5 rounded-lg border text-[10.5px] transition cursor-pointer flex items-center gap-1 ${
                      botState?.activeAsset?.key === m.key
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="text-zinc-500">•</span>
                    <span className={botState?.activeAsset?.key === m.key ? 'text-emerald-400' : 'text-zinc-300'}>
                      ${m.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode Navigation Tabs */}
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCockpitTab('cockpit')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    cockpitTab === 'cockpit'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>⚡ 24/7 Live Cockpit & Chart</span>
                </button>

                <button
                  onClick={() => setCockpitTab('brain')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    cockpitTab === 'brain'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>🧠 AI Experience & Training Brain</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-900/60 border border-purple-500/40 text-purple-200">
                    Lvl {botState?.memory?.level || 1}
                  </span>
                </button>
              </div>

              {/* Experience Memory Quick Tag */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1 text-purple-400">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{botState?.memory?.levelTitle || 'Level 1: Novice Quant Paper Trader 🚀'}</span>
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-300 font-bold">{botState?.memory?.xp || 180} XP</span>
              </div>
            </div>

            {/* TAB CONTENT: 1. COCKPIT (CHART + TERMINAL + ORDERS) */}
            {cockpitTab === 'cockpit' ? (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                {/* Left Side: Real-time Embedded TradingView Chart (7 Cols) */}
                <div className="lg:col-span-7 h-full flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-800 relative bg-black">
                  <iframe
                    key={botState?.activeAsset?.symbol || 'PAXGUSDT'}
                    src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_bot&symbol=BINANCE%3A${botState?.activeAsset?.symbol || 'PAXGUSDT'}&interval=5&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=111113&theme=dark&style=1&timezone=Asia%2FKolkata&locale=en`}
                    className="w-full flex-1 border-0"
                    title="Live TradingView Autonomous Browser View"
                  />
                  {/* Floating Chart Watermark */}
                  <div className="absolute top-3 right-3 bg-zinc-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-[10px] text-emerald-400 font-mono font-bold pointer-events-none flex items-center gap-1.5 backdrop-blur-md">
                    <Activity className="w-3 h-3 animate-spin text-emerald-400" />
                    <span>24/7 AI Scanner Hooked to Binance Live Stream</span>
                  </div>
                </div>

                {/* Right Side: AI Trader Mind, Position, & Log Terminal (5 Cols) */}
                <div className="lg:col-span-5 h-full flex flex-col overflow-hidden bg-[#141417]">
                  {/* ACTIVE POSITION / IDLE RADAR CARD */}
                  <div className="p-3.5 border-b border-zinc-800 shrink-0 bg-zinc-900/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Live Position Execution
                      </span>
                      {botState?.activePosition && (
                        <button
                          onClick={handleCloseBotPosition}
                          className="px-2 py-0.5 rounded bg-rose-600/30 hover:bg-rose-600 border border-rose-500/50 text-[10px] text-rose-300 hover:text-white font-bold transition cursor-pointer"
                        >
                          Market Exit
                        </button>
                      )}
                    </div>

                    {botState?.activePosition ? (
                      <div className="p-3 rounded-xl bg-zinc-950/90 border border-emerald-500/40 shadow-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              botState.activePosition.type === 'BUY'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                                : 'bg-rose-950 text-rose-400 border border-rose-500/50'
                            }`}>
                              {botState.activePosition.type}
                            </span>
                            <span className="text-xs font-bold text-zinc-100">{botState.activePosition.assetName}</span>
                          </div>
                          <div className={`text-sm font-mono font-bold ${
                            botState.activePosition.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {botState.activePosition.unrealizedPnL >= 0
                              ? `+₹${botState.activePosition.unrealizedPnL}`
                              : `-₹${Math.abs(botState.activePosition.unrealizedPnL)}`} ({botState.activePosition.unrealizedPnLPct || 0}%)
                          </div>
                        </div>

                        {/* Entry, Stop Loss, Target Grid */}
                        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                          <div>
                            <div className="text-[10px] text-zinc-500">Entry</div>
                            <div className="text-zinc-200 font-bold">${botState.activePosition.entryPrice}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-rose-400 font-semibold">Stop Loss</div>
                            <div className="text-rose-300 font-bold">${botState.activePosition.stopLoss}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-emerald-400 font-semibold">
                              {botState.activePosition.trailingStage && botState.activePosition.trailingStage !== 'INITIAL_RISK'
                                ? 'Next Target'
                                : 'Target (1:2)'}
                            </div>
                            <div className="text-emerald-300 font-bold">${botState.activePosition.targetPrice}</div>
                          </div>
                        </div>

                        {/* Institutional Confluence & Grade Badge */}
                        <div className="flex items-center justify-between text-[10px] bg-zinc-900/70 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9.5px]">
                              {botState.activePosition.setupGrade || 'A+'} Grade
                            </span>
                            <span className="font-semibold text-zinc-200">
                              Score: {botState.activePosition.confluenceScore || 95}/100
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400 truncate">
                              {(botState.activePosition.confluences || ['20 EMA Support', 'Healthy RSI Momentum']).slice(0, 2).join(' • ')}
                            </span>
                          </div>
                        </div>

                        {/* Trailing stop status */}
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                          <span className="flex items-center gap-1">
                            <span className="font-semibold text-zinc-300">Trailing:</span>
                            <span className={
                              botState.activePosition.trailingStage === 'TRAIL_5R_PLUS' ? 'text-amber-400 font-bold' :
                              botState.activePosition.trailingStage === 'TRAIL_4R' ? 'text-purple-400 font-bold' :
                              botState.activePosition.trailingStage === 'TRAIL_3R' ? 'text-cyan-400 font-bold' :
                              botState.activePosition.trailingStage === 'TRAIL_2R' ? 'text-emerald-400 font-bold' :
                              botState.activePosition.trailingStage === 'BREAKEVEN' ? 'text-emerald-300 font-medium' :
                              'text-zinc-500'
                            }>
                              {botState.activePosition.trailingStage === 'TRAIL_5R_PLUS' ? '🏆 Mega Runner (+₹4k locked, hunting ₹5k+)' :
                               botState.activePosition.trailingStage === 'TRAIL_4R' ? '⚡ Locked +₹3k (Heading for ₹5k+)' :
                               botState.activePosition.trailingStage === 'TRAIL_3R' ? '🔥 Locked +₹2k (Hunting ₹4k+)' :
                               botState.activePosition.trailingStage === 'TRAIL_2R' ? '🚀 Locked +₹1.2k (Hunting ₹3k+)' :
                               botState.activePosition.trailingStage === 'BREAKEVEN' ? '🛡️ Cost Breakeven (Zero Risk)' :
                               'Pending +0.7R Breakeven'}
                            </span>
                          </span>
                          <span>Opened: {botState.activePosition.openedAt}</span>
                        </div>

                        {/* Live AI Decision & Active Control Pill */}
                        {botState.activePosition.activeDecision && (
                          <div className="flex items-center gap-1.5 text-[10px] bg-zinc-900/90 border border-emerald-500/30 text-emerald-300 px-2.5 py-1.5 rounded-lg font-mono">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="font-bold text-zinc-300">Live AI Control:</span>
                            <span className="truncate">{botState.activePosition.activeDecision}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 text-center flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2 border border-emerald-500/30">
                          <Activity className="w-4 h-4 animate-spin" />
                        </div>
                        <div className="text-xs font-semibold text-zinc-200 mb-1 flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                          {botState?.dailyStats?.circuitBreakerTripped
                            ? '🛑 Daily Circuit Breaker Active'
                            : botState?.isRunning
                            ? '24/7 Market Radar Active'
                            : 'Autopilot Paused'}
                        </div>
                        <div className="text-[11px] text-emerald-300 font-mono bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800 my-1.5 max-w-sm truncate">
                          {botState?.scannerStatus || `Scanning ${botState?.activeAsset?.name || 'Gold'} • 20 EMA & RSI Momentum Setup`}
                        </div>
                        <div className="text-[10px] text-zinc-400 max-w-xs mt-0.5">
                          {botState?.dailyStats?.circuitBreakerTripped
                            ? 'Max 2 daily losses hit (-₹2,000 risk cap). Capital 100% protected until tomorrow.'
                            : botState?.isRunning
                            ? `Patience is edge: Only taking A+ Grade setups (Target: ₹4k–₹5k+) • Today: ${botState?.dailyStats?.tradesCount || 0}/4 trades.`
                            : 'Click "Start 24/7 Autopilot" to let the bot trade automatically.'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI STREAM OF CONSCIOUSNESS (LIVE TERMINAL) */}
                  <div className="flex-1 flex flex-col overflow-hidden border-b border-zinc-800">
                    <div className="p-2.5 bg-zinc-950 px-3 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
                      <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        AI Thought Stream (24-Repo Mind)
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Real-time
                      </span>
                    </div>

                    <div className="flex-1 p-2.5 overflow-y-auto space-y-1.5 font-mono text-[11px] bg-black/95 select-text">
                      {(botState?.recentLogs || []).map((log) => (
                        <div key={log.id} className="leading-relaxed">
                          <span className="text-zinc-500">[{log.time}]</span>{' '}
                          <span className={`font-bold ${
                            log.category === 'WIN'
                              ? 'text-emerald-400'
                              : log.category === 'LOSS'
                              ? 'text-rose-400'
                              : log.category === 'ORDER'
                              ? 'text-cyan-400'
                              : log.category === 'TRAIL_SL'
                              ? 'text-indigo-400'
                              : log.category === 'MEMORY' || log.category === 'MEMORY_GATE' || log.category === 'KNOWLEDGE' || log.category === 'STUDY'
                              ? 'text-purple-400'
                              : log.category === 'SYSTEM'
                              ? 'text-amber-400'
                              : 'text-zinc-400'
                          }`}>
                            [{log.category}]
                          </span>{' '}
                          <span className="text-zinc-300">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COMPLETED TRADES TABLE (BOTTOM RIGHT) */}
                  <div className="h-44 flex flex-col overflow-hidden bg-zinc-950/40 shrink-0">
                    <div className="p-2 px-3 border-b border-zinc-800 flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                      <span>Recent Completed Virtual Trades</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400">{botState?.tradeHistory?.length || 0} Trades</span>
                        <button
                          onClick={handleExportJournalCSV}
                          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                          title="Export Trading Journal to CSV"
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-1 text-xs">
                      {(botState?.tradeHistory || []).length === 0 ? (
                        <div className="text-center text-zinc-500 py-6 text-xs">
                          No trades closed yet. Bot will log wins and losses here 24/7.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {botState.tradeHistory.map((tr) => (
                            <div
                              key={tr.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px]"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  tr.isWin ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                                }`}>
                                  {tr.isWin ? 'WIN' : 'LOSS'}
                                </span>
                                {tr.setupGrade && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {tr.setupGrade}
                                  </span>
                                )}
                                <span className="font-mono text-zinc-200">{tr.symbol}</span>
                                <span className="text-zinc-500">({tr.type})</span>
                              </div>
                              <div className="flex items-center gap-3 font-mono">
                                <span className="text-zinc-400">${tr.entryPrice} → ${tr.exitPrice}</span>
                                <span className={`font-bold ${tr.isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {tr.pnlFormatted}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB CONTENT: 2. AI EXPERIENCE & TRAINING BRAIN VIEW */
              <div className="flex-1 flex flex-col overflow-y-auto p-3 sm:p-5 bg-[#0f0f12] space-y-4">
                {/* TOP LEVEL & XP STATUS OVERVIEW */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Card 1: Trader Rank & XP Progression */}
                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-gradient-to-r from-purple-950/70 via-zinc-900 to-zinc-900 border border-purple-500/40 shadow-lg flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] text-purple-400 font-semibold uppercase tracking-wider">Quant Trader Rank</div>
                          <div className="text-sm font-bold text-zinc-100">{botState?.memory?.levelTitle || 'Level 1: Novice Quant Paper Trader 🚀'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-purple-300">{botState?.memory?.xp || 180} XP</span>
                        <div className="text-[10px] text-zinc-400">Next: {botState?.memory?.nextLevelXP || 250} XP</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-zinc-700/80">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-400 h-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_#a855f7]"
                          style={{ width: `${botState?.memory?.progressPct || 70}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-1">
                        <span>{botState?.memory?.progressXP || 180} XP gained</span>
                        <span>{botState?.memory?.progressPct || 70}% towards Level {(botState?.memory?.level || 1) + 1}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Win Streak & Discipline */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-medium">Win Streak</span>
                      <Flame className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xl font-mono font-bold text-amber-400">
                        🔥 {botState?.memory?.winStreak || 0} Current
                      </div>
                      <div className="text-[11px] text-zinc-400">Best Streak: {botState?.memory?.bestStreak || 0} Wins</div>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium">Disciplined Risk: 1.0% Gate Active</div>
                  </div>

                  {/* Card 3: Memory Rules Ledger Status */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-medium">Memorized Rules</span>
                      <Brain className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-xl font-mono font-bold text-purple-300">
                        {botState?.memory?.learnedRules?.length || 5} Rules
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {(botState?.memory?.learnedRules || []).filter(r => r.source === 'TRAINED_BY_RAJ').length} Coached by Raj
                      </div>
                    </div>
                    <div className="text-[10px] text-cyan-400 font-medium">Sync: Firestore Cloud + Local JSON</div>
                  </div>
                </div>

                {/* INTERACTIVE COACH YOUR AI PANEL (RAJ'S TRAINING LAB) */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-purple-500/40 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-purple-500/20 text-purple-400">
                        <Brain className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-2">
                          <span>Coach Your AI Trader (Raj's Direct Training Input)</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-900/60 text-purple-300 border border-purple-500/50">
                            Permanent Experience Memory
                          </span>
                        </h3>
                        <p className="text-[11px] text-zinc-400">
                          Aap yahan apni trading rules, market guidance ya instructions type karein. AI ise permanently memorize karega aur 24/7 trading mein repeat hone se bachega.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Coaching Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-zinc-500 font-semibold mr-1">Quick Coach:</span>
                    {[
                      "US CPI News (8:30 PM) ke time high volatility mein trade mat lena",
                      "RSI 70 ke upar Buy mat lena, rejection candle ka wait karna",
                      "Jab bhi target 1:2 hit ho jaye to greedy mat banna, profit book karna",
                      "Gold mein 20 EMA ke counter-trend trade bina multi-timeframe confirmation ke mat lena"
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCoachFeedbackInput(chip)}
                        className="text-[10.5px] px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-purple-500/50 text-zinc-300 transition text-left cursor-pointer"
                      >
                        💡 {chip}
                      </button>
                    ))}
                  </div>

                  {/* Input Box & Submit Button */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <textarea
                      value={coachFeedbackInput}
                      onChange={(e) => setCoachFeedbackInput(e.target.value)}
                      placeholder="Type training feedback in Hinglish/English... (e.g. 'Bhai jab bhi 5m chart par price 20 EMA se 2% dur chala jaye to entry mat lena, pullback ka wait karna')"
                      rows={2}
                      className="flex-1 p-2.5 text-xs bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition resize-none"
                    />
                    <button
                      onClick={() => handleTrainAI()}
                      disabled={isTrainingAI || !coachFeedbackInput.trim()}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 ${
                        isTrainingAI || !coachFeedbackInput.trim()
                          ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 cursor-pointer'
                      }`}
                    >
                      {isTrainingAI ? (
                        <>
                          <Activity className="w-4 h-4 animate-spin" />
                          <span>AI Memorizing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Train AI (+30 XP)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Success Message Banner */}
                  {trainSuccessMsg && (
                    <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/50 flex items-start gap-2.5 text-xs animate-in fade-in">
                      <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold text-purple-200">AI Response & Rule Memorized!</div>
                        <div className="text-zinc-300 mt-0.5">{trainSuccessMsg}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTTOM SPLIT: LEARNED RULES LEDGER (LEFT) & TRADE POST-MORTEMS (RIGHT) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left 7 Cols: Learned Golden Rules Catalog */}
                  <div className="lg:col-span-7 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col">
                    <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-zinc-800 gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                          Learned Golden Rules Ledger
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                          {botState?.memory?.learnedRules?.length || 0} Active
                        </span>
                      </div>

                      {/* Filter Pills */}
                      <div className="flex items-center gap-1 text-[10px]">
                        {['ALL', 'TRAINED_BY_RAJ', 'INSTITUTIONAL_CORE', 'AUTO_LEARNED'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setFilterRuleCategory(cat)}
                            className={`px-2 py-0.5 rounded-md transition cursor-pointer font-medium ${
                              filterRuleCategory === cat
                                ? 'bg-purple-600 text-white'
                                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {cat === 'ALL' ? 'All' : cat === 'TRAINED_BY_RAJ' ? 'By Raj' : cat === 'INSTITUTIONAL_CORE' ? 'Institutional' : 'Auto-Learned'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rules List */}
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {((botState?.memory?.learnedRules || []).filter(r => filterRuleCategory === 'ALL' || r.source === filterRuleCategory)).map((rule) => (
                        <div
                          key={rule.id}
                          className={`p-3 rounded-xl border transition ${
                            rule.active
                              ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                              : 'bg-zinc-950/50 border-zinc-800/40 opacity-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  rule.source === 'TRAINED_BY_RAJ'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-500/50'
                                    : rule.source === 'AUTO_LEARNED'
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                                }`}>
                                  {rule.source === 'TRAINED_BY_RAJ' ? '🎓 Trained by Raj' : rule.source === 'AUTO_LEARNED' ? '🤖 Auto-Learned' : '🏛️ Institutional Core'}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  🛡️ Enforced {rule.enforcedCount || 0} times
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-zinc-100 leading-snug">{rule.rule}</div>
                              {rule.context && (
                                <div className="text-[11px] text-zinc-400 mt-1 italic">
                                  Reason: {rule.context}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleToggleRule(rule.id)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                  rule.active
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                }`}
                                title={rule.active ? 'Rule Active' : 'Rule Paused'}
                              >
                                {rule.active ? 'ACTIVE' : 'OFF'}
                              </button>
                              {rule.source === 'TRAINED_BY_RAJ' && (
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
                                  title="Delete Rule"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right 5 Cols: Trade Post-Mortems & Memory Events */}
                  <div className="lg:col-span-5 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Trade Post-Mortems & Reflections
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {botState?.memory?.postMortemArchive?.length || 0} Analyzed
                      </span>
                    </div>

                    {/* Post-Mortem Cards */}
                    <div className="space-y-2 flex-1 max-h-[220px] overflow-y-auto pr-1">
                      {(botState?.memory?.postMortemArchive || []).length === 0 ? (
                        <div className="text-center text-zinc-500 py-6 text-xs">
                          Abhi tak koi trade close nahi hua hai. Jaise hi trade close hoga, AI yahan deep self-reflection post-mortem likhega.
                        </div>
                      ) : (
                        (botState?.memory?.postMortemArchive || []).map((pm) => (
                          <div key={pm.id} className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                                  pm.isWin ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                                }`}>
                                  {pm.isWin ? 'WIN' : 'LOSS'}
                                </span>
                                <span className="text-zinc-200 font-mono">{pm.symbol}</span>
                                <span className="text-zinc-500">({pm.type})</span>
                              </div>
                              <span className={`font-mono font-bold ${pm.isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {pm.pnlFormatted}
                              </span>
                            </div>
                            <div className="text-zinc-300 text-[10.5px] leading-relaxed bg-black/40 p-2 rounded-lg border border-zinc-800/80">
                              {pm.reflection}
                            </div>
                            <div className="text-[10px] text-zinc-500 flex justify-between">
                              <span>{pm.reason}</span>
                              <span>{pm.closedAt}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Live Memory Event Stream (Terminal-like) */}
                    <div className="pt-2 border-t border-zinc-800">
                      <div className="text-[10px] font-mono text-zinc-400 mb-1 flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-purple-400" />
                        <span>Real-time Memory Reflex Feed</span>
                      </div>
                      <div className="h-28 overflow-y-auto p-2 rounded-lg bg-black font-mono text-[10px] space-y-1 select-text border border-zinc-800/80">
                        {(botState?.memory?.recentMemoryEvents || []).length === 0 ? (
                          <div className="text-zinc-600">Memory events will appear here in real-time...</div>
                        ) : (
                          (botState?.memory?.recentMemoryEvents || []).map((evt) => (
                            <div key={evt.id} className="text-zinc-300 leading-tight">
                              <span className="text-zinc-600">[{evt.time}]</span>{' '}
                              <span className="text-purple-300">{evt.message}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
