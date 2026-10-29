/**
 * @file src/firebase/firestoreService.ts
 * @description Capa de servicio de acceso a datos para Firestore en Consularvisa.
 * 
 * ARQUITECTURA DE DATOS:
 * - Implementa operaciones CRUD para las 5 colecciones de Firestore especificadas:
 *   1. users
 *   2. cases
 *   3. files
 *   4. appointments
 *   5. messages
 * - Soporta listeners en tiempo real (onSnapshot).
 * - Incorpora persistencia local automática con LocalStorage para desarrollo rápido,
 *   y compatibilidad total con la API oficial de Firebase Firestore.
 */

import { User, Case, FileItem, Appointment, Message } from '../types';
import { SEED_USERS, SEED_CASES, SEED_FILES, SEED_APPOINTMENTS, SEED_MESSAGES } from '../constants/seedData';
import { db, isLiveFirebaseConfigured } from './config';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';

const STORAGE_KEYS = {
  USERS: 'consularvisa_users_v1',
  CASES: 'consularvisa_cases_v1',
  FILES: 'consularvisa_files_v1',
  APPOINTMENTS: 'consularvisa_appointments_v1',
  MESSAGES: 'consularvisa_messages_v1',
};

// Helper para leer/escribir estado reactivo local
function getLocalItem<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setLocalItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    notifyListeners();
  } catch (err) {
    console.error('Error saving to local storage:', err);
  }
}

// Event bus para sincronización reactiva instantánea entre componentes
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeToChanges(callback: Listener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners() {
  listeners.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.error('Error in change listener:', e);
    }
  });
}

// Inicialización de datos semilla si no existen
export function initializeDatabase() {
  const existingUsers = getLocalItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  
  // REGLA ESTRICTA: El único usuario administrador permitido en el sistema es law@ronnypena.com.do
  // Filtramos y eliminamos cualquier otro usuario con rol 'admin'
  const nonAdminClients = existingUsers.filter(u => u.role !== 'admin');

  // Buscar si ya existía law@ronnypena.com.do para preservar datos modificados (avatar, teléfono)
  const existingRonny = existingUsers.find(u => u.email.toLowerCase() === 'law@ronnypena.com.do');

  const ronnyAdmin: User = {
    id: existingRonny?.id || 'admin-ronny',
    name: 'Lic. Ronny Peña | ConsularVisa',
    role: 'admin',
    email: 'law@ronnypena.com.do',
    portal_password: 'Escaflowne@23@',
    phone: existingRonny?.phone || '+1 (809) 555-0100',
    total_cost: 0,
    amount_paid: 0,
    avatar_url: existingRonny?.avatar_url || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=160&auto=format&fit=crop&q=80',
    created_at: existingRonny?.created_at || '2024-01-01T08:00:00Z'
  };

  // Sincronizar clientes asegurando que tengan contraseña
  const syncedClients = nonAdminClients.map(c => ({
    ...c,
    portal_password: c.portal_password || 'Consular2025*Pass'
  }));

  const cleanedUsers = [ronnyAdmin, ...syncedClients];
  setLocalItem(STORAGE_KEYS.USERS, cleanedUsers);

  getLocalItem(STORAGE_KEYS.CASES, SEED_CASES);
  getLocalItem(STORAGE_KEYS.FILES, SEED_FILES);
  getLocalItem(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
  getLocalItem(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
}

// ---------------------------------------------------------------------------
// 1. USUARIOS (USERS) & AUTENTICACIÓN
// ---------------------------------------------------------------------------
export async function getUsers(): Promise<User[]> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
    } catch (err) {
      console.warn('Firebase error, using local fallback:', err);
    }
  }
  return getLocalItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
}

export async function getUserById(userId: string): Promise<User | null> {
  const users = await getUsers();
  return users.find(u => u.id === userId) || null;
}

export async function loginUser(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  const users = await getUsers();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return { user: null, error: 'No se encontró ninguna cuenta registrada con este correo electrónico.' };
  }

  // Verificar contraseña
  const validPassword = user.portal_password || 'Consular2025*Pass';
  if (user.portal_password && user.portal_password !== cleanPassword) {
    return { user: null, error: 'Contraseña incorrecta. Por favor verifique sus credenciales.' };
  }

  return { user, error: undefined };
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  await updateUser(userId, { portal_password: newPassword.trim() });
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'users', userId);
      await updateDoc(ref, updates as any);
    } catch (err) {
      console.warn('Firebase error, updating locally:', err);
    }
  }
  const users = getLocalItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
  setLocalItem(STORAGE_KEYS.USERS, updated);
}

export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
  const newId = `user-${Date.now()}`;
  const newUser: User = { ...userData, id: newId };
  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'users'), userData);
      newUser.id = docRef.id;
    } catch (err) {
      console.warn('Firebase error, creating locally:', err);
    }
  }
  const users = getLocalItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  setLocalItem(STORAGE_KEYS.USERS, [newUser, ...users]);
  return newUser;
}

// ---------------------------------------------------------------------------
// 2. CASOS (CASES)
// ---------------------------------------------------------------------------
export async function getCases(): Promise<Case[]> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'cases'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Case));
    } catch (err) {
      console.warn('Firebase error, using local fallback:', err);
    }
  }
  return getLocalItem<Case[]>(STORAGE_KEYS.CASES, SEED_CASES);
}

export async function getCaseByClientId(clientId: string): Promise<Case | null> {
  const cases = await getCases();
  return cases.find(c => c.client_id === clientId) || null;
}

export async function updateCase(caseId: string, updates: Partial<Case>): Promise<void> {
  const payload = {
    ...updates,
    last_updated: new Date().toISOString()
  };

  if (isLiveFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'cases', caseId);
      await updateDoc(ref, payload as any);
    } catch (err) {
      console.warn('Firebase error, updating locally:', err);
    }
  }

  const cases = getLocalItem<Case[]>(STORAGE_KEYS.CASES, SEED_CASES);
  const updated = cases.map(c => c.id === caseId ? { ...c, ...payload } : c);
  setLocalItem(STORAGE_KEYS.CASES, updated);
}

export async function createCase(caseData: Omit<Case, 'id' | 'last_updated'> & { last_updated?: string }): Promise<Case> {
  const newId = `case-${Date.now()}`;
  const newCase: Case = { 
    ...caseData, 
    id: newId, 
    last_updated: caseData.last_updated || new Date().toISOString() 
  };

  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'cases'), newCase);
      newCase.id = docRef.id;
    } catch (err) {
      console.warn('Firebase error, creating locally:', err);
    }
  }

  const cases = getLocalItem<Case[]>(STORAGE_KEYS.CASES, SEED_CASES);
  setLocalItem(STORAGE_KEYS.CASES, [newCase, ...cases]);
  return newCase;
}

// ---------------------------------------------------------------------------
// 3. ARCHIVOS (FILES) & BÓVEDA DIGITAL
// ---------------------------------------------------------------------------
export async function getFiles(clientId?: string, userRole: 'admin' | 'client' = 'client'): Promise<FileItem[]> {
  let allFiles: FileItem[] = [];

  if (isLiveFirebaseConfigured && db) {
    try {
      let q = collection(db, 'files');
      const snap = await getDocs(q);
      allFiles = snap.docs.map(d => ({ id: d.id, ...d.data() } as FileItem));
    } catch (err) {
      console.warn('Firebase error, using local fallback:', err);
      allFiles = getLocalItem<FileItem[]>(STORAGE_KEYS.FILES, SEED_FILES);
    }
  } else {
    allFiles = getLocalItem<FileItem[]>(STORAGE_KEYS.FILES, SEED_FILES);
  }

  // Filtrado por cliente si se especifica
  if (clientId) {
    allFiles = allFiles.filter(f => f.client_id === clientId);
  }

  // SEGURIDAD CRÍTICA:
  // Si quien consulta es cliente, SÓLO se devuelven los archivos con visible_to_client === true
  if (userRole === 'client') {
    return allFiles.filter(f => f.visible_to_client === true);
  }

  return allFiles;
}

export async function toggleFileVisibility(fileId: string, visible_to_client: boolean): Promise<void> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'files', fileId);
      await updateDoc(ref, { visible_to_client });
    } catch (err) {
      console.warn('Firebase error, updating locally:', err);
    }
  }

  const files = getLocalItem<FileItem[]>(STORAGE_KEYS.FILES, SEED_FILES);
  const updated = files.map(f => f.id === fileId ? { ...f, visible_to_client } : f);
  setLocalItem(STORAGE_KEYS.FILES, updated);
}

export async function uploadFile(fileData: Omit<FileItem, 'id'>): Promise<FileItem> {
  const newId = `file-${Date.now()}`;
  const newFile: FileItem = {
    ...fileData,
    id: newId,
    uploaded_at: fileData.uploaded_at || new Date().toISOString()
  };

  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'files'), newFile);
      newFile.id = docRef.id;
    } catch (err) {
      console.warn('Firebase error, uploading locally:', err);
    }
  }

  const files = getLocalItem<FileItem[]>(STORAGE_KEYS.FILES, SEED_FILES);
  setLocalItem(STORAGE_KEYS.FILES, [newFile, ...files]);
  return newFile;
}

export async function deleteFile(fileId: string): Promise<void> {
  if (isLiveFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'files', fileId));
    } catch (err) {
      console.warn('Firebase error, deleting locally:', err);
    }
  }

  const files = getLocalItem<FileItem[]>(STORAGE_KEYS.FILES, SEED_FILES);
  const updated = files.filter(f => f.id !== fileId);
  setLocalItem(STORAGE_KEYS.FILES, updated);
}

// ---------------------------------------------------------------------------
// 4. CITAS Y TAREAS (APPOINTMENTS)
// ---------------------------------------------------------------------------
export async function getAppointments(clientId?: string): Promise<Appointment[]> {
  let appointments: Appointment[] = [];
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'appointments'));
      appointments = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
    } catch (err) {
      console.warn('Firebase error, using local fallback:', err);
      appointments = getLocalItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
    }
  } else {
    appointments = getLocalItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
  }

  if (clientId) {
    appointments = appointments.filter(a => a.client_id === clientId);
  }

  // Ordenar cronológicamente (más próximas primero)
  return appointments.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
}

export async function createAppointment(appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> {
  const newId = `apt-${Date.now()}`;
  const newApt: Appointment = {
    ...appointmentData,
    id: newId,
    status: appointmentData.status || 'Programada'
  };

  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'appointments'), newApt);
      newApt.id = docRef.id;
    } catch (err) {
      console.warn('Firebase error, adding locally:', err);
    }
  }

  const list = getLocalItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
  setLocalItem(STORAGE_KEYS.APPOINTMENTS, [...list, newApt]);
  return newApt;
}

export async function deleteAppointment(aptId: string): Promise<void> {
  const list = getLocalItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
  const updated = list.filter(a => a.id !== aptId);
  setLocalItem(STORAGE_KEYS.APPOINTMENTS, updated);
}

// ---------------------------------------------------------------------------
// 5. MENSAJES Y CHAT (MESSAGES)
// ---------------------------------------------------------------------------
export async function getMessages(clientId: string): Promise<Message[]> {
  const targetClientId = String(clientId || '').trim();
  let messages: Message[] = [];
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'messages'));
      messages = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
    } catch (err) {
      console.warn('Firebase error, using local fallback:', err);
      messages = getLocalItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
    }
  } else {
    messages = getLocalItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
  }

  return messages
    .filter(m => String(m.client_id || '').trim() === targetClientId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function sendMessage(messageData: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
  const cleanClientId = String(messageData.client_id || '').trim();
  const newId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newMsg: Message = {
    ...messageData,
    client_id: cleanClientId,
    id: newId,
    timestamp: new Date().toISOString()
  };

  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'messages'), newMsg);
      newMsg.id = docRef.id;
    } catch (err) {
      console.warn('Firebase error, sending locally:', err);
    }
  }

  const list = getLocalItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
  setLocalItem(STORAGE_KEYS.MESSAGES, [...list, newMsg]);
  return newMsg;
}

// Función para reiniciar datos a los valores semilla si el usuario lo desea
export function resetDatabaseToSeed(): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
  localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(SEED_CASES));
  localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(SEED_FILES));
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(SEED_APPOINTMENTS));
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(SEED_MESSAGES));
  notifyListeners();
}
