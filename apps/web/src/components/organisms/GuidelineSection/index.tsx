import clsx from 'clsx';

import SectionTitle from '@/components/atoms/SectionTitle';
import { DesignerBadge, DeveloperBadge } from '@/lib/assets/logos';

import styles from './index.module.scss';

function GuidelineSection() {
  return (
    <SectionTitle title="8주는 어떻게 진행되나요?">
      <div className={styles.guidelineSectionContents}>
        <table className={styles.guidelineTable}>
          <tbody>
            <tr>
              <td className={styles.week}>1주</td>
              <td>
                <span className={styles.badge}>팀빌딩</span>
              </td>
              <td>프로젝트 시작</td>
              <td />
            </tr>
            <tr>
              <td className={styles.week}>2주</td>
              <td />
              <td>사용자 경험 조사</td>
              <td />
            </tr>
            <tr>
              <td className={styles.week}>3주</td>
              <td />
              <td>
                <div className={styles.withBadge}>
                  <DeveloperBadge className={styles.developerBadge} />
                  <div>프로젝트 세팅</div>
                </div>
              </td>
              <td>
                <div className={styles.withBadge}>
                  <DesignerBadge className={styles.designerBadge} />
                  <div>Lo-fi design</div>
                </div>
              </td>
            </tr>
            <tr>
              <td className={styles.week}>4주</td>
              <td className={styles.middle}>
                <span className={clsx(styles.badge, styles.absolute)}>중간발표</span>
              </td>
              <td>
                <div className={styles.withBadge}>
                  <DeveloperBadge className={styles.developerBadge} />
                  <div>개발 진행</div>
                </div>
              </td>
              <td>
                <div className={styles.withBadge}>
                  <DesignerBadge className={styles.designerBadge} />
                  <div>Branding, Hi-fi design</div>
                </div>
              </td>
            </tr>
            <tr>
              <td className={styles.week}>5주</td>
              <td />
              <td>회고</td>
              <td />
            </tr>
            <tr>
              <td className={styles.week}>6주</td>
              <td />
              <td>프로토타입 데모</td>
              <td />
            </tr>
            <tr>
              <td className={styles.week}>7주</td>
              <td />
              <td>우선순위 조정</td>
              <td />
            </tr>
            <tr>
              <td className={styles.week}>8주</td>
              <td>
                <span className={styles.badge}>🔥최종 발표🔥</span>
              </td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>
        <ul className={styles.subDescription}>
          <li>실제 프로젝트 진행 시 주차별 가이드라인을 제공합니다.</li>
        </ul>
      </div>
    </SectionTitle>
  );
}

export default GuidelineSection;
