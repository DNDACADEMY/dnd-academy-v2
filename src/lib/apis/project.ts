import api from '@/app/api';
import { getCacheDate } from '@/utils';

import { ONE_HOUR } from '../constants/time';
import { Project, ProjectCategory } from '../types/project';

export async function getProjects({ ordinal }: { ordinal?: string; } | undefined = {}) {
  const response = await api<Project[], { date: string; }>({
    url: '/data/project.json',
    type: 'public',
    method: 'GET',
    params: {
      ...getCacheDate(),
    },
    config: {
      next: {
        revalidate: ONE_HOUR,
      },
    },
  });

  if (!ordinal) {
    return [...response].reverse();
  }

  return response.filter(({ flag }) => flag === ordinal);
}

export async function getProjectCount() {
  const response = await api<Record<ProjectCategory, number>, { date: string; }>({
    url: '/data/project_count.json',
    type: 'public',
    method: 'GET',
    params: {
      ...getCacheDate(),
    },
    config: {
      next: {
        revalidate: ONE_HOUR,
      },
    },
  });

  return response;
}
