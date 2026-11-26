'use client';

import { useEffect } from 'react';

export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const confirmNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target ||
        link.href === window.location.href ||
        link.hasAttribute('download')
      )
        return;
      if (!window.confirm('저장하지 않은 변경 사항이 있습니다. 편집 화면을 나갈까요?')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', confirmNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', confirmNavigation, true);
    };
  }, [dirty]);
}
