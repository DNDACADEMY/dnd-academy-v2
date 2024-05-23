'use client';

import { CSSProperties } from 'react';
import Marquee from 'react-fast-marquee';

import clsx from 'clsx';

import AlarmModal from '@/components/organisms/AlarmModal';
import ShareModal from '@/components/organisms/ShareModal';

import styles from './index.module.scss';

type MarqueeText = {
  id: number;
  text: string;
};

type DividerStyles = {
  id: number;
} & CSSProperties;

const defaultText = 'DND 에서 사이드 프로젝트를 시작하세요!';

const marqueeTexts: MarqueeText[] = [
  { id: 1, text: defaultText },
  { id: 2, text: '😉' },
  { id: 3, text: defaultText },
  { id: 4, text: '⭐️' },
  { id: 5, text: defaultText },
  { id: 6, text: '💻' },
];

const dividerStyles: DividerStyles[] = [{
  id: 1,
  height: '20px',
  marginBottom: '24px',
}, {
  id: 2,
  height: '16px',
  marginBottom: '16px',
}, {
  id: 3,
  height: '16px',
  marginBottom: '8px',
}, {
  id: 4,
  height: '16px',
  marginBottom: '4px',
}, {
  id: 5,
  height: '20px',
  marginBottom: '2px',
}];

function ShareAlarmSection() {
  return (
    <div className={styles.shareAlarmSection}>
      <Marquee autoFill className={styles.marqueeContainer}>
        <div className={styles.marqueeTexts}>
          {marqueeTexts.map(({ id, text }) => (
            <div key={id} className={clsx(id % 2 === 0 ? styles.marqueeEmoji : styles.marqueeText)}>
              {text}
            </div>
          ))}
        </div>
      </Marquee>
      {dividerStyles.map(({ id, ...style }) => (
        <div key={id} className={styles.divider} style={style} />
      ))}
      <div className={styles.descriptionWrapper}>
        <h3 className={styles.title}>지금 함께 프로젝트를 시작해요!</h3>
        <div className={styles.buttonWrapper}>
          <ShareModal />
          <AlarmModal buttonText="알림 신청하기" buttonSize="xLarge" />
        </div>
      </div>
    </div>
  );
}

export default ShareAlarmSection;
