/**
 * @file src/firebase/firestoreService.ts
 * @description Capa de servicio de acceso a datos para Consularvisa con Firebase Firestore en tiempo real.
 * 
 * ARQUITECTURA DE SINCRONIZACIÓN EN LA NUBE:
 * - Firestore en la nube (Proyecto: gen-lang-client-0352393975):
 *   Colecciones: users, cases, files, appointments, messages.
 * - Sincronización en Tiempo Real bidireccional mediante listeners onSnapshot:
 *   Cualquier cambio realizado por el abogado o cliente en cualquier computadora
 *   se refleja inmediatamente en todos los dispositivos conectados.
 * - Auto-sembrado determinista en Firestore si la base de datos está vacía.
 * - Persistencia Full-Stack en Express (/api/*) y LocalStorage como caché de alta velocidad.
 */

import { User, Case, FileItem, Appointment, Message } from '../types';
import { SEED_USERS, SEED_CASES, SEED_FILES, SEED_APPOINTMENTS, SEED_MESSAGES } from '../constants/seedData';
import { db, isLiveFirebaseConfigured } from './config';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc,
  updateDoc, 
  deleteDoc,
  onSnapshot,
  writeBatch
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

// Banderas de control de inicialización
let hasSeededFirestore = false;
let hasAttachedListeners = false;

// Inicialización de base de datos Full-Stack y Firestore
export async function initializeDatabase() {
  // 1. Cargar caché local inmediato para evitar parpadeos
  const existingUsers = getLocalItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  const cleanedUsers = sanitizeUsers(existingUsers);
  setLocalItem(STORAGE_KEYS.USERS, cleanedUsers);

  getLocalItem(STORAGE_KEYS.CASES, SEED_CASES);
  getLocalItem(STORAGE_KEYS.FILES, SEED_FILES);
  getLocalItem(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
  getLocalItem(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);

  // 2. Inicialización y sembrado en la nube Firestore si está disponible
  if (isLiveFirebaseConfigured && db && !hasSeededFirestore) {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        console.log('[Firestore Cloud] Base de datos vacía. Sembrando datos iniciales en la nube...');
        const batch = writeBatch(db);

        // Sembrar usuarios con IDs deterministas
        for (const u of SEED_USERS) {
          batch.set(doc(db, 'users', u.id), u);
        }
        // Sembrar casos
        for (const c of SEED_CASES) {
          batch.set(doc(db, 'cases', c.id), c);
        }
        // Sembrar archivos de la bóveda
        for (const f of SEED_FILES) {
          batch.set(doc(db, 'files', f.id), f);
        }
        // Sembrar citas
        for (const a of SEED_APPOINTMENTS) {
          batch.set(doc(db, 'appointments', a.id), a);
        }
        // Sembrar mensajes iniciales
        for (const m of SEED_MESSAGES) {
          batch.set(doc(db, 'messages', m.id), m);
        }

        await batch.commit();
        console.log('[Firestore Cloud] Datos iniciales sincronizados en la nube.');
      }
      hasSeededFirestore = true;
    } catch (err) {
      console.warn('[Firestore Cloud] Error al sembrar datos en la nube:', err);
    }
  }

  // 3. Suscripciones Reactivas en Tiempo Real con onSnapshot para multi-dispositivo
  if (isLiveFirebaseConfigured && db && !hasAttachedListeners && typeof window !== 'undefined') {
    hasAttachedListeners = true;
    try {
      // Mensajes en tiempo real
      onSnapshot(collection(db, 'messages'), (snapshot) => {
        if (!snapshot.empty) {
          const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
          setLocalItem(STORAGE_KEYS.MESSAGES, msgs);
        }
      }, (err) => console.warn('[Firestore] Error listener messages:', err));

      // Archivos en tiempo real
      onSnapshot(collection(db, 'files'), (snapshot) => {
        if (!snapshot.empty) {
          const fls = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FileItem));
          setLocalItem(STORAGE_KEYS.FILES, fls);
        }
      }, (err) => console.warn('[Firestore] Error listener files:', err));

      // Casos en tiempo real
      onSnapshot(collection(db, 'cases'), (snapshot) => {
        if (!snapshot.empty) {
          const cs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Case));
          setLocalItem(STORAGE_KEYS.CASES, cs);
        }
      }, (err) => console.warn('[Firestore] Error listener cases:', err));

      // Usuarios y Finanzas en tiempo real
      onSnapshot(collection(db, 'users'), (snapshot) => {
        if (!snapshot.empty) {
          const us = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
          setLocalItem(STORAGE_KEYS.USERS, sanitizeUsers(us));
        }
      }, (err) => console.warn('[Firestore] Error listener users:', err));

      // Citas en tiempo real
      onSnapshot(collection(db, 'appointments'), (snapshot) => {
        if (!snapshot.empty) {
          const aps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
          setLocalItem(STORAGE_KEYS.APPOINTMENTS, aps);
        }
      }, (err) => console.warn('[Firestore] Error listener appointments:', err));
    } catch (err) {
      console.warn('[Firestore] Error conectando listeners reactivos:', err);
    }
  }
}

// ---------------------------------------------------------------------------
// 1. USUARIOS (USERS) & AUTENTICACIÓN
// ---------------------------------------------------------------------------
export async function getUsers(): Promise<User[]> {
  // 1. Prioridad: Firebase Firestore en la nube
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        const firestoreUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
        const sanitized = sanitizeUsers(firestoreUsers);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(sanitized));
        }
        return sanitized;
      }
    } catch (err) {
      console.warn('Firebase getUsers warning:', err);
    }
  }

  // 2. Intentar API REST compartida
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
    } catch { /* fallback */ }
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
  // 1. Firebase Firestore en la nube
  if (isLiveFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'users', userId);
      await updateDoc(ref, updates as any);
    } catch (err) {
      console.warn('Firebase updateUser error:', err);
    }
  }

  // 2. API REST del servidor
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch { /* ignore */ }
  }

  // 3. Almacenamiento local optimista
  const users = getLocalItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
  setLocalItem(STORAGE_KEYS.USERS, updated);
}

export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
  const newId = `user-${Date.now()}`;
  let newUser: User = { ...userData, id: newId };

  // 1. Firebase Firestore
  if (isLiveFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'users', newId), newUser);
    } catch (err) {
      console.warn('Firebase createUser error:', err);
    }
  }

  // 2. API REST
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        newUser = await res.json() as User;
      }
    } catch (err) {
      console.warn('API error creating user:', err);
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
  // 1. Firestore en la nube
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'cases'));
      if (!snap.empty) {
        const firestoreCases = snap.docs.map(d => ({ id: d.id, ...d.data() } as Case));
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(firestoreCases));
        }
        return firestoreCases;
      }
    } catch (err) {
      console.warn('Firebase getCases error:', err);
    }
  }

  // 2. API REST
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

  // 1. Firebase Firestore
  if (isLiveFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'cases', caseId);
      await updateDoc(ref, payload as any);
    } catch (err) {
      console.warn('Firebase updateCase error:', err);
    }
  }

  // 2. API REST
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch(`/api/cases/${encodeURIComponent(caseId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch { /* fallback */ }
  }

  // 3. Local
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

  if (isLiveFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'cases', newId), newCase);
    } catch (err) {
      console.warn('Firebase createCase error:', err);
    }
  }

  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCase)
      });
      if (res.ok) {
        newCase = await res.json() as Case;
      }
    } catch { /* fallback */ }
  }

  const cases = getLocalItem<Case[]>(STORAGE_KEYS.CASES, SEED_CASES);
  setLocalItem(STORAGE_KEYS.CASES, [newCase, ...cases.filter(c => c.id !== newCase.id)]);
  return newCase;
}

// ---------------------------------------------------------------------------
// 3. ARCHIVOS (FILES) & BÓVEDA DIGITAL MULTI-DISPOSITIVO
// ---------------------------------------------------------------------------
export async function getFiles(clientId?: string, role: 'admin' | 'client' = 'admin'): Promise<FileItem[]> {
  let allFiles: FileItem[] = [];

  // 1. Firebase Firestore en la nube
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'files'));
      if (!snap.empty) {
        allFiles = snap.docs.map(d => ({ id: d.id, ...d.data() } as FileItem));
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(allFiles));
        }
      }
    } catch (err) {
      console.warn('Firebase getFiles error:', err);
    }
  }

  // 2. API REST del servidor
  if (allFiles.length === 0 && typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const url = new URL('/api/files', window.location.origin);
      if (clientId) url.searchParams.set('clientId', clientId);
      if (role === 'client') url.searchParams.set('role', 'client');
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        allFiles = await res.json() as FileItem[];
      }
    } catch { /* fallback */ }
  }

  // 3. Local fallback
  if (allFiles.length === 0) {
    allFiles = getLocalItem<FileItem[]>(STORAGE_KEYS.FILES, SEED_FILES);
  }

  if (clientId) {
    allFiles = allFiles.filter(f => f.client_id === clientId);
  }

  if (role === 'client') {
    allFiles = allFiles.filter(f => f.visible_to_client === true);
  }

  return allFiles.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
}

export async function toggleFileVisibility(fileId: string, visible_to_client: boolean): Promise<void> {
  // 1. Firebase Firestore
  if (isLiveFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'files', fileId);
      await updateDoc(ref, { visible_to_client });
    } catch (err) {
      console.warn('Firebase toggleFileVisibility error:', err);
    }
  }

  // 2. API REST
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible_to_client })
      });
    } catch { /* fallback */ }
  }

  // 3. Local
  const files = getLocalItem<FileItem[]>(STORAGE_KEYS.FILES, SEED_FILES);
  const updated = files.map(f => f.id === fileId ? { ...f, visible_to_client } : f);
  setLocalItem(STORAGE_KEYS.FILES, updated);
}

export async function uploadFile(fileData: Omit<FileItem, 'id'>): Promise<FileItem> {
  const newId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  let newFile: FileItem = {
    ...fileData,
    id: newId,
    uploaded_at: fileData.uploaded_at || new Date().toISOString()
  };

  // 1. Si viene con file_data (Base64 Data URL), enviar a /api/upload para persistencia en disco
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined' && fileData.file_data) {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileData.file_name,
          fileData: fileData.file_data,
          clientId: fileData.client_id,
          category: fileData.category,
          visibleToClient: fileData.visible_to_client,
          uploadedBy: fileData.uploaded_by
        })
      });
      if (res.ok) {
        const savedServerFile = await res.json() as FileItem;
        newFile = {
          ...savedServerFile,
          file_data: fileData.file_data // Retener base64 para vista previa instantánea
        };
      }
    } catch (err) {
      console.warn('API error uploading file:', err);
    }
  } else if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData)
      });
      if (res.ok) {
        newFile = await res.json() as FileItem;
      }
    } catch (err) {
      console.warn('API error creating file record:', err);
    }
  }

  // 2. Guardar en Firebase Firestore con ID determinista
  if (isLiveFirebaseConfigured && db) {
    try {
      // Excluir base64 gigantesco de Firestore si excede 700KB para respetar límites de documento
      const firestoreData: any = {
        id: newFile.id,
        client_id: newFile.client_id,
        file_name: newFile.file_name,
        file_url: newFile.file_url,
        file_size: newFile.file_size || '1.0 MB',
        category: newFile.category || 'Otros',
        uploaded_by: newFile.uploaded_by,
        uploaded_at: newFile.uploaded_at,
        visible_to_client: newFile.visible_to_client
      };
      if (newFile.file_data && newFile.file_data.length < 600000) {
        firestoreData.file_data = newFile.file_data;
      }
      await setDoc(doc(db, 'files', newFile.id), firestoreData);
    } catch (err) {
      console.warn('Firebase error uploading file:', err);
    }
  }

  // 3. Local
  const files = getLocalItem<FileItem[]>(STORAGE_KEYS.FILES, SEED_FILES);
  setLocalItem(STORAGE_KEYS.FILES, [newFile, ...files.filter(f => f.id !== newFile.id)]);
  return newFile;
}

export async function deleteFile(fileId: string): Promise<void> {
  // 1. Firebase Firestore
  if (isLiveFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'files', fileId));
    } catch (err) {
      console.warn('Firebase deleteFile error:', err);
    }
  }

  // 2. API REST
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch(`/api/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' });
    } catch { /* fallback */ }
  }

  // 3. Local
  const files = getLocalItem<FileItem[]>(STORAGE_KEYS.FILES, SEED_FILES);
  const updated = files.filter(f => f.id !== fileId);
  setLocalItem(STORAGE_KEYS.FILES, updated);
}

// ---------------------------------------------------------------------------
// 4. CITAS Y TAREAS (APPOINTMENTS)
// ---------------------------------------------------------------------------
export async function getAppointments(clientId?: string): Promise<Appointment[]> {
  let appointments: Appointment[] = [];

  // 1. Firebase Firestore
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'appointments'));
      if (!snap.empty) {
        appointments = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
      }
    } catch { /* fallback */ }
  }

  // 2. API REST
  if (appointments.length === 0 && typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const url = new URL('/api/appointments', window.location.origin);
      if (clientId) url.searchParams.set('clientId', clientId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        appointments = await res.json() as Appointment[];
      }
    } catch { /* fallback */ }
  }

  // 3. Local fallback
  if (appointments.length === 0) {
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

  if (isLiveFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'appointments', newId), newApt);
    } catch (err) {
      console.warn('Firebase createAppointment error:', err);
    }
  }

  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApt)
      });
      if (res.ok) {
        newApt = await res.json() as Appointment;
      }
    } catch { /* fallback */ }
  }

  const list = getLocalItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
  setLocalItem(STORAGE_KEYS.APPOINTMENTS, [...list, newApt]);
  return newApt;
}

export async function deleteAppointment(aptId: string): Promise<void> {
  if (isLiveFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'appointments', aptId));
    } catch (err) {
      console.warn('Firebase deleteAppointment error:', err);
    }
  }

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
// 5. BANDEJA DE ENTRADA Y COMUNICADOS (MESSAGES) - MULTI-DISPOSITIVO CLOUD
// ---------------------------------------------------------------------------
export async function getMessages(clientId: string): Promise<Message[]> {
  const targetClientId = String(clientId || '').trim().toLowerCase();
  if (!targetClientId) return [];

  let messages: Message[] = [];

  // 1. Firebase Firestore en la nube
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'messages'));
      if (!snap.empty) {
        messages = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      }
    } catch (err) {
      console.warn('Firebase getMessages error:', err);
    }
  }

  // 2. API REST del servidor
  if (messages.length === 0 && typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch(`/api/messages?clientId=${encodeURIComponent(targetClientId)}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        messages = await res.json() as Message[];
      }
    } catch { /* fallback */ }
  }

  // 3. Caché local de contingencia
  if (messages.length === 0) {
    messages = getLocalItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
  }

  return messages
    .filter(m => String(m.client_id || '').trim().toLowerCase() === targetClientId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function sendMessage(messageData: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
  const cleanClientId = String(messageData.client_id || '').trim();
  const newId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newMsg: Message = {
    ...messageData,
    client_id: cleanClientId,
    id: newId,
    timestamp: new Date().toISOString(),
    read: false
  };

  // 1. Guardar localmente de inmediato para UI optimista
  const list = getLocalItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
  setLocalItem(STORAGE_KEYS.MESSAGES, [...list, newMsg]);

  // 2. Transmitir en Firebase Firestore en la nube para sincronización instantánea entre computadoras
  if (isLiveFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'messages', newId), newMsg);
    } catch (err) {
      console.warn('Firebase sendMessage error:', err);
    }
  }

  // 3. Sincronizar vía API REST
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: cleanClientId,
          sender: messageData.sender,
          subject: messageData.subject,
          text: messageData.text
        })
      });
    } catch (e) {
      console.warn('API sync warning:', e);
    }
  }

  // 4. Transmitir inmediatamente vía BroadcastChannel para pestañas del mismo navegador
  syncChannel?.postMessage({ 
    type: 'NEW_CHAT_MESSAGE', 
    clientId: cleanClientId,
    message: newMsg 
  });

  notifyListeners();
  return newMsg;
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  if (isLiveFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'messages', messageId), { read: true });
    } catch (err) {
      console.warn('Firebase markMessageAsRead error:', err);
    }
  }

  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch(`/api/messages/${encodeURIComponent(messageId)}/read`, { method: 'PUT' });
    } catch { /* ignore */ }
  }

  const list = getLocalItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
  const updated = list.map(m => m.id === messageId ? { ...m, read: true } : m);
  setLocalItem(STORAGE_KEYS.MESSAGES, updated);
}

export async function deleteMessage(messageId: string): Promise<void> {
  if (isLiveFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (err) {
      console.warn('Firebase deleteMessage error:', err);
    }
  }

  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch(`/api/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' });
    } catch { /* ignore */ }
  }

  const list = getLocalItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
  const updated = list.filter(m => m.id !== messageId);
  setLocalItem(STORAGE_KEYS.MESSAGES, updated);
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
