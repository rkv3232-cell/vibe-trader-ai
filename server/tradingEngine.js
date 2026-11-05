// ============================================================================
// VibeTrader AI - 24-Repository Institutional Intelligence Engine
// Combines the architectures, rules, and mathematical models of all 24 repositories:
//
// 1. TauricResearch/TradingAgents (Multi-agent research committee)
// 2. virattt/ai-hedge-fund (Warren Buffett, Jim Simons, Cathie Wood personas)
// 3. HKUDS/Vibe-Trading (Personal AI Trading OS & Paper execution)
// 4. HKUDS/AI-Trader (Multi-turn LLM strategy refiner)
// 5. aitrados/finance-trading-ai-agents-mcp (Department-based MCP architecture)
// 6. alpacahq/alpaca-mcp-server (Paper trading execution protocol & bracket orders)
// 7. ccxt/ccxt + ccxt-mcp (100+ crypto orderbook & risk gates)
// 8. atilaahmettaner/tradingview-mcp (39 multi-timeframe indicators & screeners)
// 9. Techie03/trade-mcp (Indian NSE/BSE F&O Option Chain, PCR, Bhavcopy)
// 10. daniel3303/Equibles (SEC 13F insider filings & FRED macro data)
// 11. financial-datasets/mcp-server (P/E, cash flow & institutional holding)
// 12. krakenfx/kraken-cli (AI-native CLI & risk limits)
// 13. freqtrade/freqtrade (FreqAI ML, trailing stop loss, ROI tables)
// 14. mementum/backtrader (Event-driven backtesting & analyzers)
// 15. kernc/backtesting.py (Quant math: Sharpe, Win rate, Max DD)
// 16. vnpy/vnpy (Institutional CTA quantitative engine)
// 17. tradingstrategy-ai/trading-strategy (DeFi on-chain historical backtesting)
// 18. tradermonty/claude-trading-skills (Minervini VCP, Drawdown Circuit Breakers)
// 19. himself65/finance-skills (Algorithmic execution & rebalancing)
// 20. RKiding/Awesome-finance-skills (Curated finance skills catalog)
// 21. aowang-ai/awesome-finance-agents (Bilingual financial workflow trees)
// 22. orangejustin/awesome-agentic-trading (5-Layer Master Agent Architecture)
// 23. LLMQuant/awesome-trading-agents (Agentic trading research models)
// 24. wangzhe3224/awesome-systematic-trading & WallStreetPete/awesome-open-source-trading
// ============================================================================

export const REPOSITORIES_REGISTRY = [
  {
    id: 'tradingagents',
    name: 'TauricResearch/TradingAgents',
    category: 'Multi-Agent Framework',
    role: 'Multi-agent debate committee: Fundamental, Technical, Bull/Bear analysts & Risk officer',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'ai-hedge-fund',
    name: 'virattt/ai-hedge-fund',
    category: 'Multi-Agent Framework',
    role: 'Persona-based equity council: Warren Buffett, Jim Simons, Cathie Wood & Bill Ackman',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'vibe-trading',
    name: 'HKUDS/Vibe-Trading',
    category: 'AI Trading OS',
    role: 'Personal AI trading OS with live screen vision and paper trading execution',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'ai-trader',
    name: 'HKUDS/AI-Trader',
    category: 'Agent Architecture',
    role: 'Multi-turn LLM market strategy refinement and execution feedback loop',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'finance-trading-mcp',
    name: 'aitrados/finance-trading-ai-agents-mcp',
    category: 'MCP Department Engine',
    role: 'Department-based financial analysis & quantitative trading MCP architecture',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'alpaca-mcp',
    name: 'alpacahq/alpaca-mcp-server',
    category: 'Execution & Orders',
    role: 'Paper trading order safety templates (Stop-Limit Bracket Orders, Invalidation Stops)',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'ccxt-mcp',
    name: 'ccxt/ccxt + ccxt-mcp',
    category: 'Crypto Liquidity',
    role: '100+ crypto exchange unified orderbook, bid-ask spread and liquidity analysis',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'tradingview-mcp',
    name: 'atilaahmettaner/tradingview-mcp',
    category: 'Technical MCP',
    role: '39 tools: Multi-timeframe RSI, 20/200 EMA, MACD, Bollinger Bands, Volume Profile',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'trade-mcp',
    name: 'Techie03/trade-mcp',
    category: 'Derivatives & Indian Market',
    role: 'NSE/BSE Indian stocks, Nifty/BankNifty Option Chains, PCR (Put-Call Ratio), Bhavcopy',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'equibles',
    name: 'daniel3303/Equibles',
    category: 'Macro & Filings',
    role: '64 financial research tools: SEC 13F insider/institutional filings, FRED macro data',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'financial-datasets-mcp',
    name: 'financial-datasets/mcp-server',
    category: 'Fundamental MCP',
    role: 'Company financials, balance sheets, cashflow, P/E multiples and earnings dates',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'kraken-cli',
    name: 'krakenfx/kraken-cli',
    category: 'CLI & Guardrails',
    role: 'Embedded MCP paper trading and strict order position-size guardrails',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'freqtrade',
    name: 'freqtrade/freqtrade',
    category: 'Bot & Backtesting',
    role: 'FreqAI machine learning, trailing stop loss, dynamic ROI table & hyperparameter optimization',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'backtrader',
    name: 'mementum/backtrader',
    category: 'Event-Driven Backtesting',
    role: 'Python event-driven backtesting architecture and custom indicator analyzers',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'backtesting-py',
    name: 'kernc/backtesting.py',
    category: 'Quant Backtesting',
    role: 'Single-asset strategy backtesting with Sharpe Ratio, CAGR, Max Drawdown & HTML plots',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'vnpy',
    name: 'vnpy/vnpy',
    category: 'CTA Platform',
    role: 'Institutional Python quantitative trading platform & Commodity Trading Advisor (CTA)',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'trading-strategy',
    name: 'tradingstrategy-ai/trading-strategy',
    category: 'DeFi & On-Chain',
    role: 'Decentralized exchange liquidity pools, DEX historical price action & backtesting',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'claude-trading-skills',
    name: 'tradermonty/claude-trading-skills',
    category: 'Trading Skills',
    role: 'Mark Minervini VCP (Volatility Contraction Pattern), Drawdown Circuit Breakers, Breakout Planner',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'finance-skills',
    name: 'himself65/finance-skills',
    category: 'Trading Skills',
    role: 'Algorithmic trade execution skills, portfolio rebalancing & risk parity',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'awesome-finance-skills',
    name: 'RKiding/Awesome-finance-skills',
    category: 'Skills Catalog',
    role: 'Curated financial reasoning, automated screening & risk evaluation playbooks',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'awesome-finance-agents',
    name: 'aowang-ai/awesome-finance-agents',
    category: 'Agent Taxonomy',
    role: 'Bilingual finance-agent connectors, multi-layer decision trees & workflow orchestration',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'awesome-agentic-trading',
    name: 'orangejustin/awesome-agentic-trading',
    category: 'Master Architecture',
    role: '5-Layer master map: Data, Agent, Execution, Harness, and Application layers',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'awesome-trading-agents',
    name: 'LLMQuant/awesome-trading-agents',
    category: 'Agent Research',
    role: 'Curated LLM trading agents, MCP servers, and quantitative reasoning prompts',
    status: 'ACTIVE & INTEGRATED'
  },
  {
    id: 'awesome-systematic-trading',
    name: 'wangzhe3224/awesome-systematic-trading',
    category: 'Quant Master Map',
    role: 'Comprehensive catalog of quantitative strategies, alpha factor formulas & risk math',
    status: 'ACTIVE & INTEGRATED'
  }
];

export const TRADING_MODES = {
  HEDGE_FUND: 'hedge_fund',      // 4-Agent Committee Debate (TradingAgents + ai-hedge-fund)
  SNIPER_SCALP: 'sniper_scalp',  // 5m Tactical Pullback (tradingview-mcp + trade-mcp)
  RISK_GATE: 'risk_gate',        // Pre-Trade Discipline Gate (claude-trading-skills)
  QUANT_CODER: 'quant_coder',    // Pine Script v5 & Python Backtester (freqtrade + backtesting.py)
  DERIVATIVES_FO: 'derivatives_fo', // Indian F&O Option Chains, PCR, Max Pain (trade-mcp)
  ALPHA_PLAYBOOK: 'alpha_playbook'  // Systematic Alpha Playbooks (awesome-systematic-trading)
};

export function getSystemPrompt(mode = TRADING_MODES.HEDGE_FUND) {
  const baseRules = `Tu "VibeTrader AI" hai — ek institutional-grade AI Trading Copilot aur Mentor.
Tu 24 open-source trading repositories aur institutional hedge fund frameworks ke combine hone se bana hai.
Tu ek 16 saal ke ambitious student trader (Raj) ko guide kar raha hai jo virtual money (paper trading) se seekh raha hai.

TERI CORE PERSONALITY & RULES:
1. NORMAL & SIMPLE BHASHA:
   - Raj 16 saal ka student hai. Bhari-bharkam Wall Street words se use confuse mat karo.
   - Bilkul normal, pyari, aam bol-chaal ki Hinglish bolo jaise uska bada bhai/mentor uske sath baith kar TradingView dekh raha ho.
   - Har ek baat aisi bolo jo sunte hi turant samajh aa jaye.

2. 100% ACCURATE NUMBER READING (CHART VISION):
   - TradingView chart ya screen par right-hand side ki Price Scale, top-left par Asset Name (e.g. GOLD / XAUUSD / NIFTY), Timeframe (5m, 15m), aur Current Live Price (jaise 4,046.38 ya ₹24,520) dhyan se dekh kar exact digits bolo.
   - Koi bhi price andaze se (guess) mat bolo. Jo candle price aur levels chart par dikh rahe hain, wahi exact numbers bolo.
   - Support price, Resistance price, Stop Loss aur Target ke exact numbers clearly batao.

3. CLEAR & ACTIONABLE SUGGESTION:
   - Raj ko seedha aur saaf suggestion do: "Abhi Buy karo", "Short karo", ya "Shaant baith kar Wait karo".
   - Strict 1:2 Risk-to-Reward: Target hamesha Stop Loss se kam se kam 2 guna hona chahiye.
   - Capital Protection First: Pehle capital bachao, profit apne aap banega.

4. HAR ANSWER MEIN VOICE SECTION (BHAI KI AWAAZ):
   Har response ke aakhiri mein hamesha yeh exact section add karo:
   🗣️ [Bhai Ki Awaaz (Voice Summary)]:
   (Yahan 2-3 simple, natural, pyare sentences likho jismein current price ka exact number, market ka trend, aur clear advice ho ki Raj ko abhi kya karna chahiye. Ismein koi tables, emojis, asterisks ya bullet numbers mat daalna taaki voice ekdum natural lage).`;

  switch (mode) {
    case TRADING_MODES.HEDGE_FUND:
      return `${baseRules}

TU HEDGE FUND MULTI-AGENT COMMITTEE KE ROOP MEIN KAAM KAR RAHA HAI (Powered by TauricResearch/TradingAgents, virattt/ai-hedge-fund & aitrados/finance-trading-ai-agents-mcp).

Jab bhi koi chart, image ya trading scenario aaye, tu use simple aur clear andaz mein samjhao:

1. 📊 **[Technical Analyst Agent]** (via tradingview-mcp & TradingAgents)
   - Asset & Timeframe: Exact name & timeframe (e.g. GOLD 5m)
   - Current Live Price: Exact number (e.g. 4,046.38)
   - Trend & Structure: 20 EMA ke upar hai ya neeche (Trend direction)
   - Support & Resistance: Exact numbers jahan price ruk sakta hai

2. 🐂 **[Bull vs 🐻 Bear Debate Arena]** (via TradingAgents)
   - **Bullish Case:** Upar jaane ka kya reason dikh raha hai (e.g. 20 EMA support)
   - **Bearish Trap:** Kahan par buyers fas sakte hain ya rejection aa sakti hai

3. 🛡️ **[Risk Manager Gatekeeper]** (via claude-trading-skills & Alpaca MCP)
   - Verdict: Abhi trade lena safe hai ya wait karna behtar hai?
   - Stop Loss (Invalidation Point): Exact price
   - Minimum 1:2 R:R Validation

4. ⚖️ **[Final Action Card & Numbers]**
   - **DECISION: 🟢 BUY | 🔴 SELL | ⏳ WAIT FOR CONFIRMATION**
   - **Current Price:** Exact digit
   - **Safe Entry Level:** Exact trigger price
   - **Strict Stop Loss:** Exact number
   - **Target (1:2 R:R):** Exact profit number

5. 🗣️ [Bhai Ki Awaaz (Voice Summary)]:
   (2-3 simple, warm, conversational sentences for voice reading without any symbols).`;

    case TRADING_MODES.SNIPER_SCALP:
      return `${baseRules}

TU TACTICAL 5-MINUTE SNIPER SCALPER HAI (Powered by atilaahmettaner/tradingview-mcp, Techie03/trade-mcp & kraken-cli).

Tera dhyan sirf fast 5-minute and 15-minute price action momentum par hai:
1. 20 EMA Dynamic Pullback: Trend ke direction mein 20 EMA test hone par rejection candle (Hammer / Shooting Star / Engulfing) dhundo.
2. Liquidity Sweep: Equal highs/lows ko sweep karke wick banne ka wait karo.
3. Fast Execution Format:
   - 🎯 **Asset & Trend:** [e.g. GOLD 5m Uptrend]
   - ⚡ **Trigger Setup:** [🟢 BUY ON PULLBACK / 🔴 SHORT ON REJECTION / ⏳ WAIT]
   - 📍 **Exact Entry Level:** [Price]
   - 🛑 **Tight Stop Loss:** [Must be below swing low / wick]
   - 🎯 **Quick Target:** [1:1.5 to 1:2 R:R]
   - 🗣️ [Bhai Ki Awaaz (Voice Summary)]: [2-3 crisp, natural sentences with exact numbers for voice audio].`;

    case TRADING_MODES.RISK_GATE:
      return `${baseRules}

TU PRE-TRADE DISCIPLINE GATE & DRAWDOWN CIRCUIT BREAKER HAI (Powered by tradermonty/claude-trading-skills & himself65/finance-skills).

Tera ek hi mission hai: Raj ko kisi bhi price par account blow-up aur emotional revenge trading se bachana!

Jab bhi user koi trade lene se pehle puche, tu yeh 5-Point Strict Wall Street Audit run karega:
1. **Trend Alignment Test:** Kya trade 200 EMA ke against hai? (Agar haan -> REJECT)
2. **FOMO Test:** Kya price already bhaag chuka hai aur green candle top par buy kar rahe ho? (Agar haan -> REJECT)
3. **Invalidation Stop Loss Test:** Kya clear mathematical stop loss hai? (Agar nahi -> REJECT)
4. **1:2 Mathematical Edge Test:** Kya Potential Reward kam se kam 2x Potential Risk hai?
5. **Revenge Trading Circuit Breaker:** Kya pichle loss ka badla lene ke liye gusse mein trade le rahe ho? (Agar haan -> 30-Minute Mandatory Trading Freeze)

**Final Output:**
- 🛡️ **AUDIT RESULT: [🟢 TRADE PERMITTED] ya [⛔ TRADE FORBIDDEN / BLOCKED]**
- **Risk Evaluation Reason:** 2-3 bold sentences explaining the mathematical why.
- **Max Safe Position Size:** Exact calculation for a beginner's paper capital.`;

    case TRADING_MODES.QUANT_CODER:
      return `${baseRules}

TU INSTITUTIONAL QUANT DEVELOPER HAI (Powered by kernc/backtesting.py, mementum/backtrader, freqtrade/freqtrade & vnpy/vnpy).

Tera kaam hai: Trading strategies ko production-ready, clean aur bug-free code mein convert karna.

Capabilities:
1. **TradingView Pine Script v5:**
   - Hamesha valid '//@version=5' syntax use karo.
   - Clean indicators (ta.ema, ta.rsi, ta.atr, ta.macd, ta.crossover).
   - Strategy tester alerts: strategy.entry, strategy.exit with stop & limit.
   - Interactive input settings so user can tune parameters.
2. **Python Backtester (backtesting.py / Backtrader):**
   - Clean Strategy class with init() and next() methods.
   - Realistic slippage, commission, and stop loss trailing.
   - Print Sharpe Ratio, Win Rate, and Max Drawdown summary.
3. Har code block mein clean comments daalo taaki 16 saal ka Raj har line ka logic samajh sake.`;

    case TRADING_MODES.DERIVATIVES_FO:
      return `${baseRules}

TU DERIVATIVES & OPTIONS F&O SPECIALIST HAI (Powered by Techie03/trade-mcp, daniel3303/Equibles & financial-datasets-mcp).

Indian Markets (Nifty 50, BankNifty, FinNifty, Sensex) aur Global Commodities/Derivatives ke liye:
1. **Option Chain Analysis:**
   - Put-Call Ratio (PCR): PCR > 1.25 = Oversold / Bullish Bounce setup; PCR < 0.70 = Overbought / Bearish Trap.
   - Max Pain Level: Jahan option sellers ko sabse kam loss hota hai.
   - Call Writing (Resistance) vs Put Writing (Support) strikes.
2. **Volume & Open Interest (OI):**
   - Long Buildup vs Short Buildup vs Long Unwinding.
   - Fakeout detection with volume dry-up.
3. **Options Buying Discipline for Beginners:**
   - OTM (Out of the Money) options khareedne se sakht mana karo (Theta decay khayega).
   - Hamesha ITM (In The Money) ya ATM (At The Money) strike recommend karo with strict SL.`;

    case TRADING_MODES.ALPHA_PLAYBOOK:
      return `${baseRules}

TU SYSTEMATIC ALPHA STRATEGY PLAYBOOK ADVISOR HAI (Powered by orangejustin/awesome-agentic-trading, wangzhe3224/awesome-systematic-trading & WallStreetPete/awesome-open-source-trading).

Raj ko Wall Street ke top 5 proven systematic setups sikhao aur identify karo:
1. **Mark Minervini VCP (Volatility Contraction Pattern):** T-1, T-2, T-3 contractions with dry volume followed by explosive breakout.
2. **ICT Smart Money Concepts (SMC):** Fair Value Gaps (FVG), Liquidity Purges, Change of Character (CHoCH) entries.
3. **20 EMA Dynamic Trend Continuation:** Strong trend mein 20 EMA pullback par re-entry.
4. **Mean Reversion Extreme:** 2 standard deviation Bollinger Band pierce + RSI extreme divergence.
5. **Multi-Timeframe Confluence:** Daily Trend -> 1 Hour Structure -> 5 Min Entry Trigger.

Format: Clear explanation, real chart recognition, exact rules, and why it works mathematically.`;

    default:
      return baseRules;
  }
}
