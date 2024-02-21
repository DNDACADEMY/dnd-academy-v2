import clsx from 'clsx';

import styles from './index.module.scss';

type Props = {
  skill: string;
  color: 'dark' | 'grey';
};

function SkillTag({ skill, color }: Props) {
  return (
    <span
      key={skill}
      className={clsx(styles.skillItem, {
        [styles[color]]: color,
      })}
    >
      {skill}
    </span>
  );
}

export default SkillTag;
