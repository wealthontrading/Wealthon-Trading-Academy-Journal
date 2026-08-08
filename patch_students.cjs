const fs = require('fs');

let fbSync = fs.readFileSync('src/utils/firebaseSync.ts', 'utf8');

const oldFunc = `        // Get local students
        const localData = localStorage.getItem('trading_journal_students_list');
        let localStudents: StudentAccount[] = [];
        if (localData) {
          try {
            localStudents = JSON.parse(localData);
          } catch {
            localStudents = [];
          }
        }

        const mergedMap = new Map<string, StudentAccount>();
        localStudents.forEach((s) => {
          if (s && s.email) {
            mergedMap.set(s.email.trim().toLowerCase(), s);
          }
        });

        // Firestore updates take priority
        fsStudentsMap.forEach((s, emailKey) => {
          mergedMap.set(emailKey, s);
        });

        const mergedList = Array.from(mergedMap.values());`;

const newFunc = `        const mergedList = Array.from(fsStudentsMap.values());`;

fbSync = fbSync.replace(oldFunc, newFunc);
fs.writeFileSync('src/utils/firebaseSync.ts', fbSync);
