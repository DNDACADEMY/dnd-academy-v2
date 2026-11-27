import { describe, expect, it } from 'vitest';

import { formatSubmissionTime, grantRequest, kstDeadline } from './submission-contract';

describe('submission link requests', () => {
  const teamId = '27337ca8-859b-4538-a3ec-be0470409118';
  const expiresAt = '2026-12-19T00:00:00+09:00';

  it('accepts each scope and keeps an existing project with ID zero', () => {
    expect(grantRequest.parse({ action: 'extend', scope: 'cohort', id: 16, expiresAt })).toMatchObject({ id: 16 });
    expect(grantRequest.parse({ action: 'extend', scope: 'team', id: teamId, expiresAt })).toMatchObject({
      id: teamId,
    });
    const project = { action: 'issue', kind: 'project', teamId, targetId: 0, expiresAt, label: '검증' };
    expect(grantRequest.parse(project)).toMatchObject({ targetId: 0 });
    expect(grantRequest.safeParse({ ...project, kind: 'review' }).success).toBe(false);
    expect(grantRequest.safeParse({ ...project, kind: 'review', memberId: teamId }).success).toBe(true);
  });

  it('uses Korea time for a deadline entered on any browser', () => {
    expect(formatSubmissionTime('2026-12-18T15:00:00.000Z')).toBe('2026. 12. 19. 00:00');
    expect(formatSubmissionTime('2026-01-02T05:06:00+09:00')).toBe('2026. 01. 02. 05:06');
    expect(kstDeadline('2026-12-19T00:00')).toBe(expiresAt);
    expect(new Date(kstDeadline('2026-12-19T00:00')).toISOString()).toBe('2026-12-18T15:00:00.000Z');
  });
});
