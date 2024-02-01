import api, { getCacheDate } from '@/app/api';

import { ONE_HOUR } from '../constants/time';
import { Project } from '../types/project';

async function getProjects() {
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

  return [...response].reverse();
}

export default getProjects;
