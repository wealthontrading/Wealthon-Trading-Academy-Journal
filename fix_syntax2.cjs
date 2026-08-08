const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerSupportModal.tsx', 'utf8');

const targetStr = `                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                          Student Feedback & Review
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                          How is your experience with WealthOn?
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    We value your review! Click the button below to rate your experience and submit your feedback. Your name and email will be pre-filled automatically.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      populateUserData();
                      setActiveTab('feedback');
                      setSubmitSuccess(false);
                    }}
                    className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Star className="w-4 h-4 fill-slate-950" />
                    <span>⭐ Write a Review & Submit Feedback</span>
                  </button>
                </div>`;
code = code.replace(targetStr, '');

// Also fixing populateUserData() function not being used but being declared
// Actually, populateUserData might be causing unused warnings. 
const populateFn = /const populateUserData = \(\) => \{[\s\S]*?\};\n/;
code = code.replace(populateFn, '');

fs.writeFileSync('src/components/CustomerSupportModal.tsx', code);
