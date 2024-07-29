import { LogoType } from './common';

export interface Organizer {
  id: number;
  name: string;
  thumbnail?: string;
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
  isArchived: boolean;
  emoji?: string;
}

export type OrganizerPosition =
  | '개발'
  | '디자인'
  | '마케팅'
  | '운영'
  | '마스코트';
