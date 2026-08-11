const fs = require('fs');

function replaceIcons(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');

  if (code.includes('IndianRupee')) {
    // Add DollarSign import
    if (!code.includes('DollarSign')) {
      code = code.replace('IndianRupee,', 'IndianRupee, DollarSign,');
    }
    
    // Add useMarket import if not present
    if (!code.includes("import { useMarket }")) {
      code = code.replace(
        "import { formatINR",
        "import { useMarket } from '../contexts/MarketContext';\nimport { formatINR"
      );
      if (!code.includes("import { useMarket }")) {
        code = code.replace(
          "import { DashboardMetrics",
          "import { useMarket } from '../contexts/MarketContext';\nimport { DashboardMetrics"
        );
      }
      if (!code.includes("import { useMarket }")) {
        code = code.replace(
          "import { Trade",
          "import { useMarket } from '../contexts/MarketContext';\nimport { Trade"
        );
      }
    }

    // Inside the component, get marketType
    if (filepath.includes('DashboardStats.tsx')) {
      code = code.replace(
        "export const DashboardStats: React.FC<DashboardStatsProps> = ({ metrics }) => {",
        "export const DashboardStats: React.FC<DashboardStatsProps> = ({ metrics }) => {\n  const { marketType } = useMarket();\n  const CurrencyIcon = marketType === 'Forex' ? DollarSign : IndianRupee;"
      );
      code = code.replace("icon: IndianRupee,", "icon: CurrencyIcon,");
    }

    if (filepath.includes('MonthlyPerformance.tsx')) {
      code = code.replace(
        "export const MonthlyPerformance: React.FC<MonthlyPerformanceProps> = ({ trades }) => {",
        "export const MonthlyPerformance: React.FC<MonthlyPerformanceProps> = ({ trades }) => {\n  const { marketType } = useMarket();\n  const CurrencyIcon = marketType === 'Forex' ? DollarSign : IndianRupee;"
      );
      code = code.replace(/<IndianRupee /g, '<CurrencyIcon ');
    }

    if (filepath.includes('YearlyPerformanceHeatmap.tsx')) {
      code = code.replace(
        "export const YearlyPerformanceHeatmap: React.FC<YearlyPerformanceHeatmapProps> = ({ trades }) => {",
        "export const YearlyPerformanceHeatmap: React.FC<YearlyPerformanceHeatmapProps> = ({ trades }) => {\n  const { marketType } = useMarket();\n  const CurrencyIcon = marketType === 'Forex' ? DollarSign : IndianRupee;"
      );
      code = code.replace(/<IndianRupee /g, '<CurrencyIcon ');
    }

    if (filepath.includes('TradeFormModal.tsx')) {
      // In TradeFormModal, useMarket is already imported.
      // We just need to define CurrencyIcon and replace
      if (!code.includes("const CurrencyIcon")) {
        code = code.replace(
          "const { marketType } = useMarket();",
          "const { marketType } = useMarket();\n  const CurrencyIcon = marketType === 'Forex' ? DollarSign : IndianRupee;"
        );
        code = code.replace(/<IndianRupee /g, '<CurrencyIcon ');
      }
    }
  }

  fs.writeFileSync(filepath, code);
}

replaceIcons('src/components/DashboardStats.tsx');
replaceIcons('src/components/MonthlyPerformance.tsx');
replaceIcons('src/components/YearlyPerformanceHeatmap.tsx');
replaceIcons('src/components/TradeFormModal.tsx');
