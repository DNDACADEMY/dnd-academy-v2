'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

import type { ContentKind } from '@/lib/cms/content-contract';
import type { SubmissionLink, SubmissionWorkspace } from '@/lib/cms/submission-contract';

import { adminRequest } from './admin-request';

import styles from './submissions.module.scss';

export type SubmissionTarget = { id: number; kind: ContentKind; name: string; projectId?: number | null };
export type SubmissionTeam = SubmissionWorkspace['teams'][number];
export type IssuedLink = { id: string; label: string; url: string; kind: ContentKind };
export type Expiry = { scope: 'cohort'; id: number } | { scope: 'team' | 'link'; id: string };

export const linkStates: Record<SubmissionLink['state'], string> = {
  issued: '발급',
  editing: '작성 중',
  expired: '만료',
  revoked: '회수',
  submitted: '승인 대기',
  published: '게시 완료',
  rejected: '반려',
};

export function publicPath(kind: ContentKind, id: number) {
  if (kind === 'project') return `/projects/${id}`;
  if (kind === 'organizer') return `/organizers/${id}`;
  return '/reviews';
}

export function approvalOverview({ links, jobs, teams }: SubmissionWorkspace) {
  const pending = links.filter(({ state }) => state === 'submitted');
  const processingIds = new Set(jobs.filter(({ state }) => state !== 'failed').flatMap(({ linkIds }) => linkIds));
  const processing = pending.filter(({ id }) => processingIds.has(id)).length;
  const available = pending.filter(({ id }) => !processingIds.has(id));
  const organizers = available.filter(({ kind }) => kind === 'organizer');
  const readyTeams = teams
    .map((owner) => {
      const rows = available.filter(({ teamId }) => teamId === owner.id);
      return { owner, rows, ready: owner.projectId !== null || rows.some(({ kind }) => kind === 'project') };
    })
    .filter(({ rows }) => rows.length)
    .sort((a, b) => Number(b.ready) - Number(a.ready));
  const readyCount =
    organizers.length + readyTeams.reduce((sum, group) => sum + (group.ready ? group.rows.length : 0), 0);
  return { pending, readyTeams, organizers, readyCount, processing, waitingCount: available.length };
}

export type ApprovalOverview = ReturnType<typeof approvalOverview>;

export function useSubmissionActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '요청을 처리하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function change(payload: unknown, success: string) {
    return run(async () => {
      const result = await adminRequest<{ changed?: number }>('submissions', payload);
      setNotice(result.changed === 0 ? '변경할 항목이 없습니다.' : success);
      router.refresh();
    });
  }

  return { router, busy, error, setError, notice, setNotice, run, change };
}

export function SubmissionFeedback({
  error,
  notice,
  busy,
  children,
}: {
  error: string;
  notice: string;
  busy: boolean;
  children?: ReactNode;
}) {
  return (
    <>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div role="status" className={styles.feedback}>
        {notice && <p>{notice}</p>}
        {busy && !notice && <p>처리 중입니다…</p>}
        {children}
      </div>
    </>
  );
}
