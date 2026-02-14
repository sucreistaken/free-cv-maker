import { useRef, useCallback } from 'react';

export function usePdfExport() {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return { contentRef, handlePrint };
}
