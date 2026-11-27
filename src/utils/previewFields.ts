import type { CVData } from '../types/cv';

/** Where a piece of preview text lives in the CV data, so it can be edited in place. */
export interface PreviewField {
  /** Top-level CV key, also the section type (e.g. "experience"); "custom" for user-added sections. */
  key: string;
  /** Section id, set for user-added sections whose entries live on the section itself. */
  sectionId?: string;
  /** Entry id for list sections; absent for flat fields (summary, personalInfo). */
  entryId?: string;
  /** Property inside the entry or personalInfo; absent for summary and hobbies. */
  field?: string;
  /** Index inside a bullets array. */
  bulletIndex?: number;
  value: string;
  multiline: boolean;
}

const LIST_KEYS = ['experience', 'projects', 'education', 'involvement', 'skills', 'certifications', 'awards', 'references'] as const;

/** Entry properties that are never shown as plain editable text. */
const SKIPPED_FIELDS = new Set(['id', 'link', 'profilePhoto']);

/** Collapses whitespace and drops bold/italic markers so rendered text can be compared with raw values. */
export function normalizeForMatch(text: string): string {
  return text
    .replace(/^[•·\-•]\s*/, '')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** All editable text values of the CV, ordered like the visible sections. */
export function buildPreviewFields(cv: CVData): PreviewField[] {
  const out: PreviewField[] = [];
  for (const section of cv.sections.filter((s) => s.visible)) {
    const type: string = section.type;
    if (type === 'custom') {
      for (const entry of section.items ?? []) {
        for (const field of ['title', 'subtitle', 'startDate', 'endDate'] as const) {
          if (entry[field]) {
            out.push({ key: 'custom', sectionId: section.id, entryId: entry.id, field, value: entry[field], multiline: false });
          }
        }
        entry.bullets.forEach((b, i) => {
          if (b) out.push({ key: 'custom', sectionId: section.id, entryId: entry.id, field: 'bullets', bulletIndex: i, value: b, multiline: true });
        });
      }
    } else if (type === 'personalInfo') {
      for (const [field, value] of Object.entries(cv.personalInfo)) {
        if (SKIPPED_FIELDS.has(field) || typeof value !== 'string' || !value) continue;
        out.push({ key: 'personalInfo', field, value, multiline: false });
      }
    } else if (type === 'summary' && cv.summary) {
      out.push({ key: 'summary', value: cv.summary, multiline: true });
    } else if (type === 'hobbies' && cv.hobbies) {
      out.push({ key: 'hobbies', value: cv.hobbies, multiline: true });
    } else if ((LIST_KEYS as readonly string[]).includes(type)) {
      const entries = cv[type as (typeof LIST_KEYS)[number]] as unknown as Record<string, unknown>[];
      for (const entry of entries) {
        for (const [field, value] of Object.entries(entry)) {
          if (field === 'id' || SKIPPED_FIELDS.has(field)) continue;
          if (typeof value === 'string' && value) {
            out.push({ key: type, entryId: String(entry.id), field, value, multiline: field === 'description' || field === 'items' });
          } else if (field === 'bullets' && Array.isArray(value)) {
            value.forEach((b, i) => {
              if (typeof b === 'string' && b) {
                out.push({ key: type, entryId: String(entry.id), field, bulletIndex: i, value: b, multiline: true });
              }
            });
          }
        }
      }
    }
  }
  return out;
}

/** Candidates whose rendered text equals `text`, in section order. */
export function matchPreviewFields(fields: PreviewField[], text: string): PreviewField[] {
  const target = normalizeForMatch(text);
  if (!target) return [];
  return fields.filter((f) => normalizeForMatch(f.value) === target);
}
