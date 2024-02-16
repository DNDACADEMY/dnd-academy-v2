'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { DocumentCallback } from 'react-pdf/dist/cjs/shared/types';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type Props = {
  url?: string;
};

function PDFViewer({ url }: Props) {
  const [width, setWidth] = useState<number>();
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = (data: DocumentCallback) => {
    setNumPages(data.numPages);
  };

  const onPrev = () => setPageNumber(pageNumber - 1);
  const onNext = () => setPageNumber(pageNumber + 1);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      setWidth(containerWidth);
    }
  }, []);

  if (!url) {
    return null;
  }

  return (
    <div ref={containerRef}>
      {width && (
        <Document file={url} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} width={width} />
        </Document>
      )}
      <div>
        <button type="button" onClick={onPrev} disabled={pageNumber === 1}>이전</button>
        {`${pageNumber} / ${numPages}`}
        <button type="button" onClick={onNext} disabled={pageNumber === numPages}>이후</button>
      </div>
    </div>
  );
}

export default PDFViewer;
