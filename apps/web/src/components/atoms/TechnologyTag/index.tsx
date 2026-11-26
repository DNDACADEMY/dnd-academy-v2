import { SkillTag } from '@dnd-academy/ui';
import type { ComponentProps } from 'react';

const icons = new Set([
  'android',
  'axios',
  'cypress',
  'django',
  'docker',
  'elasticsearch',
  'express',
  'fastapi',
  'figma',
  'firebase',
  'flutter',
  'git',
  'github',
  'githubactions',
  'gradle',
  'javascript',
  'jenkins',
  'jest',
  'kotlin',
  'kubernetes',
  'mariadb',
  'mongodb',
  'mysql',
  'nestjs',
  'nextdotjs',
  'nginx',
  'nodedotjs',
  'notion',
  'postgresql',
  'python',
  'react',
  'reactquery',
  'redis',
  'redux',
  'sass',
  'spring',
  'springboot',
  'springsecurity',
  'storybook',
  'supabase',
  'swagger',
  'swift',
  'tailwindcss',
  'typescript',
  'vercel',
  'vite',
  'vuedotjs',
  'webpack',
]);

const aliases = new Map([
  ['expressjs', 'express'],
  ['githubaction', 'githubactions'],
  ['nextjs', 'nextdotjs'],
  ['nodejs', 'nodedotjs'],
  ['postgres', 'postgresql'],
  ['reactjs', 'react'],
  ['tailwind', 'tailwindcss'],
  ['vue', 'vuedotjs'],
  ['vuejs', 'vuedotjs'],
]);

type Props = Pick<ComponentProps<typeof SkillTag>, 'skill' | 'color'>;

export default function TechnologyTag({ skill, color }: Props) {
  const name = skill.toLowerCase().replace(/[.\s-]/g, '');
  const slug = aliases.get(name) ?? name;
  const icon = icons.has(slug) ? (
    <svg aria-hidden="true" focusable="false" width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
      <use href={`/assets/icons/technology.svg#${slug}`} />
    </svg>
  ) : null;

  return <SkillTag skill={skill} color={color} icon={icon} />;
}
