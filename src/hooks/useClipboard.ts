import { useCallback } from 'react';

import useToastStore from '../stores/toast';

function useClipboard() {
  const { renderToast } = useToastStore(['renderToast']);

  const onClickCopy = useCallback(async (copyMessage: string) => {
    if (!navigator.clipboard) {
      renderToast('클립보드 복사를 지원하지 않습니다. 지원하는 브라우저를 사용해주세요.', { type: 'warn' });
      return;
    }

    try {
      await navigator.clipboard.writeText(copyMessage);

      renderToast('링크가 클립보드에 복사되었습니다.', { type: 'success' });
    } catch (error) {
      renderToast('클립보드에 복사가 실패하였습니다.', { type: 'error' });
    }
  }, []);

  return onClickCopy;
}

export default useClipboard;
