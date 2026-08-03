const fs = require('fs');
let code = fs.readFileSync('src/utils/firebaseSync.ts', 'utf-8');

code = code.replace(
  "        if (stratList.length > 0) {\n          stratList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));\n          onUpdate(stratList);\n        }",
  "        stratList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));\n        onUpdate(stratList);"
);

code = code.replace(
  "        if (rulesList.length > 0) {\n          onUpdate(rulesList);\n        }",
  "        onUpdate(rulesList);"
);

code = code.replace(
  "        if (goalsList.length > 0) {\n          onUpdate(goalsList);\n        }",
  "        onUpdate(goalsList);"
);

fs.writeFileSync('src/utils/firebaseSync.ts', code);
