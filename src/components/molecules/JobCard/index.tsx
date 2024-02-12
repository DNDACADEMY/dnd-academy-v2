import Image from 'next/image';

import ExternalLink from '@/components/atoms/ExternalLink';
import { Job } from '@/lib/types/job';

import styles from './index.module.scss';

type Props = Job;

function JobCard({
  company, flag, image, link, desc, title,
}: Props) {
  return (
    <ExternalLink href={link} withTextUnderline={false} className={styles.jobCardWrapper}>
      <Image src={image} alt={company} width={64} height={64} className={styles.companyImage} />
      <div className={styles.jobContents}>
        <div className={styles.flag}>{flag}</div>
        <div className={styles.title}>{title}</div>
        <div className={styles.company}>{company}</div>
        <div className={styles.description}>{desc}</div>
      </div>
    </ExternalLink>
  );
}

export default JobCard;
