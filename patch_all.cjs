const fs = require('fs');

let fbSync = fs.readFileSync('src/utils/firebaseSync.ts', 'utf8');

// Trades
fbSync = fbSync.replace(
  "        const localTrades = getLocalTrades(userEmail);\n" +
  "        const mergedMap = new Map<string, Trade>();\n\n" +
  "        // 1. Local trades first\n" +
  "        localTrades.forEach((t) => {\n" +
  "          if (t && t.id) {\n" +
  "            mergedMap.set(t.id, t);\n" +
  "          }\n" +
  "        });\n\n" +
  "        // 2. Firestore trades overlay\n" +
  "        fsTradesMap.forEach((t, id) => {\n" +
  "          mergedMap.set(id, t);\n" +
  "        });\n\n" +
  "        const mergedList = Array.from(mergedMap.values());",
  "        const mergedList = Array.from(fsTradesMap.values());"
);

// Daily Notes
fbSync = fbSync.replace(
  "        const localNotes = getLocalNotes(userEmail);\n" +
  "        const mergedMap = new Map<string, DailyNote>();\n\n" +
  "        localNotes.forEach((n) => {\n" +
  "          if (n && n.id) mergedMap.set(n.id, n);\n" +
  "        });\n" +
  "        fsNotesMap.forEach((n, id) => {\n" +
  "          mergedMap.set(id, n);\n" +
  "        });\n\n" +
  "        const mergedList = Array.from(mergedMap.values());",
  "        const mergedList = Array.from(fsNotesMap.values());"
);

// Feedback
fbSync = fbSync.replace(
  "        const localData = localStorage.getItem('trading_journal_feedback_list');\n" +
  "        let localList: FeedbackItem[] = [];\n" +
  "        if (localData) {\n" +
  "          try {\n" +
  "            localList = JSON.parse(localData);\n" +
  "          } catch {\n" +
  "            localList = [];\n" +
  "          }\n" +
  "        }\n" +
  "        \n" +
  "        const mergedMap = new Map<string, FeedbackItem>();\n" +
  "        localList.forEach(f => {\n" +
  "          if (f && f.id) mergedMap.set(f.id, f);\n" +
  "        });\n" +
  "        fsMap.forEach((f, id) => {\n" +
  "          mergedMap.set(id, f);\n" +
  "        });\n" +
  "        \n" +
  "        const list = Array.from(mergedMap.values());",
  "        const list = Array.from(fsMap.values());"
);

fs.writeFileSync('src/utils/firebaseSync.ts', fbSync);
