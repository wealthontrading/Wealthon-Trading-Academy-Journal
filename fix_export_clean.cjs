const fs = require('fs');
let content = fs.readFileSync('src/utils/export_clean.ts', 'utf8');

// There is this exact string:
//   const pageHeight = 297;
//   const currencySymbol = globalMarketType === 'Forex' ? '
// 
//   let currentY = 15;

content = content.replace(
  "  const pageHeight = 297;\n  const currencySymbol = globalMarketType === 'Forex' ? '\n\n  let currentY = 15;",
  "  const pageHeight = 297;\n  const currencySymbol = globalMarketType === 'Forex' ? '$' : '₹';\n  const margin = 14;\n  const contentWidth = pageWidth - margin * 2;\n\n  let currentY = 15;"
);

// Look for any other syntax errors?
// Check if `margin` is undefined anywhere.
// Actually, earlier in the file we had `const margin = 14;`? No.

fs.writeFileSync('src/utils/export.ts', content);
