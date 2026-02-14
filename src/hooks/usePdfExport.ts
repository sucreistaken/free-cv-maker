import { useRef, useCallback, useState } from 'react';
import { useReactToPrint } from 'react-to-print';

export function usePdfExport() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const triggerPrint = useReactToPrint({
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
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    `,
    onBeforePrint: () => {
      setIsPrinting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
  });

  const handlePrint = useCallback(() => {
    if (isPrinting) return;
    triggerPrint();
  }, [triggerPrint, isPrinting]);

  return { contentRef, handlePrint };
}
