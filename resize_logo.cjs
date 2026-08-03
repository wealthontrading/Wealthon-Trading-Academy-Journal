const fs = require('fs');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  content = content.replace(/<Logo className="text-4xl sm:text-5xl" \/>/g, '<Logo className="text-3xl" />');
  content = content.replace(/<Logo className="text-4xl" \/>/g, '<Logo className="text-2xl" />');
  content = content.replace(/<Logo className="text-2xl" \/>/g, '<Logo className="text-xl" />');
  content = content.replace(/<Logo className="text-lg" \/>/g, '<Logo className="text-base" />');

  fs.writeFileSync(filePath, content);
}

const files = [
  'src/components/Header.tsx',
  'src/components/Footer.tsx',
  'src/components/CustomerSupportModal.tsx',
  'src/components/AdminPortal.tsx',
  'src/components/AuthModal.tsx',
  'src/components/auth/LoginModal.tsx'
];

files.forEach(replaceInFile);
