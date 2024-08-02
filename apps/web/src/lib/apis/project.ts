import type { Project, ProjectFlag } from '@dnd-academy/core';

import { projectsData } from '@/lib/assets/data';
import { checkNumber, sortFlagsDescending } from '@/utils';

export function getProjects({
  ordinal,
}: { ordinal?: string; } | undefined = {}): Project[] {
  const sortedProject = (projectsData as Project[])
    .sort((a, b) => sortFlagsDescending(a.flag, b.flag));

  if (!ordinal || ordinal === 'all') {
    return sortedProject;
  }

  return sortedProject.filter(({ flag }) => flag === ordinal);
}

export function getProjectCount() {
  const projects = projectsData as Project[];

  return projects.reduce(
    (acc, { flag }) => ({
      ...acc,
      [flag]: checkNumber(acc[flag]) + 1,
    }),
    {} as Record<ProjectFlag, number>,
  );
}

export function getProject({ id }: { id: number; }) {
  const projects = projectsData as Project[];

  return projects.find((project) => project.id === id);
}
