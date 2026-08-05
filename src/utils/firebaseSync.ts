import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DailyNote, StudentAccount, SystemMaintenanceState, Trade, TraderProfile, TradingGoal, TradingRule, BrokerRequest, FeedbackItem, StrategyItem } from '../types';

// Helper to sanitize document ID
function cleanDocId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

// Helper for clean user email key
function cleanEmailId(email?: string): string {
  if (!email) return 'default_user';
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9_\-]/g, '_');
}

// ----------------------------------------------------
// STUDENTS COLLECTION SYNC
// ----------------------------------------------------
export function subscribeStudentsFromFirestore(onUpdate: (students: StudentAccount[]) => void) {
  const path = 'students';
  try {
    const colRef = collection(db, path);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const fsStudentsMap = new Map<string, StudentAccount>();
        snapshot.forEach((docSnap) => {
          const std = docSnap.data() as StudentAccount;
          if (std && std.email) {
            fsStudentsMap.set(std.email.trim().toLowerCase(), std);
          }
        });

        // Get local students
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

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem('trading_journal_students_list', JSON.stringify(mergedList));
        onUpdate(mergedList);
      },
      (error) => {
        console.warn('Firestore students sync error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach students listener:', err);
    return () => {};
  }
}

export async function saveStudentToFirestore(student: StudentAccount) {
  const path = 'students';
  try {
    const cleanEmail = student.email.trim().toLowerCase();
    const docId = cleanDocId(cleanEmail);
    const docRef = doc(db, path, docId);
    await setDoc(docRef, { ...student, email: cleanEmail }, { merge: true });
  } catch (err) {
    console.warn('Failed to save student to Firestore:', err);
  }
}

export async function deleteStudentFromFirestore(email: string) {
  const path = 'students';
  try {
    const cleanEmail = email.trim().toLowerCase();
    const docId = cleanDocId(cleanEmail);
    const docRef = doc(db, path, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete student from Firestore:', err);
  }
}

export async function clearAllStudentsFromFirestore() {
  const path = 'students';
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    const promises: Promise<void>[] = [];
    snapshot.forEach((docSnap) => {
      promises.push(deleteDoc(docSnap.ref));
    });
    await Promise.all(promises);
  } catch (err) {
    console.warn('Failed to clear students from Firestore:', err);
  }
}

// Helper to get and set local trades safely within firebaseSync
function getLocalTrades(userEmail?: string): Trade[] {
  try {
    const key = !userEmail
      ? 'trading_journal_trades'
      : `trading_journal_trades_${userEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalTrades(trades: Trade[], userEmail?: string): void {
  try {
    const key = !userEmail
      ? 'trading_journal_trades'
      : `trading_journal_trades_${userEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    localStorage.setItem(key, JSON.stringify(trades));
  } catch {
    // ignore
  }
}

// ----------------------------------------------------
// TRADES COLLECTION SYNC
// ----------------------------------------------------
export function subscribeTradesFromFirestore(
  userEmail: string | undefined,
  onUpdate: (trades: Trade[]) => void
) {
  const path = 'trades';
  const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
  try {
    const colRef = collection(db, path);
    const q = query(colRef, where('userEmail', '==', cleanEmail));
    return onSnapshot(
      q,
      (snapshot) => {
        const fsTradesMap = new Map<string, Trade>();
        snapshot.forEach((docSnap) => {
          const t = docSnap.data() as Trade;
          if (t && t.id) {
            fsTradesMap.set(t.id, t);
          }
        });

        const localTrades = getLocalTrades(userEmail);
        const mergedMap = new Map<string, Trade>();

        // 1. Local trades first
        localTrades.forEach((t) => {
          if (t && t.id) {
            mergedMap.set(t.id, t);
          }
        });

        // 2. Firestore trades overlay
        fsTradesMap.forEach((t, id) => {
          mergedMap.set(id, t);
        });

        const mergedList = Array.from(mergedMap.values());
        mergedList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setLocalTrades(mergedList, userEmail);
        onUpdate(mergedList);
      },
      (error) => {
        console.warn('Firestore trades sync error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach trades listener:', err);
    return () => {};
  }
}

export async function saveTradeToFirestore(trade: Trade, userEmail?: string) {
  const path = 'trades';
  try {
    const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
    const tradeData = { ...trade, userEmail: cleanEmail };
    const docId = cleanDocId(trade.id);
    const docRef = doc(db, path, docId);
    const safeData = JSON.parse(JSON.stringify(tradeData));
    await setDoc(docRef, safeData, { merge: true });
  } catch (err) {
    console.warn('Failed to save trade to Firestore:', err);
  }
}

export async function deleteTradeFromFirestore(tradeId: string) {
  const path = 'trades';
  try {
    const docId = cleanDocId(tradeId);
    const docRef = doc(db, path, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete trade from Firestore:', err);
  }
}

// ----------------------------------------------------
// DAILY NOTES COLLECTION SYNC
// ----------------------------------------------------
export function subscribeDailyNotesFromFirestore(
  userEmail: string | undefined,
  onUpdate: (notes: DailyNote[]) => void
) {
  const path = 'dailyNotes';
  const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
  try {
    const colRef = collection(db, path);
    const q = query(colRef, where('userEmail', '==', cleanEmail));
    return onSnapshot(
      q,
      (snapshot) => {
        const notesList: DailyNote[] = [];
        snapshot.forEach((docSnap) => {
          notesList.push(docSnap.data() as DailyNote);
        });
        notesList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        onUpdate(notesList);
      },
      (error) => {
        console.warn('Firestore notes sync error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach notes listener:', err);
    return () => {};
  }
}

export async function saveDailyNoteToFirestore(note: DailyNote, userEmail?: string) {
  const path = 'dailyNotes';
  try {
    const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
    const noteData = { ...note, userEmail: cleanEmail };
    const docId = cleanDocId(`${cleanEmail}_${note.date}`);
    const docRef = doc(db, path, docId);
    await setDoc(docRef, noteData, { merge: true });
  } catch (err) {
    console.warn('Failed to save note to Firestore:', err);
  }
}

export async function deleteDailyNoteFromFirestore(noteDate: string, userEmail?: string) {
  const path = 'dailyNotes';
  try {
    const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
    const docId = cleanDocId(`${cleanEmail}_${noteDate}`);
    const docRef = doc(db, path, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete note from Firestore:', err);
  }
}

// ----------------------------------------------------
// PROFILES COLLECTION SYNC
// ----------------------------------------------------
export function subscribeProfileFromFirestore(
  userEmail: string | undefined,
  onUpdate: (profile: TraderProfile | null) => void
) {
  const path = 'profiles';
  const docId = cleanEmailId(userEmail);
  try {
    const docRef = doc(db, path, docId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as TraderProfile);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.warn('Firestore profile sync error:', error);
        onUpdate(null);
      }
    );
  } catch (err) {
    console.warn('Failed to attach profile listener:', err);
    onUpdate(null);
    return () => {};
  }
}

export async function saveProfileToFirestore(profile: TraderProfile, userEmail?: string) {
  const path = 'profiles';
  try {
    const docId = cleanEmailId(userEmail);
    const docRef = doc(db, path, docId);
    await setDoc(docRef, { ...profile, userEmail: userEmail || 'Student' }, { merge: true });
  } catch (err) {
    console.warn('Failed to save profile to Firestore:', err);
  }
}

// ----------------------------------------------------
// SYSTEM MAINTENANCE MODE SYNC
// ----------------------------------------------------
export function subscribeMaintenanceModeFromFirestore(
  onUpdate: (state: SystemMaintenanceState) => void
) {
  const path = 'systemSettings';
  const docId = 'maintenanceMode';
  try {
    const docRef = doc(db, path, docId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as SystemMaintenanceState);
        }
      },
      (error) => {
        console.warn('Firestore maintenance sync error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach maintenance mode listener:', err);
    return () => {};
  }
}

export async function saveMaintenanceModeToFirestore(state: SystemMaintenanceState) {
  const path = 'systemSettings';
  const docId = 'maintenanceMode';
  try {
    const docRef = doc(db, path, docId);
    // Remove any undefined properties which cause Firestore to throw
    const safeState = JSON.parse(JSON.stringify(state));
    await setDoc(docRef, safeState, { merge: true });
  } catch (err) {
    console.warn('Failed to save maintenance state to Firestore:', err);
  }
}

// ----------------------------------------------------
// BROKER REQUESTS COLLECTION SYNC
// ----------------------------------------------------
export function subscribeBrokerRequestsFromFirestore(
  onUpdate: (requests: BrokerRequest[]) => void
) {
  const path = 'brokerRequests';
  try {
    const colRef = collection(db, path);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const reqsList: BrokerRequest[] = [];
        snapshot.forEach((docSnap) => {
          const req = docSnap.data() as BrokerRequest;
          if (req && req.id) {
            reqsList.push(req);
          }
        });
        reqsList.sort((a, b) => b.submittedAt - a.submittedAt);
        if (reqsList.length > 0) {
          localStorage.setItem('trading_journal_broker_requests', JSON.stringify(reqsList));
        }
        onUpdate(reqsList);
      },
      (error) => {
        console.warn('Firestore broker requests sync error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach broker requests listener:', err);
    return () => {};
  }
}

export async function saveBrokerRequestToFirestore(req: BrokerRequest) {
  const path = 'brokerRequests';
  try {
    const docId = cleanDocId(req.id || `${req.userEmail}_${Date.now()}`);
    const docRef = doc(db, path, docId);
    const safeReq = JSON.parse(JSON.stringify(req));
    await setDoc(docRef, safeReq, { merge: true });
  } catch (err) {
    console.warn('Failed to save broker request to Firestore:', err);
  }
}

// ----------------------------------------------------
// FEEDBACK COLLECTION SYNC
// ----------------------------------------------------
export function getStoredFeedback(): FeedbackItem[] {
  try {
    const data = localStorage.getItem('trading_journal_feedback_list');
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  return [];
}

export function subscribeFeedbackFromFirestore(onUpdate: (feedbackList: FeedbackItem[]) => void) {
  const path = 'feedback';
  try {
    const colRef = collection(db, path);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: FeedbackItem[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as FeedbackItem;
          if (item && item.id) {
            list.push(item);
          }
        });
        list.sort((a, b) => b.submittedAt - a.submittedAt);
        localStorage.setItem('trading_journal_feedback_list', JSON.stringify(list));
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore feedback sync error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach feedback listener:', err);
    return () => {};
  }
}

export async function saveFeedbackToFirestore(feedback: FeedbackItem) {
  const path = 'feedback';
  try {
    const docId = cleanDocId(feedback.id || `${feedback.userEmail}_${Date.now()}`);
    const docRef = doc(db, path, docId);
    const safeFeedback = JSON.parse(JSON.stringify(feedback));
    await setDoc(docRef, safeFeedback, { merge: true });

    // Also update local storage
    const currentList = getStoredFeedback();
    const existingIdx = currentList.findIndex((f) => f.id === feedback.id);
    let updated: FeedbackItem[];
    if (existingIdx >= 0) {
      updated = [...currentList];
      updated[existingIdx] = feedback;
    } else {
      updated = [feedback, ...currentList];
    }
    localStorage.setItem('trading_journal_feedback_list', JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save feedback to Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateFeedbackStatusInFirestore(feedbackId: string, status: 'New' | 'Reviewed' | 'Resolved') {
  const path = 'feedback';
  try {
    const docId = cleanDocId(feedbackId);
    const docRef = doc(db, path, docId);
    await setDoc(docRef, { status }, { merge: true });

    // Update local storage
    const currentList = getStoredFeedback();
    const updated = currentList.map((f) => (f.id === feedbackId ? { ...f, status } : f));
    localStorage.setItem('trading_journal_feedback_list', JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to update feedback status in Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteFeedbackFromFirestore(feedbackId: string) {
  const path = 'feedback';
  try {
    const docId = cleanDocId(feedbackId);
    const docRef = doc(db, path, docId);
    await deleteDoc(docRef);

    // Update local storage
    const currentList = getStoredFeedback();
    const updated = currentList.filter((f) => f.id !== feedbackId);
    localStorage.setItem('trading_journal_feedback_list', JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete feedback from Firestore:', err);
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ----------------------------------------------------
// STRATEGIES COLLECTION SYNC
// ----------------------------------------------------
export function subscribeStrategiesFromFirestore(
  userEmail: string | undefined,
  onUpdate: (strategies: StrategyItem[]) => void
) {
  const path = 'strategies';
  const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
  try {
    const colRef = collection(db, path);
    const q = query(colRef, where('userEmail', '==', cleanEmail));
    return onSnapshot(
      q,
      (snapshot) => {
        const stratList: StrategyItem[] = [];
        snapshot.forEach((docSnap) => {
          stratList.push(docSnap.data() as StrategyItem);
        });
        stratList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        onUpdate(stratList);
      },
      (error) => {
        console.warn('Firestore strategies sync error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach strategies listener:', err);
    return () => {};
  }
}

export async function saveStrategyToFirestore(strategy: StrategyItem, userEmail?: string) {
  const path = 'strategies';
  try {
    const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
    const stratData = { ...strategy, userEmail: cleanEmail };
    const docId = cleanDocId(`${cleanEmail}_${strategy.id}`);
    const docRef = doc(db, path, docId);
    await setDoc(docRef, stratData, { merge: true });
  } catch (err) {
    console.warn('Failed to save strategy to Firestore:', err);
  }
}

export async function deleteStrategyFromFirestore(strategyId: string, userEmail?: string) {
  const path = 'strategies';
  try {
    const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
    const docId = cleanDocId(`${cleanEmail}_${strategyId}`);
    const docRef = doc(db, path, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete strategy from Firestore:', err);
  }
}




// ----------------------------------------------------
// RULES COLLECTION SYNC
// ----------------------------------------------------
export function subscribeRulesFromFirestore(
  userEmail: string | undefined,
  onUpdate: (rules: TradingRule[]) => void
) {
  const path = 'rules';
  const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
  try {
    const colRef = collection(db, path);
    const q = query(colRef, where('userEmail', '==', cleanEmail));
    return onSnapshot(
      q,
      (snapshot) => {
        const rulesList: TradingRule[] = [];
        snapshot.forEach((docSnap) => {
          rulesList.push(docSnap.data() as TradingRule);
        });
        onUpdate(rulesList);
      },
      (error) => {
        console.warn('Firestore rules sync error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach rules listener:', err);
    return () => {};
  }
}

export async function saveRuleToFirestore(rule: TradingRule, userEmail?: string) {
  const path = 'rules';
  try {
    const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
    const ruleData = { ...rule, userEmail: cleanEmail };
    const docId = cleanDocId(`${cleanEmail}_${rule.id}`);
    const docRef = doc(db, path, docId);
    await setDoc(docRef, ruleData, { merge: true });
  } catch (err) {
    console.warn('Failed to save rule to Firestore:', err);
  }
}

export async function deleteRuleFromFirestore(ruleId: string, userEmail?: string) {
  const path = 'rules';
  try {
    const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
    const docId = cleanDocId(`${cleanEmail}_${ruleId}`);
    const docRef = doc(db, path, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete rule from Firestore:', err);
  }
}

// ----------------------------------------------------
// GOALS COLLECTION SYNC
// ----------------------------------------------------
export function subscribeGoalsFromFirestore(
  userEmail: string | undefined,
  onUpdate: (goals: TradingGoal[]) => void
) {
  const path = 'goals';
  const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
  try {
    const colRef = collection(db, path);
    const q = query(colRef, where('userEmail', '==', cleanEmail));
    return onSnapshot(
      q,
      (snapshot) => {
        const goalsList: TradingGoal[] = [];
        snapshot.forEach((docSnap) => {
          goalsList.push(docSnap.data() as TradingGoal);
        });
        onUpdate(goalsList);
      },
      (error) => {
        console.warn('Firestore goals sync error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach goals listener:', err);
    return () => {};
  }
}

export async function saveGoalToFirestore(goal: TradingGoal, userEmail?: string) {
  const path = 'goals';
  try {
    const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
    const goalData = { ...goal, userEmail: cleanEmail };
    const docId = cleanDocId(`${cleanEmail}_${goal.id}`);
    const docRef = doc(db, path, docId);
    await setDoc(docRef, goalData, { merge: true });
  } catch (err) {
    console.warn('Failed to save goal to Firestore:', err);
  }
}

export async function deleteGoalFromFirestore(goalId: string, userEmail?: string) {
  const path = 'goals';
  try {
    const cleanEmail = (userEmail || 'Student').trim().toLowerCase();
    const docId = cleanDocId(`${cleanEmail}_${goalId}`);
    const docRef = doc(db, path, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete goal from Firestore:', err);
  }
}
