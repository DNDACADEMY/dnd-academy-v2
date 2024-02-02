import ProjectCard from '@/components/atoms/ProjectCard';
import Tag from '@/components/atoms/Tag';
import { Project } from '@/lib/types/project';

import styles from './index.module.scss';

type Props = {
  projects: Project[];
};

function ProjectsPage({ projects }: Props) {
  return (
    <>
      <div className={styles.subNavigation}>
        <Tag title="전체(34)" isActive />
        <Tag title="5기(10)" />
        <Tag title="6기(2)" />
        <Tag title="7기(5)" />
        <Tag title="8기(10)" />
      </div>
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
    </>
  );
}

export default ProjectsPage;
