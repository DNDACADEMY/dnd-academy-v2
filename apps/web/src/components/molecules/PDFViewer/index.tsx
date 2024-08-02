'use client';

import { useRef, useState } from 'react';
import {
  Document, DocumentProps, Page, pdfjs,
} from 'react-pdf';

import { Button } from '@dnd-academy/ui';
import clsx from 'clsx';
import { useDebounceCallback, useResizeObserver } from 'usehooks-ts';

import { ArrowExpandIcon, ArrowRightIcon } from '@/lib/assets/icons';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './index.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

type Props = {
  url: string;
};

function PDFViewer({ url }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  const [width, setWidth] = useState<number>();

  const onResizeWidth = useDebounceCallback(setWidth, 200);

  useResizeObserver<HTMLDivElement>({
    box: 'border-box',
    onResize: (size) => onResizeWidth(size.width),
    ref: containerRef,
  });

  const onDocumentLoadSuccess: DocumentProps['onLoadSuccess'] = (data) => {
    setNumPages(data.numPages);
  };

  const onPrev = () => setPageNumber(pageNumber - 1);
  const onNext = () => setPageNumber(pageNumber + 1);

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
