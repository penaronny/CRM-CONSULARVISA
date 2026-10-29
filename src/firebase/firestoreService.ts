/**
 * @file src/firebase/firestoreService.ts
 * @description Capa de servicio de acceso a datos para Consularvisa.
 * 
 * ARQUITECTURA DE DATOS:
 * - Implementa operaciones CRUD para las 5 colecciones especificadas:
 *   1. users
 *   2. cases
 *   3. files
 *   4. appointments
 *   5. messages
 * - Sincronización Full-Stack: Se conecta a la API REST de Express (/api/*) garantizando que
 *   pestañas normales, modo incógnito y diferentes dispositivos compartan los mismos datos en tiempo real.
 * - BroadcastChannel y eventos reactivos para sincronización sub-milisegundo en navegadores modernos.
 * - Compatibilidad total con Firebase Firestore y fallback local robusto en LocalStorage.
 */

import { User, Case, FileItem, Appointment, Message } from '../types';
import { SEED_USERS, SEED_CASES, SEED_FILES, SEED_APPOINTMENTS, SEED_MESSAGES } from '../constants/seedData';
import { db, isLiveFirebaseConfigured } from './config';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  addDoc, 
  deleteDoc
} from 'firebase/firestore';

export const STORAGE_KEYS = {
  USERS: 'consularvisa_users_v1',
  CASES: 'consularvisa_cases_v1',
  FILES: 'consularvisa_files_v1',
  APPOINTMENTS: 'consularvisa_appointments_v1',
  MESSAGES: 'consularvisa_messages_v1',
};

// Canal de difusión en tiempo real entre pestañas y ventanas
const syncChannel: BroadcastChannel | null = 
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('consularvisa_sync_bus')
    : null;

// Helper para leer estado local
function getLocalItem<T>(key: string, defaultVal: T): T {
  try {
    if (typeof localStorage === 'undefined') return defaultVal;
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

// Helper para guardar estado local y notificar a componentes y otras pestañas
function setLocalItem<T>(key: string, val: T): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(val));
    }
    notifyListeners();
    syncChannel?.postMessage({ type: 'LOCAL_UPDATE', key });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('consularvisa_local_update', { detail: { key } }));
    }
  } catch (err) {
    console.error('Error saving to local storage:', err);
  }
}

// Event bus para sincronización reactiva instantánea en memoria
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

// Escuchar mensajes entrantes del BroadcastChannel
if (syncChannel) {
  syncChannel.onmessage = () => {
    notifyListeners();
  };
}

// Helper para asegurar que el único admin es law@ronnypena.com.do
function sanitizeUsers(usersList: User[]): User[] {
  const nonAdmins = usersList.filter(u => u.role !== 'admin');
  const existingRonny = usersList.find(u => u.email.toLowerCase() === 'law@ronnypena.com.do');
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

  const syncedClients = nonAdmins.map(c => ({
    ...c,
    portal_password: c.portal_password || 'Consular2025*Pass'
  }));

  return [ronnyAdmin, ...syncedClients];
}

// Inicialización de base de datos
export function initializeDatabase() {
  const existingUsers = getLocalItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  const cleanedUsers = sanitizeUsers(existingUsers);
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
  // 1. Intentar API REST compartida
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json() as User[];
        const sanitized = sanitizeUsers(data);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(sanitized));
        }
        return sanitized;
      }
    } catch {
      // API offline o en arranque, usar fallback local
    }
  }

  // 2. Firebase en vivo si está configurado
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return sanitizeUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    } catch (err) {
      console.warn('Firebase error, using local fallback:', err);
    }
  }

  return sanitizeUsers(getLocalItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS));
}

export async function getUserById(userId: string): Promise<User | null> {
  const users = await getUsers();
  const cleanId = String(userId || '').trim().toLowerCase();
  return users.find(u => u.id.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) || null;
}

export async function loginUser(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  const users = await getUsers();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return { user: null, error: 'No se encontró ninguna cuenta registrada con este correo electrónico.' };
  }

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
  // 1. API REST
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch { /* ignore */ }
  }

  // 2. Firebase
  if (isLiveFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'users', userId);
      await updateDoc(ref, updates as any);
    } catch (err) {
      console.warn('Firebase error, updating locally:', err);
    }
  }

  // 3. Almacenamiento local
  const users = getLocalItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
  setLocalItem(STORAGE_KEYS.USERS, updated);
}

export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
  const newId = `user-${Date.now()}`;
  let newUser: User = { ...userData, id: newId };

  // 1. API REST
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        newUser = await res.json() as User;
      }
    } catch (err) {
      console.warn('API error creating user, using local:', err);
    }
  }

  // 2. Firebase
  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'users'), userData);
      newUser.id = docRef.id;
    } catch (err) {
      console.warn('Firebase error, creating locally:', err);
    }
  }

  // 3. Local
  const users = getLocalItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  setLocalItem(STORAGE_KEYS.USERS, [newUser, ...users.filter(u => u.id !== newUser.id)]);
  return newUser;
}

// ---------------------------------------------------------------------------
// 2. CASOS (CASES)
// ---------------------------------------------------------------------------
export async function getCases(): Promise<Case[]> {
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/cases', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json() as Case[];
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(data));
        }
        return data;
      }
    } catch { /* fallback */ }
  }

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
  const cleanId = String(clientId || '').trim().toLowerCase();
  return cases.find(c => c.client_id.toLowerCase() === cleanId) || null;
}

export async function updateCase(caseId: string, updates: Partial<Case>): Promise<void> {
  const payload = {
    ...updates,
    last_updated: new Date().toISOString()
  };

  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch(`/api/cases/${encodeURIComponent(caseId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch { /* fallback */ }
  }

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
  let newCase: Case = { 
    ...caseData, 
    id: newId, 
    last_updated: caseData.last_updated || new Date().toISOString() 
  };

  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData)
      });
      if (res.ok) {
        newCase = await res.json() as Case;
      }
    } catch { /* fallback */ }
  }

  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'cases'), newCase);
      newCase.id = docRef.id;
    } catch (err) {
      console.warn('Firebase error, creating locally:', err);
    }
  }

  const cases = getLocalItem<Case[]>(STORAGE_KEYS.CASES, SEED_CASES);
  setLocalItem(STORAGE_KEYS.CASES, [newCase, ...cases.filter(c => c.id !== newCase.id)]);
  return newCase;
}

// ---------------------------------------------------------------------------
// 3. ARCHIVOS (FILES) & BÓVEDA DIGITAL
// ---------------------------------------------------------------------------
export async function getFiles(clientId?: string, role: 'admin' | 'client' = 'admin'): Promise<FileItem[]> {
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const url = new URL('/api/files', window.location.origin);
      if (clientId) url.searchParams.set('clientId', clientId);
      if (role === 'client') url.searchParams.set('role', 'client');
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        return await res.json() as FileItem[];
      }
    } catch { /* fallback */ }
  }

  let allFiles: FileItem[] = [];
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'files'));
      allFiles = snap.docs.map(d => ({ id: d.id, ...d.data() } as FileItem));
    } catch (err) {
      allFiles = getLocalItem<FileItem[]>(STORAGE_KEYS.FILES, SEED_FILES);
    }
  } else {
    allFiles = getLocalItem<FileItem[]>(STORAGE_KEYS.FILES, SEED_FILES);
  }

  if (clientId) {
    allFiles = allFiles.filter(f => f.client_id === clientId);
  }

  if (role === 'client') {
    allFiles = allFiles.filter(f => f.visible_to_client === true);
  }

  return allFiles;
}

export async function toggleFileVisibility(fileId: string, visible_to_client: boolean): Promise<void> {
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible_to_client })
      });
    } catch { /* fallback */ }
  }

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
  let newFile: FileItem = {
    ...fileData,
    id: newId,
    uploaded_at: fileData.uploaded_at || new Date().toISOString()
  };

  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData)
      });
      if (res.ok) {
        newFile = await res.json() as FileItem;
      }
    } catch { /* fallback */ }
  }

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
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch(`/api/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' });
    } catch { /* fallback */ }
  }

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
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const url = new URL('/api/appointments', window.location.origin);
      if (clientId) url.searchParams.set('clientId', clientId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        return await res.json() as Appointment[];
      }
    } catch { /* fallback */ }
  }

  let appointments: Appointment[] = [];
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'appointments'));
      appointments = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
    } catch {
      appointments = getLocalItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
    }
  } else {
    appointments = getLocalItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
  }

  if (clientId) {
    appointments = appointments.filter(a => a.client_id === clientId);
  }

  return appointments.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
}

export async function createAppointment(appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> {
  const newId = `apt-${Date.now()}`;
  let newApt: Appointment = {
    ...appointmentData,
    id: newId,
    status: appointmentData.status || 'Programada'
  };

  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });
      if (res.ok) {
        newApt = await res.json() as Appointment;
      }
    } catch { /* fallback */ }
  }

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
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch(`/api/appointments/${encodeURIComponent(aptId)}`, { method: 'DELETE' });
    } catch { /* fallback */ }
  }

  const list = getLocalItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
  const updated = list.filter(a => a.id !== aptId);
  setLocalItem(STORAGE_KEYS.APPOINTMENTS, updated);
}

// ---------------------------------------------------------------------------
// 5. MENSAJES Y CHAT (MESSAGES) - ALTA DISPONIBILIDAD Y SINCRONIZACIÓN EN TIEMPO REAL
// ---------------------------------------------------------------------------
export async function getMessages(clientId: string): Promise<Message[]> {
  const targetClientId = String(clientId || '').trim();
  if (!targetClientId) return [];

  // 1. Intento por API REST compartida (garantiza sincronización entre incógnito/otras pestañas)
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch(`/api/messages?clientId=${encodeURIComponent(targetClientId)}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const serverMessages = await res.json() as Message[];
        // Combinar en caché local para persistencia offline
        const local = getLocalItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
        const map = new Map<string, Message>();
        local.forEach(m => map.set(m.id, m));
        serverMessages.forEach(m => map.set(m.id, m));
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(Array.from(map.values())));
          }
        } catch { /* ignore */ }
        return serverMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
    } catch {
      // Usar fallback local si API falla
    }
  }

  // 2. Fallback de Firebase Firestore si está activo
  let messages: Message[] = [];
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'messages'));
      messages = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
    } catch (err) {
      messages = getLocalItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
    }
  } else {
    messages = getLocalItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
  }

  const cleanTarget = targetClientId.toLowerCase();
  return messages
    .filter(m => String(m.client_id || '').trim().toLowerCase() === cleanTarget)
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

  // 1. Guardar localmente de inmediato para actualización optimista
  const list = getLocalItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
  setLocalItem(STORAGE_KEYS.MESSAGES, [...list, newMsg]);

  // 2. Transmitir inmediatamente vía BroadcastChannel para pestañas del mismo navegador
  syncChannel?.postMessage({ 
    type: 'NEW_CHAT_MESSAGE', 
    clientId: cleanClientId,
    message: newMsg 
  });

  // 3. Persistir en el servidor Full-Stack vía API REST
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: cleanClientId,
          sender: messageData.sender,
          text: messageData.text
        })
      });
      if (res.ok) {
        const savedServerMsg = await res.json() as Message;
        const currentList = getLocalItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
        const updated = currentList.map(m => m.id === newId ? savedServerMsg : m);
        if (!updated.some(m => m.id === savedServerMsg.id)) {
          updated.push(savedServerMsg);
        }
        setLocalItem(STORAGE_KEYS.MESSAGES, updated);
        return savedServerMsg;
      }
    } catch (e) {
      console.warn('API sync warning, saved locally:', e);
    }
  }

  // 4. Enviar a Firebase si está activo
  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'messages'), newMsg);
      newMsg.id = docRef.id;
    } catch (err) {
      console.warn('Firebase error, sending locally:', err);
    }
  }

  return newMsg;
}

// Función para reiniciar datos a los valores semilla
export function resetDatabaseToSeed(): void {
  try {
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      fetch('/api/reset', { method: 'POST' }).catch(() => {});
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(SEED_CASES));
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(SEED_FILES));
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(SEED_APPOINTMENTS));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(SEED_MESSAGES));
    }
    notifyListeners();
  } catch (err) {
    console.error('Error resetting database:', err);
  }
}
