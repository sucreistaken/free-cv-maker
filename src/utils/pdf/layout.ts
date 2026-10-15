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
  /** Font that carries most of the line's characters; label/value lines differ in weight. */
  fontName: string;
  /** True for a full-width line on a two-column page (header, contact bar). */
  spanning?: boolean;
  /** Character offset in `text` of the first wide gap (a label/value or tab column), if any. */
  gapAt?: number;
}

/** Month names and abbreviations (English and Turkish) as a regex source; shared with the parser. */
export const MONTH_PATTERN =
  '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık|Oca|Şub|Nis|May|Haz|Tem|Ağu|Eyl|Eki|Kas|Ara)';

export const BULLET_RE = /^[•\-*◦▪●‣⁃➢–—▸▶►▹▷○◆◇■□✓✔➤➔★✦❖\uF000-\uF8FF]\s*/u;

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
  const lo = Math.floor(pageWidth * 0.1);
  const hi = Math.ceil(pageWidth * 0.8);
  const runs: Gutter[] = [];
  let runStart = -1;
  for (let b = lo; b <= hi + 1; b++) {
    const free = b <= hi && coverage[b] <= maxCovered;
    if (free && runStart === -1) runStart = b;
    if (!free && runStart !== -1) {
      if (b - runStart >= GUTTER_MIN_WIDTH) runs.push({ start: runStart, end: b });
      runStart = -1;
    }
  }

  // The widest free strip is often just the right margin, so take the widest one that
  // has real text on both sides.
  const spans = inked.map(inkSpans);
  runs.sort((a, b) => b.end - b.start - (a.end - a.start));
  for (const run of runs) {
    let leftLines = 0;
    let rightLines = 0;
    for (const lineSpans of spans) {
      if (lineSpans.some(([, e]) => e <= run.start + 1)) leftLines++;
      if (lineSpans.some(([s]) => s >= run.end - 1)) rightLines++;
    }
    if (leftLines >= GUTTER_MIN_LINES_PER_SIDE && rightLines >= GUTTER_MIN_LINES_PER_SIDE) return run;
  }
  return null;
}

// ── Text joining ──

const JOIN_GAP_RATIO = 0.12;

interface JoinedText {
  text: string;
  x: number;
  textX: number;
  right: number;
  hasWideGap: boolean;
  fontName: string;
  gapAt?: number;
}

/**
 * Letter-spaced runs ("A L E X", from CSS letter-spacing) arrive with a space between
 * every glyph. Word breaks are separate whitespace items, so inside a run the spaces go.
 */
function collapseLetterSpacing(str: string): string {
  return /^\S( \S){2,}$/u.test(str) ? str.replace(/ /g, '') : str;
}

function dominantFont(items: PdfTextItem[]): string {
  const weight = new Map<string, number>();
  for (const item of items) {
    const chars = item.str.trim().length;
    if (chars) weight.set(item.fontName, (weight.get(item.fontName) ?? 0) + chars);
  }
  let best = '';
  let bestWeight = 0;
  for (const [font, w] of weight) {
    if (w > bestWeight) {
      best = font;
      bestWeight = w;
    }
  }
  return best;
}

function joinItems(rawItems: PdfTextItem[]): JoinedText {
  const items = rawItems.map((item) => ({ ...item, str: collapseLetterSpacing(item.str) }));
  let text = '';
  let prevEnd: number | null = null;
  let prevVisibleEnd: number | null = null;
  let x: number | null = null;
  let right = 0;
  let hasWideGap = false;
  let gapAt: number | undefined;
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
    if (prevVisibleEnd !== null && item.x - prevVisibleEnd > item.fontSize * 3) {
      hasWideGap = true;
      if (gapAt === undefined) gapAt = text.length;
    }
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
  return { text: trimmed, x: x ?? 0, textX, right, hasWideGap, fontName: dominantFont(items), gapAt };
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

const CONTACT_LINE_RE = /@|\bwww\.|https?:\/\/|\b[\w-]+\.(?:com|org|net|dev|io|co|tr|app)\b/i;

/** A short line carrying an email or URL is a contact entry, not a wrapped sentence. */
function isContactLine(text: string): boolean {
  return text.length <= 60 && CONTACT_LINE_RE.test(text);
}

function shouldMerge(prev: LayoutLine, next: LayoutLine, columnRight: number): boolean {
  if (prev.page !== next.page || prev.column !== next.column) return false;
  // A line that opens with an email or URL (or a short one made of it) is a contact entry, never a wrapped sentence.
  if (isContactLine(prev.text) || CONTACT_LINE_RE.test(next.text.slice(0, 40))) return false;
  // A full-width paragraph may wrap onto another full-width line, but never into a column line.
  if (Boolean(prev.spanning) !== Boolean(next.spanning)) return false;
  if (next.isBullet) return false;
  if (Math.abs(prev.fontSize - next.fontSize) > 0.3) return false;
  if (prev.isBullet) {
    return Math.abs(next.x - prev.textX) < CONTINUATION_X_TOLERANCE;
  }
  if (Math.abs(next.x - prev.x) >= CONTINUATION_X_TOLERANCE) return false;
  // A label in a different weight ("DevOps & Tools" under a list of items) starts a new line.
  if (prev.fontName && next.fontName && prev.fontName !== next.fontName) return false;
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
    fontName: joined.fontName,
    gapAt: joined.gapAt,
  };
}

const DATE_PART = '(?:[\\p{L}.]{3,9}\\s+)?(?:19|20)\\d{2}';
const DATE_ONLY_RE = new RegExp(`^${DATE_PART}(?:\\s*[-–—]\\s*(?:${DATE_PART}|\\p{L}+))?$`, 'u');

/**
 * Timeline layouts print dates in a narrow rail left of the content. That rail is not
 * a column of its own: its dates belong to the entries beside them, so the page is
 * read as a single column.
 */
function isDateRail(rawLines: RawLine[], gutter: Gutter): boolean {
  const mid = (gutter.start + gutter.end) / 2;
  let leftCount = 0;
  let dateCount = 0;
  for (const raw of rawLines) {
    const text = joinItems(raw.items.filter((i) => i.x + i.width / 2 < mid)).text;
    // Section headings sit at the left edge too but are not part of the rail.
    if (!text || isAllCapsText(text)) continue;
    leftCount++;
    if (DATE_ONLY_RE.test(text)) dateCount++;
  }
  return dateCount >= 3 && dateCount / leftCount >= 0.4;
}

/**
 * Dates and places pushed to the right margin ("Company ........ Mar 2022 - Present") look
 * like a second column to the gutter search. They are right-aligned (ragged left edge), sit
 * on the same baseline as left text and are short, unlike a real column of flowing text.
 */
function isRightAlignedTabColumn(rawLines: RawLine[], gutter: Gutter): boolean {
  const mid = (gutter.start + gutter.end) / 2;
  const rights: number[] = [];
  const lefts: number[] = [];
  let withLeftText = 0;
  let chars = 0;
  for (const raw of rawLines) {
    const rightItems = raw.items.filter((i) => i.str.trim() && i.x + i.width / 2 >= mid);
    if (rightItems.length === 0) continue;
    rights.push(Math.max(...rightItems.map((i) => i.x + i.width)));
    lefts.push(Math.min(...rightItems.map((i) => i.x)));
    chars += rightItems.reduce((n, i) => n + i.str.trim().length, 0);
    if (raw.items.some((i) => i.str.trim() && i.x + i.width / 2 < mid)) withLeftText++;
  }
  if (rights.length < 3) return false;
  const sorted = [...rights].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const aligned = rights.filter((r) => Math.abs(r - median) <= 3).length;
  const ragged = Math.max(...lefts) - Math.min(...lefts) > 6;
  return (
    withLeftText / rights.length >= 0.8 &&
    aligned / rights.length >= 0.8 &&
    ragged &&
    chars / rights.length <= 32
  );
}

function layoutPage(page: PdfPage, pageIndex: number): LayoutLine[] {
  const rawLines = groupIntoRawLines(page.items);
  let gutter = detectGutter(rawLines, page.width);
  if (gutter && (isDateRail(rawLines, gutter) || isRightAlignedTabColumn(rawLines, gutter))) gutter = null;
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
    // The column that holds the biggest text (the name) is the main one and is read first,
    // even when a sidebar sits on its left.
    const biggest = (lines: LayoutLine[]) => lines.reduce((m, l) => Math.max(m, l.fontSize), 0);
    if (biggest(right) > biggest(left) + 0.5) out.push(...right, ...left);
    else out.push(...left, ...right);
    left = [];
    right = [];
  };

  for (const raw of rawLines) {
    // A line whose ink runs unbroken across the gutter (a full-width contact bar) is not two columns.
    const spansGutter = inkSpans(raw).some(([s, e]) => s < gutter.start - 2 && e > gutter.end + 2);
    if (spansGutter) {
      flush();
      const line = makeLine(raw.items, pageIndex, 0, raw.y, raw.fontSize);
      if (line) out.push({ ...line, spanning: true });
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

const OPEN_END_START = '(?:Devam|Şu|Present|Current)';
/** A date range cut off by a narrow date column: "Jun 2019 - Feb" + "2022 Company ...". */
const DANGLING_DATE_RE = new RegExp(
  `^(.*?(?:${MONTH_PATTERN}\\.?\\s*)?(?:19|20)\\d{2}\\s*[-–—]\\s*(?:${MONTH_PATTERN}\\.?|${OPEN_END_START}))(?:\\s+(.*))?$`,
  'iu',
);
const YEAR_START_RE = /^((?:19|20)\d{2})(?:\s+(.*))?$/u;
const OPEN_END_TAIL_RE = /^(Ediyor|an)(?:\s+(.*))?$/iu;

/** Moves the second half of a wrapped date range back onto the line it belongs to. */
function repairSplitDates(lines: LayoutLine[]): LayoutLine[] {
  const out = lines.map((l) => ({ ...l }));
  for (let i = 0; i + 1 < out.length; i++) {
    const prev = out[i];
    const next = out[i + 1];
    if (prev.page !== next.page || prev.column !== next.column || Math.abs(prev.y - next.y) > prev.fontSize * 2.6) continue;
    const head = prev.text.match(DANGLING_DATE_RE);
    if (!head) continue;
    const openEnd = /(?:Devam|Şu|Present|Current)$/i.test(head[1]);
    const tail = (openEnd ? next.text.match(OPEN_END_TAIL_RE) : next.text.match(YEAR_START_RE));
    if (!tail) continue;
    const moved = tail[1];
    const nextBefore = next.text.length;
    prev.text = `${head[1]} ${moved}${head[2] ? ` ${head[2]}` : ''}`.trim();
    next.text = (tail[2] ?? '').trim();
    // Keep the wide-gap offsets pointing at the same characters after the text moved.
    if (prev.gapAt !== undefined && prev.gapAt >= head[1].length) prev.gapAt += moved.length + 1;
    if (next.gapAt !== undefined) {
      const removed = nextBefore - next.text.length;
      next.gapAt = next.gapAt >= removed ? next.gapAt - removed : undefined;
    }
  }
  return out.filter((l) => l.text);
}

/**
 * Some producers draw bullets as shapes, so the text has no marker. When the document has no
 * marked bullets at all, a repeated indent inside a column is read as a bullet list.
 */
function inferIndentBullets(lines: LayoutLine[]): LayoutLine[] {
  if (lines.some((l) => l.isBullet)) return lines;
  const out = lines.map((l) => ({ ...l }));
  const groups = new Map<string, LayoutLine[]>();
  for (const line of out) {
    if (line.spanning) continue;
    const key = `${line.page}:${line.column}`;
    groups.set(key, [...(groups.get(key) ?? []), line]);
  }
  for (const group of groups.values()) {
    const counts = new Map<number, number>();
    for (const l of group) counts.set(Math.round(l.x), (counts.get(Math.round(l.x)) ?? 0) + 1);
    // A bullet indent is an x used by several lines that sits a little to the right of
    // another x used by header lines (a parent level).
    const indentX = [...counts.entries()]
      .filter(([x, n]) => n >= 3 && [...counts.entries()].some(([px, pn]) => pn >= 2 && x - px >= 5 && x - px <= 40))
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    if (indentX === undefined) continue;
    for (const l of group) {
      if (Math.abs(l.x - indentX) > 1.5 || isAllCapsText(l.text) || CONTACT_LINE_RE.test(l.text)) continue;
      l.text = `• ${l.text}`;
      if (l.gapAt !== undefined) l.gapAt += 2;
      l.isBullet = true;
      l.textX = l.x;
    }
  }
  return out;
}

/** Turns per-page glyph runs into ordered, column-aware, continuation-merged lines. */
export function buildLayoutLines(pages: PdfPage[]): LayoutLine[] {
  const lines: LayoutLine[] = [];
  pages.forEach((page, index) => lines.push(...layoutPage(page, index)));
  return inferIndentBullets(mergeContinuations(repairSplitDates(lines)));
}
