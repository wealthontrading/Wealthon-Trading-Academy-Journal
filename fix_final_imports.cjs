const fs = require('fs');

function ensureImport(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  if (!code.includes('formatINR')) return;
  if (!code.includes("import { formatINR }") && !code.includes("import { calculateMetrics, formatINR }")) {
    if (code.includes("import { estimateIndianCharges } from '../utils/calculations';")) {
      code = code.replace(
        "import { estimateIndianCharges } from '../utils/calculations';",
        "import { estimateIndianCharges, formatINR } from '../utils/calculations';"
      );
    } else {
      code = code.replace(
        "import { StrategyItem, Trade",
        "import { formatINR } from '../utils/calculations';\nimport { StrategyItem, Trade"
      );
      if (!code.includes("import { formatINR }")) {
         // fallback
         code = "import { formatINR } from '../utils/calculations';\n" + code;
      }
    }
    fs.writeFileSync(filepath, code);
  }
}

ensureImport('src/components/StrategyBuilderView.tsx');
ensureImport('src/components/TradeFormModal.tsx');
