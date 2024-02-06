export type ProjectLinks = {
  github?: string[];
  googlePlaystore?: string;
  youtube?: string;
  link?: string;
};

export interface Project {
  id: number;
  name: string;
  title: string;
  desc?: string;
  images: string[];
  flag: ProjectCategory;
  skill: string[];
  thumbnail: string;
  pdf?: string;
  projectLinks: ProjectLinks;
}

export type ProjectCategory =
  | '9기'
  | '8기'
  | '7기'
  | '6기'
  | '5기'
  | '4기'
  | '3기'
  | '2기'
  | '1기';
