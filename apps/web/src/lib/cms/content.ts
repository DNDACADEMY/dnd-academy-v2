import 'server-only';
import type { Organizer, Project, Review } from '@dnd-academy/core';
import { cache } from 'react';

import { type ContentKind, type ContentRecord } from './content-contract';
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

export const publishedContent = cache(async (kind: ContentKind) => {
  const rows = await rpc<ContentRecord[]>('published_content', { kind });
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

function flag(ordinal: number | null | undefined): Project['flag'] {
  return ordinal ? `${ordinal}기` : '';
}

function flatLinks(links: ContentRecord['links']) {
  return Object.fromEntries(links.map(({ kind, url }) => [kind, url]));
}

export async function cmsProjects(): Promise<Project[]> {
  const { rows, media } = await publishedContent('project');
  return rows.map((row) => {
    const { github: _github, ...links } = flatLinks(row.links);
    const github = row.links.filter((link) => link.kind === 'github').map((link) => link.url);
    return {
      id: row.id,
      name: row.name,
      title: row.title ?? '',
      desc: row.description,
      flag: flag(row.cohort),
      thumbnail: (row.thumbnailId && media.get(row.thumbnailId)) || row.legacyThumbnail || '',
      pdf: (row.pdfId && media.get(row.pdfId)) || row.legacyPdf || null,
      images: (row.images ?? []).flatMap(
        (image) => (image.mediaId && media.get(image.mediaId)) || image.legacyUrl || [],
      ),
      projectLinks: { ...links, github },
      skill: row.skills ?? [],
    };
  });
}

export async function cmsOrganizers(): Promise<Organizer[]> {
  const { rows, media } = await publishedContent('organizer');
  return rows.map((row) => {
    const details = (kind: string) =>
      (row.details ?? []).filter((detail) => detail.kind === kind).map((detail) => detail.body);
    return {
      id: row.id,
      name: row.name,
      author: row.author ?? '',
      dndPosition: row.position as Organizer['dndPosition'],
      thumbnail: (row.thumbnailId && media.get(row.thumbnailId)) || row.legacyThumbnail || undefined,
      technicalStack: row.skills ?? [],
      oneLineIntroduction: row.description,
      links: flatLinks(row.links),
      career: { now: details('now'), previous: details('previous') },
      mbti: row.mbti ?? '',
      questions: {
        whatIsYourRoleInDnd: details('role')[0] ?? '',
        whyDoYouRecommendDnd: details('recommendation')[0] ?? '',
        whatIsYourInterests: details('interests')[0] ?? '',
        whatYouWantToShare: details('share'),
      },
      isArchived: row.isArchived ?? false,
      emoji: row.emoji ?? undefined,
    };
  });
}

export async function cmsReviews(): Promise<Review[]> {
  const [{ rows }, { rows: projects }] = await Promise.all([publishedContent('review'), publishedContent('project')]);
  const names = new Map(projects.map(({ id, name }) => [id, name]));
  return rows.map((row) => {
    const project = row.projectId == null ? undefined : names.get(row.projectId);
    return {
      id: row.id,
      name: row.name,
      flag: flag(row.cohort),
      position: row.position as Review['position'],
      links: flatLinks(row.links),
      review: row.description,
      project: project ?? row.originalProjectName ?? '',
      projectId: project === undefined ? null : (row.projectId ?? null),
    };
  });
}
