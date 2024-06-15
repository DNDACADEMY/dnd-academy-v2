import { jobsData } from '@/lib/assets/data';
import { Job } from '@/lib/types/job';
import { checkNumber } from '@/utils';

export function getJobs({ flag }: { flag?: string; } | undefined = {}): Job[] {
  const jobs = jobsData as Job[];

  if (!flag) {
    return [...jobs].reverse();
  }

  return jobs.filter((review) => review.flag === flag);
}

export function getJobCount() {
  const jobs = jobsData as Job[];

  return jobs.reduce(
    (acc, { flag }) => ({
      ...acc,
      [flag]: checkNumber(acc[flag]) + 1,
    }),
    {} as Record<Job['flag'], number>,
  );
}
