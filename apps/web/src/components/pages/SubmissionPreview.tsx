import OrganizerCards from '@/components/organisms/OrganizerCards';
import ProjectCards from '@/components/organisms/ProjectCards';
import { ReviewCard } from '@/components/organisms/ReviewList';
import OrganizerDetails from '@/components/pages/OrganizerPage/details';
import ProjectDetails from '@/components/pages/ProjectPage/details';
import type { ContentInput } from '@/lib/cms/content-contract';
import { organizerPresentation, projectPresentation, reviewPresentation } from '@/lib/cms/content-presentation';
import type { Submission } from '@/lib/cms/submission-contract';

import styles from './SubmissionPreview.module.scss';
import organizerStyles from '@/components/pages/OrganizerPage/index.module.scss';
import projectStyles from '@/components/pages/ProjectPage/index.module.scss';

type Props = {
  submission: Pick<Submission, 'kind' | 'targetId' | 'projectName'>;
  draft: ContentInput;
  media: ReadonlyMap<string, string>;
  card?: boolean;
};

export default function SubmissionPreview({ submission, draft, media, card = false }: Props) {
  const id = submission.targetId ?? -1;
  if (submission.kind === 'review') {
    return (
      <div className={styles.surface}>
        <ReviewCard value={reviewPresentation(draft, id, submission.projectName ?? undefined)} hasProjectLink />
      </div>
    );
  }

  if (submission.kind === 'organizer') {
    const organizer = organizerPresentation(draft, id, media);
    return (
      <div className={styles.surface}>
        {card ? (
          <div className={styles.card}>
            <OrganizerCards organizers={[organizer]} />
          </div>
        ) : (
          <div className={`${organizerStyles.organizerPage} ${organizerStyles.embedded}`}>
            <OrganizerDetails organizer={organizer} preview />
          </div>
        )}
      </div>
    );
  }

  const project = projectPresentation(draft, id, media);
  return (
    <div className={styles.surface}>
      {card ? (
        <div className={styles.card}>
          <ProjectCards projects={[project]} />
        </div>
      ) : (
        <div className={`${projectStyles.projectPageContents} ${projectStyles.embedded}`}>
          <ProjectDetails
            project={project}
            presentation={project.pdf ? <p className={styles.attachment}>발표 PDF 첨부됨</p> : undefined}
          />
        </div>
      )}
    </div>
  );
}
