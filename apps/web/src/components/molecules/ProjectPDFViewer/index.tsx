'use client';

import dynamic from 'next/dynamic';

import styles from './index.module.scss';

const PDFViewer = dynamic(() => import('../PDFViewer'), {
  ssr: false,
});

type Props = {
  url: string;
};

function ProjectPDFViewer({ url }: Props) {
  return (
    <div className={styles.pdfWrapper}>
      <PDFViewer url={url} />
    </div>
  );
}

export default ProjectPDFViewer;
