import { Button } from '@dnd-academy/ui';

import styles from './index.module.scss';

function Navigator() {
  return (
    <nav>
      <ul className={styles.navigatorWrapper}>
        <li>
          <Button buttonType="secondary" size="small" href="/current-applicant-count">현재 지원자 수 카운트 업데이트하기</Button>
        </li>
        <li>
          <Button buttonType="secondary" size="small" href="/total-count-status">총 지원자 수 카드 섹션 정보 업데이트하기</Button>
        </li>
        <li>
          <Button buttonType="secondary" size="small" href="/faq">FAQ 업데이트하기</Button>
        </li>
      </ul>
    </nav>
  );
}

export default Navigator;
