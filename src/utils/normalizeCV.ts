import type {
  CVData,
  CVSection,
  SectionType,
  PersonalInfo,
  ExperienceEntry,
  ProjectEntry,
  EducationEntry,
  InvolvementEntry,
  SkillCategory,
  CertificationEntry,
  LanguageEntry,
  AwardEntry,
  ReferenceEntry,
  CustomEntry,
  CefrGrid,
  CefrLevel,
} from '../types/cv';
import { CEFR_SKILLS } from '../types/cv';
import { generateId } from './id';
import { buildSections, lookupProficiency } from './pdfImport';

/**
 * Coerces CV data from outside the editor (imported JSON files, data already
 * stored in a profile) into the exact shape the editor and templates read.
 *
 * Imported JSON is often hand-written or made by a chatbot with its own key
 * names (`name`/`level` instead of `language`/`proficiency`). Passing it through
 * as-is crashed the editor on the first string method call on a missing field.
 *
 * Well-formed data comes back deep-equal, ids included, so this is safe to run
 * on every load.
 */

const PROFICIENCY_VALUES: LanguageEntry['proficiency'][] = ['native', 'fluent', 'intermediate', 'beginner'];

const SECTION_TYPES: SectionType[] = [
  'personalInfo', 'summary', 'experience', 'projects', 'education', 'involvement',
  'skills', 'certifications', 'languages', 'awards', 'hobbies', 'references', 'custom',
];

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(...candidates: unknown[]): string {
  for (const v of candidates) {
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
  }
  return '';
}

function strArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  if (typeof v === 'string' && v) return [v];
  return [];
}

/** Maps every object in `v` (non-objects are dropped), giving each a unique string id. */
function entries<T>(v: unknown, build: (o: Obj) => Omit<T, 'id'>): T[] {
  const seen = new Set<string>();
  return (Array.isArray(v) ? v : []).filter(isObj).map((o) => {
    let id = typeof o.id === 'string' && o.id ? o.id : generateId();
    if (seen.has(id)) id = generateId();
    seen.add(id);
    return { id, ...build(o) } as T;
  });
}

function proficiency(o: Obj): LanguageEntry['proficiency'] {
  const value = o.proficiency ?? o.level;
  if (PROFICIENCY_VALUES.includes(value as LanguageEntry['proficiency'])) {
    return value as LanguageEntry['proficiency'];
  }
  return typeof value === 'string' ? lookupProficiency(value.trim()) : 'intermediate';
}

/** Reads a CEFR level loosely ("b1+", " C1 " both work); null when none is found. */
export function parseCefrLevel(v: unknown): CefrLevel | null {
  if (typeof v !== 'string') return null;
  const match = v.match(/[ABC][12]/i);
  return match ? (match[0].toUpperCase() as CefrLevel) : null;
}

/** A grid is only kept when every skill has a readable level; half a grid cannot be printed. */
function cefrGrid(v: unknown): CefrGrid | null {
  if (!isObj(v)) return null;
  const grid: Partial<CefrGrid> = {};
  for (const skill of CEFR_SKILLS) {
    const level = parseCefrLevel(v[skill]);
    if (!level) return null;
    grid[skill] = level;
  }
  return grid as CefrGrid;
}

/** Copies an optional string field only when the source has one, so old data stays deep-equal. */
function optionalStr<K extends string>(o: Obj, key: K): { [P in K]?: string } {
  return (typeof o[key] === 'string' ? { [key]: o[key] } : {}) as { [P in K]?: string };
}

function personalInfo(v: unknown): PersonalInfo {
  const o = isObj(v) ? v : {};
  return {
    fullName: str(o.fullName),
    jobTitle: str(o.jobTitle),
    location: str(o.location),
    email: str(o.email),
    phone: str(o.phone),
    linkedin: str(o.linkedin),
    github: str(o.github),
    website: str(o.website),
    nationality: str(o.nationality),
    drivingLicense: str(o.drivingLicense),
    birthDate: str(o.birthDate),
    profilePhoto: str(o.profilePhoto),
    ...optionalStr(o, 'gender'),
  };
}

function sections(v: unknown, cv: Omit<CVData, 'sections'>): CVSection[] {
  const valid = (Array.isArray(v) ? v : []).filter(
    (s): s is Obj => isObj(s) && SECTION_TYPES.includes(s.type as SectionType),
  );
  if (valid.length === 0) return buildSections({ ...cv, sections: [] });
  return entries<CVSection>(valid, (s) => ({
    type: s.type as SectionType,
    title: str(s.title),
    visible: s.visible !== false,
    ...(s.type === 'custom'
      ? {
          items: entries<CustomEntry>(s.items, (e) => ({
            title: str(e.title, e.name),
            subtitle: str(e.subtitle),
            startDate: str(e.startDate, e.date),
            endDate: str(e.endDate),
            bullets: strArray(e.bullets),
          })),
        }
      : {}),
  }));
}

export function normalizeCVData(raw: unknown): CVData {
  const o = isObj(raw) ? raw : {};
  const cv: Omit<CVData, 'sections'> = {
    personalInfo: personalInfo(o.personalInfo),
    summary: str(o.summary),
    experience: entries<ExperienceEntry>(o.experience, (e) => ({
      title: str(e.title),
      company: str(e.company),
      ...(typeof e.link === 'string' ? { link: e.link } : {}),
      location: str(e.location),
      startDate: str(e.startDate),
      endDate: str(e.endDate),
      bullets: strArray(e.bullets),
    })),
    projects: entries<ProjectEntry>(o.projects, (e) => ({
      name: str(e.name),
      link: str(e.link),
      date: str(e.date),
      bullets: strArray(e.bullets),
    })),
    education: entries<EducationEntry>(o.education, (e) => ({
      degree: str(e.degree),
      institution: str(e.institution),
      startDate: str(e.startDate),
      year: str(e.year),
      gpa: str(e.gpa),
      ...optionalStr(e, 'location'),
      ...optionalStr(e, 'website'),
    })),
    involvement: entries<InvolvementEntry>(o.involvement, (e) => ({
      role: str(e.role),
      organization: str(e.organization),
      institution: str(e.institution),
      startDate: str(e.startDate),
      endDate: str(e.endDate),
      bullets: strArray(e.bullets),
    })),
    skills: entries<SkillCategory>(o.skills, (e) => ({
      category: str(e.category),
      items: Array.isArray(e.items) ? strArray(e.items).join(', ') : str(e.items),
    })),
    certifications: entries<CertificationEntry>(o.certifications, (e) => ({
      name: str(e.name),
      issuer: str(e.issuer),
      year: str(e.year),
      description: str(e.description),
    })),
    languages: entries<LanguageEntry>(o.languages, (e) => {
      const cefr = cefrGrid(e.cefr);
      return {
        language: str(e.language, e.name),
        proficiency: proficiency(e),
        ...(typeof e.isNative === 'boolean' ? { isNative: e.isNative } : {}),
        ...(cefr ? { cefr } : {}),
      };
    }),
    awards: entries<AwardEntry>(o.awards, (e) => ({
      title: str(e.title, e.name),
      issuer: str(e.issuer),
      year: str(e.year),
      description: str(e.description),
    })),
    hobbies: Array.isArray(o.hobbies) ? strArray(o.hobbies).join(', ') : str(o.hobbies),
    references: entries<ReferenceEntry>(o.references, (e) => ({
      name: str(e.name),
      title: str(e.title),
      company: str(e.company, e.organization),
      email: str(e.email),
      phone: str(e.phone),
    })),
  };
  return { ...cv, sections: sections(o.sections, cv) };
}
