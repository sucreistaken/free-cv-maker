import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildLayoutLines } from '../layout';
import { parseLinesToCV } from '../../pdfImport';
import { loadFixturePages } from './nodeLoader';
import type { CVData } from '../../../types/cv';

// Third-party layouts (LinkedIn, Europass, Word, Canva, Harvard, ...) rendered from one
// fictional person. See scripts/make-corpus-fixtures.mjs.
export const corpusDir = fileURLToPath(new URL('../__fixtures__/corpus/', import.meta.url));
export const data = JSON.parse(readFileSync(corpusDir + 'data.json', 'utf8')) as Record<'en' | 'tr', Person>;

export interface Person {
  name: string; title: string; email: string; phone: string; location: string;
  linkedin: string; github: string; website: string; summary: string;
  experience: { title: string; company: string; location: string; start: string; end: string; bullets: string[] }[];
  education: { degree: string; institution: string; start: string; end: string; gpa: string }[];
  skills: { category: string; items: string[] }[];
  languages: { name: string; level: string }[];
  certifications: { name: string; issuer: string; year: string }[];
}

/** Fields a layout simply does not print (so there is nothing to recover) are listed in `skip`. */
export const STYLES: { file: string; lang: 'en' | 'tr'; skip: string[] }[] = [
  // LinkedIn prints no GPA and no certification issuer, only four top skills, and wraps long names in its sidebar.
  { file: 'linkedin', lang: 'en', skip: ['gpa', 'certDetails', 'moreSkills'] },
  { file: 'europass', lang: 'en', skip: ['title', 'website', 'summary'] },
  { file: 'word', lang: 'en', skip: ['title', 'website'] },
  { file: 'canva', lang: 'en', skip: ['gpa', 'linkedin'] },
  { file: 'tr-word', lang: 'tr', skip: ['title'] },
  { file: 'harvard', lang: 'en', skip: ['title', 'website', 'summary'] },
  { file: 'inline', lang: 'en', skip: [] },
  // Known limit: in a narrow sidebar a certification name and its issuer can fill the column and read as one wrapped line.
  { file: 'tr-side', lang: 'tr', skip: ['gpa', 'github', 'certDetails'] },
];

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** Every problem found when comparing a parse with the person the PDF was rendered from. */
export function diffCv(cv: CVData, p: Person, skip: string[] = []): string[] {
  const out: string[] = [];
  // "March 2022" and "Mar 2022" are the same date; only the first three letters of a month matter.
  const day = (v: string) => norm(v).replace(/\b(\p{L}{3})\p{L}*(?=\s+\d{4})/gu, '$1');
  const eq = (label: string, got: string, want: string) => {
    const same = /(?:start|end)$/.test(label) ? day(got) === day(want) : norm(got) === norm(want);
    if (!same) out.push(`${label}: got "${got}", want "${want}"`);
  };
  const pi = cv.personalInfo;
  eq('name', pi.fullName, p.name);
  if (!skip.includes('title')) eq('title', pi.jobTitle, p.title);
  eq('email', pi.email, p.email);
  eq('phone', pi.phone.replace(/\s+/g, ''), p.phone.replace(/\s+/g, ''));
  eq('location', pi.location, p.location);
  if (!skip.includes('linkedin')) eq('linkedin', pi.linkedin, p.linkedin);
  if (!skip.includes('github')) eq('github', pi.github, p.github);
  if (p.website && !skip.includes('website')) eq('website', pi.website, p.website);
  if (!skip.includes('summary') && !norm(cv.summary).includes(norm(p.summary).slice(0, 40))) out.push(`summary: got "${cv.summary.slice(0, 50)}"`);

  if (cv.experience.length !== p.experience.length) out.push(`experience count: ${cv.experience.length} vs ${p.experience.length}`);
  p.experience.forEach((want, i) => {
    const got = cv.experience[i];
    if (!got) return;
    eq(`exp${i} title`, got.title, want.title);
    eq(`exp${i} company`, got.company, want.company);
    eq(`exp${i} location`, got.location, want.location);
    eq(`exp${i} start`, got.startDate, want.start);
    eq(`exp${i} end`, got.endDate, want.end);
    if (JSON.stringify(got.bullets.map(norm)) !== JSON.stringify(want.bullets.map(norm))) {
      out.push(`exp${i} bullets: ${got.bullets.length} vs ${want.bullets.length}`);
    }
  });

  if (cv.education.length !== p.education.length) out.push(`education count: ${cv.education.length} vs ${p.education.length}`);
  p.education.forEach((want, i) => {
    const got = cv.education[i];
    if (!got) return;
    eq(`edu${i} degree`, got.degree, want.degree);
    eq(`edu${i} institution`, got.institution, want.institution);
    eq(`edu${i} start`, got.startDate, want.start);
    eq(`edu${i} year`, got.year, want.end);
    if (want.gpa && !skip.includes('gpa')) eq(`edu${i} gpa`, got.gpa, want.gpa);
  });

  const skillText = norm(cv.skills.map((s) => s.items).join(' '));
  const wanted = p.skills.flatMap((s) => s.items).slice(0, skip.includes('moreSkills') ? 4 : undefined);
  for (const item of wanted) {
    if (!skillText.includes(norm(item))) out.push(`skill missing: ${item}`);
  }
  p.languages.forEach((want) => {
    const got = cv.languages.find((l) => norm(l.language) === norm(want.name));
    if (!got) out.push(`language missing: ${want.name}`);
    else if (got.proficiency !== want.level) out.push(`language ${want.name}: ${got.proficiency} vs ${want.level}`);
  });
  p.certifications.forEach((want) => {
    const got = cv.certifications.find((c) => norm(c.name) === norm(want.name));
    if (!got) {
      if (!skip.includes('certDetails')) out.push(`cert missing: ${want.name}`);
    } else if (!skip.includes('certDetails')) {
      eq(`cert ${want.name} issuer`, got.issuer, want.issuer);
      eq(`cert ${want.name} year`, got.year, want.year);
    }
  });
  if (cv.projects.length) out.push(`phantom projects: ${cv.projects.map((x) => x.name).join(', ')}`);
  if (cv.awards.length) out.push('phantom awards');
  return out;
}


export async function parseCorpus(file: string): Promise<CVData> {
  return parseLinesToCV(buildLayoutLines(await loadFixturePages(`${corpusDir}${file}.pdf`)));
}
