const fs = require('fs');
let code = fs.readFileSync('src/data/constants.ts', 'utf8');

if (!code.includes('FOREX_SEGMENTS')) {
  code = code.replace(
    "export const SEGMENTS: Segment[] = [",
    "export const FOREX_SEGMENTS: Segment[] = [\n  'Forex',\n  'Crypto',\n  'Indices'\n];\n\nexport const SEGMENTS: Segment[] = ["
  );
}

if (!code.includes('FOREX_SYMBOLS')) {
  code = code.replace(
    "export const INDICES_AND_SYMBOLS = [",
    "export const FOREX_SYMBOLS = [\n  'EUR/USD',\n  'GBP/USD',\n  'USD/JPY',\n  'XAU/USD (Gold)',\n  'XAG/USD (Silver)',\n  'BTC/USD',\n  'ETH/USD',\n  'US30',\n  'NAS100',\n  'Custom'\n];\n\nexport const INDICES_AND_SYMBOLS = ["
  );
}

fs.writeFileSync('src/data/constants.ts', code);
