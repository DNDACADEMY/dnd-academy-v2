import type { ProjectListCard } from '@dnd-academy/core';
import Image from 'next/image';
import Link from 'next/link';

import TechnologyTag from '@/components/atoms/TechnologyTag';

import styles from './index.module.scss';

type Props = {
  projects: ProjectListCard[];
};

function ProjectCards({ projects }: Props) {
  return (
    <div className={styles.projectWrapper}>
      {projects.map(({ flag, id, title, thumbnail, skill: skills, name }) => (
        <Link key={id} className={styles.projectCardWrapper} href={`/projects/${id}`}>
          {thumbnail && (
            <Image
              src={thumbnail}
              alt={name}
              width="0"
              height="0"
              sizes="(max-width: 1204px) 50vw, 33vw"
              className={styles.thumbnail}
            />
          )}
          <div className={styles.contents}>
            <div className={styles.flag}>{flag}</div>
            <div className={styles.name}>{name}</div>
            <div className={styles.title}>{title}</div>
            <div className={styles.skillWrapper}>
              {skills.map((skill) => (
                <TechnologyTag key={skill} skill={skill} color="dark" />
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default ProjectCards;
