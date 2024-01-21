'use client';

import Marquee from 'react-fast-marquee';

import Image from 'next/image';
import Link from 'next/link';

import useGetProjectsQuery from '@/hooks/queries/useGetProjectsQuery';

import styles from './index.module.scss';

function ProjectsSlider() {
  const { data: projects } = useGetProjectsQuery({ size: 24 });

  // TODO - 임시
  if (!projects?.length) {
    return null;
  }

  return (
    <div className={styles.projectsSlider}>
      <Marquee pauseOnHover speed={80} className={styles.marquee}>
        <div className={styles.projectSliderWrapper}>
          {projects.map(({ id, thumbnail, title }) => (
            <Link href={`/projects/${id}`} key={id}>
              <Image
                key={id}
                src={thumbnail}
                alt={title}
                width={271}
                height={158}
                className={styles.thumbnail}
              />
            </Link>
          ))}
        </div>
      </Marquee>
    </div>
  );
}

export default ProjectsSlider;
