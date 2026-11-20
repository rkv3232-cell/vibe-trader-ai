# VibeTrader AI — Autonomous Quant Paper Trading Bot (Nifty 50 Dedicated)

> ⚠️ **Educational & Research Paper Trading System.** Not financial advice. Virtual simulation only. No real money or live broker trading enabled by default.

An institutional-grade, multi-agent AI paper trading system built for **Indian Equity Benchmark: Nifty 50 Index (`NSE:NIFTY`)**, implementing quantitative architecture inspired by *Alpaca Markets*, *OpenBB Platform*, and *Tauric Research TradingAgents* (arXiv:2412.20138).

---

## 🏛️ 3-Layer Institutional Architecture

```
Market Data (Yahoo ^NSEI 5m)
       │
       ▼
Feature Engine (9 EMA, 20 EMA, RSI-14, Session Timing)
       │
       ▼
AI Signal Generator & Symmetrical Setup Evaluation (Bullish / Bearish)
       │
       ▼
Learned Experience & Risk Gatekeeper (Circuit Breaker & Drawdown Shield)
       │
       ▼
Order Manager & Paper Execution Engine (Idempotency, Realistic Slippage, Brokerage/STT Fees)
       │
       ▼
Dynamic Trailing Engine (Break-Even Lock, Milestone Runners 1:2 to 1:5 R:R)
       │
       ▼
Continuous Self-Reflection & Experience Memorization (XP & Level Progression)
```

---

## 🇮🇳 Trading Specification: Nifty 50 Index (`NIFTY50`)

| Parameter | Specification |
| :--- | :--- |
| **Asset** | Nifty 50 Index (National Stock Exchange of India) |
| **TradingView Symbol** | `NSE:NIFTY` |
| **Data Feed** | Real-time Yahoo Finance (`^NSEI`) 5-minute candles |
| **Execution Horizon** | 5-Minute Intraday Trend & Mean-Reversion |
| **Market Session** | 09:15 AM to 03:30 PM IST (Monday to Friday) |
| **Initial Paper Capital** | ₹1,00,000 INR |
| **Risk per Trade** | 1.0% (Disciplined Mode: ₹1,000) / 5.0% (Turbo 10x Mode: ₹5,000) |
| **Stop Loss Distance** | ~38.0 Points on Nifty |
| **Target Distance** | 1:2.0 to 1:2.5 R:R (~76.0 to ~95.0 Points on Nifty) |
| **Realistic Slippage** | 2.0 to 4.0 points simulated on market fills |
| **Transaction Fees** | ₹40.00 round trip (₹20 buy + ₹20 sell + STT / turnover fees) |
| **Daily Circuit Breaker** | 2 consecutive stop losses (-₹2,000 drawdown) halts trading for the day |

---

## 🛡️ Risk Management & Safety Safeguards

1. **Daily Circuit Breaker**: If 2 full stop losses occur in a single day, the kill switch automatically activates, halting all new executions until the next IST trading day.
2. **Conservative Realistic Modeling**: Every paper trade simulates **2.0–4.0 points slippage** and deducts **₹40.00 round-trip transaction costs** so net PnL reflects real market frictions.
3. **Idempotency Protection**: Every order contains a unique idempotency key (`idemp_${Date.now()}_nifty`) preventing accidental duplicate orders upon network retries.
4. **Order State Machine**: Strict progression tracking: `CREATED` → `VALIDATED` → `SUBMITTED` → `FILLED`.
5. **Dynamic Profit Trailing**:
   - At **+1.2R**, stop loss automatically moves to entry cost (Risk = ₹0, Free Trade).
   - At **+2.0R**, profit is ratcheted and guaranteed at +1.2R, allowing runners to seek 1:3 to 1:5 R:R.
   - At **+3.0R+**, profit locks higher to capture large intraday directional swings.
6. **Continuous AI Memory**: Autonomous post-mortem self-reflection memorizes lessons from winning and losing setups, preventing repeat mistakes.

---

## 🚀 Quickstart

### 1. Clone & Install
```bash
git clone https://github.com/rkv3232-cell/vibe-trader-ai.git
cd vibe-trader-ai
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
GEMINI_API_KEY=your_gemini_api_key
SARVAM_API_KEY=your_sarvam_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
GROQ_API_KEY=your_groq_api_key
PORT=3001
AUTO_START_BOT=true
```

### 3. Build & Run Locally
```bash
# Build Frontend
npm run build

# Start Backend Server & 24/7 Autopilot
npm run server
```

The app will be accessible at `http://localhost:3001`.

---

## 🌐 Production Deployment

- **Hosted URL**: `https://vibe-trader-ai.onrender.com`
- **Auto-deployment**: Continuous deployment via Render upon pushing to `main`.
- **24/7 Keep-Alive**: Background keep-alive service pings `/api/bot/state` every 8 minutes to prevent dyno sleep.

---

## ⚖️ Disclaimer

This software is strictly for educational, scientific research, and paper-trading simulation purposes. Algorithmic trading in financial markets involves substantial risk of financial loss. Never risk money you cannot afford to lose.
