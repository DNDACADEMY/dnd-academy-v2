'use client';

import { useCallback, useEffect, useState } from 'react';

import SubmissionPreview from '@/components/pages/SubmissionPreview';
import { linkKinds, linkLabels, safeContentLink } from '@/lib/cms/content-contract';
import {
  formatSubmissionTime,
  organizerProfileDetails,
  organizerProfileInput,
  type Submission,
  submissionLabels,
} from '@/lib/cms/submission-contract';

import MediaPanel from '../../admin/media-panel';
import SkillTagPicker from '../../admin/skill-tag-picker';
import OrganizerProfileFields from './organizer-profile-fields';

import styles from './submission.module.scss';

type Field = 'thumbnail' | 'gallery' | 'pdf';
const attachments = { thumbnail: '대표 이미지', gallery: '갤러리 이미지', pdf: '발표 PDF' };
const localMediaId = 'local-preview';

async function post<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(data),
  });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new Error(value?.message ?? '다시 시도해 주세요.');
  return value as T;
}

export default function SubmissionEditor({ id }: { id: string }) {
  const path = '/api/submissions/' + id;
  const [submission, setSubmission] = useState<Submission>();
  const [input, setInput] = useState<Submission['input']>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [field, setField] = useState<Field>();
  const [local, setLocal] = useState<string>();
  const [mobilePreview, setMobilePreview] = useState(false);
  const [cardPreview, setCardPreview] = useState(false);
  const [widePreview, setWidePreview] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const requestMedia = useCallback(<T,>(payload: unknown) => post<T>(path + '/media', payload), [path]);
  const loadCatalog = useCallback(() => post<{ skills: string[] }>(path, { action: 'skills' }), [path]);

  useEffect(() => {
    if (window.location.hash) return;
    let active = true;
    void post<Submission>(path, { action: 'read' })
      .then((next) => {
        if (active) {
          setSubmission(next);
          setInput(next.input);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [path]);

  async function open() {
    setBusy(true);
    setError('');
    try {
      const token = window.location.hash.slice(1);
      const next = await post<Submission>(path, token ? { action: 'open', token } : { action: 'read' });
      window.history.replaceState(null, '', window.location.pathname);
      setSubmission(next);
      setInput(next.input);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(action: 'save' | 'submit') {
    if (!submission || !input) return;
    const isProject = submission.kind === 'project';
    const isReview = submission.kind === 'review';
    const profile =
      submission.kind === 'organizer' && input.organizerProfile
        ? organizerProfileInput.safeParse({
            ...input.organizerProfile,
            now: input.organizerProfile.now.filter((line) => line.trim()),
            previous: input.organizerProfile.previous.filter((line) => line.trim()),
          })
        : undefined;
    if (profile && !profile.success) {
      setError(profile.error.issues[0]?.message ?? '프로필 항목을 확인해 주세요.');
      setConfirmSubmit(false);
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const next = await post<Submission>(path, {
        action,
        version: submission.version,
        input: {
          name: input.name,
          description: input.description,
          links: input.links,
          ...(profile?.success ? { organizerProfile: profile.data } : {}),
          ...(!isReview ? { skills: input.skills, thumbnailId: input.thumbnailId } : {}),
          ...(isProject ? { title: input.title, pdfId: input.pdfId, images: input.images } : {}),
        },
      });
      setSubmission(next);
      setInput(next.input);
      setConfirmSubmit(false);
      if (action === 'save') setNotice('임시 저장했습니다.');
    } catch (reason) {
      setError((reason as Error).message);
      setConfirmSubmit(false);
    } finally {
      setBusy(false);
    }
  }

  if (submission?.state === 'submitted') {
    return (
      <section className={styles.entry} data-admin-workspace>
        <h1>제출 완료</h1>
        <p>운영진 승인 대기 중입니다.</p>
      </section>
    );
  }
  if (!submission || !input) {
    return (
      <section className={styles.entry} data-admin-workspace>
        <h1>DND 콘텐츠 제출</h1>
        <p>발급받은 링크로 프로젝트, 후기 또는 운영진 소개를 작성합니다.</p>
        {error && <p role="alert">{error}</p>}
        <button type="button" disabled={busy} onClick={() => void open()}>
          {busy ? '확인 중…' : '작성 시작'}
        </button>
      </section>
    );
  }

  const kind = submission.kind;
  const mediaUrl = (asset: string) => path + '/media?asset=' + asset;
  const media = new Map(
    [input.thumbnailId, input.pdfId, ...(input.images ?? []).map((item) => item.mediaId)].flatMap((asset) =>
      asset ? [[asset, mediaUrl(asset)] as const] : [],
    ),
  );
  if (local) media.set(localMediaId, local);
  const originalOrganizer = submission.organizerPreview;
  const hasNewOrganizerPhoto =
    originalOrganizer && input.thumbnailId != null && input.thumbnailId !== originalOrganizer.thumbnailId;
  const draft = {
    ...input,
    mbti: input.organizerProfile?.mbti,
    details: [
      ...(input.organizerProfile ? organizerProfileDetails(input.organizerProfile) : []),
      ...(submission.organizerPreview?.shares ?? []).flatMap((body) =>
        (body.startsWith('/') && !body.startsWith('//')) || safeContentLink('link', body)
          ? [{ kind: 'share' as const, body }]
          : [],
      ),
    ],
    legacyThumbnail: originalOrganizer?.thumbnailId == null ? originalOrganizer?.legacyThumbnail : undefined,
    emoji: (local && field === 'thumbnail') || hasNewOrganizerPhoto ? null : originalOrganizer?.emoji,
    position: input.position ?? undefined,
    name: input.name.trim() || '이름 미리보기',
    links: input.links.filter(({ kind, url }) => safeContentLink(kind, url)),
    thumbnailId: local && field === 'thumbnail' ? localMediaId : input.thumbnailId,
    pdfId: local && field === 'pdf' ? localMediaId : input.pdfId,
    images: local && field === 'gallery' ? [...(input.images ?? []), { mediaId: localMediaId }] : input.images,
  };
  const update = (changed: Partial<Submission['input']>) => {
    setInput((previous) => (previous ? { ...previous, ...changed } : previous));
    setNotice('');
  };
  const canSubmit = Boolean(
    input.name.trim() && (kind !== 'review' || input.description.trim()) && (kind !== 'project' || input.title?.trim()),
  );

  return (
    <section className={styles.main} data-admin-workspace>
      <header className={styles.header}>
        <span>DND 콘텐츠 제출</span>
        <h1>
          {submission.cohort && submission.teamNumber ? `${submission.cohort}기 ${submission.teamNumber}조 · ` : ''}
          {submission.label}
        </h1>
        <p>
          {submissionLabels[kind]} · 마감 {formatSubmissionTime(submission.expiresAt)} (KST)
        </p>
        <p role="status">
          {notice ||
            (submission.savedAt
              ? `마지막 저장 ${formatSubmissionTime(submission.savedAt)} (KST)`
              : '아직 저장된 변경이 없습니다.')}
        </p>
      </header>
      <div className={styles.mobileTabs} aria-label="작성 또는 미리보기">
        <button type="button" aria-pressed={!mobilePreview} onClick={() => setMobilePreview(false)}>
          편집
        </button>
        <button type="button" aria-pressed={mobilePreview} onClick={() => setMobilePreview(true)}>
          미리보기
        </button>
      </div>
      <div className={styles.columns} data-wide-preview={widePreview}>
        <section className={styles.editor} data-mobile-hidden={mobilePreview}>
          <h2>콘텐츠 작성</h2>
          <fieldset disabled={busy || confirmSubmit}>
            <label>
              이름
              <input value={input.name} maxLength={160} onChange={(event) => update({ name: event.target.value })} />
            </label>
            {kind === 'project' && (
              <label>
                한 줄 소개
                <input
                  value={input.title ?? ''}
                  maxLength={300}
                  onChange={(event) => update({ title: event.target.value })}
                />
              </label>
            )}
            <label>
              {kind === 'review' ? '후기 본문' : '소개'}
              <textarea
                value={input.description}
                rows={8}
                maxLength={50000}
                onChange={(event) => update({ description: event.target.value })}
              />
            </label>
            {kind === 'organizer' && input.organizerProfile && (
              <OrganizerProfileFields
                profile={input.organizerProfile}
                onChange={(organizerProfile) => update({ organizerProfile })}
              />
            )}
            {kind !== 'review' && (
              <SkillTagPicker
                value={input.skills ?? []}
                loadCatalog={loadCatalog}
                onChange={(skills) => update({ skills })}
              />
            )}
            <h3>공개 링크</h3>
            {input.links.map((link, index) => (
              <div key={index} className={styles.row}>
                <select
                  aria-label={`링크 ${index + 1} 종류`}
                  value={link.kind}
                  onChange={(event) =>
                    update({
                      links: input.links.map((item, pos) =>
                        pos === index ? { ...item, kind: event.target.value as typeof link.kind } : item,
                      ),
                    })
                  }
                >
                  {linkKinds
                    .filter((value) => value !== 'email')
                    .map((value) => (
                      <option key={value} value={value}>
                        {linkLabels[value]}
                      </option>
                    ))}
                </select>
                <input
                  aria-label={`링크 ${index + 1} 주소`}
                  type="url"
                  value={link.url}
                  maxLength={2048}
                  placeholder="https://"
                  onChange={(event) =>
                    update({
                      links: input.links.map((item, pos) =>
                        pos === index ? { ...item, url: event.target.value } : item,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  aria-label={`링크 ${index + 1} 삭제`}
                  onClick={() => update({ links: input.links.filter((_, pos) => pos !== index) })}
                >
                  삭제
                </button>
              </div>
            ))}
            {input.links.length < 50 && (
              <button type="button" onClick={() => update({ links: [...input.links, { kind: 'link', url: '' }] })}>
                링크 추가
              </button>
            )}
            {kind !== 'review' && (
              <>
                <h3>첨부 파일</h3>
                {input.thumbnailId && (
                  <button type="button" onClick={() => update({ thumbnailId: null })}>
                    대표 이미지 제거
                  </button>
                )}
                {input.pdfId && (
                  <button type="button" onClick={() => update({ pdfId: null })}>
                    PDF 제거
                  </button>
                )}
                {input.images?.map((entry, index) => (
                  <button
                    key={entry.mediaId ?? entry.legacyUrl ?? index}
                    type="button"
                    onClick={() => update({ images: input.images?.filter((_, pos) => pos !== index) })}
                  >
                    갤러리 이미지 {index + 1} 제거
                  </button>
                ))}
                <div className={styles.row}>
                  {(kind === 'project' ? (['thumbnail', 'gallery', 'pdf'] as const) : (['thumbnail'] as const)).map(
                    (slot) => (
                      <button
                        key={slot}
                        type="button"
                        disabled={uploading || (slot === 'gallery' && (input.images?.length ?? 0) >= 50)}
                        onClick={() => setField(slot)}
                      >
                        {attachments[slot]} 선택
                      </button>
                    ),
                  )}
                </div>
                {field && (
                  <MediaPanel
                    key={field}
                    mime={field === 'pdf' ? 'application/pdf' : 'image/webp'}
                    requestMedia={requestMedia}
                    onBusy={setUploading}
                    onLocalPreview={setLocal}
                    onAttach={(asset) => {
                      if (field === 'thumbnail') update({ thumbnailId: asset });
                      if (field === 'pdf') update({ pdfId: asset });
                      if (field === 'gallery') update({ images: [...(input.images ?? []), { mediaId: asset }] });
                      setField(undefined);
                    }}
                  />
                )}
              </>
            )}
          </fieldset>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          {confirmSubmit ? (
            <div className={styles.row}>
              <p>제출하면 작성이 종료되고 운영진 승인 대기로 이동합니다.</p>
              <button type="button" disabled={busy} onClick={() => setConfirmSubmit(false)}>
                계속 작성
              </button>
              <button type="button" disabled={busy} onClick={() => void save('submit')}>
                제출 확정
              </button>
            </div>
          ) : (
            <div className={styles.row}>
              <button type="button" disabled={busy || uploading} onClick={() => void save('save')}>
                {busy ? '저장 중…' : '임시 저장'}
              </button>
              <button type="button" disabled={busy || uploading || !canSubmit} onClick={() => setConfirmSubmit(true)}>
                제출
              </button>
            </div>
          )}
          {!canSubmit && (
            <p>
              제출에 필요한 이름과 {kind === 'project' ? '한 줄 소개' : kind === 'review' ? '후기 본문' : '기본 정보'}를
              확인해 주세요.
            </p>
          )}
        </section>
        <section className={styles.preview} data-mobile-hidden={!mobilePreview}>
          <div className={styles.previewHeader}>
            <h2>실시간 미리보기</h2>
            <div className={styles.row}>
              <button
                type="button"
                className={styles.expandPreview}
                aria-pressed={widePreview}
                onClick={() => setWidePreview(!widePreview)}
              >
                {widePreview ? '편집과 함께 보기' : '넓게 보기'}
              </button>
              {kind !== 'review' && (
                <button type="button" onClick={() => setCardPreview(!cardPreview)}>
                  {cardPreview ? '상세 보기' : '목록 카드 보기'}
                </button>
              )}
            </div>
          </div>
          <div
            className={styles.publicContent}
            onClickCapture={(event) => {
              if (event.target instanceof Element && event.target.closest('a')) event.preventDefault();
            }}
          >
            <SubmissionPreview submission={submission} draft={draft} media={media} card={cardPreview} />
          </div>
        </section>
      </div>
    </section>
  );
}
