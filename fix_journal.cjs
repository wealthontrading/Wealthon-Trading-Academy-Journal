const fs = require('fs');

let code = fs.readFileSync('src/components/JournalNotesView.tsx', 'utf8');
if (!code.includes('const { currencySymbol } = useMarket();')) {
  code = code.replace(
    "const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);",
    "const { currencySymbol } = useMarket();\n  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);"
  );
}
fs.writeFileSync('src/components/JournalNotesView.tsx', code);
