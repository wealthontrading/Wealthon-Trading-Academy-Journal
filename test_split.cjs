const fs = require('fs');

let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// Find the start of Students Directory Table
const mainTableStartIdx = code.indexOf('{/* Students Directory Table */}');

// We will inject a new pending table right before it.
const pendingTableStr = `          {/* Pending Student Requests Table */}
          {pendingStudents > 0 && (
            <div className="border-2 border-amber-200 rounded-2xl overflow-hidden bg-amber-50 shadow-sm mb-8">
              <div className="p-4 bg-amber-100/50 border-b border-amber-200 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-amber-900 uppercase tracking-wide">
                  New Student Access Requests ({pendingStudents})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-amber-100/30 border-b border-amber-200 text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">
                      <th className="py-3 px-4">Student Email & Name</th>
                      <th className="py-3 px-4">Requested On</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/50 text-xs">
                    {students.filter(s => s.status === 'pending').map((s) => (
                      <tr key={s.id} className="hover:bg-amber-100/40 transition">
                        <td className="py-3 px-4">
                          <p className="font-extrabold text-slate-900 text-xs">{s.email}</p>
                          <p className="text-[11px] text-slate-600">{s.name || 'Student'}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {new Date(s.registeredAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 text-[11px] font-bold animate-pulse">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Waiting Approval</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleApproveStatus(s.email, 'approved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-xs flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setDeleteCandidate(s.email)}
                              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-lg transition cursor-pointer flex items-center space-x-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

`;

code = code.slice(0, mainTableStartIdx) + pendingTableStr + code.slice(mainTableStartIdx);

// Also we should filter pending out from the main table so they don't appear twice if statusFilter === 'all'.
const filterStr = `    if (statusFilter === 'all') matchesFilter = true;`;
const newFilterStr = `    if (statusFilter === 'all') matchesFilter = s.status !== 'pending';`;
code = code.replace(filterStr, newFilterStr);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
