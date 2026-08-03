const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  "      const unsubscribeTrades = subscribeTradesFromFirestore(activeUserEmail, (fsTrades) => {\n        if (fsTrades && fsTrades.length > 0) {\n          setTrades(fsTrades);\n        }\n      });",
  "      const unsubscribeTrades = subscribeTradesFromFirestore(activeUserEmail, (fsTrades) => {\n        if (fsTrades) {\n          setTrades(fsTrades);\n        }\n      });"
);

code = code.replace(
  "      const unsubscribeNotes = subscribeDailyNotesFromFirestore(activeUserEmail, (fsNotes) => {\n        if (fsNotes && fsNotes.length > 0) {\n          setDailyNotes(fsNotes);\n        }\n      });",
  "      const unsubscribeNotes = subscribeDailyNotesFromFirestore(activeUserEmail, (fsNotes) => {\n        if (fsNotes) {\n          setDailyNotes(fsNotes);\n        }\n      });"
);

code = code.replace(
  "      const unsubscribeStrategies = subscribeStrategiesFromFirestore(activeUserEmail, (fsStrategies) => {\n        if (fsStrategies && fsStrategies.length > 0) {\n          setStrategies(fsStrategies);\n        }\n      });",
  "      const unsubscribeStrategies = subscribeStrategiesFromFirestore(activeUserEmail, (fsStrategies) => {\n        if (fsStrategies) {\n          setStrategies(fsStrategies);\n        }\n      });"
);

code = code.replace(
  "      const unsubscribeRules = subscribeRulesFromFirestore(activeUserEmail, (fsRules) => {\n        if (fsRules && fsRules.length > 0) {\n          setRules(fsRules);\n        }\n      });",
  "      const unsubscribeRules = subscribeRulesFromFirestore(activeUserEmail, (fsRules) => {\n        if (fsRules) {\n          setRules(fsRules);\n        }\n      });"
);

code = code.replace(
  "      const unsubscribeGoals = subscribeGoalsFromFirestore(activeUserEmail, (fsGoals) => {\n        if (fsGoals && fsGoals.length > 0) {\n          setGoals(fsGoals);\n        }\n      });",
  "      const unsubscribeGoals = subscribeGoalsFromFirestore(activeUserEmail, (fsGoals) => {\n        if (fsGoals) {\n          setGoals(fsGoals);\n        }\n      });"
);

fs.writeFileSync('src/App.tsx', code);
