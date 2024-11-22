import type { Entries, RequiredNonNullableObject } from '@dnd-academy/core';

export const isChristmasTheme = () => process.env.NEXT_PUBLIC_THEME === 'CHRISTMAS';

export const getEntries = <T extends object>(obj: T) => {
  const entries = Object.entries(obj) as Entries<T>;

  return entries?.filter((
    entry,
  ) => !!entry?.[0] && !!entry?.[1]) as Entries<RequiredNonNullableObject<T>>;
};

export const sortFlagsDescending = (a: string, b: string) => {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);

  if (Number.isNaN(numA) && Number.isNaN(numB)) {
    return a.localeCompare(b);
  }

  if (Number.isNaN(numA)) {
    return 1;
  }

  if (Number.isNaN(numB)) {
    return -1;
  }

  return numB - numA;
};

export const checkNumber = (value?: number | null): number => {
  if (typeof value === 'number') {
    return value;
  }

  return 0;
};
