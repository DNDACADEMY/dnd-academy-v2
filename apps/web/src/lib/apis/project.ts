import type { Project, ProjectFlag } from '@dnd-academy/core';

import projectsData from '@/lib/assets/data/projects.json';
import {
  cmsProject,
  cmsProjectCards,
  cmsProjectPdf,
  cmsProjectRelated,
  cmsProjects,
  contentEnabled,
} from '@/lib/cms/content';
import { ensureNumber, sortFlagsDescending } from '@/utils';

import { getReviews } from './review';

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

function validProjectId(id: number) {
  return Number.isInteger(id) && id >= 0 && id <= 2147483647;
}

export async function getProject({ id }: { id: number }) {
  if (!validProjectId(id)) return;
  return contentEnabled() ? cmsProject(id) : (projectsData.find((project) => project.id === id) as Project | undefined);
}

export async function getProjectPdf({ id }: { id: number }) {
  if (!validProjectId(id)) return;
  return contentEnabled() ? cmsProjectPdf(id) : projectsData.find((project) => project.id === id)?.pdf;
}

export async function getProjectRelated(project: Pick<Project, 'id' | 'name' | 'flag'>) {
  if (contentEnabled()) return cmsProjectRelated(project);
  const [projects, reviews] = await Promise.all([
    getProjects({ ordinal: project.flag }),
    getReviews({ projectId: project.id }),
  ]);
  return { projects: projects.filter(({ id }) => id !== project.id), reviews };
}

export async function getProjectCards(ids?: number[]) {
  if (contentEnabled()) return cmsProjectCards(ids);
  const eligible = (await getProjects()).filter(({ thumbnail }) => thumbnail);
  if (!ids) return eligible.slice(0, 20);
  const byId = new Map(eligible.map((project) => [project.id, project]));
  return ids.flatMap((id) => byId.get(id) ?? []).slice(0, 20);
}

async function loadProjects(): Promise<Project[]> {
  return contentEnabled() ? cmsProjects() : (projectsData as Project[]);
}
