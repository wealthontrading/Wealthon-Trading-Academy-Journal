const fs = require('fs');
let content = fs.readFileSync('src/utils/export.ts', 'utf8');

content = content.replace(
  "const currencySymbol = globalMarketType === 'Forex' ? '\n  const contentWidth = pageWidth - margin * 2; // 182mm",
  "const currencySymbol = globalMarketType === 'Forex' ? '$' : '₹';\n  const margin = 14;\n  const contentWidth = pageWidth - margin * 2; // 182mm"
);

// wait, there is another syntax error down at 226
//    226	 : '₹';
//    227	  const margin = 14;
content = content.replace(
  "\n : '₹';\n  const margin = 14;",
  ""
);

fs.writeFileSync('src/utils/export.ts', content);
