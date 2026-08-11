const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  if (code.includes('import { useMarket }')) return;

  // For AITradingAssistantView
  if (filepath.includes('AITradingAssistantView')) {
    code = code.replace(
      "import { calculateMetrics } from '../utils/calculations';",
      "import { calculateMetrics, formatINR } from '../utils/calculations';\nimport { useMarket } from '../contexts/MarketContext';"
    );
    code = code.replace(
      "const AITradingAssistantView: React.FC<AITradingAssistantViewProps> = ({ trades, profile, rules }) => {",
      "const AITradingAssistantView: React.FC<AITradingAssistantViewProps> = ({ trades, profile, rules }) => {\n  const { currencySymbol } = useMarket();"
    );
    code = code.replace(/₹/g, '${currencySymbol}');
  }
  
  // For TradeDetailsModal
  if (filepath.includes('TradeDetailsModal')) {
    code = code.replace(
      "import { format } from 'date-fns';",
      "import { format } from 'date-fns';\nimport { useMarket } from '../contexts/MarketContext';"
    );
    code = code.replace(
      "export const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({ trade, onClose, onEdit, onDelete }) => {",
      "export const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({ trade, onClose, onEdit, onDelete }) => {\n  const { currencySymbol } = useMarket();"
    );
    // Replace ₹ with {currencySymbol} inside JSX
    code = code.replace(/>₹</g, '>{currencySymbol}<');
    code = code.replace(/₹\{trade/g, '{currencySymbol}{trade');
  }

  // For JournalNotesView
  if (filepath.includes('JournalNotesView')) {
    code = code.replace(
      "import { Calendar, Save, Trash2, CheckSquare, Plus, Edit2, X, FileText, CheckCircle2, TrendingUp, Search, CalendarDays } from 'lucide-react';",
      "import { Calendar, Save, Trash2, CheckSquare, Plus, Edit2, X, FileText, CheckCircle2, TrendingUp, Search, CalendarDays } from 'lucide-react';\nimport { useMarket } from '../contexts/MarketContext';"
    );
    code = code.replace(
      "export const JournalNotesView: React.FC<JournalNotesViewProps> = ({",
      "export const JournalNotesView: React.FC<JournalNotesViewProps> = ({"
    );
    if (!code.includes("const { currencySymbol } = useMarket();")) {
       code = code.replace(
         "const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);",
         "const { currencySymbol } = useMarket();\n  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);"
       );
    }
    // Very naive replace, but we must be careful with literal '₹' type in types
    // The types use '₹', we better not break types.ts
    // Just replace in specific text
    code = code.replace(/>₹</g, '>{currencySymbol}<');
    code = code.replace(/Max risk ₹2,000/g, 'Max risk ${currencySymbol}2,000');
  }

  fs.writeFileSync(filepath, code);
}

patchFile('src/components/AITradingAssistantView.tsx');
patchFile('src/components/TradeDetailsModal.tsx');
patchFile('src/components/JournalNotesView.tsx');

