import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

export function usePdfExport() {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: 'CV',
    pageStyle: `
      @page {
        size: 210mm 297mm;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
      }
    `,
  });

  return { contentRef, handlePrint };
}
