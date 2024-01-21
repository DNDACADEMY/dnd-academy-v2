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
  flag: string;
  skill: string[];
  thumbnail: string;
  pdf?: string;
  projectLinks: ProjectLinks;
}
