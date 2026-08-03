const fs = require('fs');
let code = fs.readFileSync('src/utils/storage.ts', 'utf-8');
code = code.replace(
  "  deleteDailyNoteFromFirestore,",
  "  deleteDailyNoteFromFirestore,\n  saveRuleToFirestore,\n  saveGoalToFirestore,"
);
fs.writeFileSync('src/utils/storage.ts', code);
