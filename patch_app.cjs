const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('import { useMarket }')) {
  code = code.replace(
    "import { calculateMetrics } from './utils/calculations';",
    "import { calculateMetrics } from './utils/calculations';\nimport { useMarket } from './contexts/MarketContext';\nimport { FOREX_SEGMENTS } from './data/constants';"
  );
}

if (!code.includes('const { marketType } = useMarket();')) {
  code = code.replace(
    "const metrics = useMemo(() => calculateMetrics(trades), [trades]);",
    "const { marketType } = useMarket();\n  const displayedTrades = useMemo(() => {\n    return trades.filter(t => {\n      const isForex = FOREX_SEGMENTS.includes(t.segment as any);\n      return marketType === 'Forex' ? isForex : !isForex;\n    });\n  }, [trades, marketType]);\n\n  const metrics = useMemo(() => calculateMetrics(displayedTrades), [displayedTrades]);"
  );
  
  // Replace references to `trades={trades}` with `trades={displayedTrades}` in components that should only see current market trades
  // Let's replace trades={trades} with trades={displayedTrades} where appropriate
  // We should do it carefully.
  code = code.replace(/<TradeHistory\s+trades=\{trades\}/g, '<TradeHistory trades={displayedTrades}');
  code = code.replace(/<AnalyticsView\s+trades=\{trades\}/g, '<AnalyticsView trades={displayedTrades}');
  code = code.replace(/<DashboardStats\s+metrics=\{metrics\}\s+trades=\{trades\}/g, '<DashboardStats metrics={metrics} trades={displayedTrades}');
  code = code.replace(/<AITradingAssistantView\s+trades=\{trades\}/g, '<AITradingAssistantView trades={displayedTrades}');
}

fs.writeFileSync('src/App.tsx', code);
