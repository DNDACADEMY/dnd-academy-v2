import JobCard from '@/components/molecules/JobCard';
import Tags from '@/components/molecules/Tags';
import { Job } from '@/lib/types/job';

import styles from './index.module.scss';

type Props = {
  jobs: Job[];
};

function JobsPage({ jobs }: Props) {
  return (
    <>
      <Tags
        paramKey="flag"
        route="/jobs"
        // TODO - 추후 변경
        tagCount={{
          개발: 5,
          디자인: 2,
        }}
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
