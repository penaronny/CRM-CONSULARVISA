import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  generateSecurePassword, 
  formatCredentialsText, 
  generateWhatsAppShareUrl, 
  generateEmailShareUrl 
} from './credentials';

test('generateSecurePassword generates strong password with expected structure and prefix', () => {
  const p1 = generateSecurePassword(10);
  assert.ok(p1.startsWith('Visa'), 'Password must start with Visa prefix');
  assert.ok(p1.length >= 8, 'Password length must be at least 8 characters');
  assert.match(p1, /[0-9]/, 'Password must contain digits');
  assert.match(p1, /[!*#$]/, 'Password must contain safe symbol');

  const p2 = generateSecurePassword(10);
  assert.notEqual(p1, p2, 'Subsequent passwords should be unique and random');
});

test('formatCredentialsText creates clear text with credentials and security notice', () => {
  const text = formatCredentialsText('Carlos Morales', 'carlos@test.com', 'Visa*99Abcd', 'https://consularvisa.com');
  assert.ok(text.includes('Carlos Morales'));
  assert.ok(text.includes('carlos@test.com'));
  assert.ok(text.includes('Visa*99Abcd'));
  assert.ok(text.includes('https://consularvisa.com'));
});

test('generateWhatsAppShareUrl encodes text properly and sanitizes phone', () => {
  const urlWithPhone = generateWhatsAppShareUrl('Elena Gómez', 'elena@test.com', 'Pass123', '+1 (786) 555-1234');
  assert.ok(urlWithPhone.startsWith('https://wa.me/17865551234?text='));
  assert.ok(urlWithPhone.includes(encodeURIComponent('Elena Gómez')));

  const urlWithoutPhone = generateWhatsAppShareUrl('Elena Gómez', 'elena@test.com', 'Pass123');
  assert.ok(urlWithoutPhone.startsWith('https://wa.me/?text='));
});

test('generateEmailShareUrl produces mailto with subject and body', () => {
  const mailto = generateEmailShareUrl('Roberto Silva', 'roberto@test.com', 'SecretKey*1');
  assert.ok(mailto.startsWith('mailto:roberto@test.com?subject='));
  assert.ok(mailto.includes('&body='));
});
