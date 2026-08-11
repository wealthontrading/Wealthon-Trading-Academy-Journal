const fs = require('fs');

let code = fs.readFileSync('src/components/TradeHistory.tsx', 'utf8');

if (!code.includes('import { useMarket }')) {
  code = code.replace(
    "import { formatINR } from '../utils/calculations';",
    "import { formatINR } from '../utils/calculations';\nimport { useMarket } from '../contexts/MarketContext';\nimport { SEGMENTS, FOREX_SEGMENTS } from '../data/constants';"
  );
}

if (!code.includes('const { marketType } = useMarket();')) {
  code = code.replace(
    "const [segmentFilter, setSegmentFilter] = useState('ALL');",
    "const { marketType } = useMarket();\n  const currentSegments = marketType === 'Forex' ? FOREX_SEGMENTS : SEGMENTS;\n  const [segmentFilter, setSegmentFilter] = useState('ALL');"
  );
}

const segmentDropdownRegex = /<option value="Options">Options<\/option>[\s\S]*?<option value="Currency">Currency<\/option>/;
if (segmentDropdownRegex.test(code)) {
  code = code.replace(
    segmentDropdownRegex,
    "{currentSegments.map(s => (<option key={s} value={s}>{s}</option>))}"
  );
}

fs.writeFileSync('src/components/TradeHistory.tsx', code);
