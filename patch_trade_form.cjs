const fs = require('fs');
let code = fs.readFileSync('src/components/TradeFormModal.tsx', 'utf8');

if (!code.includes('import { useMarket }')) {
  code = code.replace(
    "import { EMOTIONS, INDICES_AND_SYMBOLS, SEGMENTS } from '../data/constants';",
    "import { EMOTIONS, INDICES_AND_SYMBOLS, SEGMENTS, FOREX_SEGMENTS, FOREX_SYMBOLS } from '../data/constants';\nimport { useMarket } from '../contexts/MarketContext';"
  );
}

if (!code.includes('const { marketType } = useMarket();')) {
  code = code.replace(
    "const todayStr = new Date().toISOString().split('T')[0];",
    "const { marketType } = useMarket();\n  const todayStr = new Date().toISOString().split('T')[0];\n  const currentSegments = marketType === 'Forex' ? FOREX_SEGMENTS : SEGMENTS;\n  const currentSymbols = marketType === 'Forex' ? FOREX_SYMBOLS : INDICES_AND_SYMBOLS;"
  );
}

code = code.replace(
  "{SEGMENTS.map((s) => (",
  "{currentSegments.map((s) => ("
);

code = code.replace(
  "{INDICES_AND_SYMBOLS.map((i) => (",
  "{currentSymbols.map((i) => ("
);

fs.writeFileSync('src/components/TradeFormModal.tsx', code);
