const DEFAULT_PUBLIC_ORIGIN = 'http://localhost:3000';

export const getPublicOrigin = () => {
  const origin = process.env.NEXT_PUBLIC_ORIGIN;

  try {
    return new URL(origin || DEFAULT_PUBLIC_ORIGIN).origin;
  } catch {
    return DEFAULT_PUBLIC_ORIGIN;
  }
};

export const PUBLIC_ORIGIN = getPublicOrigin();
