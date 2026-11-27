// Regenerates src/utils/pdf/__fixtures__/export-custom-<template>.pdf: the default CV plus a
// user-added section, used to check that PDF import brings custom sections back.
//
// The PDF goes through the app's own print path ("Print / PDF"): the isolated print iframe
// with page breaks forced where the preview shows them. Its print() call is intercepted, and
// the same document is printed headless, so headings stay with their first entry exactly as
// in a real export.
//
// Usage:
//   npm run dev
//   node scripts/make-custom-section-fixture.mjs [devServerUrl] [template ...]
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const args = process.argv.slice(2);
const baseUrl = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/';
const templates = args.filter((a) => !a.startsWith('http'));
const targets = templates.length
  ? templates
  : ['classic', 'modern', 'twoColumn', 'minimalist', 'creative', 'academic', 'compact'];
const outDir = fileURLToPath(new URL('../src/utils/pdf/__fixtures__/', import.meta.url));

const CUSTOM_SECTION = {
  id: 'custom-talks',
  type: 'custom',
  title: 'Conference Talks',
  visible: true,
  items: [
    {
      id: 'talk-1',
      title: 'Keynote Speaker',
      subtitle: 'ReactConf Istanbul',
      startDate: 'Sep 2024',
      endDate: '',
      bullets: ['Spoke about design systems at scale to 400 attendees'],
    },
  ],
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const template of targets) {
    const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForSelector('.print-area .a4-page', { timeout: 15000 });

    // Add the section to the stored profile, then reload so the app reads it like any saved CV.
    await page.evaluate((section) => {
      const key = 'cv-builder-profiles';
      const stored = JSON.parse(localStorage.getItem(key));
      const profile = stored.state.profiles.find((p) => p.id === stored.state.activeProfileId);
      profile.cvData.sections.push(section);
      localStorage.setItem(key, JSON.stringify(stored));
    }, CUSTOM_SECTION);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.print-area .a4-page', { timeout: 15000 });

    const templateSelect = page.locator('select').filter({ has: page.locator('option[value="classic"]') });
    await templateSelect.selectOption(template);
    await page.waitForTimeout(800);

    // Capture the print iframe's document at the moment the app calls print().
    await page.evaluate(() => {
      window.__printHtml = new Promise((resolve) => {
        const append = document.body.appendChild.bind(document.body);
        document.body.appendChild = (node) => {
          const result = append(node);
          if (node instanceof HTMLIFrameElement && node.contentWindow) {
            node.contentWindow.print = () => resolve(node.contentDocument.documentElement.outerHTML);
          }
          return result;
        };
      });
    });
    await page.keyboard.press('Control+p');
    const html = await page.evaluate(() => window.__printHtml);

    const printPage = await context.newPage();
    await printPage.setContent(`<!doctype html>${html.replace('<head>', `<head><base href="${baseUrl}">`)}`, {
      waitUntil: 'networkidle',
    });
    await printPage.emulateMedia({ media: 'print' });
    const out = path.join(outDir, `export-custom-${template}.pdf`);
    await printPage.pdf({ path: out, printBackground: true, preferCSSPageSize: true });
    console.log(`${template} -> ${out}`);
    await context.close();
  }
} finally {
  await browser.close();
}
