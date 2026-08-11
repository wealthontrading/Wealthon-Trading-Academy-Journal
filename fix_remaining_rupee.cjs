const fs = require('fs');

function replaceFile(path, replacer) {
  if (fs.existsSync(path)) {
    let code = fs.readFileSync(path, 'utf8');
    let newCode = replacer(code);
    if (code !== newCode) {
      fs.writeFileSync(path, newCode);
      console.log(`Updated ${path}`);
    }
  }
}

// 1. TradeFormModal.tsx
replaceFile('src/components/TradeFormModal.tsx', (code) => {
  let res = code;
  res = res.replace("const [strikeVal, setStrikeVal] = useState('25000');", "const [strikeVal, setStrikeVal] = useState('');");
  // Fix the "Total Charges: ₹"
  res = res.replace("Total Charges: ₹", "Total Charges: {currencySymbol}");
  // Fix "Entry Price (₹)"
  res = res.replace(/Entry Price \(₹\)/g, "Entry Price ({currencySymbol})");
  res = res.replace(/Exit Price \(₹\)/g, "Exit Price ({currencySymbol})");
  res = res.replace(/Total Brokerage \(₹\)/g, "Total Brokerage ({currencySymbol})");
  res = res.replace(/Total GST & STT \(₹\)/g, "Total GST & STT ({currencySymbol})");
  res = res.replace(/Other Total Charges \(₹\)/g, "Other Total Charges ({currencySymbol})");
  res = res.replace(/>₹\{weightedAvgEntry\.toFixed\(2\)\}/g, ">{currencySymbol}{weightedAvgEntry.toFixed(2)}");
  res = res.replace(/>₹\{weightedAvgExit\.toFixed\(2\)\}/g, ">{currencySymbol}{weightedAvgExit.toFixed(2)}");
  return res;
});

// 2. ExecutionModePerformanceTable.tsx
replaceFile('src/components/ExecutionModePerformanceTable.tsx', (code) => {
  let res = code;
  if (!res.includes("useMarket")) {
    res = res.replace("import { ExecutionModeAnalytics", "import { useMarket } from '../contexts/MarketContext';\nimport { ExecutionModeAnalytics");
    res = res.replace(
      "export const ExecutionModePerformanceTable: React.FC<ExecutionModePerformanceTableProps> = ({ modes, totalTrades, totalNetPnL, totalChargesAll }) => {",
      "export const ExecutionModePerformanceTable: React.FC<ExecutionModePerformanceTableProps> = ({ modes, totalTrades, totalNetPnL, totalChargesAll }) => {\n  const { currencySymbol } = useMarket();\n"
    );
  }
  res = res.replace(/}₹\{/g, "}{currencySymbol}{");
  res = res.replace(/>₹\{/g, ">{currencySymbol}{");
  res = res.replace(/Charges \(₹\)/g, "Charges ({currencySymbol})");
  res = res.replace(/Gross P&L \(₹\)/g, "Gross P&L ({currencySymbol})");
  res = res.replace(/Net P&L \(₹\)/g, "Net P&L ({currencySymbol})");
  return res;
});

// 3. TradeHistory.tsx
replaceFile('src/components/TradeHistory.tsx', (code) => {
  let res = code;
  res = res.replace(/>₹\{t\.entryPrice\}</g, ">{currencySymbol}{t.entryPrice}<");
  res = res.replace(/>₹\{t\.exitPrice\}</g, ">{currencySymbol}{t.exitPrice}<");
  res = res.replace(/>₹\{t\.grossPnL\}</g, ">{currencySymbol}{t.grossPnL}<");
  res = res.replace(/>₹\{t\.brokerage\}</g, ">{currencySymbol}{t.brokerage}<");
  res = res.replace(/>₹\{t\.taxes\}</g, ">{currencySymbol}{t.taxes}<");
  res = res.replace(/>₹\{t\.netPnL\}</g, ">{currencySymbol}{t.netPnL}<");
  return res;
});

// 4. StrategyBuilderView.tsx
replaceFile('src/components/StrategyBuilderView.tsx', (code) => {
  let res = code;
  res = res.replace(/Net P&L \(₹\)/g, "Net P&L ({currencySymbol})");
  res = res.replace(/Performance \(₹\)/g, "Performance ({currencySymbol})");
  res = res.replace(/>₹\{compareData\.stratA\.stats\.expectancy\}</g, ">{currencySymbol}{compareData.stratA.stats.expectancy}<");
  res = res.replace(/>\+₹\{/g, ">+{currencySymbol}{");
  res = res.replace(/ -₹\{/g, " -{currencySymbol}{");
  res = res.replace(/>₹\{compareData\.stratB\.stats\.expectancy\}</g, ">{currencySymbol}{compareData.stratB.stats.expectancy}<");
  return res;
});

// 5. JournalNotesView.tsx
replaceFile('src/components/JournalNotesView.tsx', (code) => {
  let res = code;
  res = res.replace(/unit === '₹'/g, "unit === 'Currency'");
  res = res.replace(/unit: '₹'/g, "unit: 'Currency'");
  res = res.replace(/<option value="₹">/g, '<option value="Currency">');
  res = res.replace(/\? `₹\$\{/g, "? `${currencySymbol}${");
  return res;
});

// 6. data/constants.ts
replaceFile('src/data/constants.ts', (code) => {
  let res = code;
  res = res.replace(/unit: '₹' as const/g, "unit: 'Currency' as const");
  return res;
});

// 7. types.ts
replaceFile('src/types.ts', (code) => {
  let res = code;
  res = res.replace(/unit: '₹' \|/g, "unit: 'Currency' |");
  return res;
});

// 8. export.ts
replaceFile('src/utils/export.ts', (code) => {
  let res = code;
  res = res.replace(/\(₹\)/g, "($/₹)");
  res = res.replace(/₹\$\{/g, "${currencySymbol}${");
  if (!res.includes("globalMarketType")) {
    res = res.replace("import { Trade } from '../types';", "import { Trade } from '../types';\nimport { globalMarketType } from './calculations';");
    res = res.replace(
      "export const generatePDFReport = (",
      "export const generatePDFReport = (\n"
    );
    // Actually, currencySymbol inside export.ts can be derived from globalMarketType
    res = res.replace(
      "const margin = 14;",
      "const currencySymbol = globalMarketType === 'Forex' ? '$' : '₹';\n  const margin = 14;"
    );
    res = res.replace(
      "const headers = ['Date', 'Symbol', 'Side', 'Qty', 'Entry ($/₹)', 'Exit ($/₹)', 'Gross P&L ($/₹)', 'Net P&L ($/₹)'];",
      "const headers = ['Date', 'Symbol', 'Side', 'Qty', `Entry (${currencySymbol})`, `Exit (${currencySymbol})`, `Gross P&L (${currencySymbol})`, `Net P&L (${currencySymbol})`];"
    );
  }
  return res;
});

