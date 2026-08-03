const fs = require('fs');

function replaceInFile(filePath, isNested) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (isNested) {
    content = content.replace(/import \{ WEALTHON_LOGO_URL \} from '\.\.\/\.\.\/assets\/logo';/, "import { Logo } from '../Logo';");
  } else {
    content = content.replace(/import \{ WEALTHON_LOGO_URL \} from '\.\.\/assets\/logo';/, "import { Logo } from './Logo';");
  }

  // Use a generic regex to catch the div and the img inside it
  content = content.replace(/<div[^>]*w-1[246][^>]*>\s*<img[^>]*WEALTHON_LOGO_URL[^>]*>\s*<\/div>/g, '<Logo className="text-4xl sm:text-5xl" />');
  content = content.replace(/<div[^>]*w-11[^>]*>\s*<img[^>]*WEALTHON_LOGO_URL[^>]*>\s*<\/div>/g, '<Logo className="text-4xl" />');
  content = content.replace(/<div[^>]*w-8[^>]*>\s*<img[^>]*WEALTHON_LOGO_URL[^>]*>\s*<\/div>/g, '<Logo className="text-2xl" />');
  content = content.replace(/<div[^>]*w-5[^>]*>\s*<img[^>]*WEALTHON_LOGO_URL[^>]*\/>\s*<\/div>/g, '<Logo className="text-lg" />');

  fs.writeFileSync(filePath, content);
}

replaceInFile('src/components/Header.tsx', false);
replaceInFile('src/components/Footer.tsx', false);
replaceInFile('src/components/CustomerSupportModal.tsx', false);
replaceInFile('src/components/AdminPortal.tsx', false);
replaceInFile('src/components/AuthModal.tsx', false);
replaceInFile('src/components/auth/LoginModal.tsx', true);
