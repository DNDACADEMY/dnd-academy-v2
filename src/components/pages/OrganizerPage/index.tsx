import Image from 'next/image';

import SkillTag from '@/components/atoms/SkillTag';
import SocialIconLink from '@/components/molecules/SocialIconLink';
import { LogoType } from '@/lib/types/common';
import { Organizer } from '@/lib/types/organizer';

type Props = {
  organizer: Organizer;
};

function OrganizerPage({ organizer }: Props) {
  return (
    <div>
      <aside>
        <Image src={organizer.picture} alt={organizer.author} width={223} height={223} />
        <div>{organizer.name}</div>
        <div>{organizer.dndPosition}</div>
        <div>
          {organizer.technicalStack.map((stack) => (
            <SkillTag key={stack} color="dark" skill={stack} />
          ))}
        </div>
        <div>
          {Object.entries(organizer.links).map(([key, link]) => (
            <SocialIconLink key={key} link={link} type={key as LogoType} />
          ))}
        </div>
      </aside>
      <section>
        <h1>{organizer.oneLineIntroduction}</h1>
        <div>
          <h2>👏MBTI</h2>
          <div>{organizer.mbti}</div>
        </div>
        <div>
          <h2>이력</h2>
          <div>
            {organizer.career.now.map((nowCareer) => (
              <div key={nowCareer}>{`👉 현) ${nowCareer}`}</div>
            ))}
            {organizer.career.previous.map((previousCareer) => (
              <div key={previousCareer}>{`👉 전) ${previousCareer}`}</div>
            ))}
          </div>
        </div>
        <div>
          <h2>DND에서 어떤 업무를 맡고 있으신가요?</h2>
          <div>{organizer.questions.whatIsYourRoleInDnd}</div>
        </div>
        <div>
          <h2>지원자들에게 DND를 왜 추천하나요?</h2>
          <div>{organizer.questions.whyDoYouRecommendDnd}</div>
        </div>
        <div>
          <h2>{`${organizer.name}님이 관심있고, 행복해하는 것은?`}</h2>
          <div>{organizer.questions.whatIsYourInterests}</div>
        </div>
        <div>
          {organizer.questions.whatYouWantToShare.map((share, index) => (
            <Image key={share} src={share} width={202} height={202} alt={`공유이미지-${index}`} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default OrganizerPage;
