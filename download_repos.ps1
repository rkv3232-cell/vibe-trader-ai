$repos = @(
    @{ name = "awesome-agentic-trading"; url = "https://github.com/orangejustin/awesome-agentic-trading.git" },
    @{ name = "awesome-trading-agents"; url = "https://github.com/LLMQuant/awesome-trading-agents.git" },
    @{ name = "awesome-mcp-trading"; url = "https://github.com/EternaHybridExchange/awesome-mcp-trading.git" },
    @{ name = "awesome-systematic-trading"; url = "https://github.com/wangzhe3224/awesome-systematic-trading.git" },
    @{ name = "awesome-open-source-trading"; url = "https://github.com/WallStreetPete/awesome-open-source-trading.git" },
    @{ name = "awesome-finance-agents"; url = "https://github.com/aowang-ai/awesome-finance-agents.git" },
    @{ name = "TradingAgents"; url = "https://github.com/TauricResearch/TradingAgents.git" },
    @{ name = "ai-hedge-fund"; url = "https://github.com/virattt/ai-hedge-fund.git" },
    @{ name = "AI-Trader"; url = "https://github.com/HKUDS/AI-Trader.git" },
    @{ name = "finance-trading-ai-agents-mcp"; url = "https://github.com/aitrados/finance-trading-ai-agents-mcp.git" },
    @{ name = "alpaca-mcp-server"; url = "https://github.com/alpacahq/alpaca-mcp-server.git" },
    @{ name = "tradingview-mcp"; url = "https://github.com/atilaahmettaner/tradingview-mcp.git" },
    @{ name = "trade-mcp"; url = "https://github.com/Techie03/trade-mcp.git" },
    @{ name = "Equibles"; url = "https://github.com/daniel3303/Equibles.git" },
    @{ name = "financial-datasets-mcp"; url = "https://github.com/financial-datasets/mcp-server.git" },
    @{ name = "kraken-cli"; url = "https://github.com/krakenfx/kraken-cli.git" },
    @{ name = "backtesting.py"; url = "https://github.com/kernc/backtesting.py.git" },
    @{ name = "backtrader"; url = "https://github.com/mementum/backtrader.git" },
    @{ name = "freqtrade"; url = "https://github.com/freqtrade/freqtrade.git" },
    @{ name = "vnpy"; url = "https://github.com/vnpy/vnpy.git" },
    @{ name = "trading-strategy"; url = "https://github.com/tradingstrategy-ai/trading-strategy.git" },
    @{ name = "claude-trading-skills"; url = "https://github.com/tradermonty/claude-trading-skills.git" },
    @{ name = "finance-skills"; url = "https://github.com/himself65/finance-skills.git" },
    @{ name = "Awesome-finance-skills"; url = "https://github.com/RKiding/Awesome-finance-skills.git" }
)

Set-Location "d:\trading lala\repos"

foreach ($repo in $repos) {
    $target = $repo.name
    $url = $repo.url
    if (Test-Path $target) {
        Write-Host "[$target] Already exists. Skipping." -ForegroundColor Yellow
    } else {
        Write-Host "Cloning [$target] from $url..." -ForegroundColor Cyan
        git clone --depth 1 --quiet $url $target
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ [$target] Cloned successfully!" -ForegroundColor Green
        } else {
            Write-Host "✗ [$target] Failed or URL changed." -ForegroundColor Red
        }
    }
}

Write-Host "All repositories processed!" -ForegroundColor Green

