import Marquee from 'react-fast-marquee';

import Image from 'next/image';
import Link from 'next/link';

import { type Project } from '@dnd-academy/core';

import { getProjects } from '@/lib/apis/project';
import blurDataUrl from '@/lib/data/blurDataUrl';

import styles from './index.module.scss';

type ThumbnailProject = Project & {
  thumbnail: string;
};

function ProjectsSlider() {
  const projects = getProjects();

  return (
    <div className={styles.projectsSlider}>
      <Marquee pauseOnHover speed={100} className={styles.marquee}>
        <div className={styles.projectSliderWrapper}>
          {[...projects]
            .filter((project): project is ThumbnailProject => Boolean(project?.thumbnail))
            .slice(0, 20)
            .map(({ id, thumbnail, title }) => (
              <Link key={id} href={`/projects/${id}`} prefetch={false}>
                <Image
                  key={id}
                  src={thumbnail}
                  alt={title}
                  width={271}
                  height={158}
                  placeholder="blur"
                  blurDataURL={blurDataUrl.projectSlider}
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
