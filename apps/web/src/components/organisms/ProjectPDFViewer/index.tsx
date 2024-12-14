'use client';

import dynamic from 'next/dynamic';

import styles from './index.module.scss';

// NOTE - https://github.com/wojtekmaj/react-pdf/issues/1811
const PDFViewer = dynamic(() => import('@/components/molecules/PDFViewer'), {
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
