'use client';

import { useEffect } from 'react';

type Props = {
  title: string;
};

function TitleSync({ title }: Props) {
  useEffect(() => {
    if (typeof document !== 'undefined' && document.title !== title) {
      document.title = title;
    }
  }, [title]);

  return null;
}

export default TitleSync;
