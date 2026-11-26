'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import {
  type ContentInput,
  type ContentKind,
  type ContentRecord,
  contentKinds,
  detailKinds,
  linkKinds,
  organizerPositions,
  reviewPositions,
} from '@/lib/cms/content-contract';

import { adminRequest } from './admin-request';
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
  const input: ContentInput = {
    name: string('name'),
    description: string('description'),
    links: linkKinds.flatMap((kind) => values(string(`link-${kind}`)).map((url) => ({ kind, url }))),
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

export default function ContentPanel({
  kind,
  rows,
  initial,
}: {
  kind: ContentKind;
  rows: ContentRecord[];
  initial?: ContentRecord;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<ContentInput>();
  const path = `/admin?section=content&kind=${kind}` as const;
  const positions = kind === 'organizer' ? organizerPositions : reviewPositions;

  async function mutate(action: 'save' | 'publish' | 'unpublish', input?: ContentInput) {
    setMessage('');
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
      setMessage(
        action === 'save' ? '초안을 저장했습니다.' : action === 'publish' ? '게시했습니다.' : '공개를 중단했습니다.',
      );
      if (!initial) router.replace(`${path}&id=${result.id}`);
      router.refresh();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function editorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mode = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const input = readDraft(kind, new FormData(event.currentTarget), initial);
    if (mode?.value === 'preview') setPreview(input);
    else void mutate('save', input);
  }

  return (
    <>
      <h2>콘텐츠 관리</h2>
      <nav aria-label="콘텐츠 종류">
        {contentKinds.map((value) => (
          <a
            key={value}
            href={`/admin?section=content&kind=${value}`}
            aria-current={kind === value ? 'page' : undefined}
          >
            {names[value]}
          </a>
        ))}
      </nav>
      <label>
        편집할 {names[kind]}
        <select
          value={initial?.id ?? ''}
          onChange={(event) => router.push(event.target.value ? `${path}&id=${event.target.value}` : path)}
        >
          <option value="">새 {names[kind]}</option>
          {rows.map(({ id, name, state }) => (
            <option key={id} value={id}>
              {id} · {name} · {state === 'draft' ? '초안' : state === 'published' ? '공개 중' : '비공개'}
            </option>
          ))}
        </select>
      </label>
      {message && (
        <p role="status" className={styles.status}>
          {message}
        </p>
      )}
      <form method="post" onSubmit={editorSubmit} key={initial?.revisionId ?? 'new'}>
        <fieldset disabled={busy} className={styles.editor}>
          <legend>{names[kind]} 편집</legend>
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
            <>
              <label>
                기술 (줄마다 하나) <textarea name="skills" defaultValue={initial?.skills?.join('\n')} />
              </label>
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
          <details>
            <summary>외부 링크</summary>
            <div className={styles.grid}>
              {linkKinds
                .filter((link) => kind !== 'review' || link !== 'email')
                .map((kind) => (
                  <label key={kind}>
                    {kind}{' '}
                    <textarea
                      name={`link-${kind}`}
                      defaultValue={initial?.links
                        .filter((link) => link.kind === kind)
                        .map((link) => link.url)
                        .join('\n')}
                    />
                  </label>
                ))}
            </div>
          </details>
          <div className={styles.buttons}>
            <button type="submit" value="save">
              초안 저장
            </button>
            <button type="submit" value="preview">
              입력 내용 미리보기
            </button>
          </div>
        </fieldset>
      </form>
      {initial && (
        <div className={styles.buttons}>
          {initial.state === 'draft' && (
            <button disabled={busy} onClick={() => setPreview(initial)}>
              저장한 초안 미리보기
            </button>
          )}
          {initial.state === 'draft' && (
            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm('저장한 초안을 공개할까요?')) void mutate('publish');
              }}
            >
              저장한 초안 게시
            </button>
          )}
          {initial.liveRevisionId != null && (
            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm('현재 게시본의 공개를 중단할까요?')) void mutate('unpublish');
              }}
            >
              공개 중단
            </button>
          )}
          {initial.liveRevisionId != null && kind !== 'review' && (
            <a href={`/${kind}s/${initial.id}`}>공개 상세 열기</a>
          )}
        </div>
      )}
      {preview && <DraftPreview input={preview} />}
      {kind !== 'review' && <MediaPanel />}
    </>
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
    <fieldset>
      <legend>초안 미리보기</legend>
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
          {kind} · {url}
        </p>
      ))}
      {input.projectId != null && <p>연결 프로젝트 #{input.projectId}</p>}
      {ids.length > 0 && <button onClick={() => void loadMedia()}>첨부 미디어 불러오기</button>}
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
    </fieldset>
  );
}
