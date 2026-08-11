const fs = require('fs');
let code = fs.readFileSync('src/components/GoalToastNotification.tsx', 'utf8');

if (!code.includes('useMarket')) {
  code = "import { useMarket } from '../contexts/MarketContext';\n" + code;
  code = code.replace(
    "export const GoalToastNotification: React.FC<GoalToastProps> = ({ goal, isAchieved }) => {",
    "export const GoalToastNotification: React.FC<GoalToastProps> = ({ goal, isAchieved }) => {\n  const { currencySymbol } = useMarket();\n"
  );
  code = code.replace(/`₹\$\{/g, "`${currencySymbol}${");
  fs.writeFileSync('src/components/GoalToastNotification.tsx', code);
}
