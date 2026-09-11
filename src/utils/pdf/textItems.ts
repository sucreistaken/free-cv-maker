// Browser-side pdfjs loader. The only module that touches pdfjs directly, so
// everything downstream (layout, parsing) stays pure and testable in Node.
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { PdfPage, PdfTextItem } from './layout';

// Use Vite ?url import for reliable worker loading
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export async function loadPdfPages(data: ArrayBuffer): Promise<PdfPage[]> {
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: PdfPage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items: PdfTextItem[] = [];

    for (const item of content.items) {
      if (!('str' in item)) continue;
      const t = item as TextItem;
      items.push({
        str: t.str,
        x: t.transform[4],
        // PDF y is bottom-up; convert to top-down page coordinate
        y: viewport.height - t.transform[5],
        width: t.width,
        fontSize: Math.abs(t.transform[0]) || Math.abs(t.transform[3]),
        fontName: t.fontName,
      });
    }

    pages.push({ width: viewport.width, height: viewport.height, items });
  }

  return pages;
}
