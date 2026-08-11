const fs = require('fs');
let code = fs.readFileSync('src/utils/calculations.ts', 'utf8');

code = code.replace(
  "const converted = absVal / 83.2; // Approximate conversion rate",
  "const converted = absVal;"
);

fs.writeFileSync('src/utils/calculations.ts', code);
