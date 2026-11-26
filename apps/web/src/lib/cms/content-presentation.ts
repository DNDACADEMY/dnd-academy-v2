import type { Organizer, Project, Review } from '@dnd-academy/core';

import type { ContentInput } from './content-contract';

function flag(ordinal: number | null | undefined): Project['flag'] {
  return ordinal ? `${ordinal}기` : '';
}

function flatLinks(links: ContentInput['links']) {
  return Object.fromEntries(links.map(({ kind, url }) => [kind, url]));
}

export function projectPresentation(input: ContentInput, id: number, media: ReadonlyMap<string, string>): Project {
  const { github: _github, ...links } = flatLinks(input.links);
  const github = input.links.filter((link) => link.kind === 'github').map((link) => link.url);
  return {
    id,
    name: input.name,
    title: input.title ?? '',
    desc: input.description,
    flag: flag(input.cohort),
    thumbnail: (input.thumbnailId && media.get(input.thumbnailId)) || input.legacyThumbnail || '',
    pdf: (input.pdfId && media.get(input.pdfId)) || input.legacyPdf || null,
    images: (input.images ?? []).flatMap(
      (image) => (image.mediaId && media.get(image.mediaId)) || image.legacyUrl || [],
    ),
    projectLinks: { ...links, github },
    skill: input.skills ?? [],
  };
}

export function organizerPresentation(input: ContentInput, id: number, media: ReadonlyMap<string, string>): Organizer {
  const details = (kind: string) =>
    (input.details ?? []).filter((detail) => detail.kind === kind).map((detail) => detail.body);
  return {
    id,
    name: input.name,
    author: input.author ?? '',
    dndPosition: input.position as Organizer['dndPosition'],
    thumbnail: (input.thumbnailId && media.get(input.thumbnailId)) || input.legacyThumbnail || undefined,
    technicalStack: input.skills ?? [],
    oneLineIntroduction: input.description,
    links: flatLinks(input.links),
    career: { now: details('now'), previous: details('previous') },
    mbti: input.mbti ?? '',
    questions: {
      whatIsYourRoleInDnd: details('role')[0] ?? '',
      whyDoYouRecommendDnd: details('recommendation')[0] ?? '',
      whatIsYourInterests: details('interests')[0] ?? '',
      whatYouWantToShare: details('share'),
    },
    activityStatus: input.isArchived ? 'former' : 'active',
    emoji: input.emoji ?? undefined,
  };
}

export function reviewPresentation(input: ContentInput, id: number, project?: string): Review {
  return {
    id,
    name: input.name,
    flag: flag(input.cohort),
    position: input.position as Review['position'],
    links: flatLinks(input.links),
    review: input.description,
    project: project ?? input.originalProjectName ?? '',
    projectId: project === undefined ? null : (input.projectId ?? null),
  };
}
