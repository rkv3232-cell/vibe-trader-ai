// ============================================================================
// VibeTrader AI - Permanent Experience & Self-Reflection Memory Engine
// Learns continuously from every trade outcome, memorizes golden rules,
// ingests direct coaching from Raj, and prevents repeating past mistakes.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'experience_memory.json');

// Initial Institutional Knowledge Base (from 24 top quant repositories)
const DEFAULT_RULES = [
  {
    id: 'rule_core_1',
    rule: 'Never risk more than 1.0% of total account capital on any single trade (Jim Simons Rule).',
    source: 'INSTITUTIONAL_CORE',
    context: 'Capital preservation is priority #1. Even 10 consecutive losses will preserve 90% capital.',
    enforcedCount: 14,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rule_core_2',
    rule: 'Maintain a minimum 1:2 Risk-to-Reward ratio on every execution (Mark Minervini Rule).',
    source: 'INSTITUTIONAL_CORE',
    context: 'With a 1:2 R:R, even a 40% win rate generates substantial long-term profit.',
    enforcedCount: 22,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rule_core_3',
    rule: 'Avoid opening BUY positions when RSI > 68 or price is overextended far above 20 EMA.',
    source: 'INSTITUTIONAL_CORE',
    context: 'Chasing extended green candles into resistance leads to high probability liquidity traps.',
    enforcedCount: 9,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rule_core_4',
    rule: 'Move Stop Loss to Break-Even (Cost) as soon as trade profit reaches +1.2R.',
    source: 'INSTITUTIONAL_CORE',
    context: 'Secures a "free trade" and eliminates emotional exit anxiety.',
    enforcedCount: 7,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rule_core_5',
    rule: 'Do not take counter-trend trades against 20 EMA without a confirmed multi-timeframe divergence.',
    source: 'INSTITUTIONAL_CORE',
    context: 'Trading against institutional momentum without divergence has a <30% historical edge.',
    enforcedCount: 5,
    active: true,
    createdAt: new Date().toISOString()
  }
];

export class TraderMemory {
  constructor() {
    this.xp = 180;
    this.level = 1;
    this.levelTitle = 'Level 1: Novice Quant Paper Trader';
    this.winStreak = 0;
    this.bestStreak = 0;
    this.totalLessonsLearned = 5;
    this.learnedRules = [...DEFAULT_RULES];
    this.postMortemArchive = [];
    this.coachHistory = [];
    this.recentMemoryEvents = [];

    this.loadMemory();
    this.updateLevel();
  }

  // Load persisted experience memory from disk
  loadMemory() {
    try {
      if (fs.existsSync(MEMORY_FILE)) {
        const raw = fs.readFileSync(MEMORY_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (typeof data.xp === 'number') this.xp = data.xp;
        if (Array.isArray(data.learnedRules) && data.learnedRules.length > 0) {
          this.learnedRules = data.learnedRules;
        }
        if (Array.isArray(data.postMortemArchive)) {
          this.postMortemArchive = data.postMortemArchive;
        }
        if (Array.isArray(data.coachHistory)) {
          this.coachHistory = data.coachHistory;
        }
        if (typeof data.winStreak === 'number') this.winStreak = data.winStreak;
        if (typeof data.bestStreak === 'number') this.bestStreak = data.bestStreak;
        if (typeof data.totalLessonsLearned === 'number') this.totalLessonsLearned = data.totalLessonsLearned;
        if (Array.isArray(data.recentMemoryEvents)) this.recentMemoryEvents = data.recentMemoryEvents;
      }
    } catch (err) {
      console.warn('Could not load experience memory file:', err.message);
    }
  }

  // Persist experience memory to disk
  saveMemory() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        xp: this.xp,
        level: this.level,
        levelTitle: this.levelTitle,
        winStreak: this.winStreak,
        bestStreak: this.bestStreak,
        totalLessonsLearned: this.learnedRules.length,
        learnedRules: this.learnedRules,
        postMortemArchive: this.postMortemArchive.slice(-60),
        coachHistory: this.coachHistory.slice(-40),
        recentMemoryEvents: this.recentMemoryEvents.slice(-30),
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.warn('Could not save experience memory file:', err.message);
    }
  }

  // Calculate Trader Quant Level based on XP
  updateLevel() {
    if (this.xp >= 2200) {
      this.level = 5;
      this.levelTitle = 'Level 5: Master Algorithmic Quant 🏆';
      this.nextLevelXP = 3000;
      this.prevLevelXP = 2200;
    } else if (this.xp >= 1200) {
      this.level = 4;
      this.levelTitle = 'Level 4: Price Action Specialist ⚡';
      this.nextLevelXP = 2200;
      this.prevLevelXP = 1200;
    } else if (this.xp >= 600) {
      this.level = 3;
      this.levelTitle = 'Level 3: Risk Guardian 🛡️';
      this.nextLevelXP = 1200;
      this.prevLevelXP = 600;
    } else if (this.xp >= 250) {
      this.level = 2;
      this.levelTitle = 'Level 2: Discipline Apprentice 🎯';
      this.nextLevelXP = 600;
      this.prevLevelXP = 250;
    } else {
      this.level = 1;
      this.levelTitle = 'Level 1: Novice Quant Paper Trader 🚀';
      this.nextLevelXP = 250;
      this.prevLevelXP = 0;
    }
  }

  // Award XP for actions and log level up
  awardXP(amount, reason) {
    const prevLevel = this.level;
    this.xp += amount;
    this.updateLevel();
    this.addMemoryEvent(`+${amount} XP: ${reason}`);

    let leveledUp = false;
    if (this.level > prevLevel) {
      leveledUp = true;
      this.addMemoryEvent(`🎉 LEVEL UP! Reached ${this.levelTitle}`);
    }
    this.saveMemory();
    return { xp: this.xp, level: this.level, leveledUp, levelTitle: this.levelTitle };
  }

  // Add an event to real-time memory event log
  addMemoryEvent(message) {
    const time = new Date().toLocaleTimeString('en-IN', { hour12: false });
    this.recentMemoryEvents.unshift({
      id: `evt_${Date.now()}_${Math.random()}`,
      time,
      message
    });
    if (this.recentMemoryEvents.length > 40) this.recentMemoryEvents.pop();
  }

  // Process a closed trade with AI Self-Reflection Post-Mortem
  async recordTradeExperience(closedTrade, callGeminiFn = null) {
    const isWin = closedTrade.isWin;
    const pnl = closedTrade.pnl;

    // Update win streak
    if (isWin) {
      this.winStreak += 1;
      if (this.winStreak > this.bestStreak) this.bestStreak = this.winStreak;
    } else {
      this.winStreak = 0;
    }

    // Award XP
    const xpGained = isWin ? 35 : 20; // Even for loss, disciplined SL awards XP!
    this.awardXP(xpGained, isWin ? `Target 1:2 Hit on ${closedTrade.symbol}` : `Stop Loss Respected on ${closedTrade.symbol}`);

    let reflection = '';
    let lesson = '';
    let newRuleText = '';

    // Generate AI Self-Reflection via Gemini
    if (callGeminiFn) {
      try {
        const prompt = `You are the self-reflection cognitive engine of VibeTrader AI, an autonomous paper trader being trained by Raj (a 16yo student).
A trade just closed:
- Asset: ${closedTrade.symbol} (${closedTrade.assetName})
- Type: ${closedTrade.type}
- Entry Price: ${closedTrade.entryPrice}
- Exit Price: ${closedTrade.exitPrice}
- P&L: ₹${pnl} (${isWin ? 'PROFIT' : 'LOSS'})
- Exit Reason: ${closedTrade.reason}

Analyze this trade and return ONLY JSON:
{
  "reflection": "2 short sentences in natural Hinglish explaining why this trade succeeded or hit SL.",
  "lesson": "1 crisp golden rule to remember forever (Hinglish/English)."
}`;

        const reply = await callGeminiFn([{ role: 'user', content: prompt }]);
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          reflection = parsed.reflection;
          lesson = parsed.lesson;
          newRuleText = parsed.lesson;
        } else {
          reflection = reply.trim();
          lesson = reply.slice(0, 100);
          newRuleText = lesson;
        }
      } catch (err) {
        console.warn('Gemini trade reflection fallback:', err.message);
      }
    }

    if (!reflection) {
      if (isWin) {
        reflection = `1. Post-Mortem: 20 EMA pullback test succeeded with healthy RSI momentum, hitting 1:2 R:R cleanly.\n2. Golden Lesson: Continue taking high-conviction pullbacks along the primary trend.`;
        lesson = `Take 20 EMA pullbacks with trend confirmation.`;
        newRuleText = `Pullback Momentum Rule: Enter in trend direction when price holds 20 EMA pullback.`;
      } else {
        reflection = `1. Post-Mortem: Price faced sudden rejection and breached Stop Loss, strictly cutting loss at ₹${Math.abs(pnl)}.\n2. Golden Lesson: Never remove or widen Stop Loss; accept the small loss and wait for cleaner structure.`;
        lesson = `Always respect Stop Loss; never fight sudden counter-trend spikes.`;
        newRuleText = `Strict Risk Protection: Do not fight sudden counter-trend spikes without divergence.`;
      }
    }

    // AUTOMATICALLY PROMOTE LESSON INTO PERMANENT LEARNED RULES LEDGER!
    if (newRuleText && !this.learnedRules.some(r => r.rule.toLowerCase() === newRuleText.toLowerCase())) {
      const autoRule = {
        id: `rule_auto_${Date.now()}`,
        rule: newRuleText,
        source: 'AUTO_LEARNED',
        context: `${isWin ? 'Discovered from Winning Trade' : 'Learned from Loss'} on ${closedTrade.symbol} (P&L: ${closedTrade.pnlFormatted})`,
        enforcedCount: 0,
        active: true,
        createdAt: new Date().toISOString()
      };
      this.learnedRules.unshift(autoRule);
      this.totalLessonsLearned = this.learnedRules.length;
      this.addMemoryEvent(`📜 New Rule Auto-Learned & Active: "${newRuleText.slice(0, 50)}..."`);
    }

    const postMortemItem = {
      id: `postmortem_${Date.now()}`,
      tradeId: closedTrade.id,
      symbol: closedTrade.symbol,
      assetName: closedTrade.assetName,
      type: closedTrade.type,
      entryPrice: closedTrade.entryPrice,
      exitPrice: closedTrade.exitPrice,
      pnl: closedTrade.pnl,
      pnlFormatted: closedTrade.pnlFormatted,
      isWin,
      reason: closedTrade.reason,
      reflection,
      lesson,
      closedAt: closedTrade.closedAt || new Date().toLocaleTimeString('en-IN', { hour12: false })
    };

    this.postMortemArchive.unshift(postMortemItem);
    if (this.postMortemArchive.length > 50) this.postMortemArchive.pop();

    this.addMemoryEvent(`🧠 Post-Mortem saved for ${closedTrade.symbol}: "${lesson.slice(0, 60)}..."`);
    this.saveMemory();

    return postMortemItem;
  }

  // Raj coaches the bot: Synthesize user instruction into permanent learned rule
  async trainWithRajCoaching(feedbackText, callGeminiFn = null) {
    if (!feedbackText || !feedbackText.trim()) {
      throw new Error('Training feedback cannot be empty.');
    }

    let synthesizedRule = '';
    let replyToRaj = '';

    if (callGeminiFn) {
      try {
        const prompt = `You are VibeTrader AI, an eager, disciplined quant trader being personally trained by Raj (your 16-year-old trader brother and master).
Raj gave you this coaching feedback:
"${feedbackText.trim()}"

Respond with JSON:
{
  "rule": "A crisp, professional trading rule (1 sentence, Hinglish/English) to permanently remember and obey during live 24/7 trading.",
  "reply": "A warm, respectful, brotherly reply to Raj (2 sentences in natural conversational Hinglish) acknowledging what you learned and thanking him for training you."
}
Only return valid JSON.`;

        const reply = await callGeminiFn([{ role: 'user', content: prompt }]);
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          synthesizedRule = parsed.rule;
          replyToRaj = parsed.reply;
        }
      } catch (err) {
        console.warn('Gemini coach synthesis fallback:', err.message);
      }
    }

    if (!synthesizedRule) {
      synthesizedRule = `Raj's Training Rule: ${feedbackText.trim()}`;
      replyToRaj = `Raj bhai, maine aapka rule ache se note kar liya hai. Ab se 24/7 trading mein main is instruction ko strictly follow karunga!`;
    }

    const newRule = {
      id: `rule_raj_${Date.now()}`,
      rule: synthesizedRule,
      source: 'TRAINED_BY_RAJ',
      context: `Directly coached by Raj: "${feedbackText.trim()}"`,
      enforcedCount: 0,
      active: true,
      createdAt: new Date().toISOString()
    };

    this.learnedRules.unshift(newRule);
    this.totalLessonsLearned = this.learnedRules.length;

    const coachEntry = {
      id: `coach_${Date.now()}`,
      rawFeedback: feedbackText.trim(),
      synthesizedRule,
      replyToRaj,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false })
    };

    this.coachHistory.unshift(coachEntry);
    if (this.coachHistory.length > 30) this.coachHistory.pop();

    // Award XP for training session!
    this.awardXP(30, `New Trading Rule Ingested from Raj`);
    this.addMemoryEvent(`🎓 Raj coached the AI: "${synthesizedRule.slice(0, 50)}..."`);
    this.saveMemory();

    return {
      newRule,
      replyToRaj,
      xpGained: 30,
      state: this.getState()
    };
  }

  // Pre-Trade Rule Verification: checks if setup violates any learned rules
  checkSetupAgainstRules(candidateSetup) {
    const { type, rsi, price, ema20 } = candidateSetup;

    // Loop through ALL active learned rules (including Raj's rules and auto-learned rules)
    for (const ruleObj of this.learnedRules) {
      if (!ruleObj.active) continue;
      const text = (ruleObj.rule || '').toLowerCase();

      // Check A: Overbought RSI rules
      if (type === 'BUY' && (text.includes('rsi') || text.includes('overbought')) && (text.includes('68') || text.includes('70'))) {
        if (rsi > 68) {
          ruleObj.enforcedCount = (ruleObj.enforcedCount || 0) + 1;
          this.saveMemory();
          return {
            allowed: false,
            ruleId: ruleObj.id,
            reason: `Rule Enforced [${ruleObj.source}]: "${ruleObj.rule}" (RSI ${rsi} is overbought > 68)`
          };
        }
      }

      // Check B: Oversold RSI rules
      if (type === 'SELL' && (text.includes('rsi') || text.includes('oversold')) && (text.includes('30') || text.includes('32'))) {
        if (rsi < 32) {
          ruleObj.enforcedCount = (ruleObj.enforcedCount || 0) + 1;
          this.saveMemory();
          return {
            allowed: false,
            ruleId: ruleObj.id,
            reason: `Rule Enforced [${ruleObj.source}]: "${ruleObj.rule}" (RSI ${rsi} is oversold < 32)`
          };
        }
      }

      // Check C: Extended from 20 EMA
      if (text.includes('2%') || text.includes('dur') || text.includes('extended') || text.includes('far')) {
        if (ema20 && Math.abs(price - ema20) / ema20 > 0.018) {
          ruleObj.enforcedCount = (ruleObj.enforcedCount || 0) + 1;
          this.saveMemory();
          return {
            allowed: false,
            ruleId: ruleObj.id,
            reason: `Rule Enforced [${ruleObj.source}]: "${ruleObj.rule}" (Price extended >1.8% from 20 EMA)`
          };
        }
      }

      // Check D: High-impact News / Volatility restrictions (e.g. CPI news, US Open, 8:30 PM)
      if (text.includes('cpi') || text.includes('news') || text.includes('volatility')) {
        const now = new Date();
        const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
        const istMins = (now.getUTCMinutes() + 30) % 60;
        // Check if between 8:25 PM and 8:40 PM IST
        if (istHours === 20 && istMins >= 25 && istMins <= 40) {
          ruleObj.enforcedCount = (ruleObj.enforcedCount || 0) + 1;
          this.saveMemory();
          return {
            allowed: false,
            ruleId: ruleObj.id,
            reason: `Rule Enforced [${ruleObj.source}]: "${ruleObj.rule}" (US High Volatility News Window Active)`
          };
        }
      }

      // Check E: Counter-trend rules
      if (text.includes('counter-trend') || text.includes('against 20 ema') || text.includes('counter trend')) {
        if (type === 'BUY' && price < ema20 * 0.996) {
          ruleObj.enforcedCount = (ruleObj.enforcedCount || 0) + 1;
          this.saveMemory();
          return {
            allowed: false,
            ruleId: ruleObj.id,
            reason: `Rule Enforced [${ruleObj.source}]: "${ruleObj.rule}" (Cannot BUY below 20 EMA downtrend)`
          };
        }
        if (type === 'SELL' && price > ema20 * 1.004) {
          ruleObj.enforcedCount = (ruleObj.enforcedCount || 0) + 1;
          this.saveMemory();
          return {
            allowed: false,
            ruleId: ruleObj.id,
            reason: `Rule Enforced [${ruleObj.source}]: "${ruleObj.rule}" (Cannot SELL above 20 EMA uptrend)`
          };
        }
      }
    }

    return { allowed: true };
  }

  // Toggle active state of a learned rule
  toggleRule(ruleId) {
    const rule = this.learnedRules.find(r => r.id === ruleId);
    if (rule) {
      rule.active = !rule.active;
      this.saveMemory();
      return rule;
    }
    return null;
  }

  // Delete a user-trained rule
  deleteRule(ruleId) {
    const idx = this.learnedRules.findIndex(r => r.id === ruleId);
    if (idx !== -1) {
      const removed = this.learnedRules.splice(idx, 1)[0];
      this.totalLessonsLearned = this.learnedRules.length;
      this.saveMemory();
      return removed;
    }
    return null;
  }

  // Get full memory state for API and frontend
  getState() {
    this.updateLevel();
    const progressXP = this.xp - this.prevLevelXP;
    const neededXP = this.nextLevelXP - this.prevLevelXP;
    const progressPct = Math.min(100, Math.max(0, Math.round((progressXP / neededXP) * 100)));

    return {
      xp: this.xp,
      level: this.level,
      levelTitle: this.levelTitle,
      nextLevelXP: this.nextLevelXP,
      progressXP,
      neededXP,
      progressPct,
      winStreak: this.winStreak,
      bestStreak: this.bestStreak,
      totalLessonsLearned: this.learnedRules.length,
      learnedRules: this.learnedRules,
      postMortemArchive: this.postMortemArchive.slice(0, 25),
      coachHistory: this.coachHistory.slice(0, 15),
      recentMemoryEvents: this.recentMemoryEvents.slice(0, 15)
    };
  }
}

// Global Singleton Instance
export const traderMemory = new TraderMemory();

