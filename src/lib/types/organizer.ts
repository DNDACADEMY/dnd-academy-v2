import { LogoType } from './common';

export interface Organizer {
  id: number;
  name: string;
  picture: string;
  author: string;
  dndPosition: OrganizerPosition;
  technicalStack: string[];
  oneLineIntroduction: string;
  links: Partial<Record<LogoType, string>>;
  career: {
    now: string[];
    previous: string[];
  }
  mbti: string;
  questions: {
    whatIsYourRoleInDnd: string;
    whyDoYouRecommendDnd: string;
    whatIsYourInterests: string;
    whatYouWantToShare: string[];
  }
  emoji: boolean;
}

export type OrganizerPosition =
  | '개발'
  | '디자인'
  | '마케팅'
  | '운영';
