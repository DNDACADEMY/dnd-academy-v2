import { projectCountData, projectsData } from '../assets/data';
import { Project, ProjectFlag } from '../types/project';

export function getProjects({
  ordinal,
}: { ordinal?: string; } | undefined = {}): Project[] {
  const projects = projectsData as Project[];

  if (!ordinal) {
    return [...projects].reverse();
  }

  return projects.filter(({ flag }) => flag === ordinal);
}

export function getProjectCount(): Record<ProjectFlag, number> {
  return projectCountData;
}

export function getProject({ id }: { id: number; }) {
  const projects = projectsData as Project[];

  return projects.find((project) => project.id === id);
}
