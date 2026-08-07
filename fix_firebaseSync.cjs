const fs = require('fs');

let fbSync = fs.readFileSync('src/utils/firebaseSync.ts', 'utf8');

// Replace the `deleteStudentFromFirestore` implementation
const newDeleteFunc = `export async function deleteStudentFromFirestore(email: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    // Delete student doc
    const studentDocRef = doc(db, 'students', cleanDocId(cleanEmail));
    await deleteDoc(studentDocRef);

    // Delete trades
    try {
      const tradesQ = query(collection(db, 'trades'), where('userEmail', '==', cleanEmail));
      const tradesSnap = await getDocs(tradesQ);
      const tradesPromises = [];
      tradesSnap.forEach((d) => tradesPromises.push(deleteDoc(d.ref)));
      await Promise.all(tradesPromises);
    } catch (e) { console.warn('failed to delete trades', e); }

    // Delete daily notes
    try {
      const notesQ = query(collection(db, 'dailyNotes'), where('userEmail', '==', cleanEmail));
      const notesSnap = await getDocs(notesQ);
      const notesPromises = [];
      notesSnap.forEach((d) => notesPromises.push(deleteDoc(d.ref)));
      await Promise.all(notesPromises);
    } catch (e) { console.warn('failed to delete notes', e); }

    // Delete feedback
    try {
      const feedbackQ = query(collection(db, 'feedback'), where('userEmail', '==', cleanEmail));
      const feedbackSnap = await getDocs(feedbackQ);
      const feedbackPromises = [];
      feedbackSnap.forEach((d) => feedbackPromises.push(deleteDoc(d.ref)));
      await Promise.all(feedbackPromises);
    } catch (e) { console.warn('failed to delete feedback', e); }

  } catch (err) {
    console.warn('Failed to delete student all data from Firestore:', err);
  }
}`;

fbSync = fbSync.replace(/export async function deleteStudentFromFirestore\(email: string\) \{[\s\S]*?\}\n/, newDeleteFunc + '\n');

fs.writeFileSync('src/utils/firebaseSync.ts', fbSync);
