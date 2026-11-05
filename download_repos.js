import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const repos = [
  { name: 'awesome-agentic-trading', url: 'https://github.com/orangejustin/awesome-agentic-trading.git' },
  { name: 'awesome-trading-agents', url: 'https://github.com/LLMQuant/awesome-trading-agents.git' },
  { name: 'awesome-mcp-trading', url: 'https://github.com/EternaHybridExchange/awesome-mcp-trading.git' },
  { name: 'awesome-systematic-trading', url: 'https://github.com/wangzhe3224/awesome-systematic-trading.git' },
  { name: 'awesome-open-source-trading', url: 'https://github.com/WallStreetPete/awesome-open-source-trading.git' },
  { name: 'awesome-finance-agents', url: 'https://github.com/aowang-ai/awesome-finance-agents.git' },
  { name: 'TradingAgents', url: 'https://github.com/TauricResearch/TradingAgents.git' },
  { name: 'ai-hedge-fund', url: 'https://github.com/virattt/ai-hedge-fund.git' },
  { name: 'AI-Trader', url: 'https://github.com/HKUDS/AI-Trader.git' },
  { name: 'finance-trading-ai-agents-mcp', url: 'https://github.com/aitrados/finance-trading-ai-agents-mcp.git' },
  { name: 'alpaca-mcp-server', url: 'https://github.com/alpacahq/alpaca-mcp-server.git' },
  { name: 'tradingview-mcp', url: 'https://github.com/atilaahmettaner/tradingview-mcp.git' },
  { name: 'trade-mcp', url: 'https://github.com/Techie03/trade-mcp.git' },
  { name: 'Equibles', url: 'https://github.com/daniel3303/Equibles.git' },
  { name: 'financial-datasets-mcp', url: 'https://github.com/financial-datasets/mcp-server.git' },
  { name: 'kraken-cli', url: 'https://github.com/krakenfx/kraken-cli.git' },
  { name: 'backtesting.py', url: 'https://github.com/kernc/backtesting.py.git' },
  { name: 'backtrader', url: 'https://github.com/mementum/backtrader.git' },
  { name: 'freqtrade', url: 'https://github.com/freqtrade/freqtrade.git' },
  { name: 'vnpy', url: 'https://github.com/vnpy/vnpy.git' },
  { name: 'trading-strategy', url: 'https://github.com/tradingstrategy-ai/trading-strategy.git' },
  { name: 'claude-trading-skills', url: 'https://github.com/tradermonty/claude-trading-skills.git' },
  { name: 'finance-skills', url: 'https://github.com/himself65/finance-skills.git' },
  { name: 'Awesome-finance-skills', url: 'https://github.com/RKiding/Awesome-finance-skills.git' }
];

const targetDir = path.resolve('repos');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log(`Starting clone of ${repos.length} trading repositories into ${targetDir}...\n`);

for (const repo of repos) {
  const dest = path.join(targetDir, repo.name);
  if (fs.existsSync(dest)) {
    console.log(`[ALREADY EXISTS] ${repo.name}`);
    continue;
  }
  process.stdout.write(`Cloning ${repo.name}... `);
  try {
    execSync(`git clone --depth 1 --quiet "${repo.url}" "${dest}"`, { stdio: 'pipe' });
    console.log('✓ Done');
  } catch (err) {
    console.log('✗ Failed / Private');
  }
}

console.log('\nAll repositories processed!');

