/**
 * @file src/firebase/config.ts
 * @description Modelo de conexión y configuración de Firebase para Consularvisa.
 * 
 * SERVICIOS CONFIGURADOS:
 * 1. Firebase Authentication: Control de acceso para administradores y clientes con RBAC.
 * 2. Cloud Firestore: Base de datos NoSQL escalable para colecciones:
 *    - /users/{userId}
 *    - /cases/{caseId}
 *    - /files/{fileId}
 *    - /appointments/{appointmentId}
 *    - /messages/{messageId}
 * 3. Firebase Storage: Almacenamiento seguro de documentos con URLs firmadas y reglas de visibilidad.
 * 
 * GUÍA DE ESCALABILIDAD EN PRODUCCIÓN:
 * - Para producción, configure las variables de entorno en su archivo `.env`:
 *   VITE_FIREBASE_API_KEY=AIzaSy...
 *   VITE_FIREBASE_AUTH_DOMAIN=consularvisa-app.firebaseapp.com
 *   VITE_FIREBASE_PROJECT_ID=consularvisa-app
 *   VITE_FIREBASE_STORAGE_BUCKET=consularvisa-app.appspot.com
 *   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
 *   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
 * 
 * - Si no se detectan variables de producción (entorno de pruebas/desarrollo),
 *   el sistema activa de forma transparente un Adaptador de Datos Reactivo con
 *   persistencia en almacenamiento local, manteniendo las mismas firmas asíncronas
 *   y contratos de datos de Firebase.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Configuración leída de variables de entorno de Vite
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-consularvisa-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'consularvisa-crm.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'consularvisa-crm',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'consularvisa-crm.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '999123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:999123456789:web:a1b2c3d4e5f6g7h8'
};

// Determina si las credenciales son de un proyecto real configurado
export const isLiveFirebaseConfigured: boolean = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('demo-')
);

// Inicialización de la aplicación Firebase
let app: FirebaseApp;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
} catch (error) {
  console.warn('[Firebase] Inicialización con configuración de demostración/local:', error);
  app = initializeApp(firebaseConfig, 'consularvisa-demo');
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
}

export { app, db, auth, storage };

/**
 * REGLAS DE SEGURIDAD FIRESTORE RECOMENDADAS PARA PRODUCCIÓN (firestore.rules):
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     
 *     function isAdmin() {
 *       return request.auth != null && 
 *              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
 *     }
 *     
 *     function isOwner(userId) {
 *       return request.auth != null && request.auth.uid == userId;
 *     }
 * 
 *     // Colección users: admin tiene control total; cliente puede leer su propio perfil
 *     match /users/{userId} {
 *       allow read: if isAdmin() || isOwner(userId);
 *       allow write: if isAdmin();
 *     }
 * 
 *     // Colección cases: admin lee/escribe; cliente solo lee su caso asignado
 *     match /cases/{caseId} {
 *       allow read: if isAdmin() || (request.auth != null && resource.data.client_id == request.auth.uid);
 *       allow write: if isAdmin();
 *     }
 * 
 *     // Colección files: el cliente NUNCA puede leer archivos con visible_to_client == false
 *     match /files/{fileId} {
 *       allow read: if isAdmin() || 
 *                   (request.auth != null && 
 *                    resource.data.client_id == request.auth.uid && 
 *                    resource.data.visible_to_client == true);
 *       allow create: if request.auth != null && 
 *                     (isAdmin() || request.resource.data.client_id == request.auth.uid);
 *       allow update, delete: if isAdmin();
 *     }
 * 
 *     // Colección appointments
 *     match /appointments/{aptId} {
 *       allow read: if isAdmin() || (request.auth != null && resource.data.client_id == request.auth.uid);
 *       allow write: if isAdmin();
 *     }
 * 
 *     // Colección messages
 *     match /messages/{msgId} {
 *       allow read: if isAdmin() || (request.auth != null && resource.data.client_id == request.auth.uid);
 *       allow create: if request.auth != null && 
 *                     (isAdmin() || request.resource.data.client_id == request.auth.uid);
 *     }
 *   }
 * }
 */
