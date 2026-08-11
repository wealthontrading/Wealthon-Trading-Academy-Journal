const fs = require('fs');

function replaceWithFormatINR(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');

  // Inject import formatINR if missing
  if (!code.includes('import { formatINR }') && !code.includes('import { calculateMetrics, formatINR }')) {
    code = code.replace(
      "import { calculateMetrics } from '../utils/calculations';",
      "import { calculateMetrics, formatINR } from '../utils/calculations';"
    );
    // if calculateMetrics is not there:
    if (!code.includes('calculateMetrics')) {
      code = code.replace(
        "import { Trade ",
        "import { formatINR } from '../utils/calculations';\nimport { Trade "
      );
    }
  }

  // Replace ₹{variable.toLocaleString('en-IN')} with {formatINR(variable)}
  // E.g. ₹{data.netPnL.toLocaleString('en-IN')} -> {formatINR(data.netPnL)}
  // E.g. ₹{(scopeMetrics?.totalCharges ?? 0).toLocaleString('en-IN')} -> {formatINR(scopeMetrics?.totalCharges ?? 0)}
  code = code.replace(/₹\{([^}]+)\.toLocaleString\('en-IN'\)\}/g, '{formatINR($1)}');
  
  // Replace template strings `₹${variable.toLocaleString('en-IN')}` -> `${formatINR(variable)}`
  code = code.replace(/₹\$\{([^}]+)\.toLocaleString\('en-IN'\)\}/g, '${formatINR($1)}');

  // For hardcoded ₹0 or ₹ something
  if (code.includes('import { useMarket }')) {
    code = code.replace(/>₹0</g, '>{currencySymbol}0<');
    code = code.replace(/ P&L in ₹/g, ' P&L in {currencySymbol}');
    code = code.replace(/Net P&L \(₹\)/g, 'Net P&L ({currencySymbol})');
    code = code.replace(/Curve \(₹\)/g, 'Curve ({currencySymbol})');
  }

  fs.writeFileSync(filepath, code);
}

const comps = [
  'src/components/AnalyticsView.tsx',
  'src/components/StrategyBuilderView.tsx',
  'src/components/SendToMentorModal.tsx',
  'src/components/TradeFormModal.tsx'
];

comps.forEach(replaceWithFormatINR);
