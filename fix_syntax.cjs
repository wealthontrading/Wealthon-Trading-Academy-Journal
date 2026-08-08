const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerSupportModal.tsx', 'utf8');

// The snippet that caused the syntax error:
//                       <div>
//                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
//                          Student Feedback & Review
//                        </span>

// Let's remove everything between:
// `                )}`
// and
// `{/* Support Info Grid */}`
// inclusive.

const startStr = `                )}

`;
const endStr = `                {/* Support Info Grid */}`;

const sIdx = code.indexOf(startStr);
const eIdx = code.indexOf(endStr);
if (sIdx !== -1 && eIdx !== -1) {
    code = code.slice(0, sIdx + startStr.length) + code.slice(eIdx);
}
fs.writeFileSync('src/components/CustomerSupportModal.tsx', code);
