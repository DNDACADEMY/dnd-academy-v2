import { randomBytes } from 'node:crypto';

import { blindIndex, decryptIdentity, encryptIdentity } from './identity';

beforeEach(() => {
  vi.stubEnv('DND_APP_ENCRYPTION_KEY', randomBytes(32).toString('base64'));
  vi.stubEnv('DND_APP_SEARCH_KEY', randomBytes(32).toString('base64'));
});

afterEach(() => vi.unstubAllEnvs());

it('preserves the exact UTF-8 identity and authenticates each encrypted field', () => {
  const name = ' 가상 지원자 ';
  const ciphertext = encryptIdentity('name', name);
  expect(ciphertext).not.toBe(encryptIdentity('name', name));
  expect(decryptIdentity('name', ciphertext)).toBe(name);
  expect(() => decryptIdentity('email', ciphertext)).toThrow(/authenticate|decrypt/i);
});

it('does not normalize case or whitespace in the legacy lookup key', () => {
  expect(blindIndex('name', '가상 지원자')).not.toBe(blindIndex('name', '가상 지원자 '));
  expect(blindIndex('email', 'Fake@example.com')).not.toBe(blindIndex('email', 'fake@example.com'));
  expect(blindIndex('name', 'fixture')).not.toBe(blindIndex('email', 'fixture'));
});
