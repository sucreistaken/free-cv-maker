// Regenerates the PDF fixtures used by src/utils/pdf/__tests__/pdfImport.test.ts.
//
// Usage:
//   npm run dev                       # in another terminal (default data, no profile changes)
//   node scripts/make-pdf-fixtures.mjs [devServerUrl] [template ...]
//
// Prints one PDF per template into src/utils/pdf/__fixtures__/export-<template>.pdf using
// the system Google Chrome via playwright-core (no browser download). The page is reduced to
// the .print-area subtree first, which is what react-to-print sends to the printer.
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const args = process.argv.slice(2);
const baseUrl = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/';
const templates = args.filter((a) => !a.startsWith('http'));
const targets = templates.length ? templates : ['classic', 'modern', 'twoColumn'];
const outDir = fileURLToPath(new URL('../src/utils/pdf/__fixtures__/', import.meta.url));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const template of targets) {
    const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForSelector('.print-area .a4-page', { timeout: 15000 });

    const templateSelect = page.locator('select').filter({ has: page.locator('option[value="classic"]') });
    await templateSelect.selectOption(template);
    await page.waitForTimeout(800);

    await page.evaluate(() => {
      const area = document.querySelector('.print-area');
      if (!area) throw new Error('.print-area not found');
      const clone = area.cloneNode(true);
      document.body.innerHTML = '';
      document.body.style.margin = '0';
      document.body.appendChild(clone);
    });
    await page.emulateMedia({ media: 'print' });

    const out = path.join(outDir, `export-${template}.pdf`);
    await page.pdf({
      path: out,
      format: 'A4',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      printBackground: true,
      preferCSSPageSize: true,
    });
    console.log(`${template} -> ${out}`);
    await context.close();
  }
} finally {
  await browser.close();
}
