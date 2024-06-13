import { projectsData } from '@/lib/assets/data';
import { Project, ProjectFlag } from '@/lib/types/project';
import { sortFlagsDescending } from '@/utils';

export function getProjects({
  ordinal,
}: { ordinal?: string; } | undefined = {}): Project[] {
  const sortedProject = (projectsData as Project[])
    .sort((a, b) => sortFlagsDescending(a.flag, b.flag));

  if (!ordinal) {
    return sortedProject;
  }

  return sortedProject.filter(({ flag }) => flag === ordinal);
}

export function getProjectCount() {
  const projects = projectsData as Project[];

  return projects.reduce(
    (acc, { flag }) => ({
      ...acc,
      [flag]: (acc[flag] || 0) + 1,
    }),
    {} as Record<ProjectFlag, number>,
  );
}

export function getProject({ id }: { id: number; }) {
  const projects = projectsData as Project[];

  return projects.find((project) => project.id === id);
}
