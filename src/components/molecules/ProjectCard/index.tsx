import Image from 'next/image';
import Link from 'next/link';

import SkillTag from '@/components/atoms/SkillTag';

import styles from './index.module.scss';

type Props = {
  thumbnail: string;
  title: string;
  name: string;
  skills: string[];
  flag: string;
  id: number;
};

function ProjectCard({
  thumbnail, title, name, skills, flag, id,
}: Props) {
  return (
    <Link className={styles.projectCardWrapper} href={`/projects/${id}`}>
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
  );
}

export default ProjectCard;
