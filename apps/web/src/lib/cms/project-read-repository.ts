import 'server-only';
import type { ContentRecord } from './content-contract';
import { publicMedia } from './media';
import type { ProjectReadRepository, RelatedProjectRecord } from './project-reader';
import { publishedContent } from './published-content-repository';
import { rpc } from './supabase';

type RelatedProjectRow = Omit<RelatedProjectRecord, 'thumbnail'> & {
  legacyThumbnail: string | null;
  objectKey: string | null;
};

export const projectReadRepository = {
  async findPublishedProject(id) {
    const {
      rows: [record],
      media,
    } = await publishedContent('project', id);
    return record ? { record, media } : undefined;
  },
  async findRelatedContent(id) {
    const related = await rpc<{ projects: RelatedProjectRow[]; reviews: ContentRecord[] } | null>(
      'published_project_related',
      { selected_id: id },
    );
    if (!related) return null;

    return {
      projects: related.projects.map(({ legacyThumbnail, objectKey, ...card }) => ({
        ...card,
        thumbnail: (objectKey && publicMedia(objectKey)) || legacyThumbnail || '',
      })),
      reviews: related.reviews,
    };
  },
} satisfies ProjectReadRepository;
