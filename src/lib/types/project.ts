export type ProjectLinkType = 'github' | 'googlePlaystore' | 'youtube' | 'link';

export type ProjectLinks = Partial<Record<ProjectLinkType, string | string[]>>;

export interface Project {
  id: number;
  name: string;
  title: string;
  desc: string;
  images?: string[];
  flag: ProjectFlag;
  skill: string[];
  thumbnail: string;
  pdf: string | null;
  projectLinks: ProjectLinks;
  download?: string;
}

export type ProjectFlag =
  | '10기'
  | '9기'
  | '8기'
  | '7기'
  | '6기'
  | '5기'
  | '4기'
  | '3기'
  | '2기'
  | '1기';
