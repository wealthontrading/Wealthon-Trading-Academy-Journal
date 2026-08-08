const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// 1. Pagination Controls addition
const paginationStr = `              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Showing {(currentPage - 1) * studentsPerPage + 1} to {Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} entries</span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition font-bold cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="font-bold">Page {currentPage} of {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition font-bold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}`;

code = code.replace(/ {14}<\/table>\n {12}<\/div>\n {10}<\/div>\n {8}<\/div>\n {8}\)\}/, paginationStr);

// 2. Sort students
const sortStr = `    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    const getStatusWeight = (s) => {
      if (s.status === 'pending') return 1;
      if (s.status === 'approved') return 3;
      return 2;
    };
    if (getStatusWeight(a) !== getStatusWeight(b)) {
      return getStatusWeight(a) - getStatusWeight(b);
    }
    return (b.registeredAt || 0) - (a.registeredAt || 0);
  });`;

code = code.replace(/    return matchesSearch && matchesFilter;\n  \}\);/, sortStr);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
