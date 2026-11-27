import type { CVSection, CustomEntry, InvolvementEntry, SectionType } from '../types/cv';
import en from '../i18n/en.json';
import tr from '../i18n/tr.json';
import { generateId } from './id';

/** Longest section name the editor accepts; longer headings break most template layouts. */
export const SECTION_TITLE_MAX = 40;

const DEFAULT_TITLES: Record<string, string[]> = {};
for (const bundle of [en.sections, tr.sections] as Record<string, string>[]) {
  for (const [type, title] of Object.entries(bundle)) {
    (DEFAULT_TITLES[type] ??= []).push(title);
  }
}

/** Case- and Turkish-i-insensitive form used to compare section names. */
function fold(value: string): string {
  return value.trim().toLocaleLowerCase('tr').replace(/̇/g, '').replace(/ı/g, 'i');
}

/**
 * True when `title` is still a stock name for `type` (in any UI language) or empty,
 * i.e. the user never renamed the section. Stock names follow the UI language;
 * names the user typed are kept as written.
 */
export function isDefaultSectionTitle(type: SectionType, title: string): boolean {
  if (!title.trim()) return true;
  const folded = fold(title);
  return (DEFAULT_TITLES[type] ?? []).some((stock) => fold(stock) === folded);
}

/** Gives every section that still has a stock name the stock name of the new language. */
export function localizeSectionTitles(sections: CVSection[], stockTitle: (type: SectionType) => string): CVSection[] {
  return sections.map((s) => (isDefaultSectionTitle(s.type, s.title) ? { ...s, title: stockTitle(s.type) || s.title } : s));
}

/**
 * Upper-cases the first letter of every word. Unicode-aware: `\b\w` treats Turkish
 * letters as word breaks and turned "gönüllülük" into "GöNüLlüLüK".
 */
export function capitalizeWords(title: string, locale: string): string {
  return title.replace(/(^|[\s(/-])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toLocaleUpperCase(locale));
}

/** Cleans a name typed by the user; an empty name falls back to the stock name. */
export function cleanSectionTitle(raw: string, stock: string): string {
  const title = raw.replace(/\s+/g, ' ').trim().slice(0, SECTION_TITLE_MAX);
  return title || stock;
}

export function createCustomEntry(): CustomEntry {
  return { id: generateId(), title: '', subtitle: '', startDate: '', endDate: '', bullets: [''] };
}

export function createCustomSection(title: string): CVSection {
  return { id: generateId(), type: 'custom', title, visible: true, items: [createCustomEntry()] };
}

function hasContent(e: CustomEntry): boolean {
  return Boolean(e.title.trim() || e.subtitle.trim() || e.startDate.trim() || e.endDate.trim() || e.bullets.some((b) => b.trim()));
}

/**
 * Custom entries in the shape templates already print for "Involvement" (bold title,
 * dates on the right, a subtitle line, bullets), so every template shows them in its
 * own style. Blank entries are dropped, so a new, empty section stays off the CV.
 */
export function customItemsAsInvolvement(items: CustomEntry[] | undefined): InvolvementEntry[] {
  return (items ?? []).filter(hasContent).map((e) => ({
    id: e.id,
    role: e.title,
    institution: e.subtitle,
    organization: '',
    startDate: e.startDate,
    endDate: e.endDate,
    bullets: e.bullets,
  }));
}
