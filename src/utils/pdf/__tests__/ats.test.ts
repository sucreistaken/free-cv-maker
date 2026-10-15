import { describe, expect, it } from 'vitest';
import { loadFixturePages } from './nodeLoader';

// What an applicant tracking system sees: the text in content-stream order, with none of this
// app's layout reconstruction. Each template's exported PDF must read cleanly that way.
const TEMPLATES = ['classic', 'modern', 'twoColumn', 'minimalist', 'creative', 'academic', 'compact'];

async function streamText(template: string): Promise<string> {
  const pages = await loadFixturePages(`export-${template}.pdf`);
  // Runs on one baseline are concatenated as an extractor does; a new baseline starts a new line.
  let out = '';
  let lastY: number | null = null;
  for (const item of pages.flatMap((p) => p.items)) {
    if (lastY !== null && Math.abs(item.y - lastY) > 2) out += ' ';
    out += item.str;
    lastY = item.y;
  }
  return out.replace(/\s+/g, ' ');
}

describe.each(TEMPLATES)('ATS readability of %s', (template) => {
  it('keeps standard section headings intact in plain ASCII', async () => {
    const text = (await streamText(template)).toUpperCase();
    for (const heading of ['SUMMARY', 'EXPERIENCE', 'EDUCATION', 'SKILLS', 'CERTIFICATIONS', 'LANGUAGES']) {
      expect(text, `${heading} heading`).toContain(heading);
    }
  });

  it('has no letter-spaced words', async () => {
    const text = await streamText(template);
    expect(text.match(/(?:(?<![\p{L}])\p{L} ){3,}\p{L}(?![\p{L}])/gu) ?? []).toEqual([]);
  });

  it('prints contact details as whole tokens', async () => {
    const text = await streamText(template);
    expect(text).toContain('alex.morgan@email.com');
    expect(text).toContain('+49 170 1234567');
  });

  it('uses only common bullet and dash glyphs', async () => {
    const text = await streamText(template);
    const unusual = [...new Set([...text].filter((c) => c.charCodeAt(0) > 0x7e && !/[\p{L}\p{N}]/u.test(c)))].filter(
      (c) => !'•·–—'.includes(c),
    );
    expect(unusual).toEqual([]);
  });

  it('starts with the name, before any section', async () => {
    const text = await streamText(template);
    expect(text.toLowerCase().indexOf('alex morgan')).toBeLessThan(text.toUpperCase().indexOf('SUMMARY'));
  });
});
