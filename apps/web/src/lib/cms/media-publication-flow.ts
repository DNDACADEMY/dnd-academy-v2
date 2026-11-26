export async function publishWithCopies<Result>(
  collect: (onCopy: (key: string) => void) => Promise<Record<string, string>>,
  commit: (replacements: Record<string, string>) => Promise<Result>,
  finish: (keys: string[], committed: boolean) => Promise<void>,
): Promise<Result> {
  const copies: string[] = [];
  let committed = false;
  try {
    const result = await commit(await collect((key) => copies.push(key)));
    committed = true;
    return result;
  } finally {
    if (copies.length) await finish(copies, committed);
  }
}
