type PickByValue<T, V> = Pick<T, { [K in keyof T]: T[K] extends V ? K : never }[keyof T]>;

export type Entries<T> = {
  [K in keyof T]: [keyof PickByValue<T, T[K]>, T[K]]
}[keyof T][];

export type RequiredNonNullableObject<T extends object> = {
  [P in keyof Required<T>]: NonNullable<T[P]>;
};
