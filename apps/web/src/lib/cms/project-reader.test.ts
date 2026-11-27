import { describe, expect, it, vi } from 'vitest';

import type { ContentRecord } from './content-contract';
import { type ProjectReadRepository, createProjectReader } from './project-reader';

const record: ContentRecord = {
  id: 0,
  revisionId: 1,
  editNumber: 1,
  name: '프로젝트',
  description: '소개',
  links: [],
  thumbnailId: 'cover',
};

describe('project reader', () => {
  it('passes ID zero to the injected repository and uses its published media', async () => {
    const repository = {
      findPublishedProject: vi.fn<ProjectReadRepository['findPublishedProject']>().mockResolvedValue({
        record,
        media: new Map([['cover', 'https://assets.dnd.ac/cover.webp']]),
      }),
      findRelatedContent: vi.fn<ProjectReadRepository['findRelatedContent']>().mockResolvedValue(null),
    };

    await expect(createProjectReader(repository).getProject(0)).resolves.toMatchObject({
      id: 0,
      name: record.name,
      thumbnail: 'https://assets.dnd.ac/cover.webp',
    });
    expect(repository.findPublishedProject).toHaveBeenCalledExactlyOnceWith(0);
  });

  it('uses the injected related records and preserves their ordering and project link', async () => {
    const repository = {
      findPublishedProject: vi.fn<ProjectReadRepository['findPublishedProject']>().mockResolvedValue(undefined),
      findRelatedContent: vi.fn<ProjectReadRepository['findRelatedContent']>().mockResolvedValue({
        projects: [
          { id: 7, name: '관련 프로젝트', title: '설명', thumbnail: '', skill: ['TypeScript'], cohort: 16 },
          { id: 9, name: '다음 프로젝트', title: '', thumbnail: '', skill: [], cohort: 16 },
        ],
        reviews: [{ ...record, id: 2, projectId: 0 }],
      }),
    };
    const reader = createProjectReader(repository);

    const result = await reader.getRelatedContent(record);
    expect(result.projects.map(({ id, flag }) => [id, flag])).toEqual([
      [7, '16기'],
      [9, '16기'],
    ]);
    expect(result.reviews).toMatchObject([{ id: 2, projectId: 0, project: record.name }]);
    expect(repository.findRelatedContent).toHaveBeenCalledExactlyOnceWith(0);
  });

  it('keeps missing detail and empty related content distinct', async () => {
    const reader = createProjectReader({
      findPublishedProject: async () => undefined,
      findRelatedContent: async () => null,
    });

    await expect(reader.getProject(0)).resolves.toBeUndefined();
    await expect(reader.getRelatedContent(record)).resolves.toEqual({ projects: [], reviews: [] });
  });
});
