const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(
  "{totalPages >= 1 {totalPages > 1 && ({totalPages > 1 && ( (",
  "{totalPages > 0 && ("
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
