import { jobsData } from '../assets/data';
import { Job } from '../types/job';

// eslint-disable-next-line import/prefer-default-export
export function getJobs({ flag }: { flag?: string; } | undefined = {}): Job[] {
  const jobs = jobsData as Job[];

  if (!flag) {
    return [...jobs].reverse();
  }

  return jobs.filter((review) => review.flag === flag);
}
