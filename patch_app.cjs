const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(
  "subscribeProfileFromFirestore,\n  subscribeStudentsFromFirestore,\n  subscribeTradesFromFirestore,\n  subscribeStrategiesFromFirestore,",
  "subscribeProfileFromFirestore,\n  subscribeStudentsFromFirestore,\n  subscribeTradesFromFirestore,\n  subscribeStrategiesFromFirestore,\n  subscribeRulesFromFirestore,\n  subscribeGoalsFromFirestore,"
);
code = code.replace(
  "      const unsubscribeStrategies = subscribeStrategiesFromFirestore(activeUserEmail, (fsStrategies) => {\n        if (fsStrategies && fsStrategies.length > 0) {\n          setStrategies(fsStrategies);\n        }\n      });",
  "      const unsubscribeStrategies = subscribeStrategiesFromFirestore(activeUserEmail, (fsStrategies) => {\n        if (fsStrategies && fsStrategies.length > 0) {\n          setStrategies(fsStrategies);\n        }\n      });\n\n      const unsubscribeRules = subscribeRulesFromFirestore(activeUserEmail, (fsRules) => {\n        if (fsRules && fsRules.length > 0) {\n          setRules(fsRules);\n        }\n      });\n\n      const unsubscribeGoals = subscribeGoalsFromFirestore(activeUserEmail, (fsGoals) => {\n        if (fsGoals && fsGoals.length > 0) {\n          setGoals(fsGoals);\n        }\n      });"
);
code = code.replace(
  "        unsubscribeStrategies();",
  "        unsubscribeStrategies();\n        unsubscribeRules();\n        unsubscribeGoals();"
);
fs.writeFileSync('src/App.tsx', code);
