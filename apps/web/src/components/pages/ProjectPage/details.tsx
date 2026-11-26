import type { Project } from '@dnd-academy/core';
import { Badge, SkillTag } from '@dnd-academy/ui';
import Image from 'next/image';
import type { ReactNode } from 'react';

import SocialIconLink from '@/components/molecules/SocialIconLink';
import { getEntries } from '@/utils';

import styles from './index.module.scss';

export default function ProjectDetails({
  project,
  presentation,
  actions,
}: {
  project: Project;
  presentation?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className={styles.projectDetail}>
      {presentation ??
        (project.thumbnail ? (
          <div className={styles.thumbnailWrapper}>
            <Image
              fill
              src={project.thumbnail}
              alt={project.name}
              className={styles.thumbnail}
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        ) : null)}
      <div className={styles.projectIntroduceTitleWrapper}>
        <div className={styles.header}>
          <Badge label={project.flag} variant="info" size="large" theme="light" />
          <div className={styles.linkWrapper}>
            {getEntries(project.projectLinks).map(([key, value]) => {
              if (key === 'github') {
                return value?.map((link) => <SocialIconLink key={link} type="github" link={link} theme="light" />);
              }

              return <SocialIconLink key={key} type={key} link={value} theme="light" />;
            })}
            {actions}
          </div>
        </div>
        <h1 className={styles.name}>{project.name}</h1>
        <h2 className={styles.title}>{project.title}</h2>
        <div className={styles.skillWrapper}>
          {project.skill.map((skill) => (
            <SkillTag key={skill} skill={skill} color="grey" />
          ))}
        </div>
      </div>
      <div>
        <div className={styles.description}>{project.desc}</div>
        {project.images?.map((image, index) => (
          <Image
            key={`${index}:${image}`}
            src={image}
            width={768}
            height={480}
            style={{ maxWidth: '100%', height: 'auto' }}
            alt={`${project.name} 이미지 ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
