import { type Project } from '@dnd-academy/core';
import { Button } from '@dnd-academy/ui';

import DetailNavigation from '@/components/molecules/DetailNavigation';
import ShareClipBoardCTA from '@/components/molecules/ShareClipBoardCTA';
import ProjectCards from '@/components/organisms/ProjectCards';
import ProjectPDFViewer from '@/components/organisms/ProjectPDFViewer';
import ReviewList from '@/components/organisms/ReviewList';
import { getProjects } from '@/lib/apis/project';
import { getReviews } from '@/lib/apis/review';
import { ShareIcon } from '@/lib/assets/icons';
import { PUBLIC_ORIGIN } from '@/lib/constants/origin';

import ProjectDetails from './details';

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
        <ProjectDetails
          project={project}
          presentation={
            project.pdf ? (
              <ProjectPDFViewer
                url={project.pdf}
                documentUrl={process.env.VERCEL_ENV === 'preview' ? `/projects/${project.id}/pdf` : undefined}
              />
            ) : undefined
          }
          actions={
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
          }
        />
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
