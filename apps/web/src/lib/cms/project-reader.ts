import type { Project, ProjectListCard, Review } from '@dnd-academy/core';

import type { ContentRecord } from './content-contract';
import { projectPresentation, reviewPresentation } from './content-presentation';

export type RelatedProjectRecord = Omit<ProjectListCard, 'flag'> & { cohort: number };

export type ProjectReadRepository = {
  findPublishedProject(id: number): Promise<{ record: ContentRecord; media: ReadonlyMap<string, string> } | undefined>;
  findRelatedContent(id: number): Promise<{
    projects: RelatedProjectRecord[];
    reviews: ContentRecord[];
  } | null>;
};

export function createProjectReader(repository: ProjectReadRepository) {
  return {
    async getProject(id: number): Promise<Project | undefined> {
      const published = await repository.findPublishedProject(id);
      return published && projectPresentation(published.record, published.record.id, published.media);
    },
    async getRelatedContent(project: Pick<Project, 'id' | 'name'>): Promise<{
      projects: ProjectListCard[];
      reviews: Review[];
    }> {
      const related = await repository.findRelatedContent(project.id);
      return {
        projects: (related?.projects ?? []).map(({ cohort, ...card }) => ({ ...card, flag: `${cohort}기` })),
        reviews: (related?.reviews ?? []).map((review) => reviewPresentation(review, review.id, project.name)),
      };
    },
  };
}
