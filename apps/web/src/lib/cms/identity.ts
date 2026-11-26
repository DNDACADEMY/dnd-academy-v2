import 'server-only';
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

function secret(name: 'DND_APP_ENCRYPTION_KEY' | 'DND_APP_SEARCH_KEY') {
  const key = Buffer.from(process.env[name] ?? '', 'base64');
  if (key.length !== 32) throw new Error(`${name} must contain 32 random bytes`);
  return key;
}

export function blindIndex(field: 'name' | 'email' | 'visitor', value: string) {
  return createHmac('sha256', secret('DND_APP_SEARCH_KEY')).update(field).update('\0').update(value).digest('hex');
}

export function encryptIdentity(field: 'name' | 'email', value: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secret('DND_APP_ENCRYPTION_KEY'), nonce);
  cipher.setAAD(Buffer.from(field));
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString('base64url');
}

export function decryptIdentity(field: 'name' | 'email', value: string) {
  const ciphertext = Buffer.from(value, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', secret('DND_APP_ENCRYPTION_KEY'), ciphertext.subarray(0, 12));
  decipher.setAAD(Buffer.from(field));
  decipher.setAuthTag(ciphertext.subarray(12, 28));
  return Buffer.concat([decipher.update(ciphertext.subarray(28)), decipher.final()]).toString('utf8');
}
