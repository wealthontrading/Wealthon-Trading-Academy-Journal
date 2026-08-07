import { BrokerRequest, StudentAccount, SystemMaintenanceState, UserSession } from '../types';
import { clearAllStudentsFromFirestore, deleteStudentFromFirestore, saveBrokerRequestToFirestore, saveMaintenanceModeToFirestore, saveStudentToFirestore } from './firebaseSync';

const STUDENTS_STORAGE_KEY = 'trading_journal_students_list';
const SESSION_STORAGE_KEY = 'trading_journal_active_session';
const MAINTENANCE_STORAGE_KEY = 'trading_journal_maintenance_state';

export const ADMIN_CREDENTIALS = {
  email: 'admin@tradejournal.in',
  adminId: 'admin',
  password: '@WealthOn2026',
};

export const ADMIN_MPIN = '246788';

const DEFAULT_STUDENTS: StudentAccount[] = [];

export function getStoredStudents(): StudentAccount[] {
  const data = localStorage.getItem(STUDENTS_STORAGE_KEY);
  if (!data) {
    return [];
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredStudents(students: StudentAccount[]): void {
  localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  if (Array.isArray(students)) {
    students.forEach((std) => saveStudentToFirestore(std));
  }
}

export function registerStudentRequest(email: string, name: string, password?: string): { success: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { success: false, message: 'Email address is required.' };

  const students = getStoredStudents();
  const existing = students.find((s) => s.email.toLowerCase() === cleanEmail);

  if (existing) {
    if (existing.status === 'approved') {
      return { success: false, message: 'This email is already registered and approved! Please log in directly.' };
    }
    if (existing.status === 'pending') {
      return { success: false, message: 'This email request is currently pending Admin approval.' };
    }
    return { success: false, message: 'This student account has been disabled or rejected by Admin.' };
  }

  const newStudent: StudentAccount = {
    id: 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    email: cleanEmail,
    name: name.trim() || cleanEmail.split('@')[0],
    password: password || 'student123',
    status: 'pending',
    registeredAt: Date.now(),
  };

  const updated = [newStudent, ...students];
  saveStoredStudents(updated);
  saveStudentToFirestore(newStudent);

  return {
    success: true,
    message: 'Your request has been submitted successfully! Please ask your Admin to approve your email ID.',
  };
}

export function adminAddAndApproveStudent(
  email: string,
  name: string,
  password?: string
): { success: boolean; message: string; student?: StudentAccount } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { success: false, message: 'Email address is required.' };

  const students = getStoredStudents();
  const existingIdx = students.findIndex((s) => s.email.toLowerCase() === cleanEmail);
  const oneYearExpiry = Date.now() + 365 * 24 * 60 * 60 * 1000;

  if (existingIdx >= 0) {
    const updated = [...students];
    updated[existingIdx] = {
      ...updated[existingIdx],
      status: 'approved',
      approvedAt: Date.now(),
      expiryDate: updated[existingIdx].expiryDate || oneYearExpiry,
      name: name.trim() || updated[existingIdx].name,
      password: password ? password : updated[existingIdx].password,
    };
    saveStoredStudents(updated);
    saveStudentToFirestore(updated[existingIdx]);
    return { success: true, message: `Updated and approved ${cleanEmail}!`, student: updated[existingIdx] };
  }

  const newStudent: StudentAccount = {
    id: 'std_' + Date.now(),
    email: cleanEmail,
    name: name.trim() || cleanEmail.split('@')[0],
    password: password || 'student123',
    status: 'approved',
    registeredAt: Date.now(),
    approvedAt: Date.now(),
    expiryDate: oneYearExpiry,
  };

  const updated = [newStudent, ...students];
  saveStoredStudents(updated);
  saveStudentToFirestore(newStudent);
  return { success: true, message: `Successfully registered and approved student ${cleanEmail}!`, student: newStudent };
}

export function adminUpdateStudentStatus(
  email: string,
  status: 'approved' | 'pending' | 'rejected' | 'disabled',
  newPassword?: string,
  renew: boolean = false
): StudentAccount[] {
  const students = getStoredStudents();
  let updatedStudent: StudentAccount | undefined;
  const updated = students.map((s) => {
    if (s.email.toLowerCase() === email.trim().toLowerCase()) {
      const now = Date.now();
      const oneYearExpiry = now + 365 * 24 * 60 * 60 * 1000;
      
      let newExpiryDate = s.expiryDate;
      if (status === 'approved') {
        if (!s.expiryDate || renew) {
          newExpiryDate = oneYearExpiry;
        }
      }

      const res = {
        ...s,
        status,
        approvedAt: status === 'approved' && (!s.approvedAt || renew) ? now : s.approvedAt,
        expiryDate: newExpiryDate,
        password: newPassword ? newPassword : s.password,
      };
      updatedStudent = res;
      return res;
    }
    return s;
  });
  saveStoredStudents(updated);
  if (updatedStudent) {
    saveStudentToFirestore(updatedStudent);
  }
  return updated;
}

export function adminUpdateStudentDates(
  email: string,
  approvedAt: number | undefined,
  expiryDate: number | undefined
): StudentAccount[] {
  const students = getStoredStudents();
  let updatedStudent: StudentAccount | undefined;
  const updated = students.map((s) => {
    if (s.email.toLowerCase() === email.trim().toLowerCase()) {
      const res = {
        ...s,
        approvedAt: approvedAt !== undefined ? approvedAt : s.approvedAt,
        expiryDate: expiryDate !== undefined ? expiryDate : s.expiryDate,
      };
      updatedStudent = res;
      return res;
    }
    return s;
  });
  saveStoredStudents(updated);
  if (updatedStudent) {
    saveStudentToFirestore(updatedStudent);
  }
  return updated;
}

export function adminDeleteStudent(email: string): StudentAccount[] {
  const students = getStoredStudents();
  const updated = students.filter((s) => s.email.toLowerCase() !== email.trim().toLowerCase());
  saveStoredStudents(updated);
  deleteStudentFromFirestore(email);
  // Also clean local data immediately
  localStorage.removeItem(`trading_journal_trades_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  localStorage.removeItem(`trading_journal_notes_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  localStorage.removeItem(`trading_journal_goals_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  localStorage.removeItem(`trading_journal_rules_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  localStorage.removeItem(`trading_journal_broker_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  return updated;
}

export function clearAllStudents(): StudentAccount[] {
  localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify([]));
  clearAllStudentsFromFirestore();
  return [];
}

export function authenticateStudent(
  email: string,
  password?: string
): { success: boolean; message: string; session?: UserSession } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { success: false, message: 'Please enter your email ID.' };

  const students = getStoredStudents();
  const student = students.find((s) => s.email.toLowerCase() === cleanEmail);

  if (!student) {
    return {
      success: false,
      message: 'Student Email ID not found. Please submit a request or ask Admin to register your email.',
    };
  }

  if (student.status === 'pending') {
    return {
      success: false,
      message: 'Your email ID is pending Admin approval. Please ask your Admin to approve your account.',
    };
  }

  if (student.status === 'disabled' || student.status === 'rejected') {
    return {
      success: false,
      message: 'Your student account has been disabled. Contact Admin for support.',
    };
  }

  // Check password if provided
  if (password && student.password && password !== student.password) {
    return {
      success: false,
      message: 'Incorrect password for this student account. Try default "student123" or contact Admin.',
    };
  }

  const session: UserSession = {
    email: student.email,
    name: student.name,
    role: 'student',
    plan: 'Active Plan - Limited',
    expiryDate: student.expiryDate,
  };

  saveStoredSession(session);
  return { success: true, message: `Welcome back, ${student.name}!`, session };
}

export function authenticateAdmin(
  adminIdOrEmail: string,
  passwordInput: string,
  mpinInput?: string
): { success: boolean; message: string; requiresMpin?: boolean; session?: UserSession } {
  const input = adminIdOrEmail.trim().toLowerCase();
  const isValidCredentials =
    (input === ADMIN_CREDENTIALS.email.toLowerCase() || input === ADMIN_CREDENTIALS.adminId.toLowerCase()) &&
    passwordInput === ADMIN_CREDENTIALS.password;

  if (!isValidCredentials) {
    return { success: false, message: 'Invalid Admin ID or Password.' };
  }

  if (!mpinInput) {
    return {
      success: false,
      requiresMpin: true,
      message: 'ID & Password verified! Please enter your 6-digit Security MPIN.',
    };
  }

  if (mpinInput.trim() !== ADMIN_MPIN) {
    return {
      success: false,
      requiresMpin: true,
      message: 'Incorrect MPIN Number! Please enter the correct 6-digit Security MPIN.',
    };
  }

  const session: UserSession = {
    email: ADMIN_CREDENTIALS.email,
    name: 'System Admin',
    role: 'admin',
    plan: 'Admin Control Center',
  };
  saveStoredSession(session);
  return { success: true, message: 'Admin authenticated successfully with MPIN safety!', session };
}

export function getStoredSession(): UserSession | null {
  const data = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveStoredSession(session: UserSession | null): void {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
}

export function getStoredMaintenanceState(): SystemMaintenanceState {
  const data = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
  if (!data) {
    return {
      isMaintenanceActive: false,
      title: 'System Under Maintenance',
      message: 'Our technical team is performing scheduled maintenance and updates. Please wait or check back shortly.',
      reason: 'Scheduled System Upgrade',
      estimatedDuration: '15-30 Minutes',
    };
  }
  try {
    return JSON.parse(data);
  } catch {
    return {
      isMaintenanceActive: false,
      title: 'System Under Maintenance',
      message: 'Our technical team is performing scheduled maintenance and updates. Please wait or check back shortly.',
      reason: 'Scheduled System Upgrade',
      estimatedDuration: '15-30 Minutes',
    };
  }
}

export function saveStoredMaintenanceState(state: SystemMaintenanceState): void {
  localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(state));
  saveMaintenanceModeToFirestore(state);
  // Dispatch local window event for real-time reactive update across tabs/components
  window.dispatchEvent(new CustomEvent('maintenance_state_changed', { detail: state }));
}

// ----------------------------------------------------
// BROKER REQUESTS STORAGE HELPERS
// ----------------------------------------------------
const BROKER_REQUESTS_KEY = 'trading_journal_broker_requests';

export function getStoredBrokerRequests(): BrokerRequest[] {
  const data = localStorage.getItem(BROKER_REQUESTS_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredBrokerRequest(req: BrokerRequest): void {
  const list = getStoredBrokerRequests();
  const existingIdx = list.findIndex((r) => r.userEmail === req.userEmail);
  if (existingIdx >= 0) {
    list[existingIdx] = req;
  } else {
    list.unshift(req);
  }
  localStorage.setItem(BROKER_REQUESTS_KEY, JSON.stringify(list));
  saveBrokerRequestToFirestore(req);
  window.dispatchEvent(new CustomEvent('broker_requests_changed', { detail: list }));
}


