// Regenerates src/utils/pdf/__fixtures__/export-custom-<template>.pdf: the default CV plus a
// user-added section, used to check that PDF import brings custom sections back.
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
const targets = templates.length ? templates : ['classic', 'modern'];
const outDir = fileURLToPath(new URL('../src/utils/pdf/__fixtures__/', import.meta.url));

export const CUSTOM_SECTION = {
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

    await page.evaluate(() => {
      const area = document.querySelector('.print-area');
      if (!area) throw new Error('.print-area not found');
      const clone = area.cloneNode(true);
      document.body.innerHTML = '';
      document.body.style.margin = '0';
      document.body.appendChild(clone);
      const style = document.createElement('style');
      style.textContent = 'html, body { height: auto !important; overflow: visible !important; }';
      document.head.appendChild(style);
    });
    await page.emulateMedia({ media: 'print' });

    const out = path.join(outDir, `export-custom-${template}.pdf`);
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
