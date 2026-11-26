'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import {
  type ContentInput,
  type ContentKind,
  type ContentRecord,
  type ContentSummary,
  detailKinds,
  linkKinds,
  organizerPositions,
  reviewPositions,
} from '@/lib/cms/content-contract';

import { adminRequest } from './admin-request';
import LinkFields, { linkLabels } from './link-fields';
import AdminLinkStatus from './link-status';
import MediaPanel from './media-panel';

import styles from './styles.module.scss';

const names: Record<ContentKind, string> = { project: '프로젝트', organizer: '운영진', review: '후기' };
const detailLabels = {
  now: '현재 경력',
  previous: '이전 경력',
  role: 'DND에서 맡은 역할',
  recommendation: 'DND를 추천하는 이유',
  interests: '관심사',
  share: '나누고 싶은 이야기',
};

function values(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function readDraft(kind: ContentKind, form: FormData, initial?: ContentRecord): ContentInput {
  const string = (key: string) => String(form.get(key) ?? '');
  const urls = form.getAll('link-url');
  const links = form.getAll('link-kind').flatMap((value, index) => {
    const kind = linkKinds.find((kind) => kind === value);
    const entry = urls[index];
    const url = typeof entry === 'string' ? entry.trim() : '';
    return kind && url ? [{ kind, url }] : [];
  });

  const input: ContentInput = {
    name: string('name'),
    description: string('description'),
    links,
  };
  if (kind !== 'review') {
    const thumbnailId = string('thumbnailId') || null;
    Object.assign(input, {
      thumbnailId,
      legacyThumbnail: thumbnailId || form.has('removeLegacyThumbnail') ? null : initial?.legacyThumbnail,
      skills: values(string('skills')),
    });
  }
  if (kind === 'project') {
    const pdfId = string('pdfId') || null;
    Object.assign(input, {
      title: string('title'),
      cohort: Number(string('cohort')),
      pdfId,
      legacyPdf: pdfId || form.has('removeLegacyPdf') ? null : initial?.legacyPdf,
      images: [
        ...values(string('images')).map((mediaId) => ({ mediaId })),
        ...(form.has('removeLegacyImages') ? [] : (initial?.images ?? []).filter((image) => !image.mediaId)),
      ],
    });
  }
  if (kind === 'organizer') {
    Object.assign(input, {
      position: string('position'),
      author: string('author'),
      mbti: string('mbti'),
      emoji: string('emoji') || null,
      isArchived: form.has('isArchived'),
      details: detailKinds.flatMap((kind) => {
        const body = string(`detail-${kind}`);
        const bodies = ['role', 'recommendation', 'interests'].includes(kind) ? [body].filter(Boolean) : values(body);
        return bodies.map((body) => ({ kind, body }));
      }),
    });
  }
  if (kind === 'review') {
    Object.assign(input, {
      position: string('position'),
      cohort: string('cohort') ? Number(string('cohort')) : null,
      projectId: string('projectId') ? Number(string('projectId')) : null,
      originalProjectName: string('originalProjectName'),
    });
  }
  return input;
}

function publication(row: ContentSummary) {
  if (row.state === 'draft') return row.liveRevisionId != null ? '수정 초안' : '초안';
  return row.state === 'published' ? '공개 중' : '비공개';
}

function Publication({ row }: { row: ContentSummary }) {
  return (
    <span
      className={styles.pill}
      data-tone={row.state === 'published' ? 'green' : row.state === 'draft' ? 'amber' : 'neutral'}
    >
      {publication(row)}
    </span>
  );
}

export default function ContentPanel({
  kind,
  rows,
  initial,
  create,
}: {
  kind: ContentKind;
  rows: ContentSummary[];
  initial?: ContentRecord;
  create: boolean;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const path = `/admin?section=content&kind=${kind}` as const;
  const needle = query.trim().toLocaleLowerCase('ko-KR');
  const listed = rows.filter(
    (row) =>
      (!status ||
        (status === 'published' ? row.liveRevisionId != null || row.state === 'published' : row.state === status)) &&
      (!needle ||
        [row.name, String(row.id), row.author, row.position, row.cohort ? `${row.cohort}기` : ''].some((value) =>
          value?.toLocaleLowerCase('ko-KR').includes(needle),
        )),
  );
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <h1>{names[kind]} 관리</h1>
          <p>
            {rows.length}개 항목 · 공개 중{' '}
            {rows.filter((row) => row.liveRevisionId != null || row.state === 'published').length}개
          </p>
        </div>
        <Link href={`${path}&id=new`} className={styles.primary}>
          ＋ {names[kind]} 추가
        </Link>
      </div>
      <div className={styles.contentLayout}>
        <section className={`${styles.card} ${styles.library}`} aria-label={`${names[kind]} 목록`}>
          <div className={styles.libraryHead}>
            <h2>
              {names[kind]} 목록 <span>{listed.length}</span>
            </h2>
            <label className={styles.search}>
              <span className={styles.visuallyHidden}>{names[kind]} 검색</span>
              <input
                type="search"
                value={query}
                placeholder="이름, ID, 기수 검색"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <select aria-label="게시 상태 필터" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">모든 상태</option>
              <option value="published">공개 중</option>
              <option value="draft">초안</option>
              <option value="archived">비공개</option>
            </select>
          </div>
          {listed.length ? (
            <ul className={styles.records}>
              {listed.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`${path}&id=${row.id}`}
                    prefetch={false}
                    aria-current={initial?.id === row.id ? 'page' : undefined}
                  >
                    <span className={styles.recordMain}>
                      <strong>{row.name}</strong>
                      <small>
                        {[`#${row.id}`, row.cohort ? `${row.cohort}기` : '', row.position, row.author]
                          .filter(Boolean)
                          .join(' · ')}
                      </small>
                    </span>
                    <span className={styles.recordIndicators}>
                      <Publication row={row} />
                      <AdminLinkStatus />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>
              {rows.length ? '검색 조건에 맞는 항목이 없습니다.' : '등록된 항목이 없습니다.'}
            </p>
          )}
        </section>
        {initial || create ? (
          <ContentEditor key={initial?.id ?? 'new'} kind={kind} initial={initial} />
        ) : (
          <section className={`${styles.card} ${styles.emptyEditor}`}>
            <h2>편집할 {names[kind]} 선택</h2>
            <p>목록에서 항목을 열거나 새 항목을 추가하세요.</p>
          </section>
        )}
      </div>
    </>
  );
}

function ContentEditor({ kind, initial }: { kind: ContentKind; initial?: ContentRecord }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<'basic' | 'links' | 'media'>('basic');
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<ContentInput>();
  const path = `/admin?section=content&kind=${kind}` as const;
  const positions = kind === 'organizer' ? organizerPositions : reviewPositions;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const confirmNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.target || link.href === window.location.href) return;
      if (!window.confirm('저장하지 않은 변경 사항이 있습니다. 편집 화면을 나갈까요?')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', confirmNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', confirmNavigation, true);
    };
  }, [dirty]);

  async function mutate(action: 'save' | 'publish' | 'unpublish', input?: ContentInput) {
    setMessage('');
    setFailed(false);
    setBusy(true);
    try {
      const live = action === 'unpublish';
      const result = await adminRequest<{ id: number }>('content', {
        action,
        kind,
        input,
        id: initial?.id ?? null,
        revisionId: (live ? initial?.liveRevisionId : initial?.revisionId) ?? null,
        editNumber: (live ? initial?.liveEditNumber : initial?.editNumber) ?? null,
      });
      setPreview(undefined);
      setDirty(false);
      setMessage(
        action === 'save' ? '초안을 저장했습니다.' : action === 'publish' ? '게시했습니다.' : '공개를 중단했습니다.',
      );
      if (!initial) router.replace(`${path}&id=${result.id}`);
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function editorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const invalid = Array.from(form.elements).find(
      (control): control is HTMLInputElement | HTMLTextAreaElement =>
        (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) && !control.validity.valid,
    );
    if (invalid) {
      setTab('basic');
      requestAnimationFrame(() => invalid.reportValidity());
      return;
    }
    const mode = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const input = readDraft(kind, new FormData(event.currentTarget), initial);
    if (mode?.value === 'preview') setPreview(input);
    else void mutate('save', input);
  }

  function attach(id: string, field: 'thumbnailId' | 'pdfId' | 'images') {
    const control = formRef.current?.elements.namedItem(field);
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;
    control.value = field === 'images' ? [...new Set([...values(control.value), id])].join('\n') : id;
    setDirty(true);
  }

  return (
    <section className={`${styles.card} ${styles.editorCard}`}>
      <div className={styles.editorHeading}>
        <div>
          <Link href={path} className={styles.mobileBack}>
            ← 목록으로
          </Link>
          <h2>{initial?.name ?? `새 ${names[kind]}`}</h2>
          <p>{initial ? `#${initial.id} · ${names[kind]}` : '내용을 입력하고 초안을 저장하세요.'}</p>
        </div>
        {initial && <Publication row={initial} />}
      </div>
      <div className={styles.tabs} aria-label="편집 구역">
        <button type="button" aria-pressed={tab === 'basic'} onClick={() => setTab('basic')}>
          기본 정보
        </button>
        <button type="button" aria-pressed={tab === 'links'} onClick={() => setTab('links')}>
          외부 링크
        </button>
        {kind !== 'review' && (
          <button type="button" aria-pressed={tab === 'media'} onClick={() => setTab('media')}>
            미디어
          </button>
        )}
      </div>
      {message && (
        <p role={failed ? 'alert' : 'status'} className={failed ? styles.error : styles.status}>
          {message}
        </p>
      )}
      {kind !== 'review' && (
        <div hidden={tab !== 'media'} className={styles.mediaArea}>
          <MediaPanel kind={kind} onAttach={attach} />
        </div>
      )}
      <form
        ref={formRef}
        method="post"
        noValidate
        onSubmit={editorSubmit}
        onChange={() => setDirty(true)}
        key={initial?.revisionId ?? 'new'}
      >
        <fieldset disabled={busy} className={styles.editor}>
          <div className={styles.fields} hidden={tab !== 'basic'}>
            <label>
              이름 <input name="name" required maxLength={160} defaultValue={initial?.name} />
            </label>
            {kind === 'project' && (
              <label>
                제목 <input name="title" required maxLength={300} defaultValue={initial?.title} />
              </label>
            )}
            <label>
              {kind === 'review' ? '본문' : '소개'}{' '}
              <textarea name="description" required={kind === 'review'} defaultValue={initial?.description} />
            </label>
            {kind !== 'organizer' && (
              <label>
                기수{' '}
                <input
                  name="cohort"
                  type="number"
                  min="1"
                  required={kind === 'project'}
                  defaultValue={initial?.cohort ?? ''}
                />
              </label>
            )}
            {kind !== 'project' && (
              <label>
                직군{' '}
                <select name="position" defaultValue={initial?.position}>
                  {positions.map((position) => (
                    <option key={position}>{position}</option>
                  ))}
                </select>
              </label>
            )}
            {kind === 'review' && (
              <>
                <label>
                  연결 프로젝트 ID (선택){' '}
                  <input name="projectId" type="number" min="0" defaultValue={initial?.projectId ?? ''} />
                </label>
                <label>
                  원본 프로젝트 표기{' '}
                  <input name="originalProjectName" maxLength={160} defaultValue={initial?.originalProjectName} />
                </label>
              </>
            )}
            {kind === 'organizer' && (
              <>
                <div className={styles.grid}>
                  <label>
                    필명 <input name="author" defaultValue={initial?.author} />
                  </label>
                  <label>
                    MBTI <input name="mbti" defaultValue={initial?.mbti} />
                  </label>
                  <label>
                    이모지 <input name="emoji" defaultValue={initial?.emoji ?? ''} />
                  </label>
                </div>
                <label>
                  <input name="isArchived" type="checkbox" defaultChecked={initial?.isArchived} /> 역대 운영진
                </label>
                <details>
                  <summary>경력과 인터뷰</summary>
                  {detailKinds.map((kind) => (
                    <label key={kind}>
                      {detailLabels[kind]}
                      <textarea
                        name={`detail-${kind}`}
                        defaultValue={initial?.details
                          ?.filter((detail) => detail.kind === kind)
                          .map((detail) => detail.body)
                          .join('\n')}
                      />
                    </label>
                  ))}
                </details>
              </>
            )}
            {kind !== 'review' && (
              <label>
                기술 (줄마다 하나) <textarea name="skills" defaultValue={initial?.skills?.join('\n')} />
              </label>
            )}
          </div>
          <div className={styles.fields} hidden={tab !== 'links'}>
            <LinkFields kind={kind} initial={initial?.links ?? []} onEdit={() => setDirty(true)} />
          </div>
          <div className={styles.fields} hidden={tab !== 'media'}>
            <h3>연결된 미디어</h3>
            {kind !== 'review' && (
              <>
                <label>
                  썸네일·프로필 미디어 ID <input name="thumbnailId" defaultValue={initial?.thumbnailId ?? ''} />
                </label>
                {initial?.legacyThumbnail && (
                  <label>
                    <input type="checkbox" name="removeLegacyThumbnail" /> 기존 이미지 연결 제거
                  </label>
                )}
              </>
            )}
            {kind === 'project' && (
              <>
                <label>
                  PDF 미디어 ID <input name="pdfId" defaultValue={initial?.pdfId ?? ''} />
                </label>
                {initial?.legacyPdf && (
                  <label>
                    <input type="checkbox" name="removeLegacyPdf" /> 기존 PDF 연결 제거
                  </label>
                )}
                <label>
                  갤러리 미디어 ID (줄마다 하나){' '}
                  <textarea
                    name="images"
                    defaultValue={initial?.images?.flatMap(({ mediaId }) => mediaId ?? []).join('\n')}
                  />
                </label>
                {initial?.images?.some((image) => image.legacyUrl && !image.mediaId) && (
                  <label>
                    <input type="checkbox" name="removeLegacyImages" /> 기존 갤러리 연결 제거
                  </label>
                )}
              </>
            )}
          </div>
        </fieldset>
      </form>
      <footer className={styles.editorFooter}>
        <span className={styles.muted}>
          {busy
            ? '처리 중…'
            : dirty
              ? '저장하지 않은 변경 사항'
              : initial?.liveRevisionId != null
                ? '홈페이지에 게시본이 공개되어 있습니다.'
                : ''}
        </span>
        <div className={styles.buttons}>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (formRef.current) setPreview(readDraft(kind, new FormData(formRef.current), initial));
            }}
          >
            미리보기
          </button>
          <button
            type="button"
            className={styles.primary}
            disabled={busy}
            onClick={() => formRef.current?.requestSubmit()}
          >
            초안 저장
          </button>
        </div>
      </footer>
      {initial && (
        <div className={styles.publicationActions}>
          {initial.state === 'draft' && (
            <button
              type="button"
              className={styles.primary}
              disabled={busy || dirty}
              onClick={() => {
                if (window.confirm('저장한 초안을 공개할까요?')) void mutate('publish');
              }}
            >
              저장한 초안 게시
            </button>
          )}
          {initial.liveRevisionId != null && (
            <button
              type="button"
              className={styles.danger}
              disabled={busy || dirty}
              onClick={() => {
                if (window.confirm('현재 게시본의 공개를 중단할까요?')) void mutate('unpublish');
              }}
            >
              공개 중단
            </button>
          )}
          {initial.liveRevisionId != null && (
            <a
              className={styles.inlineLink}
              href={kind === 'review' ? '/reviews' : `/${kind}s/${initial.id}`}
              target="_blank"
              rel="noreferrer"
            >
              {kind === 'review' ? '공개 후기 보기' : '공개 상세 열기'} ↗
            </a>
          )}
        </div>
      )}
      {preview && <PreviewDialog input={preview} onClose={() => setPreview(undefined)} />}
    </section>
  );
}

function PreviewDialog({ input, onClose }: { input: ContentInput; onClose: () => void }) {
  return (
    <dialog
      ref={(element) => {
        if (element && !element.open) element.showModal();
      }}
      className={styles.dialog}
      onClose={onClose}
      aria-labelledby="draft-preview-title"
    >
      <header>
        <h2 id="draft-preview-title">초안 미리보기</h2>
        <form method="dialog">
          <button aria-label="미리보기 닫기">닫기</button>
        </form>
      </header>
      <DraftPreview input={input} />
    </dialog>
  );
}

function DraftPreview({ input }: { input: ContentInput }) {
  const [resources, setResources] = useState<{ url: string; mime: string }[]>([]);
  const [error, setError] = useState('');
  const ids = [input.thumbnailId, ...(input.images?.map(({ mediaId }) => mediaId) ?? []), input.pdfId].filter(
    (id): id is string => !!id,
  );
  async function loadMedia() {
    try {
      setResources(
        await Promise.all(
          ids.map((id) => adminRequest<{ url: string; mime: string }>('media', { action: 'preview', id })),
        ),
      );
      setError('');
    } catch {
      setError('첨부 미디어를 불러오지 못했습니다.');
    }
  }
  return (
    <section className={styles.previewBody}>
      <h3>{input.name}</h3>
      {input.title && <p>{input.title}</p>}
      <p>
        {[input.cohort ? `${input.cohort}기` : '', input.position, input.author, input.mbti, input.emoji]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <p className={styles.previewText}>{input.description}</p>
      {input.skills?.length ? <p>{input.skills.join(' · ')}</p> : null}
      {input.details?.map(({ kind, body }, index) => (
        <p key={`${kind}:${index}`}>
          {detailLabels[kind]} · {body}
        </p>
      ))}
      {input.links.map(({ kind, url }, index) => (
        <p key={index}>
          {linkLabels[kind]} · {url}
        </p>
      ))}
      {input.projectId != null && <p>연결 프로젝트 #{input.projectId}</p>}
      {ids.length > 0 && (
        <button type="button" onClick={() => void loadMedia()}>
          첨부 미디어 불러오기
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      {resources.map(({ mime, url }) =>
        mime === 'image/webp' ? (
          <Image key={url} unoptimized src={url} width={960} height={540} alt="초안 미디어" />
        ) : (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            초안 PDF 열기
          </a>
        ),
      )}
    </section>
  );
}
