'use client';

import { useState } from 'react';
import {
  Document, DocumentProps, Page, pdfjs,
} from 'react-pdf';

import clsx from 'clsx';
import useResizeObserver from 'use-resize-observer';

import Button from '@/components/atoms/Button';
import { ArrowExpandIcon, ArrowRightIcon } from '@/lib/assets/icons';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './index.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Props = {
  url: string | null;
};

function PDFViewer({ url }: Props) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  const { ref: containerRef, width } = useResizeObserver<HTMLDivElement>({
    box: 'border-box',
  });

  const onDocumentLoadSuccess: DocumentProps['onLoadSuccess'] = (data) => {
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
          type="button"
          onClick={onPrev}
          size="small"
          theme="light"
          buttonType="clear"
          disabled={pageNumber === 1}
        >
          <ArrowRightIcon className={clsx(styles.prevIcon, pageNumber === 1 && styles.disabled)} />
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
          theme="light"
          disabled={!numPages || pageNumber === numPages}
        >
          <ArrowRightIcon
            className={clsx(
              styles.nextIcon,
              (!numPages || pageNumber === numPages) && styles.disabled,
            )}
          />
        </Button>
        <Button
          isExternalLink
          href={url}
          buttonType="clear"
          size="small"
          theme="light"
          className={styles.expandLink}
        >
          <ArrowExpandIcon className={styles.icon} />
        </Button>
      </div>
    </div>
  );
}

export default PDFViewer;
