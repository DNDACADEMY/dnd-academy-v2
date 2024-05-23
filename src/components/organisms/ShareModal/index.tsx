import Button from '@/components/atoms/Button';
import Modal from '@/components/molecules/Modal';

function ShareModal() {
  return (
    <Modal>
      <Modal.OpenButton>
        <Button type="button" buttonType="secondary" size="xLarge">친구에게 공유하기</Button>
      </Modal.OpenButton>
      <Modal.ContentsBase title="친구에게 공유하기">
        <div>
          <div>
            <Button type="button" size="large">카카오톡</Button>
            <Button type="button" size="large">링크 복사</Button>
          </div>
          <Button type="button">URL 공유하기</Button>
        </div>
      </Modal.ContentsBase>
    </Modal>
  );
}

export default ShareModal;
