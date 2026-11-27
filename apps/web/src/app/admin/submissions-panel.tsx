'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { type ContentKind, organizerPositions, reviewPositions } from '@/lib/cms/content-contract';
import {
  defaultDeadline,
  formatSubmissionTime,
  kstDeadline,
  type SubmissionJob,
  type SubmissionLink,
  submissionLabels,
  type SubmissionWorkspace,
} from '@/lib/cms/submission-contract';

import { adminRequest } from './admin-request';

import styles from './submissions.module.scss';

type Team = SubmissionWorkspace['teams'][number];
type Match = { id: number; name: string; cohort?: number };
type Changes = { changes: { field: string; before: unknown; after: unknown }[] };
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
  name: '이름',
  title: '한 줄 소개',
  description: '본문',
  links: '공개 링크',
  skills: '기술 태그',
  thumbnailId: '대표 이미지',
  pdfId: '발표 PDF',
  images: '갤러리 이미지',
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
  target?: { id: number; kind: ContentKind };
}) {
  const router = useRouter();
  const [tab, setTab] = useState(target ? (target.kind === 'organizer' ? 'organizers' : 'teams') : 'approvals');
  const [teamId, setTeamId] = useState(workspace.teams[0]?.id ?? '');
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
  const [lookup, setLookup] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<Match | null>(
    target ? { id: target.id, name: `기존 항목 ${target.id}` } : null,
  );
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [details, setDetails] = useState<Record<string, Changes>>({});
  const [conflict, setConflict] = useState<{ ids: string[]; confirmation: string; fields: string[] }>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const cohort = workspace.cohorts.find(({ id }) => id === workspace.cohortId);
  const team = workspace.teams.find(({ id }) => id === teamId) ?? workspace.teams[0];
  const operationKind = tab === 'organizers' ? 'organizer' : kind === 'review' ? 'review' : 'project';
  const pending = workspace.links.filter((link) => link.state === 'submitted');

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
    item: Match | null = selected,
  ) {
    const payload = {
      action: 'issue',
      kind: type,
      expiresAt: kstDeadline(deadline),
      targetId: item?.id ?? null,
      label:
        label.trim() ||
        member?.name ||
        (owner ? `${cohort?.ordinal}기 ${owner.number}조 ${submissionLabels[type]}` : '새 운영진 소개'),
      ...(owner ? { teamId: owner.id } : {}),
      ...(member ? { memberId: member.id } : {}),
      ...(type === 'organizer' ? { position: organizerPosition, archived } : {}),
    };
    const result = await adminRequest<SubmissionLink & { path: string }>('submissions', payload);
    setLinks((previous) => [
      ...previous,
      { label: result.label, url: new URL(result.path, window.location.origin).href },
    ]);
  }

  async function processJob(jobId: string) {
    setNotice('게시 작업이 진행 중입니다.');
    const until = Date.now() + 180_000;
    while (Date.now() < until) {
      const result = await adminRequest<Pick<SubmissionJob, 'state'> | null>('submissions', {
        action: 'process',
        jobId,
      });
      if (result?.state === 'published') {
        setNotice('게시를 완료했습니다.');
        return;
      }
      if (!result || result.state === 'failed')
        throw new Error('게시 작업을 완료하지 못했습니다. 변경 사항을 확인하고 다시 승인해 주세요.');
      if (result.state === 'processing') await new Promise((resolve) => window.setTimeout(resolve, 2500));
    }
    setNotice('게시 작업이 저장되었습니다. 게시 작업에서 이어서 처리할 수 있습니다.');
  }

  async function approve(ids: string[], confirmation?: string) {
    await run(async () => {
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
        try {
          await processJob(result.jobId);
        } finally {
          router.refresh();
        }
      }
    });
  }

  function status(link: SubmissionLink) {
    return (
      <li key={link.id} className={styles.linkRow}>
        <strong>{link.label}</strong> <span>{states[link.state]}</span>
        <time dateTime={link.expiresAt}>{formatSubmissionTime(link.expiresAt)} KST</time>
        {active(link) && (
          <>
            <button
              type="button"
              disabled={busy || !deadline}
              onClick={() =>
                void change(
                  { action: 'extend', scope: 'link', id: link.id, expiresAt: kstDeadline(deadline) },
                  '링크 기한을 연장했습니다.',
                )
              }
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
          <strong>{row.label}</strong> <span>{submissionLabels[row.kind]}</span>
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
            {review ? '비교 닫기' : '변경 비교'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm('이 제출안을 반려할까요?'))
                void change({ action: 'reject', linkId: row.id }, '제출안을 반려했습니다.');
            }}
          >
            반려
          </button>
        </div>
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
                    <span>제출안</span> {describe(field, after) || '비어 있음'}
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

  return (
    <section className={styles.panel} aria-busy={busy}>
      <h1>제출 관리</h1>
      <div className={styles.row} aria-label="제출 관리 메뉴">
        {[
          ['approvals', `승인 대기 ${pending.length}`],
          ['teams', '조별 현황'],
          ['organizers', '운영진 프로필'],
        ].map(([id, text]) => (
          <button
            type="button"
            key={id}
            aria-pressed={tab === id}
            onClick={() => {
              setTab(id);
              setConflict(undefined);
            }}
          >
            {text}
          </button>
        ))}
        {tab !== 'organizers' && (
          <label>
            기수
            <select
              value={cohort?.ordinal ?? ''}
              onChange={(event) => router.push(`/admin?section=submissions&cohort=${event.target.value}`)}
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
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {busy && <p role="status">처리 중입니다…</p>}
      {tab === 'approvals' ? (
        <>
          {conflict && (
            <div className={styles.box}>
              <p role="alert">같은 필드에 변경이 겹쳤습니다. {conflict.fields.join(', ')}</p>
              <button type="button" disabled={busy} onClick={() => void approve(conflict.ids, conflict.confirmation)}>
                확인한 제출안으로 승인
              </button>
              <button type="button" onClick={() => setConflict(undefined)}>
                닫기
              </button>
            </div>
          )}
          {workspace.jobs.length > 0 && (
            <div className={styles.box}>
              <h2>게시 작업</h2>
              <ul>
                {workspace.jobs.map((job) => (
                  <li key={job.id}>
                    {job.linkIds.length}건 · {job.state === 'failed' ? '게시 실패' : '게시 처리 중'}
                    {job.state !== 'failed' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            try {
                              await processJob(job.id);
                            } finally {
                              router.refresh();
                            }
                          })
                        }
                      >
                        이어서 처리
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pending.length === 0 && <p>승인할 제출안이 없습니다.</p>}
          {workspace.teams.map((owner) => {
            const rows = pending.filter((row) => row.teamId === owner.id);
            if (!rows.length) return null;
            const ready = owner.projectId !== null || rows.some((row) => row.kind === 'project');
            return (
              <article className={styles.box} key={owner.id}>
                <div className={styles.row}>
                  <h2>
                    {cohort?.ordinal}기 {owner.number}조
                  </h2>
                  <button
                    type="button"
                    disabled={busy || !ready}
                    onClick={() => void approve(rows.map(({ id }) => id))}
                  >
                    {rows.length}건 승인 및 게시
                  </button>
                </div>
                {!ready && <p>프로젝트가 제출되면 후기를 함께 게시할 수 있습니다.</p>}
                <ul>{rows.map(showReview)}</ul>
              </article>
            );
          })}
          {pending
            .filter((row) => row.kind === 'organizer')
            .map((row) => (
              <article className={styles.box} key={row.id}>
                <div className={styles.row}>
                  <h2>운영진 프로필</h2>
                  <button type="button" disabled={busy} onClick={() => void approve([row.id])}>
                    승인 및 게시
                  </button>
                </div>
                <ul>{showReview(row)}</ul>
              </article>
            ))}
        </>
      ) : (
        <>
          <div className={styles.box}>
            <label>
              마감 시각 (KST)
              <input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            </label>
            {tab === 'teams' && cohort && (
              <>
                <div className={styles.row}>
                  <label>
                    만들 조 수
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
                    disabled={busy || !deadline}
                    onClick={() =>
                      void change(
                        { action: 'extend', scope: 'cohort', id: cohort.id, expiresAt: kstDeadline(deadline) },
                        '기수 링크 기한을 연장했습니다.',
                      )
                    }
                  >
                    기수 전체 연장
                  </button>
                </div>
                {team && (
                  <>
                    <label>
                      조
                      <select
                        value={team.id}
                        onChange={(event) => {
                          setTeamId(event.target.value);
                          setMemberId('');
                          setSelected(null);
                        }}
                      >
                        {workspace.teams.map(({ id, number, members }) => {
                          const group = workspace.links.filter((row) => row.teamId === id);
                          const reviewed = new Set(
                            group
                              .filter((row) => row.kind === 'review' && ['submitted', 'published'].includes(row.state))
                              .map((row) => row.memberId),
                          );
                          return (
                            <option key={id} value={id}>
                              {number}조 · 후기 {reviewed.size}/{members.length}명 제출
                            </option>
                          );
                        })}
                      </select>
                    </label>
                    <div className={styles.row}>
                      <label>
                        팀원 이름
                        <input
                          value={memberName}
                          maxLength={160}
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
                      <button
                        type="button"
                        disabled={busy || !memberName.trim()}
                        onClick={() =>
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
                          })
                        }
                      >
                        팀원 추가
                      </button>
                      <button
                        type="button"
                        disabled={busy || !deadline}
                        onClick={() =>
                          void change(
                            { action: 'extend', scope: 'team', id: team.id, expiresAt: kstDeadline(deadline) },
                            '조 링크 기한을 연장했습니다.',
                          )
                        }
                      >
                        이 조 기한 연장
                      </button>
                    </div>
                    <p>{team.members.map((member) => member.name).join(', ') || '등록한 팀원이 없습니다.'}</p>
                    <button
                      type="button"
                      disabled={busy || !deadline}
                      onClick={() =>
                        void run(async () => {
                          const group = workspace.links.filter((entry) => entry.teamId === team.id);
                          try {
                            if (
                              !group.some(
                                (entry) =>
                                  entry.kind === 'project' && entry.state !== 'revoked' && entry.state !== 'rejected',
                              )
                            )
                              await issue('project', team, undefined, operationKind === 'project' ? selected : null);
                            for (const member of team.members) {
                              if (
                                !group.some(
                                  (entry) =>
                                    entry.memberId === member.id &&
                                    entry.state !== 'revoked' &&
                                    entry.state !== 'rejected',
                                )
                              )
                                await issue('review', team, member, null);
                            }
                            setNotice('발급 목록을 확인해 주세요.');
                          } finally {
                            router.refresh();
                          }
                        })
                      }
                    >
                      조별 프로젝트·후기 링크 발급
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          {(tab === 'organizers' || team) && (
            <div className={styles.box}>
              <h2>개별 링크 발급</h2>
              {tab === 'teams' && (
                <label>
                  콘텐츠
                  <select
                    value={operationKind}
                    onChange={(event) => {
                      setKind(event.target.value as ContentKind);
                      setSelected(null);
                      setMatches([]);
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
                  <select value={memberId} onChange={(event) => setMemberId(event.target.value)}>
                    <option value="">팀원 선택</option>
                    {team?.members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className={styles.row}>
                <label>
                  기존 {submissionLabels[operationKind]} 검색
                  <input value={lookup} onChange={(event) => setLookup(event.target.value)} />
                </label>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      setMatches(
                        await adminRequest<Match[]>('submissions', {
                          action: 'lookup',
                          kind: operationKind,
                          query: lookup,
                          cohort: operationKind === 'organizer' ? undefined : cohort?.ordinal,
                        }),
                      );
                    })
                  }
                >
                  검색
                </button>
                <button type="button" onClick={() => setSelected(null)}>
                  신규 등록
                </button>
              </div>
              {matches.length > 0 && (
                <label>
                  검색 결과
                  <select
                    value={selected?.id ?? ''}
                    onChange={(event) => {
                      setSelected(matches.find((item) => String(item.id) === event.target.value) ?? null);
                    }}
                  >
                    <option value="">항목 선택</option>
                    {matches.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <p>
                {selected
                  ? `${selected.name} 수정`
                  : operationKind === 'project' && team?.projectId !== null && team?.projectId !== undefined
                    ? '조에 연결된 프로젝트 수정'
                    : '신규 등록'}
              </p>
              <label>
                링크 이름
                <input value={label} maxLength={160} onChange={(event) => setLabel(event.target.value)} />
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
                    <input type="checkbox" checked={archived} onChange={(event) => setArchived(event.target.checked)} />{' '}
                    하단 운영진 목록에 표시
                  </label>
                </>
              )}
              <button
                type="button"
                disabled={busy || !deadline || (operationKind === 'review' && !memberId)}
                onClick={() =>
                  void run(async () => {
                    await issue(
                      operationKind,
                      operationKind === 'organizer' ? undefined : team,
                      team?.members.find((member) => member.id === memberId),
                    );
                    setNotice('링크를 발급했습니다. 아래에서 복사하세요.');
                    router.refresh();
                  })
                }
              >
                링크 발급
              </button>
            </div>
          )}
          {links.length > 0 && (
            <div className={styles.box}>
              <h2>방금 발급한 링크</h2>
              <p>
                발급 주소는 이 화면에서 복사할 수 있습니다. 프로젝트 링크는 조에, 후기 링크는 각 팀원에게 전달하세요.
              </p>
              {links.map(({ label: name, url }) => (
                <div className={styles.row} key={url}>
                  <label>
                    {name}
                    <input readOnly value={url} onFocus={(event) => event.target.select()} />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(url)
                        .then(() => setNotice('링크를 복사했습니다.'))
                        .catch(() => setError('주소를 선택해 직접 복사해 주세요.'))
                    }
                  >
                    복사
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className={styles.box}>
            <h2>발급 내역</h2>
            <ul>
              {workspace.links
                .filter((entry) => (tab === 'organizers' ? entry.kind === 'organizer' : entry.teamId === team?.id))
                .map(status)}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
