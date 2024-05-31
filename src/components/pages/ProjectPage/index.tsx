import Link from 'next/link';

import SkillTag from '@/components/atoms/SkillTag';
import PDFViewer from '@/components/molecules/PDFViewer';
import ProjectCards from '@/components/molecules/ProjectCards';
import ReviewList from '@/components/molecules/ReviewList';
import { getProjects } from '@/lib/apis/project';
import { getReviews } from '@/lib/apis/review';
import { RightIcon } from '@/lib/assets/icons';
import { Project } from '@/lib/types/project';

import styles from './index.module.scss';

type Props = {
  project: Project;
};

function ProjectPage({ project }: Props) {
  const reviews = getReviews({ flag: project.flag, projectId: project.id });
  const projects = getProjects({ ordinal: project.flag });

  return (
    <>
      <nav className={styles.projectNavigation}>
        <Link href="/projects" className={styles.link}>
          프로젝트
        </Link>
        <RightIcon />
        <div className={styles.projectName}>{project.name}</div>
      </nav>
      <div className={styles.projectPageContents}>
        <section className={styles.projectDetail}>
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
        </section>
        <section className={styles.projectSection}>
          <h2>참가자</h2>
          <ReviewList reviews={reviews} hasProjectLink={false} />
        </section>
        <section className={styles.projectSection}>
          <h2>프로젝트 더보기</h2>
          <ProjectCards
            projects={projects.filter(({ id }) => id !== project.id)}
          />
        </section>
      </div>
    </>
  );
}

export default ProjectPage;
