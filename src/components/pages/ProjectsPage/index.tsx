import ProjectCard from '@/components/molecules/ProjectCard';
import Tags from '@/components/molecules/Tags';
import { getProjectCount } from '@/lib/apis/project';
import { Project } from '@/lib/types/project';

import styles from './index.module.scss';

type Props = {
  projects: Project[];
};

async function ProjectsPage({ projects }: Props) {
  const projectCount = await getProjectCount();

  return (
    <>
      <Tags paramKey="ordinal" route="/projects" tagCount={projectCount} />
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
