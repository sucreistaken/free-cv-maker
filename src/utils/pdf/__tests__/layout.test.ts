import { describe, expect, it } from 'vitest';
import { buildLayoutLines, foldTurkish, type PdfPage, type PdfTextItem } from '../layout';

const FONT = 8;

/** Lays out runs left to right on one baseline; `gap` is the space before each run. */
function row(y: number, runs: { str: string; gap?: number; x?: number }[], fontSize = FONT): PdfTextItem[] {
  const items: PdfTextItem[] = [];
  let cursor = 40;
  for (const run of runs) {
    const x = run.x ?? cursor + (run.gap ?? 0);
    const width = run.str.length * fontSize * 0.5;
    items.push({ str: run.str, x, y, width, fontSize, fontName: 'f1' });
    cursor = x + width;
  }
  return items;
}

function page(items: PdfTextItem[], width = 595): PdfPage {
  return { width, height: 842, items };
}

describe('foldTurkish', () => {
  it('maps every Turkish I variant to a plain i', () => {
    expect(foldTurkish('EXPERİENCE')).toBe('experience');
    expect(foldTurkish('EĞİTİM')).toBe('eğitim');
    expect(foldTurkish('KATILIMLAR')).toBe('katilimlar');
    expect(foldTurkish('Iş')).toBe('iş');
  });
});

describe('buildLayoutLines', () => {
  it('glues punctuation runs but keeps word gaps', () => {
    const items = [
      ...row(100, [{ str: 'alex' }, { str: '.' }, { str: 'morgan' }, { str: '@' }, { str: 'email' }, { str: '.' }, { str: 'com' }]),
      ...row(100, [{ str: '+49 170', x: 200 }, { str: ' ', x: 228 }, { str: '1234567', x: 232 }]),
    ];
    const [line] = buildLayoutLines([page(items)]);
    expect(line.text).toBe('alex.morgan@email.com +49 170 1234567');
  });

  it('inserts a space when runs are separated by a visible gap', () => {
    const items = row(100, [{ str: 'TechFlow' }, { str: 'GmbH', gap: 3 }, { str: 'Mar 2023', gap: 200 }]);
    const [line] = buildLayoutLines([page(items)]);
    expect(line.text).toBe('TechFlow GmbH Mar 2023');
    expect(line.hasWideGap).toBe(true);
  });

  it('merges a wrapped bullet continuation into its bullet', () => {
    const items = [
      ...row(100, [{ str: '•' }, { str: 'Led the migration of a legacy app', gap: 4 }]),
      ...row(112, [{ str: 'to React, reducing bundle size.', x: 40 + FONT * 0.5 + 4 }]),
      ...row(124, [{ str: 'TechFlow GmbH', x: 40 }]),
    ];
    const lines = buildLayoutLines([page(items)]);
    expect(lines.map((l) => l.text)).toEqual([
      '• Led the migration of a legacy app to React, reducing bundle size.',
      'TechFlow GmbH',
    ]);
    expect(lines[0].isBullet).toBe(true);
  });

  it('merges a paragraph line that wrapped at the column edge', () => {
    const items = [
      ...row(100, [{ str: 'React, TypeScript, Next.js, Tailwind' }]),
      ...row(112, [{ str: 'CSS, Redux, Vue.js' }]),
      ...row(124, [{ str: 'Backend:' }]),
    ];
    const lines = buildLayoutLines([page(items)]);
    expect(lines.map((l) => l.text)).toEqual(['React, TypeScript, Next.js, Tailwind CSS, Redux, Vue.js', 'Backend:']);
  });

  it('splits a two-column page and reads each column top to bottom', () => {
    const items: PdfTextItem[] = [];
    for (let i = 0; i < 12; i++) {
      items.push(...row(100 + i * 12, [{ str: `Left line ${i}.`, x: 40 }]));
      items.push(...row(100 + i * 12, [{ str: `Right line ${i}.`, x: 320 }]));
    }
    const lines = buildLayoutLines([page(items)]);
    expect(lines.map((l) => l.text)).toEqual([
      ...Array.from({ length: 12 }, (_, i) => `Left line ${i}.`),
      ...Array.from({ length: 12 }, (_, i) => `Right line ${i}.`),
    ]);
    expect(lines.slice(0, 12).every((l) => l.column === 0)).toBe(true);
    expect(lines.slice(12).every((l) => l.column === 1)).toBe(true);
  });

  it('keeps a full-width header above two columns in reading order', () => {
    const items: PdfTextItem[] = [
      ...row(40, [{ str: 'Alex Morgan spanning the whole page width with a long name line', x: 40 }], 12),
    ];
    for (let i = 0; i < 12; i++) {
      items.push(...row(100 + i * 12, [{ str: `L${i}.`, x: 40 }]));
      items.push(...row(100 + i * 12, [{ str: `R${i}.`, x: 320 }]));
    }
    const lines = buildLayoutLines([page(items)]);
    expect(lines[0].text).toMatch(/^Alex Morgan/);
    expect(lines.slice(1, 13).map((l) => l.text)).toEqual(Array.from({ length: 12 }, (_, i) => `L${i}.`));
  });

  it('collapses letter-spaced runs but keeps the word break between them', () => {
    const items = row(100, [{ str: 'A L E X' }, { str: ' ', gap: 1 }, { str: 'M O R G A N', gap: 1 }]);
    const [line] = buildLayoutLines([page(items)]);
    expect(line.text).toBe('ALEX MORGAN');
  });

  it('treats arrow-style glyphs as bullet markers', () => {
    const items = [
      ...row(100, [{ str: '▸' }, { str: 'Led the migration', gap: 4 }]),
      ...row(112, [{ str: '▸' }, { str: 'Mentored developers', gap: 4 }]),
    ];
    const lines = buildLayoutLines([page(items)]);
    expect(lines.map((l) => l.isBullet)).toEqual([true, true]);
  });

  it('does not split a contact bar that runs across the gutter into two columns', () => {
    const items: PdfTextItem[] = [
      ...row(40, [
        { str: 'Berlin, Germany' },
        { str: 'alex.morgan@email.com', gap: 6 },
        { str: '+49 170 1234567', gap: 6 },
        { str: 'github.com/alexmdev', gap: 6 },
        { str: 'alexmorgan.dev', gap: 6 },
      ]),
    ];
    for (let i = 0; i < 12; i++) {
      items.push(...row(100 + i * 12, [{ str: `L${i}.`, x: 40 }]));
      items.push(...row(100 + i * 12, [{ str: `R${i}.`, x: 320 }]));
    }
    const lines = buildLayoutLines([page(items)]);
    expect(lines[0].text).toBe('Berlin, Germany alex.morgan@email.com +49 170 1234567 github.com/alexmdev alexmorgan.dev');
  });

  it('reads a left rail of dates as part of one column instead of a column of its own', () => {
    const items: PdfTextItem[] = [];
    const dates = ['Mar 2023 - Present', 'Jun 2021 - Feb 2023', 'Sep 2020 - May 2021'];
    dates.forEach((date, i) => {
      items.push(...row(100 + i * 36, [{ str: date, x: 40 }]));
      items.push(...row(100 + i * 36, [{ str: `Role ${i}`, x: 200 }]));
      items.push(...row(112 + i * 36, [{ str: `Company ${i}`, x: 200 }]));
      items.push(...row(124 + i * 36, [{ str: `Detail ${i}`, x: 200 }]));
    });
    const lines = buildLayoutLines([page(items)]);
    expect(lines[0].text).toContain('Mar 2023 - Present');
    expect(lines[0].text).toContain('Role 0');
    expect(lines[0].column).toBe(0);
  });

  it('does not merge a label in a different font into the list above it', () => {
    const items = [
      ...row(100, [{ str: 'Node.js, Express, Python, PostgreSQL, MongoDB, Redis, GraphQL, REST APIs' }]),
      ...row(112, [{ str: 'DevOps & Tools' }]).map((i) => ({ ...i, fontName: 'bold' })),
    ];
    const lines = buildLayoutLines([page(items)]);
    expect(lines.map((l) => l.text)).toEqual([
      'Node.js, Express, Python, PostgreSQL, MongoDB, Redis, GraphQL, REST APIs',
      'DevOps & Tools',
    ]);
  });
});
