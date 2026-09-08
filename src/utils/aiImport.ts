import { generateId } from './id';
import { buildSections } from './pdfImport';
import type {
  CVData,
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
} from '../types/cv';

export type AIParseFailureReason = 'empty' | 'no-json' | 'invalid-json' | 'not-cv-shaped';

export type AIParseResult = { ok: true; data: CVData } | { ok: false; reason: AIParseFailureReason };

const KNOWN_CV_KEYS = [
  'personalInfo', 'summary', 'experience', 'projects', 'education', 'involvement',
  'skills', 'certifications', 'languages', 'awards', 'hobbies', 'references',
];

const PROFICIENCY_VALUES = ['native', 'fluent', 'intermediate', 'beginner'] as const;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function strArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  if (typeof v === 'string' && v) return [v];
  return [];
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/** Char-by-char scan tracking string/escape state so braces inside string values don't corrupt depth. */
function findBalancedJsonObject(text: string, startIndex: number): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(startIndex, i + 1);
    }
  }
  return null;
}

export function extractJsonBlock(raw: string): string | null {
  const fenceMatches = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map((m) => m[1]);
  const candidates = fenceMatches.length > 0 ? fenceMatches : [raw];

  for (const candidate of candidates) {
    const start = candidate.indexOf('{');
    if (start === -1) continue;
    const block = findBalancedJsonObject(candidate, start);
    if (block) return block;
  }
  return null;
}

function looksLikeCVData(obj: Record<string, unknown>): boolean {
  if (obj.personalInfo !== undefined && !isObj(obj.personalInfo)) return false;
  return KNOWN_CV_KEYS.some((key) => obj[key] !== undefined);
}

function normalizePersonalInfo(v: unknown): PersonalInfo {
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
    profilePhoto: '',
  };
}

function normalizeExperience(v: unknown): ExperienceEntry[] {
  return arr(v).filter(isObj).map((o) => ({
    id: generateId(),
    title: str(o.title),
    company: str(o.company),
    link: str(o.link) || undefined,
    location: str(o.location),
    startDate: str(o.startDate),
    endDate: str(o.endDate),
    bullets: strArray(o.bullets),
  }));
}

function normalizeProjects(v: unknown): ProjectEntry[] {
  return arr(v).filter(isObj).map((o) => ({
    id: generateId(),
    name: str(o.name),
    link: str(o.link),
    date: str(o.date),
    bullets: strArray(o.bullets),
  }));
}

function normalizeEducation(v: unknown): EducationEntry[] {
  return arr(v).filter(isObj).map((o) => ({
    id: generateId(),
    degree: str(o.degree),
    institution: str(o.institution),
    startDate: str(o.startDate),
    year: str(o.year),
    gpa: str(o.gpa),
  }));
}

function normalizeInvolvement(v: unknown): InvolvementEntry[] {
  return arr(v).filter(isObj).map((o) => ({
    id: generateId(),
    role: str(o.role),
    organization: str(o.organization),
    institution: str(o.institution),
    startDate: str(o.startDate),
    endDate: str(o.endDate),
    bullets: strArray(o.bullets),
  }));
}

function normalizeSkills(v: unknown): SkillCategory[] {
  return arr(v).filter(isObj).map((o) => ({
    id: generateId(),
    category: str(o.category),
    items: Array.isArray(o.items) ? strArray(o.items).join(', ') : str(o.items),
  }));
}

function normalizeCertifications(v: unknown): CertificationEntry[] {
  return arr(v).filter(isObj).map((o) => ({
    id: generateId(),
    name: str(o.name),
    issuer: str(o.issuer),
    year: str(o.year),
    description: str(o.description),
  }));
}

function normalizeLanguages(v: unknown): LanguageEntry[] {
  return arr(v).filter(isObj).map((o) => {
    const proficiency = PROFICIENCY_VALUES.includes(o.proficiency as typeof PROFICIENCY_VALUES[number])
      ? (o.proficiency as LanguageEntry['proficiency'])
      : 'intermediate';
    return { id: generateId(), language: str(o.language), proficiency };
  });
}

function normalizeAwards(v: unknown): AwardEntry[] {
  return arr(v).filter(isObj).map((o) => ({
    id: generateId(),
    title: str(o.title),
    issuer: str(o.issuer),
    year: str(o.year),
    description: str(o.description),
  }));
}

function normalizeReferences(v: unknown): ReferenceEntry[] {
  return arr(v).filter(isObj).map((o) => ({
    id: generateId(),
    name: str(o.name),
    title: str(o.title),
    company: str(o.company),
    email: str(o.email),
    phone: str(o.phone),
  }));
}

function normalizeAIData(obj: Record<string, unknown>): CVData {
  const base: Omit<CVData, 'sections'> = {
    personalInfo: normalizePersonalInfo(obj.personalInfo),
    summary: str(obj.summary),
    experience: normalizeExperience(obj.experience),
    projects: normalizeProjects(obj.projects),
    education: normalizeEducation(obj.education),
    involvement: normalizeInvolvement(obj.involvement),
    skills: normalizeSkills(obj.skills),
    certifications: normalizeCertifications(obj.certifications),
    languages: normalizeLanguages(obj.languages),
    awards: normalizeAwards(obj.awards),
    hobbies: str(obj.hobbies),
    references: normalizeReferences(obj.references),
  };
  const withSections: CVData = { ...base, sections: [] };
  return { ...withSections, sections: buildSections(withSections) };
}

export function parseAIResponse(raw: string): AIParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };

  const block = extractJsonBlock(trimmed);
  if (!block) return { ok: false, reason: 'no-json' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(block);
  } catch {
    try {
      parsed = JSON.parse(block.replace(/,(\s*[}\]])/g, '$1'));
    } catch {
      return { ok: false, reason: 'invalid-json' };
    }
  }

  if (!isObj(parsed)) return { ok: false, reason: 'invalid-json' };

  const source = isObj(parsed.cvData) ? parsed.cvData : parsed;
  if (!looksLikeCVData(source)) return { ok: false, reason: 'not-cv-shaped' };

  return { ok: true, data: normalizeAIData(source) };
}

export function cvHasContent(cv: CVData): boolean {
  return (
    !!cv.personalInfo.fullName.trim() ||
    !!cv.summary.trim() ||
    cv.experience.length > 0 ||
    cv.projects.length > 0 ||
    cv.education.length > 0 ||
    cv.involvement.length > 0 ||
    cv.skills.length > 0 ||
    cv.certifications.length > 0 ||
    cv.languages.length > 0 ||
    cv.awards.length > 0 ||
    !!cv.hobbies.trim() ||
    cv.references.length > 0
  );
}
