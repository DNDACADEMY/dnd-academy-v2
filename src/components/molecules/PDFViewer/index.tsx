'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { DocumentCallback } from 'react-pdf/dist/cjs/shared/types';

import clsx from 'clsx';
import useResizeObserver from 'use-resize-observer';

import Button from '@/components/atoms/Button';
import { ArrowExpandIcon, ArrowRightIcon } from '@/lib/assets/icons';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './index.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type Props = {
  url?: string;
};

function PDFViewer({ url }: Props) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  const { ref: containerRef, width } = useResizeObserver<HTMLDivElement>({
    box: 'border-box',
  });

  const onDocumentLoadSuccess = (data: DocumentCallback) => {
    setNumPages(data.numPages);
  };

  const onPrev = () => setPageNumber(pageNumber - 1);
  const onNext = () => setPageNumber(pageNumber + 1);

  if (!url) {
    return null;
  }

  return (
    <div ref={containerRef} className={styles.pdfViewerWrapper}>
      {width && (
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          // TODO: 로딩 임시 처리
          loading={<div className={styles.loading}>loading pdf..</div>}
        >
          <Page
            pageNumber={pageNumber}
            width={width}
            loading={<div className={styles.loading}>loading page..</div>}
          />
        </Document>
      )}
      <div className={styles.pdfButtonWrapper}>
        <Button
          className={styles.button}
          type="button"
          onClick={onPrev}
          size="small"
          buttonType="clear"
          disabled={pageNumber === 1}
        >
          <ArrowRightIcon className={clsx(styles.icon, pageNumber === 1 && styles.disabled)} />
        </Button>
        <div className={styles.pageCount}>
          {numPages ? `${pageNumber} / ${numPages}` : pageNumber}
        </div>
        <Button
          className={styles.button}
          type="button"
          onClick={onNext}
          size="small"
          buttonType="clear"
          disabled={!numPages || pageNumber === numPages}
        >
          <ArrowRightIcon
            className={clsx((!numPages || pageNumber === numPages) && styles.disabled)}
          />
        </Button>
        <Button
          isExternalLink
          href={url}
          buttonType="clear"
          size="small"
          className={styles.expandLink}
        >
          <ArrowExpandIcon className={styles.icon} />
        </Button>
      </div>
    </div>
  );
}

export default PDFViewer;
