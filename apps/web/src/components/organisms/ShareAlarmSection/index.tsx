'use client';

import { CSSProperties } from 'react';
import Marquee from 'react-fast-marquee';

import Image from 'next/image';

import { Button } from '@dnd-academy/ui';
import clsx from 'clsx';

import ShareClipBoardCTA from '@/components/molecules/ShareClipBoardCTA';
import ApplyNotifyButtonGroup from '@/components/organisms/ApplyNotifyButtonGroup';
import { getEventStatus } from '@/lib/apis/event';
import { PUBLIC_ORIGIN } from '@/lib/constants/origin';
import { isChristmasTheme } from '@/utils';

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
}, {
  id: 2,
  height: '24px',
}, {
  id: 3,
  height: '16px',
}, {
  id: 4,
  height: '16px',
}, {
  id: 5,
  height: '16px',
}, {
  id: 6,
  height: '8px',
}, {
  id: 7,
  height: '16px',
}, {
  id: 8,
  height: '4px',
}, {
  id: 9,
  height: '20px',
}, {
  id: 10,
  height: '2px',
}];

function ShareAlarmSection() {
  const eventStatus = getEventStatus();
  const isChristmas = isChristmasTheme();

  const shareUrl = PUBLIC_ORIGIN;
  const introduceText = 'DND와 함께 프로젝트를 시작해 보세요!\n1. 개발자와 디자이너의 협업 경험을 만들 수 있어요.\n2. 헤매지 않고 8주 커리큘럼에 따라 프로젝트를 완성해요.\n3. DND에서 주최하는 다양한 이벤트, 세미나에 참가할 수 있어요.\n지금 바로 참가하기\n';

  return (
    <div className={styles.shareAlarmSection}>
      <Marquee autoFill className={styles.marqueeContainer}>
        <div className={clsx(styles.marqueeTexts, { [styles.christmasTheme]: isChristmas })}>
          {marqueeTexts.map(({ id, text }) => (
            <div
              key={id}
              className={clsx(id % 2 === 0 ? styles.marqueeEmoji : styles.marqueeText)}
            >
              {text}
            </div>
          ))}
        </div>
      </Marquee>
      {dividerStyles.map(({ id, ...style }) => (
        <div
          key={id}
          style={style}
          className={clsx(styles.divider, isChristmas && styles.christmasTheme, {
            [styles.evenDivider]: id % 2 === 0,
            [styles.oddDivider]: id % 2 === 1,
          })}
        />
      ))}
      <div className={clsx(styles.descriptionWrapper, { [styles.christmasTheme]: isChristmas })}>
        <h3 className={clsx(isChristmas ? styles.christmasTitle : styles.title)}>
          {isChristmas
            ? (
              <>
                <Image
                  src="/assets/images/christmas/leaf-angle.png"
                  alt="christmas-title"
                  width={100}
                  height={80}
                  className={styles.christmasLeafAngle}
                />
                <span className={styles.title}>지금 함께 프로젝트를 시작해요!</span>
                <Image
                  src="/assets/images/christmas/leaf-angle.png"
                  alt="christmas-title"
                  width={100}
                  height={80}
                  className={styles.christmasLeafAngle}
                />
              </>
            )
            : '지금 함께 프로젝트를 시작해요!'}
        </h3>
        <div className={styles.buttonWrapper}>
          <ShareClipBoardCTA shareText={`${introduceText}${shareUrl}`}>
            <Button fullWidth size="xLarge" type="button">친구에게 공유하기</Button>
          </ShareClipBoardCTA>
          <ApplyNotifyButtonGroup eventStatus={eventStatus}>
            <Button fullWidth size="xLarge" buttonType="primary" />
          </ApplyNotifyButtonGroup>
        </div>
      </div>
    </div>
  );
}

export default ShareAlarmSection;
