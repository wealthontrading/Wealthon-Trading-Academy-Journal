const fs = require('fs');

function addCurrencySymbol(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  if (code.includes('currencySymbol') && !code.includes('const { currencySymbol }')) {
    if (code.includes('const { marketType } = useMarket();')) {
      code = code.replace(
        "const { marketType } = useMarket();",
        "const { marketType, currencySymbol } = useMarket();"
      );
    } else {
      // Find where we can insert it.
      // Usually right after component definition
      const regex = /export const \w+: React\.FC<.*> = \([^)]*\) => {/;
      const match = code.match(regex);
      if (match) {
        code = code.replace(match[0], match[0] + "\n  const { currencySymbol } = useMarket();");
        if (!code.includes("useMarket")) {
          code = "import { useMarket } from '../contexts/MarketContext';\n" + code;
        }
      }
    }
    fs.writeFileSync(filepath, code);
  }
}

addCurrencySymbol('src/components/ExecutionModePerformanceTable.tsx');
addCurrencySymbol('src/components/StrategyBuilderView.tsx');
addCurrencySymbol('src/components/TradeFormModal.tsx');
addCurrencySymbol('src/components/TradeHistory.tsx');
addCurrencySymbol('src/components/AnalyticsView.tsx');

// Fix calculations.ts export
let calc = fs.readFileSync('src/utils/calculations.ts', 'utf8');
calc = calc.replace("let globalMarketType: 'Indian' | 'Forex' = 'Indian';", "export let globalMarketType: 'Indian' | 'Forex' = 'Indian';");
fs.writeFileSync('src/utils/calculations.ts', calc);

// Fix GoalToastNotification.tsx
let goal = fs.readFileSync('src/components/GoalToastNotification.tsx', 'utf8');
goal = goal.replace(/unit === '₹'/g, "unit === 'Currency'");
fs.writeFileSync('src/components/GoalToastNotification.tsx', goal);

// Fix JournalNotesView.tsx unit state initialization
let journal = fs.readFileSync('src/components/JournalNotesView.tsx', 'utf8');
journal = journal.replace(/useState<TradingGoal\['unit'\]>\('₹'\)/g, "useState<TradingGoal['unit']>('Currency')");
fs.writeFileSync('src/components/JournalNotesView.tsx', journal);

