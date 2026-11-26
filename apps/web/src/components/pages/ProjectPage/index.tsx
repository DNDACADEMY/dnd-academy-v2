import { type Project } from '@dnd-academy/core';
import { Badge, Button, SkillTag } from '@dnd-academy/ui';
import Image from 'next/image';

import DetailNavigation from '@/components/molecules/DetailNavigation';
import ShareClipBoardCTA from '@/components/molecules/ShareClipBoardCTA';
import SocialIconLink from '@/components/molecules/SocialIconLink';
import ProjectCards from '@/components/organisms/ProjectCards';
import ProjectPDFViewer from '@/components/organisms/ProjectPDFViewer';
import ReviewList from '@/components/organisms/ReviewList';
import { getProjects } from '@/lib/apis/project';
import { getReviews } from '@/lib/apis/review';
import { ShareIcon } from '@/lib/assets/icons';
import { PUBLIC_ORIGIN } from '@/lib/constants/origin';
import { getEntries } from '@/utils';

import styles from './index.module.scss';

type Props = {
  project: Project;
};

async function ProjectPage({ project }: Props) {
  const reviews = await getReviews({ projectId: project.id });
  const projects = await getProjects({ ordinal: project.flag });

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
          {project?.pdf ? (
            <ProjectPDFViewer
              url={project.pdf}
              documentUrl={process.env.VERCEL_ENV === 'preview' ? `/projects/${project.id}/pdf` : undefined}
            />
          ) : project.thumbnail ? (
            <div className={styles.thumbnailWrapper}>
              <Image
                fill
                src={project.thumbnail}
                alt={project.name}
                className={styles.thumbnail}
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          ) : null}
          <div className={styles.projectIntroduceTitleWrapper}>
            <div className={styles.header}>
              <Badge label={project.flag} variant="info" size="large" theme="light" />
              <div className={styles.linkWrapper}>
                {getEntries(project.projectLinks).map(([key, value]) => {
                  if (key === 'github') {
                    return value?.map((link) => <SocialIconLink key={link} type="github" link={link} theme="light" />);
                  }

                  return <SocialIconLink key={key} type={key} link={value} theme="light" />;
                })}
                <ShareClipBoardCTA shareText={`${PUBLIC_ORIGIN}/projects/${project.id}`}>
                  <Button
                    type="button"
                    prefixIcon={<ShareIcon width={16} height={16} />}
                    buttonType="clear"
                    size="small"
                    theme="light"
                  >
                    프로젝트 공유하기
                  </Button>
                </ShareClipBoardCTA>
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
            {project.images?.map((image, index) => (
              <Image
                key={`${index}:${image}`}
                src={image}
                width={768}
                height={480}
                style={{ maxWidth: '100%', height: 'auto' }}
                alt={`${project.name} 이미지 ${index + 1}`}
              />
            ))}
          </div>
        </section>
        {reviews.length > 0 && (
          <section className={styles.projectSubSection}>
            <h2>참가자</h2>
            <ReviewList reviews={reviews} hasProjectLink={false} />
          </section>
        )}
        <section className={styles.projectSubSection}>
          <h2>프로젝트 더보기</h2>
          <ProjectCards projects={projects.filter(({ id }) => id !== project.id)} />
        </section>
      </div>
    </>
  );
}

export default ProjectPage;
