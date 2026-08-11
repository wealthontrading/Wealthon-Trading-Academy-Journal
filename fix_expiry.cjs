const fs = require('fs');

let code = fs.readFileSync('src/utils/studentStorage.ts', 'utf8');

code = code.replace(/const threeMonthsExpiry = Date\.now\(\) \+ 90 \* 24 \* 60 \* 60 \* 1000;/g, "const planExpiry = Date.now() + 31 * 24 * 60 * 60 * 1000;");
code = code.replace(/const threeMonthsExpiry = now \+ 90 \* 24 \* 60 \* 60 \* 1000;/g, "const planExpiry = now + 31 * 24 * 60 * 60 * 1000;");
code = code.replace(/threeMonthsExpiry/g, "planExpiry");

fs.writeFileSync('src/utils/studentStorage.ts', code);
