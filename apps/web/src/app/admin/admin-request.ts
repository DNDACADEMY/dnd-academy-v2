export async function adminRequest<T>(
  resource:
    | 'admissions'
    | 'content'
    | 'content/preview'
    | 'content/projects'
    | 'content/skills'
    | 'media'
    | 'home'
    | 'submissions'
    | 'recruitment-controls',
  payload: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`/api/admin/${resource}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal,
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.message ??
        (response.status === 409 ? '중복된 행 또는 직군 충돌이 있습니다.' : '요청을 처리하지 못했습니다.'),
    );
  return data as T;
}
