import Link from 'next/link';

import SkillTag from '@/components/atoms/SkillTag';
import PDFViewer from '@/components/molecules/PDFViewer';
import { RightIcon } from '@/lib/assets/icons';
import { Project } from '@/lib/types/project';

import styles from './index.module.scss';

type Props = {
  project: Project;
};

function ProjectPage({ project }: Props) {
  console.log(project);

  return (
    <>
      <nav className={styles.projectNavigation}>
        <Link href="/projects" className={styles.link}>
          프로젝트
        </Link>
        <RightIcon />
        <div className={styles.projectName}>{project.name}</div>
      </nav>
      <div className={styles.projectDetail}>
        <div>
          <PDFViewer url={project?.pdf} />
        </div>
        <div className={styles.projectIntroduceTitleWrapper}>
          <div>
            <div className={styles.flag}>{project.flag}</div>
          </div>
          <h1 className={styles.name}>{project.name}</h1>
          <h2 className={styles.title}>{project.title}</h2>
          <div className={styles.skillWrapper}>
            {project.skill.map((skill) => (
              <SkillTag key={skill} skill={skill} color="grey" />
            ))}
          </div>
        </div>
        <div>
          <div className={styles.description}>{project.desc}</div>
        </div>
      </div>
    </>
  );
}

export default ProjectPage;
