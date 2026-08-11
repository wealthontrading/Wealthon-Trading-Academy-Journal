const fs = require('fs');

['src/components/ExecutionModePerformanceTable.tsx', 'src/components/StrategyBuilderView.tsx'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes("import { useMarket }")) {
    code = "import { useMarket } from '../contexts/MarketContext';\n" + code;
    fs.writeFileSync(file, code);
  }
});
