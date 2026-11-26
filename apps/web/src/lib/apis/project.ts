import type { Project, ProjectFlag } from '@dnd-academy/core';

import projectsData from '@/lib/assets/data/projects.json';
import { cmsProjects, contentEnabled } from '@/lib/cms/content';
import { ensureNumber, sortFlagsDescending } from '@/utils';

export async function getProjects({ ordinal }: { ordinal?: string } | undefined = {}): Promise<Project[]> {
  const sortedProject = [...(await loadProjects())].sort((a, b) => sortFlagsDescending(a.flag, b.flag));

  if (!ordinal || ordinal === 'all') {
    return sortedProject;
  }

  return sortedProject.filter(({ flag }) => flag === ordinal);
}

export async function getProjectCount() {
  const projects = await loadProjects();

  return projects.reduce(
    (acc, { flag }) => ({
      ...acc,
      [flag]: ensureNumber(acc[flag]) + 1,
    }),
    {} as Record<ProjectFlag, number>,
  );
}

export async function getProject({ id }: { id: number }) {
  const projects = await loadProjects();

  return projects.find((project) => project.id === id);
}

async function loadProjects(): Promise<Project[]> {
  return contentEnabled() ? cmsProjects() : (projectsData as Project[]);
}
