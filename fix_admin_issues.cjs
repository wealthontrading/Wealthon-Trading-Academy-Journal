const fs = require('fs');

let adminTsx = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// 1. Fix the top stats boxes colors (bg-white -> bg-slate-800/50 or similar)
adminTsx = adminTsx.replace(
  /<div className="p-3 bg-white backdrop-blur-md rounded-2xl border border-white\/10 text-center">/g,
  '<div className="p-3 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 text-center">'
);

// 2. Add pagination state
adminTsx = adminTsx.replace(
  "const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'disabled' | 'rejected' | 'expiring' | 'expired'>('all');",
  "const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'disabled' | 'rejected' | 'expiring' | 'expired'>('all');\n  const [currentPage, setCurrentPage] = useState(1);\n  const studentsPerPage = 10;"
);

// Reset pagination when filter or search changes
adminTsx = adminTsx.replace(
  "const filteredStudents = students.filter((s) => {",
  "useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);\n\n  const filteredStudents = students.filter((s) => {"
);

// Add custom delete modal state
adminTsx = adminTsx.replace(
  "// Bulk Add Student",
  "// Delete Confirmation\n  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);\n\n  // Bulk Add Student"
);

// Update handleDeleteStudent
adminTsx = adminTsx.replace(
  /const handleDeleteStudent = \(email: string\) => \{[\s\S]*?refreshStudents\(\);\n    \}\n  \};/,
  `const confirmDeleteStudent = (email: string) => {
    adminDeleteStudent(email);
    setBannerMsg({ type: 'success', text: \`Deleted student record and all associated data for \${email}!\` });
    setDeleteCandidate(null);
    refreshStudents();
  };`
);

// Update the delete button onClick
adminTsx = adminTsx.replace(
  /onClick=\{\(\) => handleDeleteStudent\(s\.email\)\}/g,
  "onClick={() => setDeleteCandidate(s.email)}"
);

// Paginate filtered students
adminTsx = adminTsx.replace(
  "const totalStudents = students.length;",
  `const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);
  
  const totalStudents = students.length;`
);

// Render paginatedStudents instead of filteredStudents
adminTsx = adminTsx.replace(
  /filteredStudents\.length === 0/g,
  "paginatedStudents.length === 0"
);
adminTsx = adminTsx.replace(
  /filteredStudents\.map\(\(s\)/g,
  "paginatedStudents.map((s)"
);

// Add pagination controls to the table footer
const paginationControls = `
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>Showing {(currentPage - 1) * studentsPerPage + 1} to {Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} entries</span>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition font-bold"
                >
                  Previous
                </button>
                <span className="font-bold">Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-100 transition font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </div>
`;

adminTsx = adminTsx.replace(
  / {10}<\/div>\n {8}<\/div>\n {8}<\/div>\n {8}\)\}/g,
  paginationControls + "\n        </div>\n      )}"
);

// Add Delete Confirmation Modal
const deleteModal = `
      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Delete Student?</h3>
              <p className="text-sm text-slate-600">
                Are you sure you want to permanently delete <strong>{deleteCandidate}</strong>? 
                This will erase their profile, journal trades, notes, and feedback.
              </p>
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setDeleteCandidate(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  No, Cancel
                </button>
                <button
                  onClick={() => confirmDeleteStudent(deleteCandidate)}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
`;

adminTsx = adminTsx.replace(
  / {4}<\/div>\n {2}\);\n\};/,
  deleteModal + "    </div>\n  );\n};"
);

fs.writeFileSync('src/components/AdminPortal.tsx', adminTsx);
