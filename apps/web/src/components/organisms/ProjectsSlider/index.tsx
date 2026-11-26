import Image from 'next/image';
import Link from 'next/link';
import Marquee from 'react-fast-marquee';

import { getProjectCards } from '@/lib/apis/project';
import type { ProjectCard } from '@/lib/cms/content';
import blurDataUrl from '@/lib/data/blurDataUrl';

import styles from './index.module.scss';

async function ProjectsSlider({ projects }: { projects?: ProjectCard[] }) {
  const items = projects ?? (await getProjectCards());

  return (
    <div className={styles.projectsSlider}>
      <Marquee pauseOnHover speed={100} className={styles.marquee}>
        <div className={styles.projectSliderWrapper}>
          {items.map(({ id, thumbnail, title }) => (
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
