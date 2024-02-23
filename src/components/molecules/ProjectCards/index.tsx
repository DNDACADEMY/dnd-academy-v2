import Image from 'next/image';
import Link from 'next/link';

import SkillTag from '@/components/atoms/SkillTag';
import { Project } from '@/lib/types/project';

import styles from './index.module.scss';

type Props = {
  projects: Project[];
};

function ProjectCards({ projects }: Props) {
  return (
    <div className={styles.projectWrapper}>
      {projects.map(({
        flag, id, title, thumbnail, skill: skills, name,
      }) => (
        <Link key={id} className={styles.projectCardWrapper} href={`/projects/${id}`}>
          <Image src={thumbnail} alt={name} width={271} height={158} className={styles.thumbnail} />
          <div className={styles.contents}>
            <div className={styles.flag}>{flag}</div>
            <div className={styles.name}>{name}</div>
            <div className={styles.title}>{title}</div>
            <div className={styles.skillWrapper}>
              {skills.map((skill) => (
                <SkillTag key={skill} skill={skill} color="dark" />
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default ProjectCards;
