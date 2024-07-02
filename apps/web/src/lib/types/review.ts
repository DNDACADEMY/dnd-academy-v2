import { LogoType } from './common';
import { ProjectFlag } from './project';

export interface Review {
  id: number;
  flag: ProjectFlag;
  email: string;
  name: string;
  position: ReviewPosition;
  links: Partial<Record<LogoType, string>>;
  project: string;
  projectId: number | null;
  review: string;
}

export type ReviewPosition =
  | '백엔드 개발자'
  | '프론트엔드 개발자'
  | '프로덕트 디자이너'
  | 'Android Developer'
  | 'iOS Developer';
