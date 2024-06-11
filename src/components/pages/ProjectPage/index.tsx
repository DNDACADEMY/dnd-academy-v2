import Badge from '@/components/atoms/Badge';
import DetailNavigation from '@/components/atoms/DetailNavigation';
import SkillTag from '@/components/atoms/SkillTag';
import PDFViewer from '@/components/molecules/PDFViewer';
import ProjectCards from '@/components/molecules/ProjectCards';
import SocialIconLink from '@/components/molecules/SocialIconLink';
import ReviewList from '@/components/organisms/ReviewList';
import { getProjects } from '@/lib/apis/project';
import { getReviews } from '@/lib/apis/review';
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
      <DetailNavigation
        steps={[
          {
            label: '프로젝트',
            href: '/projects',
          },
          {
            label: project.name,
          },
        ]}
      />
      <div className={styles.projectPageContents}>
        <section className={styles.projectDetail}>
          <div>
            <PDFViewer url={project?.pdf} />
          </div>
          <div className={styles.projectIntroduceTitleWrapper}>
            <div className={styles.header}>
              <Badge
                label={project.flag}
                variant="info"
                size="large"
                theme="light"
              />
              <div className={styles.linkWrapper}>
                {project.projectLinks.link && (
                  <SocialIconLink
                    type="link"
                    link={project.projectLinks.link}
                    theme="light"
                  />
                )}
                {project.projectLinks.github && (
                <>
                  {project.projectLinks.github.map((link) => (
                    <SocialIconLink
                      key={link}
                      type="github"
                      link={link}
                      theme="light"
                    />
                  ))}
                </>
                )}
                {project.projectLinks.youtube && (
                  <SocialIconLink
                    type="youtube"
                    link={project.projectLinks.youtube}
                    theme="light"
                  />
                )}
              </div>
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
