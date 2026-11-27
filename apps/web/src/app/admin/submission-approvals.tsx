'use client';

import { useEffect, useState } from 'react';

import SubmissionPreview from '@/components/pages/SubmissionPreview';
import type { ContentInput, MediaItem } from '@/lib/cms/content-contract';
import {
  organizerProfileLabels,
  type Submission,
  type SubmissionJob,
  type SubmissionLink,
  type SubmissionPublication,
  submissionLabels,
  type SubmissionWorkspace,
} from '@/lib/cms/submission-contract';

import { adminRequest } from './admin-request';
import { type ApprovalOverview, publicPath, SubmissionFeedback, useSubmissionActions } from './submission-workspace';

import adminStyles from './styles.module.scss';
import styles from './submissions.module.scss';

type Changes = {
  submission: Submission;
  draft: ContentInput;
  media: MediaItem[];
  changes: { field: string; before: unknown; after: unknown }[];
};
type Approval = { jobId?: string; conflicts?: { id: string; field: string }[]; confirmation?: string };
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
function describe(field: string, value: unknown) {
  if (field === 'images' && Array.isArray(value)) return `이미지 ${value.length}장`;
  if (field === 'thumbnailId' || field === 'pdfId') return value ? '첨부 있음' : '첨부 없음';
  if (Array.isArray(value))
    return value
      .map((item) => (typeof item === 'string' ? item : typeof item?.url === 'string' ? item.url : ''))
      .join(', ');
  return typeof value === 'string' ? value : '';
}

export default function SubmissionApprovals({
  workspace,
  overview,
  onOpenTeams,
  onOpenOrganizers,
}: {
  workspace: SubmissionWorkspace;
  overview: ApprovalOverview;
  onOpenTeams: () => void;
  onOpenOrganizers: () => void;
}) {
  const { router, busy, error, notice, setNotice, run, change } = useSubmissionActions();
  const { pending, readyTeams, organizers, readyCount, processing } = overview;
  const cohort = workspace.cohorts.find(({ id }) => id === workspace.cohortId);
  const [details, setDetails] = useState<Record<string, Changes>>({});
  const [conflict, setConflict] = useState<{ ids: string[]; confirmation: string; fields: string[] }>();
  const [published, setPublished] = useState<{ kind: Submission['kind']; id: number }[]>([]);
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
  }, [jobToWatch, router, setNotice]);
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

  return (
    <section className={styles.view} aria-labelledby="approval-heading" aria-busy={busy}>
      <header className={styles.viewHeading}>
        <h2 id="approval-heading">승인 대기</h2>
        <p>제출안의 변경 사항을 검토하고 게시 상태를 확인합니다.</p>
      </header>
      <SubmissionFeedback busy={busy} error={error} notice={notice}>
        {published.length > 0 && (
          <ul className={styles.row} aria-label="방금 게시한 콘텐츠">
            {published.map(({ kind, id }) => (
              <li key={`${kind}-${id}`}>
                <a href={publicPath(kind, id)}>{submissionLabels[kind]} 공개 페이지 보기</a>
              </li>
            ))}
          </ul>
        )}
      </SubmissionFeedback>
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
            {pending.length - readyCount - processing}
            <span>건</span>
          </dd>
        </div>
        <div>
          <dt>게시 처리 중</dt>
          <dd>
            {processing}
            <span>건</span>
          </dd>
        </div>
      </dl>
      {conflict && (
        <div className={styles.box}>
          <p role="alert" className={styles.warning}>
            같은 필드에 변경이 겹쳤습니다. {conflict.fields.join(', ')}
          </p>
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
          <button type="button" className={adminStyles.primary} onClick={onOpenTeams}>
            조별 링크 관리
          </button>
          <button type="button" onClick={onOpenOrganizers}>
            운영진 링크 관리
          </button>
        </div>
      )}
      {readyTeams.map(({ owner, rows, ready }) => (
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
            <div>
              <h3>운영진 프로필 제출</h3>
            </div>
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
    </section>
  );
}
