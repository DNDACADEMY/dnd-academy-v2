// eslint-disable-next-line import/prefer-default-export
export function isEmailAllowed(email: string) {
  const allowedEmails = process.env.ALLOWED_EMAIL_ADDRESSES?.split(',').map((allowedEmail) => allowedEmail.trim()) || [];

  return allowedEmails.includes(email);
}
