import Image from 'next/image';

import { Button } from '@dnd-academy/ui/client';

import PageTitle from '@/components/atoms/PageTitle';
import { LinkIcon } from '@/lib/assets/icons';

import styles from './index.module.scss';

function CulturePage() {
  return (
    <>
      <section className={styles.introduceSection}>
        <PageTitle title="문화" />
        <Image
          className={styles.image}
          src="/assets/images/dnd-culture.png"
          alt="dnd-culture"
          sizes="100vw"
          width={0}
          height={0}
          priority
        />
        <div className={styles.subTitle}>
          {'Brings joy to the project.\nBrings opportunity to all.'}
        </div>
        <div className={styles.description}>
          <strong>
            {'무언가를 만들고, 함께 시작하는 즐거움을 느껴 보셨나요?\n'}
          </strong>
          <br />
          {'개발자와 디자이너, 운영진과 참가자 사이.\n다양한 네트워킹을 통해 성장하며,\n앞으로 한걸음 더 나아갑니다.'}
        </div>
      </section>
      <section className={styles.codeOfConductorSection}>
        <h2 className={styles.title}>Code of Conductor</h2>
        <div className={styles.description}>
          <strong>DND</strong>
          는 누구나 자유롭게 참여할 수 있는 커뮤니티를 지향합니다. 성별, 직업, 나이, 성 정체성, 성적 취향, 장애, 외모,
          민족, 국적, 인종, 정치, 종교 등에 대한 발언은 강력하게 금지합니다.
          이는 DND에서 운영하는 모든 행사에 참여하는 모든 개인에게 해당하며 위반 시 운영위원 또는
          운영위원회의 결정을 통해 주의, 퇴장, 외부로의 도움 요청등의 제재를 받을 수 있습니다.
        </div>
        <div>
          <div className={styles.descriptionTitle}>
            ✅ 대화에 참여하고 싶을 때, 망설이지 말고 적극적으로 참여해주세요.
          </div>
          <div className={styles.descriptionText}>
            또한 처음 오신 분들도 적극적으로 참여할 수 있도록 도와주고, 상대방의 용기에 감사를 표현해주세요.
          </div>
          <br />
          <div className={styles.descriptionTitle}>
            ✅ 상대방의 의견을 비난하지말고, 서로를 존중해주세요.
          </div>
          <br />
          <div className={styles.descriptionTitle}>
            ✅ 불필요한 오해를 일으킬수 있는 말과 행동을 조심해주세요.
          </div>
          <div className={styles.descriptionText}>
            다른사람의 생각의 기준은 나와 다를 수 있어요. 나의 부모님, 가족에게 하지 못할 말은 상대방에게 하지 말아주세요.
          </div>
          <br />
          <div className={styles.descriptionTitle}>
            ✅ 도움이 필요하다면 주위 또는 운영진에게 도움을 요청하세요.
          </div>
        </div>
        <div className={styles.description}>
          <strong>DND</strong>
          에 참여하신 모든 참가자들은 위 행동 강령에 동의한 것으로 간주하며 위 행동 강령을
          위반한 행사 참가자가 참가를 위해 지불한 비용이 있다면 돌려받을 수 없습니다.
          행동 강령에 위반된 곤란한 상황을 마주하셨을 경우 DND 운영진에게 알려주십시요.
          DND 운영진은 개인의 판단 또는 운영위원회의 논의를 거처 참가자를 위험으로 부터 보호하고 경우따라 경찰, 사법기관에 도움을 요청 할 수 있습니다.
        </div>
        <div className={styles.buttonWrapper}>
          <Button
            isExternalLink
            href="https://island-allium-288.notion.site/DND-53511a46df7748899e8ed079ca0eee85?pvs=4"
            buttonType="clear"
            size="large"
            suffixIcon={<LinkIcon width={14} height={14} className={styles.linkIcon} />}
          >
            DND활동 정책 확인하기
          </Button>
        </div>
      </section>
    </>
  );
}

export default CulturePage;
