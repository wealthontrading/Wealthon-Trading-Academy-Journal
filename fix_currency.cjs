const fs = require('fs');

function fix(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  if (code.includes('const { currencySymbol } = useMarket();')) return;
  
  code = code.replace(
    "const [activeSubTab, setActiveSubTab] = useState<'chat' | 'journal' | 'insights'>('journal');",
    "const { currencySymbol } = useMarket();\n  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'journal' | 'insights'>('journal');"
  );
  
  if (filepath.includes('TradeDetailsModal')) {
    code = code.replace(
      "if (!trade) return null;",
      "const { currencySymbol } = useMarket();\n  if (!trade) return null;"
    );
  }

  fs.writeFileSync(filepath, code);
}

fix('src/components/AITradingAssistantView.tsx');
fix('src/components/TradeDetailsModal.tsx');
