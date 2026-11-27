'use client';

import { useState } from 'react';

import { type ContentKind, organizerPositions, reviewPositions } from '@/lib/cms/content-contract';
import {
  defaultDeadline,
  formatSubmissionTime,
  kstDeadline,
  type SubmissionContentMatch,
  type SubmissionLink,
  submissionLabels,
  type SubmissionWorkspace,
} from '@/lib/cms/submission-contract';

import { adminRequest } from './admin-request';
import SubmissionContentPicker from './submission-content-picker';
import {
  type Expiry,
  type IssuedLink,
  type SubmissionTarget,
  type SubmissionTeam,
  linkStates as states,
  publicPath,
  SubmissionFeedback,
  useSubmissionActions,
} from './submission-workspace';

import adminStyles from './styles.module.scss';
import styles from './submissions.module.scss';

type Team = SubmissionTeam;
type Cohort = SubmissionWorkspace['cohorts'][number];
export type Receipts = { issued: IssuedLink[]; onIssue: (link: IssuedLink) => void };
type Extension = Expiry & { label: string; value: string };
type TeamContext = {
  team: Team;
  cohort: Cohort;
  teams: Team[];
  links: SubmissionLink[];
  kind: 'project' | 'review';
  setKind: (kind: 'project' | 'review') => void;
};
const active = (link: SubmissionLink) => ['issued', 'editing', 'expired'].includes(link.state);

export function OrganizerSubmissionLinks({
  links,
  target,
  issued,
  onIssue,
}: Receipts & {
  links: SubmissionLink[];
  target?: SubmissionTarget;
}) {
  return (
    <section className={styles.view} aria-labelledby="organizer-links-heading">
      <header className={styles.viewHeading}>
        <h2 id="organizer-links-heading">운영진 링크 관리</h2>
        <p>소개를 새로 받거나 기존 프로필의 수정 링크를 발급합니다.</p>
      </header>
      <LinkManagement links={links} target={target} issued={issued} onIssue={onIssue} />
    </section>
  );
}

export function LinkManagement({
  context,
  links: scopedLinks,
  target,
  issued: latestLinks,
  onIssue,
  teamDeadline,
  onTeamDeadlineChange,
}: Receipts & {
  context?: TeamContext;
  links: SubmissionLink[];
  target?: SubmissionTarget;
  teamDeadline?: string;
  onTeamDeadlineChange?: (value: string) => void;
}) {
  const { busy, error, notice, setError, setNotice, run, change, router } = useSubmissionActions();
  const team = context?.team;
  const cohort = context?.cohort;
  const operationKind = context?.kind ?? 'organizer';
  const [organizerDeadline, setOrganizerDeadline] = useState(defaultDeadline);
  const deadline = teamDeadline ?? organizerDeadline;
  const setDeadline = onTeamDeadlineChange ?? setOrganizerDeadline;
  const [memberId, setMemberId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [reviewPosition, setReviewPosition] = useState<(typeof reviewPositions)[number]>(reviewPositions[0]);
  const [organizerPosition, setOrganizerPosition] = useState<(typeof organizerPositions)[number]>(
    organizerPositions[0],
  );
  const [archived, setArchived] = useState(false);
  const [label, setLabel] = useState('');
  const [selected, setSelected] = useState<SubmissionContentMatch | null>(
    target ? { id: target.id, name: target.name } : null,
  );
  const [targetMode, setTargetMode] = useState<'new' | 'existing'>(target ? 'existing' : 'new');
  const [historyFilter, setHistoryFilter] = useState<'all' | SubmissionLink['state']>('all');
  const [extension, setExtension] = useState<Extension | null>(null);

  const [historyQuery, setHistoryQuery] = useState('');
  const [copied, setCopied] = useState<string>();
  const conflictingTarget =
    operationKind === 'project' && team?.projectId != null && selected !== null && selected.id !== team.projectId;
  const canIssue = Boolean(
    !busy &&
    deadline &&
    !conflictingTarget &&
    (operationKind !== 'review' || memberId) &&
    (targetMode === 'new' || selected || (operationKind === 'project' && team?.projectId != null)),
  );

  const historyTerm = historyQuery.normalize('NFC').toLocaleLowerCase('ko').trim();
  const history = scopedLinks.filter(
    ({ label, state }) =>
      (historyFilter === 'all' || historyFilter === state) &&
      label.normalize('NFC').toLocaleLowerCase('ko').includes(historyTerm),
  );
  function editDeadline(scope: Expiry, title: string, expiresAt?: string) {
    setError('');
    const value = expiresAt
      ? new Date(Math.max(Date.now(), Date.parse(expiresAt)) + (24 + 9) * 60 * 60 * 1000).toISOString().slice(0, 16)
      : defaultDeadline();
    setExtension({ ...scope, label: title, value });
  }
  const toIssue = (context?.teams ?? []).map((owner) => {
    const issued = (context?.links ?? []).filter(
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
    onIssue({
      id: result.id,
      label: result.label,
      kind: result.kind,
      url: new URL(result.path, window.location.origin).href,
    });
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
      } catch (reason) {
        if (count > 0) setNotice(`${count}건 발급했습니다. 발급한 주소를 복사하고 남은 대상을 다시 시도해 주세요.`);
        throw reason;
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

  return (
    <>
      <SubmissionFeedback busy={busy} error={error} notice={notice} />
      {latestLinks.length > 0 && (
        <div className={`${styles.box} ${styles.receipts}`}>
          <header className={styles.cardHeading}>
            <div>
              <h2>이번에 발급한 링크</h2>
              <p>이 작업 중 발급한 주소를 복사해 작성자에게 전달하세요. 새로고침하면 주소를 다시 볼 수 없습니다.</p>
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
                      .then(() => {
                        setCopied(id);
                        setError('');
                        setNotice('링크를 복사했습니다.');
                      })
                      .catch(() => setError('주소를 선택해 직접 복사해 주세요.'))
                  }
                >
                  {copied === id ? '복사 완료' : '복사'}
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
              <h2>{!team ? '운영진 작성 링크 발급' : `${team?.number}조 작성 링크 발급`}</h2>
              <p>{team ? '프로젝트 또는 후기의 작성 대상을 선택하세요.' : '운영진에게 보낼 작성 링크를 발급하세요.'}</p>
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
            {team && (
              <label>
                발급할 콘텐츠
                <select
                  value={operationKind}
                  onChange={(event) => {
                    context?.setKind(event.target.value === 'review' ? 'review' : 'project');
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
                    key={operationKind}
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
                  <input type="checkbox" checked={archived} onChange={(event) => setArchived(event.target.checked)} />{' '}
                  공개 운영진 페이지 하단에 이름만 표시
                </label>
              </>
            )}
            <button type="submit" className={adminStyles.primary} disabled={!canIssue}>
              링크 발급
            </button>
          </form>
          {team && (
            <details className={styles.secondaryAction}>
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
          {team && (
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
            {scopedLinks.length > 0 && (
              <label>
                링크 이름 검색
                <input
                  type="search"
                  value={historyQuery}
                  onChange={(event) => setHistoryQuery(event.target.value)}
                  placeholder="이름으로 찾기"
                />
              </label>
            )}
            {history.length > 0 ? (
              <ul>{history.map(status)}</ul>
            ) : (
              <p className={styles.muted}>
                {scopedLinks.length ? '검색 조건에 맞는 링크가 없습니다.' : '발급한 링크가 없습니다.'}
              </p>
            )}
          </section>
        </div>
      </div>

      {extension && <DeadlineDialog initial={extension} onClose={() => setExtension(null)} onDone={setNotice} />}
    </>
  );
}

export function DeadlineDialog({
  initial,
  onClose,
  onDone,
}: {
  initial: Extension;
  onClose: () => void;
  onDone?: (notice: string) => void;
}) {
  const [extension, setExtension] = useState(initial);
  const { busy, error, router, run } = useSubmissionActions();
  return (
    <dialog
      className={styles.dialog}
      aria-labelledby="submission-deadline-title"
      ref={(node) => {
        if (node && !node.open) node.showModal();
      }}
      onClose={() => onClose()}
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
            onClose();
            onDone?.(result.changed ? `${result.changed}건의 링크 기한을 연장했습니다.` : '연장할 링크가 없습니다.');
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
          <button type="button" disabled={busy} onClick={() => onClose()}>
            취소
          </button>
          <button type="submit" className={adminStyles.primary} disabled={busy || !extension.value}>
            기한 연장
          </button>
        </div>
      </form>
    </dialog>
  );
}
