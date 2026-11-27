export type ProjectLinkType = 'github' | 'googlePlayStore' | 'youtube' | 'link' | 'blog' | 'figma' | 'appStore';

export type ProjectLinks = {
  github?: string[];
} & Partial<Omit<Record<ProjectLinkType, string>, 'github'>>;

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
}

export type ProjectListCard = Pick<Project, 'id' | 'flag' | 'name' | 'title' | 'thumbnail' | 'skill'>;

export type ProjectFlag = `${number}기` | '';
