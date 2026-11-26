import { publishWithCopies } from './media-publication-flow';

it('cleans staged copies when a later copy fails without attempting to commit', async () => {
  const commit = vi.fn<(replacements: Record<string, string>) => Promise<void>>();
  const cleanup = vi.fn<(keys: string[], committed: boolean) => Promise<void>>();
  const failure = new Error('copy failed');
  await expect(
    publishWithCopies(
      async (staged) => {
        staged('first-copy');
        staged('second-copy');
        throw failure;
      },
      commit,
      cleanup,
    ),
  ).rejects.toBe(failure);
  expect(commit).not.toHaveBeenCalled();
  expect(cleanup).toHaveBeenCalledExactlyOnceWith(['first-copy', 'second-copy'], false);
});

it('cleans staged copies when the database rejects the publication', async () => {
  const cleanup = vi.fn<(keys: string[], committed: boolean) => Promise<void>>();
  const failure = new Error('stale revision');
  await expect(
    publishWithCopies(
      async (staged) => {
        staged('staged-copy');
        return { draft: 'public' };
      },
      async () => {
        throw failure;
      },
      cleanup,
    ),
  ).rejects.toBe(failure);
  expect(cleanup).toHaveBeenCalledExactlyOnceWith(['staged-copy'], false);
});

it('keeps copies after the database commits', async () => {
  const finish = vi.fn<(keys: string[], committed: boolean) => Promise<void>>();
  const commit = vi
    .fn<(replacements: Record<string, string>) => Promise<{ revisionId: number }>>()
    .mockResolvedValue({ revisionId: 7 });
  await expect(
    publishWithCopies(
      async (staged) => {
        staged('staged-copy');
        return { draft: 'public' };
      },
      commit,
      finish,
    ),
  ).resolves.toEqual({ revisionId: 7 });
  expect(commit).toHaveBeenCalledExactlyOnceWith({ draft: 'public' });
  expect(finish).toHaveBeenCalledExactlyOnceWith(['staged-copy'], true);
});
