import { PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

import { useIsMounted } from 'usehooks-ts';

interface Props {
  elementId?: string;
}

function GlobalPortal({ elementId = 'portal-container', children }: PropsWithChildren<Props>) {
  const isMounted = useIsMounted();

  if (!isMounted()) {
    return null;
  }

  const portalRoot = document.getElementById(elementId);

  if (!portalRoot) {
    return null;
  }

  return createPortal(children, portalRoot);
}

export default GlobalPortal;
