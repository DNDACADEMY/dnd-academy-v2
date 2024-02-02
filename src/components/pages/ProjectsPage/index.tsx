'use client';

import ProjectCard from '@/components/atoms/ProjectCard';
import { Project } from '@/lib/types/project';

import styles from './index.module.scss';

type Props = {
  projects: Project[];
};

function ProjectsPage({ projects }: Props) {
  return (
    <div className={styles.projectWrapper}>
      {projects.map(({
        flag, id, title, thumbnail, skill, name,
      }) => (
        <ProjectCard
          key={id}
          id={id}
          flag={flag}
          skills={skill}
          thumbnail={thumbnail}
          title={title}
          name={name}
        />
      ))}
    </div>
  );
}

export default ProjectsPage;
