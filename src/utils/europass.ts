import type { CefrGrid, CefrLevel, CefrSkill, LanguageEntry } from '../types/cv';
import { CEFR_SKILLS } from '../types/cv';

/** Pure helpers for the Europass template: how free text in CVData becomes Europass blocks. */

export interface HobbyGroup {
  /** Group heading such as "Sport"; empty for lines written before the first heading. */
  title: string;
  items: string[];
}

/** Splits "a, b (c, d), e" into items, ignoring commas inside parentheses. */
export function splitListItems(text: string): string[] {
  const items: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      items.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  items.push(current);
  return items.map((s) => s.trim()).filter(Boolean);
}

const BULLET_PREFIX = /^(?:[-•·]\s*|\*\s+)/; // "* " only, so *italic* markers survive
/** Contract: a group heading is "# " plus text; "#1 ..." is an ordinary item. */
const GROUP_HEADING = /^#\s/;

/**
 * Hobbies are stored as one string: one item per line, and a line starting with
 * "# " opens a group. A single line without headings is the older comma format.
 */
export function parseHobbies(text: string): HobbyGroup[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  if (lines.length === 1 && !GROUP_HEADING.test(lines[0])) {
    const items = splitListItems(lines[0].replace(BULLET_PREFIX, ''));
    return items.length ? [{ title: '', items }] : [];
  }

  const groups: HobbyGroup[] = [];
  for (const line of lines) {
    if (GROUP_HEADING.test(line)) {
      groups.push({ title: line.replace(GROUP_HEADING, '').trim(), items: [] });
      continue;
    }
    const item = line.replace(BULLET_PREFIX, '').trim();
    if (!item) continue;
    if (groups.length === 0) groups.push({ title: '', items: [] });
    groups[groups.length - 1].items.push(item);
  }
  return groups;
}

/** An explicit flag wins; without one, the proficiency "native" marks a mother tongue. */
export function isNativeLanguage(entry: LanguageEntry): boolean {
  return entry.isNative ?? entry.proficiency === 'native';
}

/**
 * Level printed for a language under "Weitere Sprache(n)". Such a language is not a
 * mother tongue (isNative false), so a stray "native" proficiency reads as fluent.
 */
export function otherLanguageLevel(entry: LanguageEntry): Exclude<LanguageEntry['proficiency'], 'native'> {
  return entry.proficiency === 'native' ? 'fluent' : entry.proficiency;
}

/** "start – end" with an en dash, or whichever end exists. */
export function formatDateRange(start?: string, end?: string): string {
  const a = start?.trim() ?? '';
  const b = end?.trim() ?? '';
  if (a && b) return `${a} – ${b}`;
  return a || b;
}

/**
 * Editor rule for the CEFR grid: the first level picked on an empty grid fills all
 * five skills (most students have even levels), a cleared level removes the grid
 * (a half grid cannot be printed).
 */
export function setCefrLevel(grid: CefrGrid | undefined, skill: CefrSkill, level: CefrLevel | ''): CefrGrid | undefined {
  if (!level) return undefined;
  if (!grid) return Object.fromEntries(CEFR_SKILLS.map((s) => [s, level])) as CefrGrid;
  return { ...grid, [skill]: level };
}
