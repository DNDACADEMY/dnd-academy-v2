import 'server-only';
import type { Organizer, Project, Review } from '@dnd-academy/core';
import { cache } from 'react';

import { type ContentKind, type ContentRecord, type ContentSummary } from './content-contract';
import { organizerPresentation, projectPresentation, reviewPresentation } from './content-presentation';
import { mediaAssets, publicMedia } from './media';
import { rpc } from './supabase';

export function contentEnabled() {
  return process.env.DND_CMS_CONTENT === 'enabled';
}

export function contentAssets(row: ContentRecord) {
  return [row.thumbnailId, row.pdfId, ...(row.images ?? []).map((image) => image.mediaId)].filter((id): id is string =>
    Boolean(id),
  );
}

export const publishedContent = cache(async (kind: ContentKind, id?: number) => {
  const rows = await rpc<ContentRecord[]>('published_content', { kind, selected_id: id ?? null });
  const ids = [...new Set(rows.flatMap(contentAssets))];
  const media = new Map<string, string>();
  for (let start = 0; start < ids.length; start += 80) {
    const assets = await mediaAssets(ids.slice(start, start + 80));
    for (const [id, asset] of assets) {
      if (asset.bucket === 'cms-public' && asset.ready) media.set(id, publicMedia(asset.object_key));
    }
  }
  return { rows, media };
});

export function editableContent(actor: string, kind: ContentKind, id?: number) {
  return rpc<ContentRecord[]>('editable_content', { actor, kind, selected_id: id ?? null });
}

export function contentWorkspace(actor: string, kind: ContentKind, id: number | null) {
  return rpc<{ rows: ContentSummary[]; initial: ContentRecord | null }>('content_workspace', {
    actor,
    kind,
    selected_id: id,
  });
}

export async function cmsProjects(): Promise<Project[]> {
  const { rows, media } = await publishedContent('project');
  return rows.map((row) => projectPresentation(row, row.id, media));
}

export async function cmsProject(id: number): Promise<Project | undefined> {
  const {
    rows: [row],
    media,
  } = await publishedContent('project', id);
  return row ? projectPresentation(row, row.id, media) : undefined;
}

export type ProjectCard = Pick<Project, 'id' | 'title' | 'thumbnail'>;

export async function cmsProjectCards(ids?: number[]): Promise<ProjectCard[]> {
  const rows = await rpc<{ id: number; title: string; legacy_thumbnail: string | null; object_key: string | null }[]>(
    'published_project_cards',
    { featured_ids: ids ?? null },
  );
  return rows.map(({ id, title, legacy_thumbnail, object_key }) => ({
    id,
    title,
    thumbnail: object_key ? publicMedia(object_key) : (legacy_thumbnail ?? ''),
  }));
}

export async function cmsProjectPdf(id: number) {
  const row = await rpc<{ object_key: string | null; legacy_pdf: string | null } | null>('published_project_pdf', {
    selected_id: id,
  });
  return row?.object_key ? publicMedia(row.object_key) : row?.legacy_pdf;
}

export async function cmsOrganizers(): Promise<Organizer[]> {
  const { rows, media } = await publishedContent('organizer');
  return rows.map((row) => organizerPresentation(row, row.id, media));
}

export async function cmsReviews(): Promise<Review[]> {
  const [{ rows }, { rows: projects }] = await Promise.all([publishedContent('review'), publishedContent('project')]);
  const names = new Map(projects.map(({ id, name }) => [id, name]));
  return rows.map((row) =>
    reviewPresentation(row, row.id, row.projectId == null ? undefined : names.get(row.projectId)),
  );
}
