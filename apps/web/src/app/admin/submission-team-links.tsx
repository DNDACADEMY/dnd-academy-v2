'use client';

import { useState } from 'react';

import { defaultDeadline, type SubmissionWorkspace } from '@/lib/cms/submission-contract';

import { DeadlineDialog, LinkManagement, type Receipts } from './submission-links';
import {
  linkStates as states,
  type SubmissionTarget,
  SubmissionFeedback,
  useSubmissionActions,
} from './submission-workspace';

import styles from './submissions.module.scss';

export function TeamSubmissionLinks({
  workspace,
  target,
  issued,
  onIssue,
}: Receipts & {
  workspace: SubmissionWorkspace;
  target?: SubmissionTarget;
}) {
  const { busy, error, notice, change, setNotice } = useSubmissionActions();
  const cohort = workspace.cohorts.find(({ id }) => id === workspace.cohortId);
  const linkedProject = target?.kind === 'project' ? target.id : target?.projectId;
  const [teamId, setTeamId] = useState(
    workspace.teams.find((team) => linkedProject != null && team.projectId === linkedProject)?.id,
  );
  const [teamCount, setTeamCount] = useState(String(Math.max(10, workspace.teams.length)));
  const [kind, setKind] = useState<'project' | 'review'>(target?.kind === 'review' ? 'review' : 'project');
  const [deadline, setDeadline] = useState(defaultDeadline);
  const team = workspace.teams.find(({ id }) => id === teamId) ?? workspace.teams[0];
  const [cohortExtension, setCohortExtension] = useState(false);

  return (
    <section className={styles.view} aria-labelledby="team-links-heading">
      <header className={styles.viewHeading}>
        <h2 id="team-links-heading">조별 링크 관리</h2>
        <p>조를 선택해 프로젝트와 팀원별 후기 링크를 관리합니다.</p>
      </header>
      <SubmissionFeedback busy={busy} error={error} notice={notice} />
      {cohort ? (
        <div className={styles.box}>
          <header className={styles.cardHeading}>
            <div>
              <h2>{cohort.ordinal}기 조 현황</h2>
              <p>{workspace.teams.length}개 조</p>
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
                  disabled={
                    busy ||
                    !Number.isInteger(Number(teamCount)) ||
                    Number(teamCount) <= workspace.teams.length ||
                    Number(teamCount) > 100
                  }
                  onClick={() =>
                    void change(
                      { action: 'teams', cohortId: cohort.id, count: Number(teamCount) },
                      '조를 추가했습니다.',
                    )
                  }
                >
                  조 추가
                </button>
                <button type="button" disabled={busy} onClick={() => setCohortExtension(true)}>
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
                    <button type="button" aria-pressed={team?.id === owner.id} onClick={() => setTeamId(owner.id)}>
                      <strong>{owner.number}조</strong>
                      <span>
                        {project
                          ? `프로젝트 ${states[project.state]}`
                          : owner.projectId !== null
                            ? '프로젝트 연결됨'
                            : '프로젝트 미발급'}
                      </span>
                      <small>
                        {owner.members.length ? `후기 ${reviewCount}/${owner.members.length}명 제출` : '팀원 미등록'}
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
      ) : (
        <div className={styles.empty}>
          <h3>등록된 기수가 없습니다</h3>
          <p>모집 관리에서 기수를 등록해 주세요.</p>
        </div>
      )}
      {cohort && cohortExtension && (
        <DeadlineDialog
          initial={{ scope: 'cohort', id: cohort.id, label: `${cohort.ordinal}기 전체`, value: defaultDeadline() }}
          onClose={() => setCohortExtension(false)}
          onDone={setNotice}
        />
      )}
      {cohort && team && (
        <LinkManagement
          key={team.id}
          context={{ team, cohort, teams: workspace.teams, links: workspace.links, kind, setKind }}
          links={workspace.links.filter(({ teamId }) => teamId === team.id)}
          target={target?.kind === kind ? target : undefined}
          issued={issued}
          onIssue={onIssue}
          teamDeadline={deadline}
          onTeamDeadlineChange={setDeadline}
        />
      )}
    </section>
  );
}
