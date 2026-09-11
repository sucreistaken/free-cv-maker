// Pure layout reconstruction for PDF text items: groups glyph runs into lines,
// detects a two-column layout per page, joins runs into readable text, and
// merges wrapped continuation lines back into their bullet or paragraph.
// No pdfjs or DOM dependency so it can run in Node tests.

export interface PdfTextItem {
  str: string;
  /** Left edge in PDF points, from the left of the page. */
  x: number;
  /** Baseline in PDF points, measured from the TOP of the page. */
  y: number;
  width: number;
  fontSize: number;
  fontName: string;
}

export interface PdfPage {
  width: number;
  height: number;
  items: PdfTextItem[];
}

export interface LayoutLine {
  text: string;
  page: number;
  /** 0 = single/full-width or left column, 1 = right column. */
  column: number;
  /** Left edge of the first visible glyph run. */
  x: number;
  /** Left edge of the text after a bullet marker (equals x for non-bullets). */
  textX: number;
  /** Right edge of the last visible glyph run. */
  right: number;
  y: number;
  fontSize: number;
  isBullet: boolean;
  /** True when visible runs are separated by a gap wider than 3 em (e.g. a right-aligned date). */
  hasWideGap: boolean;
}

export const BULLET_RE = /^[•\-*◦▪●‣⁃➢–—]\s*/;

/** Lowercases text so that Turkish dotted/dotless I variants all become plain "i". */
export function foldTurkish(text: string): string {
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/̇/g, '')
    .toLowerCase();
}

interface RawLine {
  y: number;
  fontSize: number;
  items: PdfTextItem[];
}

// ── Line grouping ──

function groupIntoRawLines(items: PdfTextItem[]): RawLine[] {
  const lines: RawLine[] = [];

  for (const item of items) {
    if (item.str.length === 0) continue;
    const threshold = Math.max(item.fontSize * 0.5, 2);
    let best: RawLine | null = null;
    let bestDist = Infinity;
    for (const line of lines) {
      const dist = Math.abs(line.y - item.y);
      if (dist < threshold && dist < bestDist) {
        best = line;
        bestDist = dist;
      }
    }
    if (best) {
      best.items.push(item);
      if (item.str.trim() && item.fontSize > best.fontSize) best.fontSize = item.fontSize;
    } else {
      lines.push({ y: item.y, fontSize: item.str.trim() ? item.fontSize : 0, items: [item] });
    }
  }

  for (const line of lines) line.items.sort((a, b) => a.x - b.x);
  lines.sort((a, b) => a.y - b.y);
  return lines;
}

// ── Column detection ──

interface Gutter {
  start: number;
  end: number;
}

/** Horizontal spans of ink on a line, with word gaps bridged. */
function inkSpans(line: RawLine): [number, number][] {
  const spans: [number, number][] = [];
  for (const item of line.items) {
    if (!item.str.trim()) continue;
    const start = item.x;
    const end = item.x + item.width;
    const bridge = Math.max(item.fontSize, 4) * 0.8;
    const last = spans[spans.length - 1];
    if (last && start - last[1] <= bridge) {
      last[1] = Math.max(last[1], end);
    } else {
      spans.push([start, end]);
    }
  }
  return spans;
}

const GUTTER_MIN_WIDTH = 8;
const GUTTER_MAX_COVERAGE = 0.12;
const GUTTER_MIN_LINES_PER_SIDE = 5;

function detectGutter(lines: RawLine[], pageWidth: number): Gutter | null {
  const inked = lines.filter((l) => l.items.some((i) => i.str.trim()));
  if (inked.length < GUTTER_MIN_LINES_PER_SIDE * 2) return null;

  const bins = Math.ceil(pageWidth);
  const coverage = new Array<number>(bins).fill(0);
  for (const line of inked) {
    for (const [s, e] of inkSpans(line)) {
      const from = Math.max(0, Math.floor(s));
      const to = Math.min(bins - 1, Math.ceil(e));
      for (let b = from; b <= to; b++) coverage[b]++;
    }
  }

  const maxCovered = inked.length * GUTTER_MAX_COVERAGE;
  const lo = Math.floor(pageWidth * 0.2);
  const hi = Math.ceil(pageWidth * 0.8);
  let best: Gutter | null = null;
  let runStart = -1;
  for (let b = lo; b <= hi + 1; b++) {
    const free = b <= hi && coverage[b] <= maxCovered;
    if (free && runStart === -1) runStart = b;
    if (!free && runStart !== -1) {
      const width = b - runStart;
      if (width >= GUTTER_MIN_WIDTH && (!best || width > best.end - best.start)) {
        best = { start: runStart, end: b };
      }
      runStart = -1;
    }
  }
  if (!best) return null;

  // Both sides must carry real text, otherwise this is just a wide margin.
  let leftLines = 0;
  let rightLines = 0;
  for (const line of inked) {
    const spans = inkSpans(line);
    if (spans.some(([, e]) => e <= best!.start + 1)) leftLines++;
    if (spans.some(([s]) => s >= best!.end - 1)) rightLines++;
  }
  if (leftLines < GUTTER_MIN_LINES_PER_SIDE || rightLines < GUTTER_MIN_LINES_PER_SIDE) return null;
  return best;
}

// ── Text joining ──

const JOIN_GAP_RATIO = 0.12;

interface JoinedText {
  text: string;
  x: number;
  textX: number;
  right: number;
  hasWideGap: boolean;
}

function joinItems(items: PdfTextItem[]): JoinedText {
  let text = '';
  let prevEnd: number | null = null;
  let prevVisibleEnd: number | null = null;
  let x: number | null = null;
  let right = 0;
  let hasWideGap = false;
  const runs: { offset: number; item: PdfTextItem }[] = [];

  for (const item of items) {
    if (!item.str.trim()) {
      if (text && !text.endsWith(' ')) text += ' ';
      prevEnd = item.x + item.width;
      continue;
    }
    if (x === null) x = item.x;
    if (prevEnd !== null && text && !text.endsWith(' ')) {
      const gap = item.x - prevEnd;
      if (gap > item.fontSize * JOIN_GAP_RATIO) text += ' ';
    }
    if (prevVisibleEnd !== null && item.x - prevVisibleEnd > item.fontSize * 3) hasWideGap = true;
    runs.push({ offset: text.length, item });
    text += item.str;
    prevEnd = item.x + item.width;
    prevVisibleEnd = prevEnd;
    right = Math.max(right, prevEnd);
  }

  const trimmed = text.trim();
  let textX = x ?? 0;
  const marker = trimmed.match(BULLET_RE);
  if (marker && trimmed.length > marker[0].length) {
    // Left edge of the first glyph after the bullet marker.
    const markerEnd = (text.length - text.trimStart().length) + marker[0].length;
    const run = runs.find((r) => r.offset + r.item.str.length > markerEnd);
    if (run) {
      const into = Math.max(0, markerEnd - run.offset);
      const perChar = run.item.str.length > 0 ? run.item.width / run.item.str.length : 0;
      textX = run.item.x + into * perChar;
    }
  }
  return { text: trimmed, x: x ?? 0, textX, right, hasWideGap };
}

// ── Continuation merging ──

const CONTINUATION_X_TOLERANCE = 2.5;

function isAllCapsText(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, '');
  return letters.length >= 3 && letters === letters.toUpperCase();
}

/** Did `prev` wrap because it ran into the column edge? */
function fillsColumn(prev: LayoutLine, columnRight: number): boolean {
  return !prev.hasWideGap && columnRight - prev.right < prev.fontSize * 2.5;
}

function shouldMerge(prev: LayoutLine, next: LayoutLine, columnRight: number): boolean {
  if (prev.page !== next.page || prev.column !== next.column) return false;
  if (next.isBullet) return false;
  if (Math.abs(prev.fontSize - next.fontSize) > 0.3) return false;
  if (prev.isBullet) {
    return Math.abs(next.x - prev.textX) < CONTINUATION_X_TOLERANCE;
  }
  if (Math.abs(next.x - prev.x) >= CONTINUATION_X_TOLERANCE) return false;
  if (/[,\-–]$/.test(prev.text)) return true;
  if (/[.:;!?]$/.test(prev.text)) return false;
  if (/^[\p{Ll}]/u.test(next.text)) return true;
  return fillsColumn(prev, columnRight) && !isAllCapsText(next.text) && !isAllCapsText(prev.text);
}

function mergeContinuations(lines: LayoutLine[]): LayoutLine[] {
  const columnRight = new Map<string, number>();
  for (const line of lines) {
    const key = `${line.page}:${line.column}`;
    columnRight.set(key, Math.max(columnRight.get(key) ?? 0, line.right));
  }

  const out: LayoutLine[] = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (prev && shouldMerge(prev, line, columnRight.get(`${line.page}:${line.column}`) ?? 0)) {
      prev.text = `${prev.text} ${line.text}`;
      // The merged line now ends where the last wrapped piece ends.
      prev.right = line.right;
      prev.hasWideGap = line.hasWideGap;
    } else {
      out.push({ ...line });
    }
  }
  return out;
}

// ── Page assembly ──

function makeLine(items: PdfTextItem[], page: number, column: number, y: number, fontSize: number): LayoutLine | null {
  const joined = joinItems(items);
  if (!joined.text) return null;
  const isBullet = BULLET_RE.test(joined.text) && joined.text.replace(BULLET_RE, '').length > 0;
  return {
    text: joined.text,
    page,
    column,
    x: joined.x,
    textX: joined.textX,
    right: joined.right,
    y,
    fontSize,
    isBullet,
    hasWideGap: joined.hasWideGap,
  };
}

function layoutPage(page: PdfPage, pageIndex: number): LayoutLine[] {
  const rawLines = groupIntoRawLines(page.items);
  const gutter = detectGutter(rawLines, page.width);
  const out: LayoutLine[] = [];

  if (!gutter) {
    for (const raw of rawLines) {
      const line = makeLine(raw.items, pageIndex, 0, raw.y, raw.fontSize);
      if (line) out.push(line);
    }
    return out;
  }

  let left: LayoutLine[] = [];
  let right: LayoutLine[] = [];
  const flush = () => {
    out.push(...left, ...right);
    left = [];
    right = [];
  };

  for (const raw of rawLines) {
    const spansGutter = raw.items.some(
      (i) => i.str.trim() && i.x < gutter.start - 2 && i.x + i.width > gutter.end + 2,
    );
    if (spansGutter) {
      flush();
      const line = makeLine(raw.items, pageIndex, 0, raw.y, raw.fontSize);
      if (line) out.push(line);
      continue;
    }
    const mid = (gutter.start + gutter.end) / 2;
    const leftItems = raw.items.filter((i) => i.x + i.width / 2 < mid);
    const rightItems = raw.items.filter((i) => i.x + i.width / 2 >= mid);
    const fontOf = (items: PdfTextItem[]) =>
      items.reduce((m, i) => (i.str.trim() ? Math.max(m, i.fontSize) : m), 0);
    const l = makeLine(leftItems, pageIndex, 0, raw.y, fontOf(leftItems));
    const r = makeLine(rightItems, pageIndex, 1, raw.y, fontOf(rightItems));
    if (l) left.push(l);
    if (r) right.push(r);
  }
  flush();
  return out;
}

/** Turns per-page glyph runs into ordered, column-aware, continuation-merged lines. */
export function buildLayoutLines(pages: PdfPage[]): LayoutLine[] {
  const lines: LayoutLine[] = [];
  pages.forEach((page, index) => lines.push(...layoutPage(page, index)));
  return mergeContinuations(lines);
}
