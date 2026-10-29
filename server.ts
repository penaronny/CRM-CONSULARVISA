/**
 * @file server.ts
 * @description Servidor Full-Stack Express con Vite para Consularvisa CRM & Portal de Clientes.
 * 
 * Funcionalidades:
 * - API RESTful compartida para mensajes, usuarios, casos, archivos y citas.
 * - Sincronización en tiempo real para navegadores cruzados (cross-browser, incognito, móvil).
 * - Persistencia en disco local (data/db.json) para evitar pérdida de mensajes o datos entre recargas.
 * - Montaje de Vite middlewares en desarrollo y servicio estático en producción.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { SEED_USERS, SEED_CASES, SEED_FILES, SEED_APPOINTMENTS, SEED_MESSAGES } from './src/constants/seedData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Estructura de base de datos compartida
interface DatabaseState {
  users: typeof SEED_USERS;
  cases: typeof SEED_CASES;
  files: typeof SEED_FILES;
  appointments: typeof SEED_APPOINTMENTS;
  messages: typeof SEED_MESSAGES;
}

// Cargar o inicializar base de datos
function loadDatabase(): DatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content) as DatabaseState;
      // Garantizar que law@ronnypena.com.do sea el único admin
      if (parsed.users) {
        parsed.users = parsed.users.filter(u => u.role !== 'admin' || u.email.toLowerCase() === 'law@ronnypena.com.do');
        const hasRonny = parsed.users.some(u => u.email.toLowerCase() === 'law@ronnypena.com.do');
        if (!hasRonny) {
          const ronny = SEED_USERS.find(u => u.email.toLowerCase() === 'law@ronnypena.com.do');
          if (ronny) parsed.users.unshift(ronny);
        }
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error loading DB file, seeding fresh:', err);
  }

  // Semilla inicial
  const initialState: DatabaseState = {
    users: SEED_USERS,
    cases: SEED_CASES,
    files: SEED_FILES,
    appointments: SEED_APPOINTMENTS,
    messages: SEED_MESSAGES,
  };
  saveDatabase(initialState);
  return initialState;
}

function saveDatabase(state: DatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

let dbState = loadDatabase();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '15mb' }));

  // Middleware CORS y cabeceras anti-cache para endpoints de API
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // -------------------------------------------------------------------------
  // ENDPOINTS DE MENSAJES (CHAT LEGAL)
  // -------------------------------------------------------------------------
  app.get('/api/messages', (req: Request, res: Response) => {
    const { clientId } = req.query;
    let msgs = [...dbState.messages];
    if (clientId) {
      const cleanId = String(clientId).trim().toLowerCase();
      // Permitir coincidencia por clientId o email del cliente
      const targetUser = dbState.users.find(u => u.id.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId);
      const matchIds = new Set<string>([cleanId]);
      if (targetUser) {
        matchIds.add(targetUser.id.toLowerCase());
        matchIds.add(targetUser.email.toLowerCase());
      }
      msgs = msgs.filter(m => matchIds.has(String(m.client_id || '').trim().toLowerCase()));
    }
    msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    res.json(msgs);
  });

  app.post('/api/messages', (req: Request, res: Response) => {
    const { client_id, sender, text } = req.body;
    if (!client_id || !text || !sender) {
      res.status(400).json({ error: 'client_id, sender and text are required' });
      return;
    }

    const cleanClientId = String(client_id).trim();
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      client_id: cleanClientId,
      sender: sender === 'client' ? ('client' as const) : ('admin' as const),
      text: String(text).trim(),
      timestamp: new Date().toISOString(),
    };

    dbState.messages.push(newMsg);
    saveDatabase(dbState);
    res.status(201).json(newMsg);
  });

  // -------------------------------------------------------------------------
  // ENDPOINTS DE USUARIOS (USERS)
  // -------------------------------------------------------------------------
  app.get('/api/users', (req: Request, res: Response) => {
    res.json(dbState.users);
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const userData = req.body;
    const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newUser = {
      ...userData,
      id: newId,
      created_at: userData.created_at || new Date().toISOString(),
    };

    dbState.users.unshift(newUser);
    saveDatabase(dbState);
    res.status(201).json(newUser);
  });

  app.put('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const index = dbState.users.findIndex(u => u.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    dbState.users[index] = { ...dbState.users[index], ...updates };
    saveDatabase(dbState);
    res.json(dbState.users[index]);
  });

  // -------------------------------------------------------------------------
  // ENDPOINTS DE CASOS (CASES)
  // -------------------------------------------------------------------------
  app.get('/api/cases', (req: Request, res: Response) => {
    res.json(dbState.cases);
  });

  app.post('/api/cases', (req: Request, res: Response) => {
    const caseData = req.body;
    const newId = `case-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCase = {
      ...caseData,
      id: newId,
      last_updated: caseData.last_updated || new Date().toISOString(),
    };

    dbState.cases.unshift(newCase);
    saveDatabase(dbState);
    res.status(201).json(newCase);
  });

  app.put('/api/cases/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const index = dbState.cases.findIndex(c => c.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    dbState.cases[index] = {
      ...dbState.cases[index],
      ...updates,
      last_updated: new Date().toISOString(),
    };
    saveDatabase(dbState);
    res.json(dbState.cases[index]);
  });

  // -------------------------------------------------------------------------
  // ENDPOINTS DE ARCHIVOS (FILES)
  // -------------------------------------------------------------------------
  app.get('/api/files', (req: Request, res: Response) => {
    const { clientId, role } = req.query;
    let list = [...dbState.files];
    if (clientId) {
      list = list.filter(f => f.client_id === clientId);
    }
    if (role === 'client') {
      list = list.filter(f => f.visible_to_client === true);
    }
    res.json(list);
  });

  app.post('/api/files', (req: Request, res: Response) => {
    const fileData = req.body;
    const newId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newFile = {
      ...fileData,
      id: newId,
      uploaded_at: fileData.uploaded_at || new Date().toISOString(),
    };

    dbState.files.unshift(newFile);
    saveDatabase(dbState);
    res.status(201).json(newFile);
  });

  app.put('/api/files/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const index = dbState.files.findIndex(f => f.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    dbState.files[index] = { ...dbState.files[index], ...updates };
    saveDatabase(dbState);
    res.json(dbState.files[index]);
  });

  app.delete('/api/files/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    dbState.files = dbState.files.filter(f => f.id !== id);
    saveDatabase(dbState);
    res.json({ success: true });
  });

  // -------------------------------------------------------------------------
  // ENDPOINTS DE CITAS (APPOINTMENTS)
  // -------------------------------------------------------------------------
  app.get('/api/appointments', (req: Request, res: Response) => {
    const { clientId } = req.query;
    let list = [...dbState.appointments];
    if (clientId) {
      list = list.filter(a => a.client_id === clientId);
    }
    list.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
    res.json(list);
  });

  app.post('/api/appointments', (req: Request, res: Response) => {
    const aptData = req.body;
    const newId = `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newApt = {
      ...aptData,
      id: newId,
      status: aptData.status || 'Programada',
    };

    dbState.appointments.push(newApt);
    saveDatabase(dbState);
    res.status(201).json(newApt);
  });

  app.delete('/api/appointments/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    dbState.appointments = dbState.appointments.filter(a => a.id !== id);
    saveDatabase(dbState);
    res.json({ success: true });
  });

  // Reset database endpoint
  app.post('/api/reset', (req: Request, res: Response) => {
    dbState = {
      users: SEED_USERS,
      cases: SEED_CASES,
      files: SEED_FILES,
      appointments: SEED_APPOINTMENTS,
      messages: SEED_MESSAGES,
    };
    saveDatabase(dbState);
    res.json({ success: true });
  });

  // -------------------------------------------------------------------------
  // INTEGRACIÓN VITE (DEV MIDDLEWARES / PROD STATIC)
  // -------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Consularvisa Server] Activo y escuchando en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
