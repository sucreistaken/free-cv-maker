import { useRef, useCallback, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';

/** Safety net for browsers that never report the print dialog closing. */
const PRINT_LOCK_TIMEOUT_MS = 10_000;

export function usePdfExport() {
  const contentRef = useRef<HTMLDivElement>(null);
  // A ref, not state: the lock must be readable by the latest handler without
  // recreating the callback, and it must never survive a dropped afterprint.
  const isPrintingRef = useRef(false);
  const releaseTimerRef = useRef<number | null>(null);

  const releaseLock = useCallback(() => {
    isPrintingRef.current = false;
    if (releaseTimerRef.current !== null) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
  }, []);

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
      isPrintingRef.current = true;
      // Some browsers never fire onAfterPrint when the dialog is dismissed, and
      // an embedded (iframed) page can swallow it entirely. Without this the
      // lock stayed on and the button did nothing until a page reload.
      if (releaseTimerRef.current !== null) window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = window.setTimeout(releaseLock, PRINT_LOCK_TIMEOUT_MS);
      return Promise.resolve();
    },
    onAfterPrint: releaseLock,
    onPrintError: releaseLock,
  });

  // Second release path: the browser's own event, which fires in cases where
  // the library's callback does not.
  useEffect(() => {
    window.addEventListener('afterprint', releaseLock);
    return () => {
      window.removeEventListener('afterprint', releaseLock);
      if (releaseTimerRef.current !== null) window.clearTimeout(releaseTimerRef.current);
    };
  }, [releaseLock]);

  const handlePrint = useCallback(() => {
    if (isPrintingRef.current) return;
    triggerPrint();
  }, [triggerPrint]);

  return { contentRef, handlePrint };
}
