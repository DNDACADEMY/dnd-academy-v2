'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { ReviewCard } from '@/components/organisms/ReviewList';
import OrganizerDetails from '@/components/pages/OrganizerPage/details';
import ProjectDetails from '@/components/pages/ProjectPage/details';
import {
  type ContentInput,
  type ContentKind,
  contentPreviewRequest,
  safeContentLink,
} from '@/lib/cms/content-contract';
import { organizerPresentation, projectPresentation, reviewPresentation } from '@/lib/cms/content-presentation';

import { adminRequest } from './admin-request';

import styles from './content-preview.module.scss';
import reviewStyles from '@/components/organisms/ReviewList/index.module.scss';
import organizerStyles from '@/components/pages/OrganizerPage/index.module.scss';
import projectStyles from '@/components/pages/ProjectPage/index.module.scss';

type PreviewResources = {
  media: { id: string; url: string; mime: string }[];
  projectName: string | null;
};

const names: Record<ContentKind, string> = { project: '프로젝트', organizer: '운영진', review: '후기' };

export default function ContentPreview({
  input,
  kind,
  id,
  onClose,
}: {
  input: ContentInput;
  kind: ContentKind;
  id?: number;
  onClose: () => void;
}) {
  const [resources, setResources] = useState<PreviewResources>();
  const [error, setError] = useState('');
  const ids = useMemo(
    () => [
      { id: input.thumbnailId, mime: 'image/webp' },
      { id: input.pdfId, mime: 'application/pdf' },
      ...(input.images ?? []).map(({ mediaId }) => ({ id: mediaId, mime: 'image/webp' })),
    ],
    [input],
  );
  const request = useMemo(
    () =>
      contentPreviewRequest.safeParse({
        mediaIds: [...new Set(ids.flatMap(({ id }) => (id ? [id] : [])))],
        projectId: kind === 'review' ? (input.projectId ?? null) : null,
      }),
    [ids, input.projectId, kind],
  );
  const media = new Map(
    resources?.media.flatMap((asset) =>
      ids.some(({ id, mime }) => id === asset.id && mime === asset.mime) ? [[asset.id, asset.url] as const] : [],
    ) ?? [],
  );
  const missing = !!resources && ids.some(({ id }) => id && !media.has(id));

  useEffect(() => {
    if (!request.success || (!request.data.mediaIds.length && request.data.projectId === null)) return;
    let active = true;
    void adminRequest<PreviewResources>('content/preview', request.data)
      .then((value) => {
        if (active) setResources(value);
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [request]);

  const draft: ContentInput = {
    ...input,
    name: input.name.trim() || `새 ${names[kind]}`,
    links: input.links.filter(({ kind, url }) => safeContentLink(kind, url)),
    details: input.details?.filter(
      ({ kind, body }) => kind !== 'share' || body.startsWith('/') || safeContentLink('link', body),
    ),
  };
  const loading =
    request.success && (request.data.mediaIds.length > 0 || request.data.projectId !== null) && !resources && !error;
  const project = kind === 'project' ? projectPresentation(draft, id ?? -1, media) : undefined;

  return createPortal(
    <dialog
      ref={(element) => {
        if (element && !element.open) element.showModal();
      }}
      className={styles.dialog}
      onClose={onClose}
      aria-labelledby="draft-preview-title"
    >
      <header className={styles.toolbar}>
        <div>
          <h2 id="draft-preview-title">초안 미리보기</h2>
          <p>현재 입력 내용 · {names[kind]}</p>
        </div>
        <form method="dialog">
          <button aria-label="미리보기 닫기">닫기</button>
        </form>
      </header>
      <div className={styles.canvas}>
        {loading && (
          <p className={styles.notice} role="status">
            첨부 자료를 불러오는 중입니다.
          </p>
        )}
        {(!request.success || error || missing) && (
          <p className={styles.notice} role="alert">
            {error || '일부 첨부 자료를 표시할 수 없습니다. 연결된 자료를 확인해 주세요.'}
          </p>
        )}
        {project && (
          <div className={projectStyles.projectPageContents}>
            <ProjectDetails
              project={project}
              presentation={
                project.pdf ? (
                  <div className={styles.presentation}>
                    <iframe src={project.pdf} title="프로젝트 발표 PDF" />
                    <a href={project.pdf} target="_blank" rel="noreferrer">
                      PDF 별도로 열기 ↗
                    </a>
                  </div>
                ) : undefined
              }
            />
          </div>
        )}
        {kind === 'organizer' && (
          <div className={organizerStyles.organizerPage}>
            <OrganizerDetails organizer={organizerPresentation(draft, id ?? -1, media)} />
          </div>
        )}
        {kind === 'review' && (
          <div className={`${styles.review} ${reviewStyles.hasProjectLink}`}>
            <ReviewCard
              value={reviewPresentation(draft, id ?? -1, resources?.projectName ?? undefined)}
              hasProjectLink
            />
          </div>
        )}
      </div>
    </dialog>,
    document.body,
  );
}
