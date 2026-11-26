import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './index.module.scss';

type Props = {
  skill: string;
  color: 'dark' | 'grey';
  icon?: ReactNode;
};

function SkillTag({ skill, color, icon }: Props) {
  return (
    <span key={skill} className={clsx(styles.skillItem, styles[color])}>
      {icon}
      {skill}
    </span>
  );
}

export default SkillTag;
