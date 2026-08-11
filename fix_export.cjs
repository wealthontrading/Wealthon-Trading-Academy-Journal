const fs = require('fs');

let code = fs.readFileSync('src/utils/export.ts', 'utf8');

// Fix the syntax error in exportTradesToPDF
code = code.replace(
  "const currencySymbol = globalMarketType === 'Forex' ? '",
  "const currencySymbol = globalMarketType === 'Forex' ? '$' : '₹';\n  const margin = 14;"
);

// If it has "const currencySymbol = globalMarketType === 'Forex' ? '$' : '₹';\n  const margin = 14;\n  const contentWidth = pageWidth - margin * 2;" and something else is broken, let's fix it safely.
// Let's just fix lines 62, 63
