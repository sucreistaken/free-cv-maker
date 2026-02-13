import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

export function usePdfExport() {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: 'CV',
  });

  return { contentRef, handlePrint };
}
