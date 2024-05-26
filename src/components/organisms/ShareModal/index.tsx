import Button from '@/components/atoms/Button';
import Modal from '@/components/molecules/Modal';
import { ShareIcon } from '@/lib/assets/icons';
import { ShareInstagramLogo, ShareKakaoLogo, ShareXLogo } from '@/lib/assets/logos';

import styles from './index.module.scss';

function ShareModal() {
  return (
    <Modal>
      <Modal.OpenButton>
        <Button type="button" buttonType="secondary" size="xLarge">친구에게 공유하기</Button>
      </Modal.OpenButton>
      <Modal.ContentsBase title="친구에게 공유하기" size="small">
        <div className={styles.shareModalContentsWrapper}>
          <div className={styles.shareButtonWrapper}>
            <button type="button" className={styles.shareButton}>
              <ShareKakaoLogo className={styles.socialIcon} />
              <div>카카오톡</div>
            </button>
            <button type="button" className={styles.shareButton}>
              <ShareInstagramLogo className={styles.socialIcon} />
              <div>인스타그램</div>
            </button>
            <button type="button" className={styles.shareButton}>
              <ShareXLogo className={styles.socialIcon} />
              <div>X</div>
            </button>
          </div>
          <Button
            type="button"
            buttonType="secondary"
            prefixIcon={<ShareIcon />}
            className={styles.shareUrlButton}
          >
            URL 공유하기
          </Button>
        </div>
      </Modal.ContentsBase>
    </Modal>
  );
}

export default ShareModal;
