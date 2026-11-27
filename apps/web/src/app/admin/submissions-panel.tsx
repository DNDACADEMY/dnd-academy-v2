'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import type { SubmissionWorkspace } from '@/lib/cms/submission-contract';

import SubmissionApprovals from './submission-approvals';
import { OrganizerSubmissionLinks } from './submission-links';
import { TeamSubmissionLinks } from './submission-team-links';
import { approvalOverview, type IssuedLink, type SubmissionTarget } from './submission-workspace';

import styles from './submissions.module.scss';

const views = [
  { id: 'approvals', label: '승인 대기', description: '제출안 검토 · 게시 상태' },
  { id: 'teams', label: '조별 링크 관리', description: '프로젝트 · 참여 후기' },
  { id: 'organizers', label: '운영진 링크 관리', description: '운영진 소개 등록 · 수정' },
] as const;
type View = (typeof views)[number]['id'];

export default function SubmissionsPanel({
  workspace,
  target,
}: {
  workspace: SubmissionWorkspace;
  target?: SubmissionTarget;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeView = views.find(({ id }) => id === searchParams.get('view'))?.id;
  const view = routeView ?? (target ? (target.kind === 'organizer' ? 'organizers' : 'teams') : 'approvals');
  const [issued, setIssued] = useState<IssuedLink[]>([]);
  const overview = approvalOverview(workspace);
  const cohort = workspace.cohorts.find(({ id }) => id === workspace.cohortId);

  function selectView(next: View) {
    if (next === view) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', next);
    window.history.pushState(null, '', `/admin?${params}`);
  }

  function recordIssue(link: IssuedLink) {
    setIssued((previous) => [link, ...previous]);
  }

  return (
    <section className={styles.panel}>
      <header className={styles.heading}>
        <div>
          <h1>제출 관리</h1>
          <p>작성 링크를 발급하고 제출된 콘텐츠를 검토합니다.</p>
        </div>
      </header>
      <nav className={styles.tabs} aria-label="제출 관리 메뉴">
        {views.map(({ id, label, description }) => (
          <button type="button" key={id} aria-pressed={id === view} onClick={() => selectView(id)}>
            <strong>{label}</strong>
            <small>{description}</small>
            {id === 'approvals' && overview.waitingCount > 0 && <span>{overview.waitingCount}건</span>}
          </button>
        ))}
      </nav>
      {view !== 'organizers' && workspace.cohorts.length > 0 && (
        <div className={styles.scope}>
          <label className={styles.cohort}>
            기수
            <select
              value={cohort?.ordinal ?? ''}
              onChange={(event) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('view', view);
                params.set('cohort', event.target.value);
                router.push(`/admin?${params}`);
              }}
            >
              {!cohort && <option value="">기수 없음</option>}
              {workspace.cohorts.map(({ id, ordinal }) => (
                <option key={id} value={ordinal}>
                  {ordinal}기
                </option>
              ))}
            </select>
          </label>
          {view === 'approvals' && <p>운영진 제출은 기수와 관계없이 표시됩니다.</p>}
        </div>
      )}
      {view === 'approvals' && (
        <SubmissionApprovals
          workspace={workspace}
          overview={overview}
          onOpenTeams={() => selectView('teams')}
          onOpenOrganizers={() => selectView('organizers')}
        />
      )}
      {view === 'teams' && (
        <TeamSubmissionLinks
          workspace={workspace}
          target={target?.kind === 'organizer' ? undefined : target}
          issued={issued.filter(({ kind }) => kind !== 'organizer')}
          onIssue={recordIssue}
        />
      )}
      {view === 'organizers' && (
        <OrganizerSubmissionLinks
          links={workspace.links.filter(({ kind }) => kind === 'organizer')}
          target={target?.kind === 'organizer' ? target : undefined}
          issued={issued.filter(({ kind }) => kind === 'organizer')}
          onIssue={recordIssue}
        />
      )}
    </section>
  );
}
