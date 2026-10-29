import test from 'node:test';
import assert from 'node:assert/strict';
import { getMessages, sendMessage, initializeDatabase, getUsers } from './firestoreService.ts';

// Mock localStorage for Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    key: (index: number) => Object.keys(store)[index] || null,
    length: 0
  } as any;
}

test('initializeDatabase retains ONLY law@ronnypena.com.do as admin', async () => {
  initializeDatabase();
  const users = await getUsers();
  const admins = users.filter(u => u.role === 'admin');
  
  assert.equal(admins.length, 1, 'Only one administrator must exist');
  assert.equal(admins[0].email, 'law@ronnypena.com.do');
  assert.equal(admins[0].name, 'Lic. Ronny Peña | ConsularVisa');
  assert.equal(admins[0].portal_password, 'Escaflowne@23@');
});

test('sendMessage and getMessages correctly stores and retrieves messages for a client', async () => {
  const testClientId = 'client-test-123';
  
  const sent = await sendMessage({
    client_id: testClientId,
    sender: 'admin',
    text: 'Hola, prueba de mensaje desde el despacho legal'
  });

  assert.ok(sent.id, 'Message should have an ID');
  assert.equal(sent.client_id, testClientId);
  assert.equal(sent.text, 'Hola, prueba de mensaje desde el despacho legal');

  const retrieved = await getMessages(testClientId);
  assert.ok(retrieved.length >= 1, 'Should find at least 1 message');
  const found = retrieved.find(m => m.id === sent.id);
  assert.ok(found, 'Sent message must appear in retrieved messages');
  assert.equal(found?.text, 'Hola, prueba de mensaje desde el despacho legal');
});

test('sendMessage handles trimmed whitespace on client_id', async () => {
  const rawId = '  client-spaced-999  ';
  const sent = await sendMessage({
    client_id: rawId,
    sender: 'client',
    text: 'Consulta sobre mi cita consular'
  });

  const retrieved = await getMessages('client-spaced-999');
  const found = retrieved.find(m => m.id === sent.id);
  assert.ok(found, 'Message sent with spaced ID must be retrievable with clean ID');
});
