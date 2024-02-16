import Link from 'next/link';

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
      </div>
    </>
  );
}

export default ProjectPage;
