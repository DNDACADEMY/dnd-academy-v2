'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

import styles from './index.module.scss';

// NOTE - https://github.com/wojtekmaj/react-pdf/issues/1811
const PDFViewer = dynamic(() => import('@/components/molecules/PDFViewer'), {
  ssr: false,
});

function ProjectPDFViewer(props: ComponentProps<typeof PDFViewer>) {
  return (
    <div className={styles.pdfWrapper}>
      <PDFViewer {...props} />
    </div>
  );
}

export default ProjectPDFViewer;
