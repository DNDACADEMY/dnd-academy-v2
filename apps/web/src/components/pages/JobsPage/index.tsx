import type { Job } from '@dnd-academy/core';

import Tags from '@/components/molecules/Tags';
import JobCard from '@/components/organisms/JobCard';
import { getJobCount } from '@/lib/apis/job';

import styles from './index.module.scss';

type Props = {
  jobs: Job[];
};

function JobsPage({ jobs }: Props) {
  const tagCount = getJobCount();

  return (
    <>
      <Tags
        paramKey="flag"
        route="/jobs"
        tagCount={tagCount}
      />
      <div className={styles.jobsWrapper}>
        {jobs.map(({
          flag, id, title, company, image, link, desc,
        }) => (
          <JobCard
            key={id}
            id={id}
            flag={flag}
            desc={desc}
            company={company}
            title={title}
            image={image}
            link={link}
          />
        ))}
      </div>
    </>
  );
}

export default JobsPage;
