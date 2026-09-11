// Node twin of textItems.ts for tests: same PdfPage shape, legacy pdfjs build.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { PdfPage, PdfTextItem } from '../layout';

const require = createRequire(import.meta.url);
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');

export async function loadFixturePages(name: string): Promise<PdfPage[]> {
  const fixturesDir = fileURLToPath(new URL('../__fixtures__/', import.meta.url));
  const file = path.isAbsolute(name) ? name : path.join(fixturesDir, name);
  const data = new Uint8Array(await readFile(file));
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
