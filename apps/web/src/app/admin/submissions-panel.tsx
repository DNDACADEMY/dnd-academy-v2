'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import SubmissionPreview from '@/components/pages/SubmissionPreview';
import {
  type ContentInput,
  type MediaItem,
  type ContentKind,
  organizerPositions,
  reviewPositions,
} from '@/lib/cms/content-contract';
import {
  defaultDeadline,
  formatSubmissionTime,
  kstDeadline,
  organizerProfileLabels,
  type Submission,
  type SubmissionContentMatch,
  type SubmissionJob,
  type SubmissionLink,
  type SubmissionPublication,
  submissionLabels,
  type SubmissionWorkspace,
} from '@/lib/cms/submission-contract';

import { adminRequest } from './admin-request';
import SubmissionContentPicker from './submission-content-picker';

import adminStyles from './styles.module.scss';
import styles from './submissions.module.scss';

type Team = SubmissionWorkspace['teams'][number];
type Changes = {
  submission: Submission;
  draft: ContentInput;
  media: MediaItem[];
  changes: { field: string; before: unknown; after: unknown }[];
};
type Expiry = { scope: 'cohort'; id: number } | { scope: 'team' | 'link'; id: string };
type Extension = Expiry & { label: string; value: string };
type Tab = 'approvals' | 'teams' | 'organizers';
type IssuedLink = { id: string; label: string; url: string; kind: ContentKind };
type Approval = { jobId?: string; conflicts?: { id: string; field: string }[]; confirmation?: string };

const states: Record<SubmissionLink['state'], string> = {
  issued: '발급',
  editing: '작성 중',
  expired: '만료',
  revoked: '회수',
  submitted: '승인 대기',
  published: '게시 완료',
  rejected: '반려',
};
const labels: Record<string, string> = {
  ...organizerProfileLabels,
  name: '이름',
  title: '한 줄 소개',
  description: '본문',
  links: '공개 링크',
  skills: '기술 태그',
  thumbnailId: '대표 이미지',
  pdfId: '발표 PDF',
  images: '갤러리 이미지',
};
const publicPath = (kind: ContentKind, id: number) => {
  if (kind === 'project') return `/projects/${id}`;
  if (kind === 'organizer') return `/organizers/${id}`;
  return '/reviews';
};
const active = (link: SubmissionLink) => ['issued', 'editing', 'expired'].includes(link.state);

function describe(field: string, value: unknown) {
  if (field === 'images' && Array.isArray(value)) return `이미지 ${value.length}장`;
  if (field === 'thumbnailId' || field === 'pdfId') return value ? '첨부 있음' : '첨부 없음';
  if (Array.isArray(value))
    return value
      .map((item) => (typeof item === 'string' ? item : typeof item?.url === 'string' ? item.url : ''))
      .join(', ');
  return typeof value === 'string' ? value : '';
}

export default function SubmissionsPanel({
  workspace,
  target,
}: {
  workspace: SubmissionWorkspace;
  target?: { id: number; kind: ContentKind; name: string; projectId?: number | null };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const tab =
    view === 'teams' || view === 'organizers' || view === 'approvals'
      ? view
      : target
        ? target.kind === 'organizer'
          ? 'organizers'
          : 'teams'
        : 'approvals';
  const linkedProject = target?.kind === 'project' ? target.id : target?.projectId;
  const [teamId, setTeamId] = useState(
    workspace.teams.find((team) => linkedProject != null && team.projectId === linkedProject)?.id ??
      workspace.teams[0]?.id ??
      '',
  );
  const [memberId, setMemberId] = useState('');
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [teamCount, setTeamCount] = useState('10');
  const [memberName, setMemberName] = useState('');
  const [reviewPosition, setReviewPosition] = useState<(typeof reviewPositions)[number]>(reviewPositions[0]);
  const [organizerPosition, setOrganizerPosition] = useState<(typeof organizerPositions)[number]>(
    organizerPositions[0],
  );
  const [archived, setArchived] = useState(false);
  const [kind, setKind] = useState<ContentKind>(target?.kind ?? 'project');
  const [label, setLabel] = useState('');
  const [selected, setSelected] = useState<SubmissionContentMatch | null>(
    target ? { id: target.id, name: target.name } : null,
  );
  const [targetMode, setTargetMode] = useState<'new' | 'existing'>(target ? 'existing' : 'new');
  const [links, setLinks] = useState<IssuedLink[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | SubmissionLink['state']>('all');
  const [extension, setExtension] = useState<Extension | null>(null);
  const [details, setDetails] = useState<Record<string, Changes>>({});
  const [conflict, setConflict] = useState<{ ids: string[]; confirmation: string; fields: string[] }>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [published, setPublished] = useState<{ kind: ContentKind; id: number }[]>([]);
  const [busy, setBusy] = useState(false);

  const [watchedJob, setWatchedJob] = useState<string>();
  const [jobProgress, setJobProgress] = useState<{ id: string; state: SubmissionJob['state'] }>();
  const jobToWatch = watchedJob ?? workspace.jobs.find(({ state }) => state === 'queued' || state === 'processing')?.id;

  useEffect(() => {
    if (!jobToWatch) return;
    const controller = new AbortController();
    let timeout: number | undefined;
    const watchUntil = Date.now() + 180_000;
    async function refreshStatus() {
      try {
        const result = await adminRequest<SubmissionPublication | null>(
          'submissions',
          { action: 'publicationStatus', jobId: jobToWatch },
          controller.signal,
        );
        if (controller.signal.aborted || !result || !jobToWatch) return;
        setJobProgress({ id: jobToWatch, state: result.state });
        if (result.state === 'published' || result.state === 'failed') {
          setPublished(result.published);
          setNotice(
            result.state === 'published' ? '게시를 완료했습니다.' : '게시가 실패했습니다. 제출안을 검토해 주세요.',
          );
          router.refresh();
          return;
        }
      } catch {
        // A temporary status failure does not affect the server job.
      }
      if (!controller.signal.aborted && Date.now() < watchUntil)
        timeout = window.setTimeout(() => void refreshStatus(), 4000);
    }
    void refreshStatus();
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [jobToWatch, router]);

  const cohort = workspace.cohorts.find(({ id }) => id === workspace.cohortId);
  const team = workspace.teams.find(({ id }) => id === teamId) ?? workspace.teams[0];
  const operationKind = tab === 'organizers' ? 'organizer' : kind === 'review' ? 'review' : 'project';
  const pending = workspace.links.filter((link) => link.state === 'submitted');
  const pendingIds = new Set(pending.map(({ id }) => id));
  const conflictingTarget =
    operationKind === 'project' && team?.projectId != null && selected !== null && team.projectId !== selected.id;
  const processing = new Set(
    workspace.jobs
      .filter(({ state }) => state !== 'failed')
      .flatMap(({ linkIds }) => linkIds.filter((id) => pendingIds.has(id))),
  );
  const readyTeams = workspace.teams
    .map((owner) => {
      const rows = pending.filter((row) => row.teamId === owner.id && !processing.has(row.id));
      return {
        owner,
        rows,
        ready: owner.projectId !== null || rows.some((row) => row.kind === 'project'),
      };
    })
    .filter(({ rows }) => rows.length);
  const organizers = pending.filter((row) => row.kind === 'organizer' && !processing.has(row.id));
  const readyCount =
    organizers.length + readyTeams.filter(({ ready }) => ready).reduce((total, { rows }) => total + rows.length, 0);
  const scopedLinks = workspace.links.filter((link) =>
    tab === 'organizers' ? link.kind === 'organizer' : link.teamId === team?.id,
  );
  const latestLinks = links.filter((link) =>
    tab === 'organizers' ? link.kind === 'organizer' : link.kind !== 'organizer',
  );
  const canIssue = Boolean(
    !busy &&
    deadline &&
    !conflictingTarget &&
    (operationKind !== 'review' || memberId) &&
    (targetMode === 'new' || selected || (operationKind === 'project' && team?.projectId != null)),
  );
  const history = scopedLinks.filter(({ state }) => historyFilter === 'all' || historyFilter === state);

  function chooseView(next: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', next);
    window.history.pushState(null, '', `/admin?${params}`);
    setConflict(undefined);
    if (next !== tab) {
      setSelected(next === (target?.kind === 'organizer' ? 'organizers' : 'teams') && target ? target : null);
      setTargetMode(next === (target?.kind === 'organizer' ? 'organizers' : 'teams') && target ? 'existing' : 'new');
      setKind(target?.kind ?? 'project');
      setMemberId('');
      setLabel('');
      setHistoryFilter('all');
    }
  }

  function chooseTeam(owner: Team) {
    if (owner.id === team?.id) return;
    setTeamId(owner.id);
    setMemberId('');
    const teamTarget = target?.kind === operationKind ? target : null;
    setSelected(teamTarget);
    setTargetMode(teamTarget ? 'existing' : 'new');
    setLabel('');
    setHistoryFilter('all');
  }

  function editDeadline(scope: Expiry, title: string, expiresAt?: string) {
    setError('');
    const value = expiresAt
      ? new Date(Math.max(Date.now(), Date.parse(expiresAt)) + 33 * 60 * 60 * 1000).toISOString().slice(0, 16)
      : defaultDeadline();
    setExtension({ ...scope, label: title, value });
  }
  const toIssue = workspace.teams.map((owner) => {
    const issued = workspace.links.filter(
      (entry) => entry.teamId === owner.id && !['revoked', 'rejected'].includes(entry.state),
    );
    return {
      owner,
      project: !issued.some((entry) => entry.kind === 'project'),
      members: owner.members.filter((member) => !issued.some((entry) => entry.memberId === member.id)),
    };
  });
  const countToIssue = (group: (typeof toIssue)[number]) => Number(group.project) + group.members.length;
  const cohortLinkCount = toIssue.reduce((count, group) => count + countToIssue(group), 0);
  const teamLinks = toIssue.filter(({ owner }) => owner.id === team?.id);
  const teamLinkCount = teamLinks.reduce((count, group) => count + countToIssue(group), 0);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function change(payload: unknown, success: string) {
    await run(async () => {
      const value = await adminRequest<{ changed?: number }>('submissions', payload);
      setNotice(value.changed === 0 ? '변경할 링크가 없습니다.' : success);
      router.refresh();
    });
  }

  async function issue(
    type: ContentKind,
    owner?: Team,
    member?: Team['members'][number],
    item: SubmissionContentMatch | null = selected,
    customLabel = label,
  ) {
    const payload = {
      action: 'issue',
      kind: type,
      expiresAt: kstDeadline(deadline),
      targetId: item?.id ?? null,
      label:
        customLabel.trim() ||
        member?.name ||
        (owner ? `${cohort?.ordinal}기 ${owner.number}조 ${submissionLabels[type]}` : '새 운영진 소개'),
      ...(owner ? { teamId: owner.id } : {}),
      ...(member ? { memberId: member.id } : {}),
      ...(type === 'organizer' ? { position: organizerPosition, archived } : {}),
    };
    const result = await adminRequest<SubmissionLink & { path: string }>('submissions', payload);
    setLinks((previous) => [
      ...previous,
      {
        id: result.id,
        label: result.label,
        kind: result.kind,
        url: new URL(result.path, window.location.origin).href,
      },
    ]);
  }

  async function issueGroups(groups: typeof toIssue, projectTarget: SubmissionContentMatch | null) {
    await run(async () => {
      let count = 0;
      try {
        for (const group of groups) {
          if (group.project) {
            await issue('project', group.owner, undefined, projectTarget, '');
            count += 1;
          }
          for (const member of group.members) {
            await issue('review', group.owner, member, null, '');
            count += 1;
          }
        }
        setNotice(`${count}건을 발급했습니다. 발급 목록에서 주소를 복사할 수 있습니다.`);
      } finally {
        router.refresh();
      }
    });
  }

  async function approve(ids: string[], confirmation?: string) {
    await run(async () => {
      try {
        const result = await adminRequest<Approval>('submissions', {
          action: 'approve',
          linkIds: ids,
          acceptConflicts: confirmation,
        });
        if (result.conflicts?.length && result.confirmation) {
          setConflict({
            ids,
            confirmation: result.confirmation,
            fields: [...new Set(result.conflicts.map(({ field }) => labels[field] ?? field))],
          });
          return;
        }
        setConflict(undefined);
        if (result.jobId) {
          setPublished([]);
          setWatchedJob(result.jobId);
          setNotice('게시를 예약했습니다. 이 화면을 닫아도 게시가 진행됩니다.');
        }
      } finally {
        router.refresh();
      }
    });
  }

  function status(link: SubmissionLink) {
    return (
      <li key={link.id} className={styles.linkRow}>
        <div className={styles.rowTitle}>
          <strong>{link.label}</strong>
          <small>
            {submissionLabels[link.kind]} ·{' '}
            <time dateTime={link.expiresAt}>{formatSubmissionTime(link.expiresAt)} KST</time>
          </small>
        </div>
        <span className={styles.pill} data-state={link.state}>
          {states[link.state]}
        </span>
        {link.publishedId !== null && <a href={publicPath(link.kind, link.publishedId)}>공개 페이지</a>}
        {active(link) && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => editDeadline({ scope: 'link', id: link.id }, link.label, link.expiresAt)}
            >
              연장
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm('이 링크의 접근 권한을 회수할까요?'))
                  void change({ action: 'revoke', linkId: link.id }, '링크를 회수했습니다.');
              }}
            >
              회수
            </button>
          </>
        )}
      </li>
    );
  }

  function showReview(row: SubmissionLink) {
    const review = details[row.id];
    return (
      <li key={row.id} className={styles.reviewRow}>
        <div className={styles.row}>
          <div className={styles.rowTitle}>
            <strong>{row.label}</strong>
            <small>{submissionLabels[row.kind]}</small>
          </div>
          <button
            type="button"
            aria-expanded={Boolean(review)}
            disabled={busy}
            onClick={() => {
              if (review) {
                setDetails(({ [row.id]: _closed, ...rest }) => rest);
                return;
              }
              void run(async () => {
                const result = await adminRequest<Changes>('submissions', { action: 'inspect', linkId: row.id });
                setDetails((current) => ({ ...current, [row.id]: result }));
              });
            }}
          >
            {review ? '검토 닫기' : '제출안 검토'}
          </button>
          <button
            type="button"
            className={adminStyles.danger}
            disabled={busy}
            onClick={() => {
              if (window.confirm(`‘${row.label}’ 제출안을 반려할까요?`))
                void change({ action: 'reject', linkId: row.id }, '제출안을 반려했습니다.');
            }}
          >
            반려
          </button>
        </div>
        {review && (
          <details>
            <summary>게시 화면 미리보기</summary>
            <div
              className={styles.preview}
              onClickCapture={(event) => {
                if (event.target instanceof Element && event.target.closest('a')) event.preventDefault();
              }}
            >
              <SubmissionPreview
                submission={review.submission}
                draft={review.draft}
                media={new Map(review.media.map(({ id, url }) => [id, url]))}
              />
            </div>
          </details>
        )}
        {review &&
          (review.changes.length ? (
            <dl className={styles.changes}>
              {review.changes.map(({ field, before, after }) => (
                <div key={field}>
                  <dt>{labels[field] ?? field}</dt>
                  <dd>
                    <span>현재</span> {describe(field, before) || '비어 있음'}
                  </dd>
                  <dd>
                    <span>게시 예정</span> {describe(field, after) || '비어 있음'}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>공개 내용과 달라진 필드가 없습니다.</p>
          ))}
      </li>
    );
  }

  const tabs = [
    { id: 'approvals', label: '승인 대기', count: pending.length - processing.size },
    { id: 'teams', label: '조별 현황', count: workspace.teams.length },
    { id: 'organizers', label: '운영진 프로필', count: undefined },
  ] as const;

  return (
    <section className={styles.panel} aria-busy={busy}>
      <header className={styles.heading}>
        <div>
          <h1>제출 관리</h1>
          <p>작성 링크를 발급하고 제출된 프로젝트·후기·운영진 소개를 검토합니다.</p>
        </div>
        {tab !== 'organizers' && (
          <label className={styles.cohort}>
            기수
            <select
              value={cohort?.ordinal ?? ''}
              onChange={(event) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('view', tab);
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
        )}
      </header>

      <div className={styles.tabs} role="group" aria-label="제출 관리 메뉴">
        {tabs.map(({ id, label: name, count }) => (
          <button type="button" key={id} aria-pressed={tab === id} onClick={() => chooseView(id)}>
            {name}
            {count !== undefined && <span>{count}</span>}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div aria-live="polite" className={styles.feedback}>
        {notice && <p>{notice}</p>}
        {busy && !notice && <p>처리 중입니다…</p>}
        {published.length > 0 && (
          <ul className={styles.row} aria-label="방금 게시한 콘텐츠">
            {published.map(({ kind, id }) => (
              <li key={`${kind}-${id}`}>
                <a href={publicPath(kind, id)}>{submissionLabels[kind]} 공개 페이지 보기</a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {tab === 'approvals' ? (
        <>
          <dl className={styles.metrics}>
            <div>
              <dt>승인 가능</dt>
              <dd>
                {readyCount}
                <span>건</span>
              </dd>
            </div>
            <div>
              <dt>프로젝트 제출 대기</dt>
              <dd>
                {pending.length - readyCount - processing.size}
                <span>건</span>
              </dd>
            </div>
            <div>
              <dt>게시 처리 중</dt>
              <dd>
                {processing.size}
                <span>건</span>
              </dd>
            </div>
          </dl>
          {conflict && (
            <div className={styles.box}>
              <p role="alert">같은 필드에 변경이 겹쳤습니다. {conflict.fields.join(', ')}</p>
              <div className={styles.row}>
                <button
                  type="button"
                  className={adminStyles.primary}
                  disabled={busy}
                  onClick={() => void approve(conflict.ids, conflict.confirmation)}
                >
                  확인한 제출안으로 승인
                </button>
                <button type="button" onClick={() => setConflict(undefined)}>
                  닫기
                </button>
              </div>
            </div>
          )}
          {pending.length === 0 && (
            <div className={styles.empty}>
              <h2>검토할 제출안이 없습니다</h2>
              <p>작성자가 제출을 완료하면 여기에서 검토할 수 있습니다.</p>
              <button type="button" className={adminStyles.primary} onClick={() => chooseView('teams')}>
                조별 현황 보기
              </button>
            </div>
          )}
          {readyTeams
            .sort((a, b) => Number(b.ready) - Number(a.ready))
            .map(({ owner, rows, ready }) => (
              <article className={styles.box} key={owner.id}>
                <header className={styles.cardHeading}>
                  <div>
                    <h2>
                      {cohort?.ordinal}기 {owner.number}조
                    </h2>
                    <p>{rows.length}건 제출</p>
                  </div>
                  {ready ? (
                    <button
                      type="button"
                      className={adminStyles.primary}
                      disabled={busy}
                      onClick={() => void approve(rows.map(({ id }) => id))}
                    >
                      {rows.length}건 승인 및 게시
                    </button>
                  ) : (
                    <span className={styles.pill} data-state="expired">
                      프로젝트 제출 대기
                    </span>
                  )}
                </header>
                {!ready && <p className={styles.muted}>프로젝트가 제출되면 후기를 함께 게시할 수 있습니다.</p>}
                <ul>{rows.map(showReview)}</ul>
              </article>
            ))}
          {organizers.map((row) => (
            <article className={styles.box} key={row.id}>
              <header className={styles.cardHeading}>
                <h2>운영진 프로필 제출</h2>
                <button
                  type="button"
                  className={adminStyles.primary}
                  disabled={busy}
                  onClick={() => void approve([row.id])}
                >
                  승인 및 게시
                </button>
              </header>
              <ul>{showReview(row)}</ul>
            </article>
          ))}
          {workspace.jobs.length > 0 && (
            <div className={styles.box}>
              <h2>게시 작업</h2>
              <ul>
                {workspace.jobs.map((job) => {
                  const state = jobProgress?.id === job.id ? jobProgress.state : job.state;
                  const labels = {
                    queued: '게시 대기',
                    processing: '게시 중',
                    published: '게시 완료',
                    failed: '게시 실패',
                  };
                  return (
                    <li className={styles.linkRow} key={job.id}>
                      <strong className={styles.rowTitle}>{job.linkIds.length}건</strong>
                      <span className={styles.pill} data-state={state === 'failed' ? 'rejected' : 'submitted'}>
                        {labels[state]}
                      </span>
                      {state === 'queued' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await adminRequest('submissions', { action: 'dispatchPublication', jobId: job.id });
                              setWatchedJob(job.id);
                              router.refresh();
                            })
                          }
                        >
                          게시 요청 다시 보내기
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          {tab === 'teams' && cohort && (
            <div className={styles.box}>
              <header className={styles.cardHeading}>
                <div>
                  <h2>{cohort.ordinal}기 조 현황</h2>
                  <p>조를 선택하면 아래에서 작성 링크와 팀원을 관리할 수 있습니다.</p>
                </div>
                <details className={styles.teamSettings}>
                  <summary>기수 설정</summary>
                  <div className={styles.stack}>
                    <label>
                      전체 조 수
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={teamCount}
                        onChange={(event) => setTeamCount(event.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void change(
                          { action: 'teams', cohortId: cohort.id, count: Number(teamCount) },
                          '조를 추가했습니다.',
                        )
                      }
                    >
                      조 추가
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => editDeadline({ scope: 'cohort', id: cohort.id }, `${cohort.ordinal}기 전체`)}
                    >
                      기수 전체 기한 연장
                    </button>
                  </div>
                </details>
              </header>
              {workspace.teams.length > 0 ? (
                <ul className={styles.teamGrid}>
                  {workspace.teams.map((owner) => {
                    const group = workspace.links.filter((row) => row.teamId === owner.id);
                    const reviewCount = new Set(
                      group
                        .filter((row) => row.kind === 'review' && ['submitted', 'published'].includes(row.state))
                        .map((row) => row.memberId),
                    ).size;
                    const project = group.find((row) => row.kind === 'project');
                    return (
                      <li key={owner.id}>
                        <button type="button" aria-pressed={team?.id === owner.id} onClick={() => chooseTeam(owner)}>
                          <strong>{owner.number}조</strong>
                          <span>
                            {project
                              ? `프로젝트 ${states[project.state]}`
                              : owner.projectId !== null
                                ? '프로젝트 연결됨'
                                : '프로젝트 미발급'}
                          </span>
                          <small>
                            {owner.members.length
                              ? `후기 ${reviewCount}/${owner.members.length}명 제출`
                              : '팀원 미등록'}
                          </small>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={styles.muted}>기수 설정에서 조를 추가해 주세요.</p>
              )}
            </div>
          )}
          {tab === 'teams' && !cohort && (
            <div className={styles.empty}>
              <h2>등록된 기수가 없습니다</h2>
              <p>모집 관리에서 기수를 등록해 주세요.</p>
            </div>
          )}
          {(tab === 'organizers' || team) && (
            <>
              {latestLinks.length > 0 && (
                <div className={styles.box}>
                  <header className={styles.cardHeading}>
                    <div>
                      <h2>이 화면에서 발급한 링크</h2>
                      <p>이 화면을 떠나기 전에 주소를 복사해 대상자에게 전달하세요.</p>
                    </div>
                  </header>
                  <ul>
                    {latestLinks.map(({ id, label: name, url }) => (
                      <li className={styles.copyRow} key={id}>
                        <label>
                          {name}
                          <input readOnly value={url} onFocus={(event) => event.target.select()} />
                        </label>
                        <button
                          type="button"
                          aria-label={`${name} 링크 복사`}
                          onClick={() =>
                            void navigator.clipboard
                              .writeText(url)
                              .then(() => setNotice('링크를 복사했습니다.'))
                              .catch(() => setError('주소를 선택해 직접 복사해 주세요.'))
                          }
                        >
                          복사
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className={styles.columns}>
                <section className={styles.box}>
                  <header className={styles.cardHeading}>
                    <div>
                      <h2>{tab === 'organizers' ? '운영진 작성 링크 발급' : `${team?.number}조 작성 링크 발급`}</h2>
                      <p>대상과 마감 시각을 지정합니다.</p>
                    </div>
                  </header>
                  <form
                    className={styles.stack}
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!canIssue) return;
                      void run(async () => {
                        await issue(
                          operationKind,
                          operationKind === 'organizer' ? undefined : team,
                          team?.members.find((member) => member.id === memberId),
                        );
                        setNotice('링크를 발급했습니다. 발급한 링크에서 복사할 수 있습니다.');
                        router.refresh();
                      });
                    }}
                  >
                    {tab === 'teams' && (
                      <label>
                        콘텐츠
                        <select
                          value={operationKind}
                          onChange={(event) => {
                            setKind(event.target.value as ContentKind);
                            setSelected(null);
                            setTargetMode('new');
                          }}
                        >
                          <option value="project">프로젝트</option>
                          <option value="review">후기</option>
                        </select>
                      </label>
                    )}
                    {operationKind === 'review' && (
                      <label>
                        후기 작성자
                        <select value={memberId} required onChange={(event) => setMemberId(event.target.value)}>
                          <option value="">팀원 선택</option>
                          {team?.members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {operationKind === 'project' && team?.projectId != null ? (
                      <p className={styles.selection}>
                        {conflictingTarget
                          ? '이 조는 다른 프로젝트에 연결되어 있습니다. 수정 대상과 연결된 조를 선택하세요.'
                          : '조에 연결된 프로젝트를 수정합니다.'}
                      </p>
                    ) : (
                      <>
                        <div className={styles.segment} role="group" aria-label="등록 방식">
                          <button
                            type="button"
                            aria-pressed={targetMode === 'new'}
                            onClick={() => {
                              setTargetMode('new');
                              setSelected(null);
                            }}
                          >
                            신규 등록
                          </button>
                          <button
                            type="button"
                            aria-pressed={targetMode === 'existing'}
                            onClick={() => setTargetMode('existing')}
                          >
                            기존 콘텐츠 수정
                          </button>
                        </div>
                        {targetMode === 'existing' && (
                          <SubmissionContentPicker
                            key={JSON.stringify([tab, workspace.cohortId, team?.id, operationKind])}
                            kind={operationKind}
                            cohort={operationKind === 'organizer' ? undefined : cohort?.ordinal}
                            selected={selected}
                            onSelect={setSelected}
                            disabled={busy}
                          />
                        )}
                      </>
                    )}
                    <label>
                      마감 시각 (한국시간)
                      <input
                        type="datetime-local"
                        value={deadline}
                        required
                        onChange={(event) => setDeadline(event.target.value)}
                      />
                    </label>
                    <label>
                      <span>
                        링크 이름 <small>(선택)</small>
                      </span>
                      <input
                        value={label}
                        maxLength={160}
                        placeholder="비워 두면 자동으로 지정합니다"
                        onChange={(event) => setLabel(event.target.value)}
                      />
                    </label>
                    {operationKind === 'organizer' && !selected && (
                      <>
                        <label>
                          운영진 직군
                          <select
                            value={organizerPosition}
                            onChange={(event) => setOrganizerPosition(event.target.value as typeof organizerPosition)}
                          >
                            {organizerPositions.map((position) => (
                              <option key={position}>{position}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={archived}
                            onChange={(event) => setArchived(event.target.checked)}
                          />{' '}
                          하단 운영진 목록에 표시
                        </label>
                      </>
                    )}
                    <button type="submit" className={adminStyles.primary} disabled={!canIssue}>
                      링크 발급
                    </button>
                  </form>
                  {tab === 'teams' && (
                    <details>
                      <summary>여러 링크 한 번에 발급</summary>
                      <div className={styles.stack}>
                        <p className={styles.muted}>미발급 대상에게 위 마감 시각을 적용합니다.</p>
                        <button
                          type="button"
                          disabled={busy || !deadline || !teamLinkCount || conflictingTarget}
                          onClick={() => void issueGroups(teamLinks, operationKind === 'project' ? selected : null)}
                        >
                          이 조 링크 {teamLinkCount}건 발급
                        </button>
                        <button
                          type="button"
                          disabled={busy || !deadline || !cohortLinkCount}
                          onClick={() => {
                            if (window.confirm(`${cohort?.ordinal}기 미발급 링크 ${cohortLinkCount}건을 발급할까요?`))
                              void issueGroups(toIssue, null);
                          }}
                        >
                          기수 링크 {cohortLinkCount}건 발급
                        </button>
                      </div>
                    </details>
                  )}
                </section>
                <div className={styles.stack}>
                  {tab === 'teams' && team && (
                    <section className={styles.box}>
                      <header className={styles.cardHeading}>
                        <h2>팀원 {team.members.length}명</h2>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => editDeadline({ scope: 'team', id: team.id }, `${team.number}조 전체`)}
                        >
                          이 조 기한 연장
                        </button>
                      </header>
                      {team.members.length > 0 ? (
                        <ul className={styles.members}>
                          {team.members.map((member) => (
                            <li key={member.id}>
                              <strong>{member.name}</strong>
                              <small>{member.position}</small>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={styles.muted}>팀원을 추가하면 개인 후기 링크를 발급할 수 있습니다.</p>
                      )}
                      <details>
                        <summary>팀원 추가</summary>
                        <form
                          className={styles.stack}
                          onSubmit={(event) => {
                            event.preventDefault();
                            void run(async () => {
                              await adminRequest('submissions', {
                                action: 'member',
                                teamId: team.id,
                                name: memberName,
                                position: reviewPosition,
                              });
                              setMemberName('');
                              router.refresh();
                              setNotice('팀원을 추가했습니다.');
                            });
                          }}
                        >
                          <label>
                            팀원 이름
                            <input
                              value={memberName}
                              maxLength={160}
                              required
                              onChange={(event) => setMemberName(event.target.value)}
                            />
                          </label>
                          <label>
                            직군
                            <select
                              value={reviewPosition}
                              onChange={(event) => setReviewPosition(event.target.value as typeof reviewPosition)}
                            >
                              {reviewPositions.map((position) => (
                                <option key={position}>{position}</option>
                              ))}
                            </select>
                          </label>
                          <button type="submit" disabled={busy || !memberName.trim()}>
                            팀원 저장
                          </button>
                        </form>
                      </details>
                    </section>
                  )}
                  <section className={styles.box}>
                    <header className={styles.cardHeading}>
                      <h2>
                        발급 내역 <small>{scopedLinks.length}건</small>
                      </h2>
                      {scopedLinks.length > 0 && (
                        <select
                          aria-label="발급 내역 상태"
                          value={historyFilter}
                          onChange={(event) => setHistoryFilter(event.target.value as typeof historyFilter)}
                        >
                          <option value="all">모든 상태</option>
                          {Object.entries(states).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))}
                        </select>
                      )}
                    </header>
                    {history.length > 0 ? (
                      <ul>{history.map(status)}</ul>
                    ) : (
                      <p className={styles.muted}>
                        {scopedLinks.length ? '해당 상태의 링크가 없습니다.' : '발급한 링크가 없습니다.'}
                      </p>
                    )}
                  </section>
                </div>
              </div>
            </>
          )}
        </>
      )}
      {extension && (
        <dialog
          className={styles.dialog}
          aria-labelledby="submission-deadline-title"
          ref={(node) => {
            if (node && !node.open) node.showModal();
          }}
          onClose={() => setExtension(null)}
        >
          <form
            className={styles.stack}
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const { scope, id, value } = extension;
                const result = await adminRequest<{ changed: number }>('submissions', {
                  action: 'extend',
                  scope,
                  id,
                  expiresAt: kstDeadline(value),
                });
                setExtension(null);
                setNotice(
                  result.changed ? `${result.changed}건의 링크 기한을 연장했습니다.` : '연장할 링크가 없습니다.',
                );
                router.refresh();
              });
            }}
          >
            <h2 id="submission-deadline-title">링크 기한 연장</h2>
            <p className={styles.muted}>{extension.label} · 기존보다 늦은 날짜만 적용됩니다.</p>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <label>
              새 마감 시각 (한국시간)
              <input
                type="datetime-local"
                required
                value={extension.value}
                onChange={(event) => setExtension({ ...extension, value: event.target.value })}
              />
            </label>
            <div className={styles.row}>
              <button type="button" disabled={busy} onClick={() => setExtension(null)}>
                취소
              </button>
              <button type="submit" className={adminStyles.primary} disabled={busy || !extension.value}>
                기한 연장
              </button>
            </div>
          </form>
        </dialog>
      )}
    </section>
  );
}
