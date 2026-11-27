import OrganizerCards from '@/components/organisms/OrganizerCards';
import ProjectCards from '@/components/organisms/ProjectCards';
import { ReviewCard } from '@/components/organisms/ReviewList';
import OrganizerDetails from '@/components/pages/OrganizerPage/details';
import ProjectDetails from '@/components/pages/ProjectPage/details';
import type { ContentInput } from '@/lib/cms/content-contract';
import { organizerPresentation, projectPresentation, reviewPresentation } from '@/lib/cms/content-presentation';
import type { Submission } from '@/lib/cms/submission-contract';

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
    return <ReviewCard value={reviewPresentation(draft, id, submission.projectName ?? undefined)} hasProjectLink />;
  }
  if (submission.kind === 'organizer') {
    const organizer = organizerPresentation(draft, id, media);
    return card ? (
      <OrganizerCards organizers={[organizer]} />
    ) : (
      <div className={organizerStyles.organizerPage}>
        <OrganizerDetails organizer={organizer} />
      </div>
    );
  }
  const project = projectPresentation(draft, id, media);
  return card ? (
    <ProjectCards projects={[project]} />
  ) : (
    <div className={projectStyles.projectPageContents}>
      <ProjectDetails project={project} presentation={project.pdf ? <p>발표 PDF 첨부됨</p> : undefined} />
    </div>
  );
}
