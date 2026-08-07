const fs = require('fs');

let storageTs = fs.readFileSync('src/utils/studentStorage.ts', 'utf8');

// Also clear local data when adminDeleteStudent is called
storageTs = storageTs.replace(
  "deleteStudentFromFirestore(email);",
  `deleteStudentFromFirestore(email);
  // Also clean local data immediately
  localStorage.removeItem(\`trading_journal_trades_\${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}\`);
  localStorage.removeItem(\`trading_journal_notes_\${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}\`);
  localStorage.removeItem(\`trading_journal_goals_\${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}\`);
  localStorage.removeItem(\`trading_journal_rules_\${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}\`);
  localStorage.removeItem(\`trading_journal_broker_\${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}\`);`
);

fs.writeFileSync('src/utils/studentStorage.ts', storageTs);
