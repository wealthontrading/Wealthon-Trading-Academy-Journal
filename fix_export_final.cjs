const fs = require('fs');

let lines = fs.readFileSync('src/utils/export.ts', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const currencySymbol = globalMarketType === 'Forex' ? '")) {
    lines[i] = "  const currencySymbol = globalMarketType === 'Forex' ? '$' : '₹';\n  const margin = 14;\n  const contentWidth = pageWidth - margin * 2;\n  let currentY = 15;";
  }
}

fs.writeFileSync('src/utils/export.ts', lines.join('\n'));
