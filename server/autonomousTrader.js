// ============================================================================
// VibeTrader AI - 24/7 Autonomous Human-like Paper Trading Engine
// Combines 24-repo institutional intelligence, real-time price feeds,
// 1% risk discipline, 1:2 R:R execution, and voice announcements.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { traderMemory } from './traderMemory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'bot_state.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class AutonomousTrader {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.cycleSeconds = 6; // Evaluates live market every 6 seconds

    // Supported live assets with multi-exchange institutional fallback
    this.assets = {
      XAUUSD: {
        name: 'Gold (PAXG/USD)',
        symbol: 'PAXGUSDT',
        coinbasePair: 'PAXG-USD',
        krakenPair: 'PAXGUSD',
        decimals: 2,
        minMove: 0.1
      },
      BTCUSDT: {
        name: 'Bitcoin (BTC/USD)',
        symbol: 'BTCUSDT',
        coinbasePair: 'BTC-USD',
        krakenPair: 'XBTUSD',
        decimals: 2,
        minMove: 1.0
      },
      ETHUSDT: {
        name: 'Ethereum (ETH/USD)',
        symbol: 'ETHUSDT',
        coinbasePair: 'ETH-USD',
        krakenPair: 'ETHUSD',
        decimals: 2,
        minMove: 0.5
      },
      SOLUSDT: {
        name: 'Solana (SOL/USD)',
        symbol: 'SOLUSDT',
        coinbasePair: 'SOL-USD',
        krakenPair: 'SOLUSD',
        decimals: 2,
        minMove: 0.05
      }
    };

    this.activeAssetKey = 'XAUUSD';
    this.livePrice = 4096.50;
    this.priceHistory = [];

    // Virtual Wallet State (Initial Capital: ₹1,00,000 INR)
    this.wallet = {
      initialCapital: 100000,
      balance: 100000,
      equity: 100000,
      realizedPnL: 0,
      unrealizedPnL: 0,
      winCount: 0,
      lossCount: 0,
      totalTrades: 0,
      winRate: 0,
      peakEquity: 100000,
      maxDrawdownPct: 0
    };

    // Active open trade
    this.activePosition = null;

    // Completed trade history
    this.tradeHistory = [];

    // Real-time AI Stream of Consciousness (Thought logs)
    this.logs = [];

    // Latest Voice Speech to announce
    this.latestAnnouncement = null;

    // AI Mentor Gemini caller reference for post-mortems
    this.geminiCaller = null;

    // Risk settings
    this.riskPerTradePct = 0.01; // 1% risk rule (Mark Minervini / Jim Simons)
    this.riskRewardRatio = 2.0;  // 1:2 R:R strict institutional standard

    // Indicator history for EMA / RSI calculations
    this.priceTicks = [];

    // Load persisted state if available
    this.wasRunning = true;
    this.loadState();

    // Auto-start 24/7 Autopilot immediately on boot
    if (this.wasRunning !== false && process.env.AUTO_START_BOT !== 'false') {
      setTimeout(() => {
        if (!this.isRunning) this.start();
      }, 1000);
    }

    this.addLog('SYSTEM', 'Autonomous Human Trader Engine initialized. Ready to trade 24/7.');
  }

  // Set Gemini Caller function for post-mortem analysis
  setGeminiCaller(fn) {
    this.geminiCaller = fn;
  }

  // Load saved state from disk
  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (typeof data.isRunning === 'boolean') {
          this.wasRunning = data.isRunning;
        } else {
          this.wasRunning = true;
        }
        if (data.wallet) this.wallet = { ...this.wallet, ...data.wallet };
        if (data.activePosition !== undefined) this.activePosition = data.activePosition;
        if (Array.isArray(data.tradeHistory)) this.tradeHistory = data.tradeHistory;
        if (data.activeAssetKey) this.activeAssetKey = data.activeAssetKey;
        if (Array.isArray(data.logs)) this.logs = data.logs.slice(-30);
      }
    } catch (e) {
      console.warn('Could not load bot state from disk:', e.message);
    }
  }

  // Persist state to disk
  saveState() {
    try {
      const stateToSave = {
        isRunning: this.isRunning,
        wallet: this.wallet,
        activePosition: this.activePosition,
        tradeHistory: this.tradeHistory.slice(-50),
        activeAssetKey: this.activeAssetKey,
        logs: this.logs.slice(-40),
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(stateToSave, null, 2));
    } catch (e) {
      console.warn('Could not save bot state to disk:', e.message);
    }
  }

  // Add a log with timestamp
  addLog(category, message) {
    const time = new Date().toLocaleTimeString('en-IN', { hour12: false });
    const logItem = { time, category, message, id: Date.now() + Math.random() };
    this.logs.unshift(logItem);
    if (this.logs.length > 80) this.logs.pop();
  }

  // Set active asset
  setAsset(assetKey) {
    if (this.assets[assetKey]) {
      this.activeAssetKey = assetKey;
      this.priceTicks = [];
      this.addLog('CONFIG', `Switched active trading market to ${this.assets[assetKey].name}`);
      this.saveState();
    }
  }

  // Fetch real live price with Multi-Tier Institutional Providers (Coinbase -> Kraken -> Binance)
  async fetchLivePrice() {
    const asset = this.assets[this.activeAssetKey];
    if (!asset) return this.livePrice;

    // 1. Try Coinbase Public Spot API (Fastest, global, never blocked on US/cloud servers)
    if (asset.coinbasePair) {
      try {
        const url = `https://api.coinbase.com/v2/prices/${asset.coinbasePair}/spot`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          const price = parseFloat(data?.data?.amount);
          if (!isNaN(price) && price > 0) {
            this.livePrice = Number(price.toFixed(asset.decimals));
            this.recordTick(this.livePrice);
            return this.livePrice;
          }
        }
      } catch (e) {
        // Fall through to Kraken
      }
    }

    // 2. Try Kraken Public Ticker API (Institutional global failover)
    if (asset.krakenPair) {
      try {
        const url = `https://api.kraken.com/0/public/Ticker?pair=${asset.krakenPair}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          const pairKey = Object.keys(data?.result || {})[0];
          const price = parseFloat(data?.result?.[pairKey]?.c?.[0]);
          if (!isNaN(price) && price > 0) {
            this.livePrice = Number(price.toFixed(asset.decimals));
            this.recordTick(this.livePrice);
            return this.livePrice;
          }
        }
      } catch (e) {
        // Fall through to Binance
      }
    }

    // 3. Try Binance Public API (Direct / Global)
    try {
      const url = `https://api.binance.com/api/v3/ticker/price?symbol=${asset.symbol}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        const price = parseFloat(data.price);
        if (!isNaN(price) && price > 0) {
          this.livePrice = Number(price.toFixed(asset.decimals));
          this.recordTick(this.livePrice);
          return this.livePrice;
        }
      }
    } catch (e) {
      // Ignored
    }

    return this.livePrice;
  }

  // Record price tick for indicator calculation
  recordTick(price) {
    this.priceTicks.push(price);
    if (this.priceTicks.length > 50) this.priceTicks.shift();
  }

  // Calculate Simple / Exponential Moving Average
  calculateEMA(period = 20) {
    if (this.priceTicks.length < period) return this.livePrice;
    const k = 2 / (period + 1);
    let ema = this.priceTicks[0];
    for (let i = 1; i < this.priceTicks.length; i++) {
      ema = this.priceTicks[i] * k + ema * (1 - k);
    }
    return Number(ema.toFixed(2));
  }

  // Calculate simple Relative Strength Index (RSI)
  calculateRSI(period = 14) {
    if (this.priceTicks.length <= period) return 50.0;
    let gains = 0;
    let losses = 0;
    for (let i = this.priceTicks.length - period; i < this.priceTicks.length; i++) {
      const diff = this.priceTicks[i] - this.priceTicks[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    if (losses === 0) return 100;
    const rs = (gains / period) / (losses / period);
    return Number((100 - (100 / (1 + rs))).toFixed(1));
  }

  // Start 24/7 Autonomous Bot
  start() {
    if (this.isRunning && this.intervalId) return;
    this.isRunning = true;
    this.wasRunning = true;
    this.addLog('SYSTEM', `🟢 24/7 Autonomous Human Trader STARTED on ${this.assets[this.activeAssetKey].name}.`);
    this.latestAnnouncement = `Raj bhai, maine 24/7 autonomous paper trading start kar di hai. Capital safe rakh kar 1 is to 2 target par kaam karunga.`;
    this.saveState();

    // Run immediately once
    this.executeTradingCycle();

    // Then continuous 24/7 interval
    this.intervalId = setInterval(() => {
      this.executeTradingCycle();
    }, this.cycleSeconds * 1000);
  }

  // Stop / Pause Autonomous Bot
  stop() {
    this.isRunning = false;
    this.wasRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.addLog('SYSTEM', '⏸️ 24/7 Autonomous Trader PAUSED.');
    this.saveState();
  }

  // Reset virtual capital back to initial ₹1,00,000
  reset() {
    this.wallet = {
      initialCapital: 100000,
      balance: 100000,
      equity: 100000,
      realizedPnL: 0,
      unrealizedPnL: 0,
      winCount: 0,
      lossCount: 0,
      totalTrades: 0,
      winRate: 0,
      peakEquity: 100000,
      maxDrawdownPct: 0
    };
    this.activePosition = null;
    this.tradeHistory = [];
    this.logs = [];
    this.addLog('RESET', 'Virtual Account Reset to ₹1,00,000. Ready for fresh 24/7 compounding.');
    this.saveState();
  }

  // Core Autonomous Decision Cycle (Runs every 6 seconds)
  async executeTradingCycle() {
    if (!this.isRunning) return;

    try {
      // 1. Fetch live real-time price
      const price = await this.fetchLivePrice();
      const asset = this.assets[this.activeAssetKey];

      // 2. Manage open position if exists
      if (this.activePosition) {
        this.manageOpenPosition(price);
      } else {
        // 3. Scan for high-probability setups if idle
        this.scanAndEvaluateMarket(price);
      }

      // 4. Update equity and drawdown
      this.updateWalletEquity();

      // 5. Auto save state
      this.saveState();
    } catch (err) {
      console.error('Bot execution cycle error:', err);
      this.addLog('ERROR', `Cycle error: ${err.message}`);
    }
  }

  // Manage Active Position (Check Stop Loss, Take Profit, Trailing Stop)
  manageOpenPosition(currentPrice) {
    const pos = this.activePosition;
    if (!pos) return;

    pos.currentPrice = currentPrice;

    // Calculate PnL in INR based on price difference
    const priceDiff = pos.type === 'BUY'
      ? (currentPrice - pos.entryPrice)
      : (pos.entryPrice - currentPrice);

    // Calculate profit/loss relative to risk
    const slDiff = Math.abs(pos.entryPrice - pos.stopLoss);
    const pointValue = (pos.riskAmount && slDiff > 0)
      ? pos.riskAmount / slDiff
      : 100;
    const calcPnL = Number((priceDiff * pointValue).toFixed(2));
    pos.unrealizedPnL = isNaN(calcPnL) ? 0 : calcPnL;
    const calcPct = Number(((priceDiff / (pos.entryPrice || 1)) * 100).toFixed(2));
    pos.unrealizedPnLPct = isNaN(calcPct) ? 0 : calcPct;

    // A. Check Take Profit (1:2 R:R WIN)
    const isTargetHit = pos.type === 'BUY'
      ? currentPrice >= pos.targetPrice
      : currentPrice <= pos.targetPrice;

    if (isTargetHit) {
      this.closePosition('TARGET_HIT', currentPrice);
      return;
    }

    // B. Check Stop Loss (Strict Risk Gate Protection)
    const isStopLossHit = pos.type === 'BUY'
      ? currentPrice <= pos.stopLoss
      : currentPrice >= pos.stopLoss;

    if (isStopLossHit) {
      this.closePosition('STOP_LOSS_HIT', currentPrice);
      return;
    }

    // C. Trailing Stop Loss to Cost (Break-Even) if up 1:1.2
    if (!pos.isTrailingActive && pos.unrealizedPnL >= (pos.riskAmount * 1.2)) {
      pos.isTrailingActive = true;
      pos.stopLoss = pos.entryPrice; // Move SL to Entry (Free Trade!)
      this.addLog('TRAIL_SL', `🛡️ Trailing Stop Loss moved to Cost (${pos.entryPrice}). Zero risk on this trade!`);
    }
  }

  // Close an active position
  closePosition(reason, exitPrice) {
    const pos = this.activePosition;
    if (!pos) return;

    const priceDiff = pos.type === 'BUY'
      ? (exitPrice - pos.entryPrice)
      : (pos.entryPrice - exitPrice);

    const pointValue = pos.riskAmount / Math.abs(pos.entryPrice - pos.stopLoss);
    const finalPnL = reason === 'TARGET_HIT'
      ? Number(pos.targetProfit.toFixed(2))
      : reason === 'STOP_LOSS_HIT'
      ? Number((-pos.riskAmount).toFixed(2))
      : Number((priceDiff * pointValue).toFixed(2));

    const isWin = finalPnL > 0;

    // Update Wallet
    this.wallet.balance = Number((this.wallet.balance + finalPnL).toFixed(2));
    this.wallet.realizedPnL = Number((this.wallet.realizedPnL + finalPnL).toFixed(2));
    this.wallet.totalTrades += 1;
    if (isWin) this.wallet.winCount += 1;
    else this.wallet.lossCount += 1;

    this.wallet.winRate = Number(((this.wallet.winCount / this.wallet.totalTrades) * 100).toFixed(1));

    const closedTrade = {
      id: pos.id,
      symbol: pos.symbol,
      assetName: pos.assetName,
      type: pos.type,
      entryPrice: pos.entryPrice,
      exitPrice: exitPrice,
      stopLoss: pos.stopLoss,
      targetPrice: pos.targetPrice,
      riskReward: '1:2.0',
      pnl: finalPnL,
      pnlFormatted: finalPnL >= 0 ? `+₹${finalPnL}` : `-₹${Math.abs(finalPnL)}`,
      isWin,
      reason,
      openedAt: pos.openedAt,
      closedAt: new Date().toLocaleTimeString('en-IN', { hour12: false })
    };

    this.tradeHistory.unshift(closedTrade);
    if (this.tradeHistory.length > 100) this.tradeHistory.pop();

    if (isWin) {
      this.addLog('WIN', `🎉 TARGET HIT! Booked +₹${finalPnL} profit on ${pos.symbol} at ${exitPrice}. 1:2 R:R achieved!`);
      this.latestAnnouncement = `Mubarak ho Raj bhai! ${pos.assetName} mein target hit ho gaya aur virtual profit ₹${finalPnL} account mein add ho gaya hai.`;
    } else {
      this.addLog('LOSS', `🛑 Stop Loss Hit at ${exitPrice}. Loss strictly capped at ₹${Math.abs(finalPnL)}. Capital safe.`);
      this.latestAnnouncement = `Raj bhai, ${pos.assetName} mein stop loss trigger hua hai. Hamara risk strictly ₹${Math.abs(finalPnL)} par control raha. Discipline se agla setup dekhenge.`;
    }

    this.activePosition = null;
    this.updateWalletEquity();
    this.saveState();

    // Trigger AI Self-Reflection & Experience Memorization
    try {
      traderMemory.recordTradeExperience(closedTrade, this.geminiCaller)
        .then((pm) => {
          if (pm?.lesson) {
            this.addLog('MEMORY', `🧠 Lesson Memorized: "${pm.lesson.slice(0, 60)}"`);
          }
        })
        .catch((err) => console.warn('Memory postmortem error:', err.message));
    } catch (e) {
      console.warn('Memory trigger error:', e.message);
    }
  }

  // Scan Market & Look for Institutional 1:2 Setups
  scanAndEvaluateMarket(currentPrice) {
    const asset = this.assets[this.activeAssetKey];
    const ema20 = this.calculateEMA(20);
    const rsi = this.calculateRSI(14);

    // Periodic Continuous AI Market Structure Study (~every 3-4 minutes)
    this.cycleCounter = (this.cycleCounter || 0) + 1;
    if (this.cycleCounter % 30 === 0 && this.geminiCaller) {
      this.runMarketStudy(asset, currentPrice, ema20, rsi);
    }

    // Human thought logs
    if (Math.random() < 0.28) {
      this.addLog('MIND', `Watching ${asset.name} at ${currentPrice}. 20 EMA: ${ema20} | RSI: ${rsi}.`);
    }

    // Mathematical Trading Rules (Minervini VCP + 20 EMA Pullback + Risk Gate)
    const riskAmount = Number((this.wallet.balance * this.riskPerTradePct).toFixed(2)); // 1% Risk
    const targetProfit = Number((riskAmount * this.riskRewardRatio).toFixed(2));        // 2x Reward

    // BUY Condition: Price above 20 EMA, RSI between 45 and 65 (Not overbought), Pullback retest
    const isBullishPullback = (currentPrice >= ema20 * 0.998) && (rsi >= 46 && rsi <= 64);
    // SELL Condition: Price below 20 EMA, RSI between 35 and 52
    const isBearishRejection = (currentPrice <= ema20 * 1.002) && (rsi >= 36 && rsi <= 54);

    // Random trigger filter so it doesn't overtrade every second (acts like a patient human)
    const triggerNow = Math.random() < 0.35;

    if (triggerNow && (isBullishPullback || isBearishRejection)) {
      const type = isBullishPullback ? 'BUY' : 'SELL';

      // Experience Check: Verify candidate setup against permanently learned rules
      const ruleCheck = traderMemory.checkSetupAgainstRules({ type, rsi, price: currentPrice, ema20 });
      if (!ruleCheck.allowed) {
        this.addLog('MEMORY_GATE', `🛡️ Setup avoided by Learned Rule: ${ruleCheck.reason}`);
        return;
      }
      this.addLog('KNOWLEDGE', `✅ All ${traderMemory.learnedRules.length} learned rules verified. Risk & structure approved.`);

      const stopDistance = Number((currentPrice * 0.0025).toFixed(asset.decimals)); // ~0.25% stop
      const targetDistance = Number((stopDistance * this.riskRewardRatio).toFixed(asset.decimals));

      const stopLoss = type === 'BUY'
        ? Number((currentPrice - stopDistance).toFixed(asset.decimals))
        : Number((currentPrice + stopDistance).toFixed(asset.decimals));

      const targetPrice = type === 'BUY'
        ? Number((currentPrice + targetDistance).toFixed(asset.decimals))
        : Number((currentPrice - targetDistance).toFixed(asset.decimals));

      this.activePosition = {
        id: `trade_${Date.now()}`,
        symbol: asset.symbol,
        assetName: asset.name,
        type,
        entryPrice: currentPrice,
        currentPrice,
        stopLoss,
        targetPrice,
        riskAmount,
        targetProfit,
        unrealizedPnL: 0,
        unrealizedPnLPct: 0,
        isTrailingActive: false,
        openedAt: new Date().toLocaleTimeString('en-IN', { hour12: false })
      };

      this.addLog(
        'ORDER',
        `🚀 EXECUTED VIRTUAL ${type}: ${asset.name} @ ${currentPrice} | SL: ${stopLoss} | Target: ${targetPrice} (1:2 R:R, Max Risk: ₹${riskAmount})`
      );

      this.latestAnnouncement = `Raj bhai, maine ${asset.name} mein ${currentPrice} par virtual ${type === 'BUY' ? 'Buy' : 'Short'} position open ki hai. Stop loss ${stopLoss} aur target ${targetPrice} rakha hai.`;
      this.saveState();
    }
  }

  // Continuous Market Structure Study via Gemini AI
  async runMarketStudy(asset, price, ema20, rsi) {
    try {
      const prompt = `You are VibeTrader AI actively observing live market price action on ${asset.name}.
Price: ${price}, 20 EMA: ${ema20}, RSI: ${rsi}.
Write 1 brief insight (Hinglish/English, under 20 words) analyzing current institutional pressure, support/resistance, or breakout potential.`;
      const reply = await this.geminiCaller([{ role: 'user', content: prompt }]);
      if (reply) {
        const cleanInsight = reply.replace(/[*_#]/g, '').trim();
        this.addLog('STUDY', `📖 Market Structure Study: ${cleanInsight}`);
        traderMemory.awardXP(10, `Market Structure Study on ${asset.name}`);
      }
    } catch (e) {
      // Ignore network hiccup
    }
  }

  // Update Equity & Drawdown metrics
  updateWalletEquity() {
    const unPnL = (this.activePosition && !isNaN(this.activePosition.unrealizedPnL))
      ? Number(this.activePosition.unrealizedPnL)
      : 0;
    this.wallet.unrealizedPnL = unPnL;
    const balance = !isNaN(this.wallet.balance) ? Number(this.wallet.balance) : 100000;
    this.wallet.balance = balance;
    this.wallet.equity = Number((balance + unPnL).toFixed(2));

    if (!this.wallet.peakEquity || this.wallet.equity > this.wallet.peakEquity) {
      this.wallet.peakEquity = this.wallet.equity;
    }

    if (this.wallet.peakEquity > 0) {
      const dd = ((this.wallet.peakEquity - this.wallet.equity) / this.wallet.peakEquity) * 100;
      if (dd > (this.wallet.maxDrawdownPct || 0)) {
        this.wallet.maxDrawdownPct = Number(dd.toFixed(2));
      }
    }
  }

  // Get full state representation for API
  getState() {
    this.updateWalletEquity();
    const asset = this.assets[this.activeAssetKey];
    return {
      isRunning: this.isRunning,
      activeAsset: {
        key: this.activeAssetKey,
        name: asset?.name || 'Gold',
        symbol: asset?.symbol || 'PAXGUSDT'
      },
      availableAssets: Object.entries(this.assets).map(([key, val]) => ({
        key,
        name: val.name,
        symbol: val.symbol
      })),
      livePrice: this.livePrice,
      wallet: this.wallet,
      activePosition: this.activePosition,
      tradeHistory: this.tradeHistory.slice(0, 30),
      recentLogs: this.logs.slice(0, 25),
      latestAnnouncement: this.latestAnnouncement,
      riskPerTradePct: this.riskPerTradePct,
      riskRewardRatio: this.riskRewardRatio,
      memory: traderMemory.getState()
    };
  }
}

// Global singleton instance
export const autonomousBot = new AutonomousTrader();

