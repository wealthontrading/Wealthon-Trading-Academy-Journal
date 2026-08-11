const fs = require('fs');
let code = fs.readFileSync('src/utils/calculations.ts', 'utf8');

if (!code.includes('globalMarketType')) {
  const replaceStr = `
let globalMarketType: 'Indian' | 'Forex' = 'Indian';
export function setGlobalMarketType(type: 'Indian' | 'Forex') {
  globalMarketType = type;
}

export function formatINR(amount: number): string {
  const safeAmount = Number.isNaN(Number(amount)) || amount === undefined || amount === null ? 0 : Number(amount);
  const isNegative = safeAmount < 0;
  const absVal = Math.abs(safeAmount);
  
  if (globalMarketType === 'Forex') {
    const converted = absVal / 83.2; // Approximate conversion rate
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(converted);
    return isNegative ? \`-\${formatted}\` : formatted;
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(absVal);

  return isNegative ? \`-\${formatted}\` : formatted;
}
`;
  
  // Replace the old formatINR
  code = code.replace(
    /export function formatINR[\s\S]*?return isNegative \? \`-\${formatted}\` : formatted;\n}/,
    replaceStr.trim()
  );
  
  fs.writeFileSync('src/utils/calculations.ts', code);
}
