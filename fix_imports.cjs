const fs = require('fs');

function addImport(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  if (!code.includes("import { useMarket }")) {
    code = code.replace(
      "import { ",
      "import { useMarket } from '../contexts/MarketContext';\nimport { "
    );
    fs.writeFileSync(filepath, code);
  }
}

addImport('src/components/AITradingAssistantView.tsx');
addImport('src/components/TradeDetailsModal.tsx');
addImport('src/components/JournalNotesView.tsx');

