import { useSuspenseQuery } from '@tanstack/react-query';

import api from '@/app/api';
import { Project as ProjectType } from '@/lib/types/project';

function useGetProjectsQuery({ size }: { size?: number; } = {}) {
  const query = useSuspenseQuery({
    queryKey: ['projects'],
    queryFn: () => api<ProjectType[], { size?: number; }>({
      url: '/projects',
      type: 'bff',
      method: 'GET',
      params: {
        size,
      },
    }),
    gcTime: Infinity,
    staleTime: Infinity,
  });

  return query;
}

export default useGetProjectsQuery;
