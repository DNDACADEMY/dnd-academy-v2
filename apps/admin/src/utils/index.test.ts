import { isEmailAllowed } from './index';

afterEach(() => {
  vi.unstubAllEnvs();
});

it('allows only the listed admin email addresses', () => {
  vi.stubEnv('ALLOWED_EMAIL_ADDRESSES', 'first@example.com, second@example.com');

  expect(isEmailAllowed('second@example.com')).toBe(true);
  expect(isEmailAllowed('other@example.com')).toBe(false);
});

it('denies access when the email list has not been configured', () => {
  vi.stubEnv('ALLOWED_EMAIL_ADDRESSES', undefined);

  expect(isEmailAllowed('first@example.com')).toBe(false);
});
