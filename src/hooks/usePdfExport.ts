import { useRef, useCallback } from 'react';
import { computePageBreaks } from '../utils/pagination';

/**
 * PDF export via the browser's own print, but hardened.
 *
 * The CV is cloned into an isolated, off-screen iframe that contains nothing
 * but the resume, then that iframe is printed. This avoids the whole class of
 * bugs the previous "print the main window and hide everything else with
 * `visibility: hidden`" approach caused:
 *   - a blank page, because the live preview wraps the resume in a
 *     `transform: scale()` container with `overflow: hidden`, which shrank and
 *     clipped the absolutely-positioned print area down to nothing;
 *   - dependence on a fragile visibility toggle that had to out-specify every
 *     element on the page.
 *
 * Because the iframe holds only the resume at scale 1, output is faithful to
 * the on-screen template, text stays selectable (vector, not rasterized, so
 * Tailwind's oklch colors are unaffected), and `@page { margin: 0 }` keeps
 * Chrome from adding its URL and timestamp footer by default.
 */

const PRINT_SAFETY_TIMEOUT_MS = 60_000;

/** Copies every stylesheet from the app document into the print document. */
function copyStyles(source: Document, target: Document): void {
  for (const node of source.querySelectorAll('style, link[rel="stylesheet"]')) {
    target.head.appendChild(node.cloneNode(true));
  }
}

/** Resolves once the print document's images and fonts are ready, or times out. */
function waitForAssets(doc: Document, win: Window & typeof globalThis): Promise<void> {
  const images = Array.from(doc.images).map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.addEventListener('load', () => resolve(), { once: true });
      img.addEventListener('error', () => resolve(), { once: true });
    });
  });

  const fonts = win.document.fonts?.ready ?? Promise.resolve();
  const assets = Promise.all([...images, fonts]).then(() => undefined);

  // Never block printing on a stalled asset.
  const cap = new Promise<void>((resolve) => win.setTimeout(resolve, 3_000));
  return Promise.race([assets, cap]);
}

export function usePdfExport() {
  const contentRef = useRef<HTMLDivElement>(null);
  const isPrintingRef = useRef(false);

  const handlePrint = useCallback(async () => {
    const source = contentRef.current;
    if (!source || isPrintingRef.current) return;
    isPrintingRef.current = true;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    // Off-screen but still laid out, so the browser renders it for printing.
    iframe.style.cssText =
      'position:fixed; left:-9999px; top:0; width:210mm; height:297mm; border:0; visibility:hidden;';

    const finish = () => {
      if (!isPrintingRef.current) return;
      isPrintingRef.current = false;
      iframe.remove();
    };

    try {
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow as (Window & typeof globalThis) | null;
      if (!doc || !win) {
        finish();
        return;
      }

      copyStyles(document, doc);

      const printStyle = doc.createElement('style');
      printStyle.textContent = `
        @page { size: 210mm 297mm; margin: 0; }
        html, body {
          margin: 0;
          padding: 0;
          height: auto;
          overflow: visible;
          background: #ffffff;
        }
        .print-area {
          position: static;
          width: 210mm;
          margin: 0;
          padding: 0;
          transform: none !important;
        }
        .a4-page { box-shadow: none !important; }
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      `;
      doc.head.appendChild(printStyle);
      doc.title = 'CV';

      const clone = source.cloneNode(true) as HTMLElement;
      doc.body.appendChild(clone);

      // The template's top/bottom padding only exists once, so pages 2+ would start
      // flush against the paper edge. Repeat it on every page fragment. (Using @page
      // margins instead would make Chrome print its URL/date/page-number header and footer.)
      const pageStyle = doc.createElement('style');
      pageStyle.textContent = `
        .a4-page { box-decoration-break: clone; -webkit-box-decoration-break: clone; min-height: 0 !important; }
      `;
      doc.head.appendChild(pageStyle);

      await waitForAssets(doc, win);

      // Break exactly where the preview's page lines are: same measurement, forced here.
      const page = clone.querySelector<HTMLElement>('.a4-page');
      if (page) {
        for (const { element } of computePageBreaks(page)) {
          if (element) element.style.breakBefore = 'page';
        }
      }

      // The browser fires afterprint on the iframe window once the dialog
      // closes. A timeout is the fallback for browsers that never do.
      win.addEventListener('afterprint', finish, { once: true });
      window.setTimeout(finish, PRINT_SAFETY_TIMEOUT_MS);

      win.focus();
      win.print();
    } catch {
      finish();
    }
  }, []);

  return { contentRef, handlePrint };
}
