import 'server-only';
import type { Organizer, OrganizerCard, OrganizerDirectory, Project, Review } from '@dnd-academy/core';

import { type ContentKind, type ContentRecord, type ContentSummary } from './content-contract';
import { organizerPresentation, projectPresentation, reviewPresentation } from './content-presentation';
import { publicMedia } from './media';
import { projectReadRepository } from './project-read-repository';
import { createProjectReader } from './project-reader';
import { publishedContent } from './published-content-repository';
import { database, DatabaseError, rpc } from './supabase';

export { contentAssets } from './published-content-repository';

export const { getProject: cmsProject, getRelatedContent: cmsProjectRelated } =
  createProjectReader(projectReadRepository);

export function contentEnabled() {
  return process.env.DND_CMS_CONTENT === 'enabled';
}

export async function contentSkills() {
  const pageSize = 500;
  const skills: string[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await database()
      .from('skills')
      .select('label')
      .order('id')
      .range(offset, offset + pageSize - 1);
    if (error) throw new DatabaseError(error.code);
    skills.push(...data.map(({ label }) => label));
    if (data.length < pageSize) return skills.toSorted((a, b) => a.localeCompare(b, 'ko'));
  }
}

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

export async function cmsOrganizer(id: number): Promise<Organizer | undefined> {
  const {
    rows: [row],
    media,
  } = await publishedContent('organizer', id);
  return row ? organizerPresentation(row, row.id, media) : undefined;
}

export async function cmsOrganizerDirectory(): Promise<OrganizerDirectory> {
  type DirectoryCard = Omit<OrganizerCard, 'thumbnail' | 'emoji'> & {
    legacyThumbnail: string | null;
    objectKey: string | null;
    emoji: string | null;
  };
  const { active, former } = await rpc<{ active: DirectoryCard[]; former: OrganizerDirectory['former'] }>(
    'published_organizer_directory',
  );
  return {
    former,
    active: active.map(({ objectKey, legacyThumbnail, emoji, ...card }) => ({
      ...card,
      thumbnail: objectKey ? publicMedia(objectKey) : (legacyThumbnail ?? undefined),
      emoji: emoji ?? undefined,
    })),
  };
}

export async function cmsReviews(): Promise<Review[]> {
  const [{ rows }, projects] = await Promise.all([
    publishedContent('review'),
    rpc<{ id: number; name: string }[]>('published_review_projects'),
  ]);
  const names = new Map(projects.map(({ id, name }) => [id, name]));
  return rows.map((row) =>
    reviewPresentation(row, row.id, row.projectId == null ? undefined : names.get(row.projectId)),
  );
}
