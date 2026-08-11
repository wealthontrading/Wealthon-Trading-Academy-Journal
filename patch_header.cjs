const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

if (!code.includes('import { useMarket }')) {
  code = code.replace(
    "import { Logo } from './Logo';",
    "import { Logo } from './Logo';\nimport { useMarket } from '../contexts/MarketContext';"
  );
}

if (!code.includes('const { marketType, setMarketType } = useMarket();')) {
  code = code.replace(
    "const [dateStr, setDateStr] = useState('');",
    "const [dateStr, setDateStr] = useState('');\n  const { marketType, setMarketType } = useMarket();"
  );
}

const actionButtonsStr = "{/* Action Buttons */}";
if (!code.includes("marketType === 'Indian'")) {
  const switchCode = `          {/* Market Toggle */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 text-[11px] font-bold shadow-inner border border-slate-200">
              <button
                onClick={() => setMarketType('Indian')}
                className={\`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 \${marketType === 'Indian' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}\`}
              >
                <span>Indian Market</span>
              </button>
              <button
                onClick={() => setMarketType('Forex')}
                className={\`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 \${marketType === 'Forex' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}\`}
              >
                <span>Forex Market</span>
              </button>
            </div>
          </div>
          `;
  code = code.replace(
    "{/* Action Buttons */}",
    switchCode + "\n          {/* Action Buttons */}"
  );
}

fs.writeFileSync('src/components/Header.tsx', code);
