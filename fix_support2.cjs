const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerSupportModal.tsx', 'utf8');

const startStr = `{/* DIRECT REVIEW & FEEDBACK CALLOUT CARD INSIDE SUPPORT PAGE */}`;
const startIdx = code.indexOf(startStr);
if (startIdx !== -1) {
    const endStr = `{/* Support Info Grid */}`;
    const endIdx = code.indexOf(endStr);
    if (endIdx !== -1) {
        code = code.slice(0, startIdx) + code.slice(endIdx);
    }
}
fs.writeFileSync('src/components/CustomerSupportModal.tsx', code);
