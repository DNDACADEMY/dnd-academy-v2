'use client';

import { CSSProperties } from 'react';
import Marquee from 'react-fast-marquee';

import clsx from 'clsx';

import Button from '@/components/atoms/Button';
import ApplyModal from '@/components/organisms/ApplyModal';
import useClipboard from '@/hooks/useClipboard';

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
  const onClickShare = useClipboard();

  const shareUrl = process.env.NEXT_PUBLIC_ORIGIN;
  const introduceText = 'DND와 함께 프로젝트를 시작해 보세요!\n1. 개발자와 디자이너의 협업 경험을 만들 수 있어요.\n2. 헤매지 않고 8주 커리큘럼에 따라 프로젝트를 완성해요.\n3. DND에서 주최하는 다양한 이벤트, 세미나에 참가할 수 있어요.\n지금 바로 참가하기\n';

  const handleClickShare = () => onClickShare(`${introduceText}${shareUrl}`);

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
          <Button onClick={handleClickShare} type="button" size="xLarge">친구에게 공유하기</Button>
          <ApplyModal>
            <Button size="xLarge" buttonType="primary" />
          </ApplyModal>
        </div>
      </div>
    </div>
  );
}

export default ShareAlarmSection;
