const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /\bbg-white\b(?!\s+dark:)/g, replace: 'bg-white dark:bg-slate-800' },
  { search: /\bbg-slate-50\b(?!\s+dark:)/g, replace: 'bg-slate-50 dark:bg-slate-900' },
  { search: /\bbg-slate-100\b(?!\s+dark:)/g, replace: 'bg-slate-100 dark:bg-slate-800/50' },
  { search: /\btext-slate-900\b(?!\s+dark:)/g, replace: 'text-slate-900 dark:text-slate-50' },
  { search: /\btext-slate-800\b(?!\s+dark:)/g, replace: 'text-slate-800 dark:text-slate-100' },
  { search: /\btext-slate-700\b(?!\s+dark:)/g, replace: 'text-slate-700 dark:text-slate-200' },
  { search: /\btext-slate-600\b(?!\s+dark:)/g, replace: 'text-slate-600 dark:text-slate-300' },
  { search: /\btext-slate-500\b(?!\s+dark:)/g, replace: 'text-slate-500 dark:text-slate-400' },
  { search: /\bborder-slate-100\b(?!\s+dark:)/g, replace: 'border-slate-100 dark:border-slate-700/50' },
  { search: /\bborder-slate-200\b(?!\s+dark:)/g, replace: 'border-slate-200 dark:border-slate-700' },
  { search: /\bborder-slate-300\b(?!\s+dark:)/g, replace: 'border-slate-300 dark:border-slate-600' },
  { search: /\bdivide-slate-200\b(?!\s+dark:)/g, replace: 'divide-slate-200 dark:divide-slate-700' },
  { search: /\bdivide-slate-100\b(?!\s+dark:)/g, replace: 'divide-slate-100 dark:divide-slate-700/50' },
  { search: /\bh-screen bg-slate-100\b(?!\s+dark:)/g, replace: 'h-screen bg-slate-100 dark:bg-slate-900' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      for (const { search, replace } of replacements) {
        content = content.replace(search, replace);
      }
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./src');
