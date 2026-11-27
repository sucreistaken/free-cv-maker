import type {
  CVData,
  CVSection,
  CustomEntry,
  ExperienceEntry,
  ProjectEntry,
  EducationEntry,
  InvolvementEntry,
  SkillCategory,
  CertificationEntry,
  LanguageEntry,
  AwardEntry,
  ReferenceEntry,
  SectionType,
} from '../types/cv';
import { generateId } from './id';
import { capitalizeWords } from './sections';
import {
  COMPANY_WORDS_RE,
  RANGE_RE,
  isDegreeLike,
  isInstitutionLike,
  isLocationLike,
  isTitleLike,
  splitAtCompany,
  splitTokens,
  stripDuration,
} from './pdf/entryTokens';
import { buildLayoutLines, foldTurkish, BULLET_RE, MONTH_PATTERN, type LayoutLine } from './pdf/layout';

// ── Section keyword dictionary (TR + EN) ──

type HeadingType = SectionType;

const SECTION_KEYWORDS: Record<string, HeadingType> = {
  'summary': 'summary', 'profile': 'summary', 'profil': 'summary',
  'about': 'summary', 'about me': 'summary', 'hakkımda': 'summary',
  'özet': 'summary', 'objective': 'summary', 'career objective': 'summary',
  'professional summary': 'summary', 'profesyonel özet': 'summary',

  'experience': 'experience', 'work experience': 'experience',
  'professional experience': 'experience', 'deneyim': 'experience',
  'iş deneyimi': 'experience', 'employment': 'experience',
  'employment history': 'experience', 'work history': 'experience',
  'deneyimler': 'experience', 'iş deneyimleri': 'experience',

  'education': 'education', 'eğitim': 'education', 'eğitim bilgileri': 'education',

  'skills': 'skills', 'technical skills': 'skills', 'beceriler': 'skills',
  'yetenekler': 'skills', 'core competencies': 'skills', 'teknik beceriler': 'skills',

  'projects': 'projects', 'projeler': 'projects', 'personal projects': 'projects',
  'project': 'projects',

  'certifications': 'certifications', 'certificates': 'certifications',
  'sertifikalar': 'certifications', 'certification': 'certifications',

  'languages': 'languages', 'diller': 'languages', 'yabancı diller': 'languages',

  'awards': 'awards', 'honors': 'awards', 'ödüller': 'awards',
  'honors & awards': 'awards', 'awards & honors': 'awards',

  'hobbies': 'hobbies', 'interests': 'hobbies', 'hobiler': 'hobbies',
  'ilgi alanları': 'hobbies',

  'references': 'references', 'referanslar': 'references',

  'involvement': 'involvement', 'volunteering': 'involvement',
  'volunteer': 'involvement', 'gönüllülük': 'involvement',
  'aktiviteler': 'involvement', 'activities': 'involvement',
  'extracurricular': 'involvement', 'extracurricular activities': 'involvement',
  'katılımlar': 'involvement',

  'contact': 'personalInfo', 'iletişim': 'personalInfo',
  'personal info': 'personalInfo', 'kişisel bilgiler': 'personalInfo',
};

/** Folded, whitespace-free key so "EXPERİENCE", "Exper ience" and "experience" all match. */
function headingKey(text: string): string {
  return foldTurkish(text)
    .replace(/[:\-–—_|.]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

const HEADING_LOOKUP: Record<string, HeadingType> = {};
for (const [key, type] of Object.entries(SECTION_KEYWORDS)) {
  HEADING_LOOKUP[headingKey(key)] = type;
}
const HEADING_KEYS_BY_LENGTH = Object.keys(HEADING_LOOKUP).sort((a, b) => b.length - a.length);

// ── Regex patterns ──

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{0,4})?/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+|\bin\/[a-zA-Z0-9_-]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s,)]*)?/;

const MONTH = MONTH_PATTERN;
const DATE_TOKEN = `(?:${MONTH}\\.?\\s*\\d{4}|\\d{1,2}[./]\\d{4}|\\b(?:19|20)\\d{2}\\b)`;
const OPEN_END = '(?:Present|Current|Now|Günümüz|Devam(?:\\s+Ediyor)?|Halen|Şu\\s+an)';
const DATE_RANGE_RE = new RegExp(`${DATE_TOKEN}\\s*[-–—]\\s*(?:${DATE_TOKEN}|${OPEN_END})`, 'i');
const YEAR_RE = /\b(19|20)\d{2}\b/;
const GPA_RE = /\b(?:GPA|Not(?:\s*Ort(?:alaması|\.)?)?|Ortalama)\s*:?\s*([\d.,]+(?:\s*\/\s*[\d.,]+)?)/i;
const SEPARATOR_RE = /\s*[•·|]\s*/;

// ── Section detection ──

interface Section {
  type: SectionType;
  title: string;
  lines: string[];
}

/** Words that may accompany a heading keyword ("Technical Skills", "Work Experience & Internships"). */
const HEADING_MODIFIERS = new Set(
  ['technical', 'professional', 'work', 'key', 'core', 'top', 'additional', 'relevant', 'other', 'personal', 'academic', 'and', 'the', 'of',
    'internships', 'internship', 'training', 'history', 'iş', 'kişisel', 'bilgileri', 'bilgiler', 've', 'teknik', 'diğer', 'profesyonel']
    .map(headingKey),
);
const HEADING_KEYWORD_WORDS = new Set(
  Object.keys(SECTION_KEYWORDS).flatMap((k) => k.split(/\s+/)).map(headingKey),
);

function matchHeading(text: string, allowDecorated = true): HeadingType | undefined {
  const key = headingKey(text);
  if (!key) return undefined;
  const exact = HEADING_LOOKUP[key];
  if (exact) return exact;
  if (!allowDecorated) return undefined;
  // Decorated headings: "Work Experience & Internships", "Technical Skills". Every extra word must be a
  // known modifier or another heading word, so job titles ("Project Manager") and sentences never match.
  if (/[,;.:]/.test(text) || text.trim().split(/\s+/).length > 5) return undefined;
  const words = foldTurkish(text).replace(/[&|/]/g, ' ').split(/\s+/).filter(Boolean).map(headingKey);
  if (!words.every((w) => HEADING_MODIFIERS.has(w) || HEADING_KEYWORD_WORDS.has(w))) return undefined;
  // "Skills & Interests" is about skills: the keyword that comes first decides, longer breaks ties.
  let best: { index: number; known: string } | undefined;
  for (const known of HEADING_KEYS_BY_LENGTH) {
    if (known.length < 5) continue;
    const index = key.indexOf(known);
    if (index === -1) continue;
    if (!best || index < best.index || (index === best.index && known.length > best.known.length)) best = { index, known };
  }
  return best ? HEADING_LOOKUP[best.known] : undefined;
}

function isAllCaps(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, '');
  return letters.length >= 3 && letters === letters.toUpperCase();
}

function stripContactTokens(text: string): string {
  return text
    .replace(new RegExp(EMAIL_RE.source, 'g'), ' ')
    .replace(new RegExp(LINKEDIN_RE.source, 'gi'), ' ')
    .replace(new RegExp(GITHUB_RE.source, 'gi'), ' ')
    .replace(new RegExp(URL_RE.source, 'g'), ' ')
    .replace(new RegExp(PHONE_RE.source, 'g'), ' ')
    .replace(/\b(?:License|Ehliyet)\s*:\s*\S+/gi, ' ')
    .replace(/[•·|,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasContactToken(text: string): boolean {
  return EMAIL_RE.test(text) || LINKEDIN_RE.test(text) || GITHUB_RE.test(text) || URL_RE.test(text);
}

/**
 * A wide gap inside a line (right-aligned dates, label/value tables) separates fields; keep
 * that as an explicit " | " so the entry parsers do not have to guess where the fields end.
 */
function withGapMarker(line: LayoutLine): string {
  const text = line.text.trim();
  const at = line.gapAt;
  if (at === undefined || at <= 0 || at >= text.length) return text;
  const before = text.slice(0, at).trimEnd();
  const after = text.slice(at).trimStart();
  if (/[|•·,;:–—-]$/.test(before) || /^[|•·,;:–—-]/.test(after)) return text;
  return `${before} | ${after}`;
}

function detectSections(lines: LayoutLine[]): { headerLines: LayoutLine[]; sections: Section[] } {
  const headerLines: LayoutLine[] = [];
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let inHeader = true;

  // Body font size = the most common font size (rounded to 0.5)
  const fontSizeCounts = new Map<number, number>();
  for (const line of lines) {
    const rounded = Math.round(line.fontSize * 2) / 2;
    fontSizeCounts.set(rounded, (fontSizeCounts.get(rounded) || 0) + 1);
  }
  let bodyFontSize = 10;
  let maxCount = 0;
  for (const [size, count] of fontSizeCounts) {
    if (count > maxCount) {
      maxCount = count;
      bodyFontSize = size;
    }
  }

  const looksLikeHeading = (line: LayoutLine, text: string) =>
    text.length < 40 && !line.isBullet && (line.fontSize >= bodyFontSize * 0.95 || isAllCaps(text));

  // Font size the document uses for its recognised headings. A renamed or user-added
  // section ("GÖNÜLLÜLÜK") is printed in exactly that style, while the words are unknown.
  const headingSizeCounts = new Map<number, number>();
  for (const line of lines) {
    const text = line.text.trim();
    const type = matchHeading(text);
    if (type && type !== 'personalInfo' && looksLikeHeading(line, text) && isAllCaps(text)) {
      const rounded = Math.round(line.fontSize * 2) / 2;
      headingSizeCounts.set(rounded, (headingSizeCounts.get(rounded) || 0) + 1);
    }
  }
  let headingSize = 0;
  let headingSizeCount = 0;
  for (const [size, count] of headingSizeCounts) {
    if (count > headingSizeCount) {
      headingSizeCount = count;
      headingSize = size;
    }
  }
  // Needs a clear house style (two or more headings in it) before trusting unknown words.
  const isUnknownHeading = (line: LayoutLine, text: string) =>
    headingSizeCount >= 2 &&
    headingSize > bodyFontSize &&
    Math.abs(line.fontSize - headingSize) < 0.3 &&
    isAllCaps(text) &&
    !/\d/.test(text) &&
    !hasContactToken(text) &&
    looksLikeHeading(line, text);

  for (const line of lines) {
    const text = line.text.trim();
    const matchedType = matchHeading(text);

    if (!matchedType && !inHeader && isUnknownHeading(line, text)) {
      currentSection = { type: 'custom', title: text, lines: [] };
      sections.push(currentSection);
      continue;
    }

    if (matchedType && looksLikeHeading(line, text)) {
      if (matchedType === 'personalInfo') {
        inHeader = true;
        currentSection = null;
      } else {
        inHeader = false;
        currentSection = { type: matchedType, title: text, lines: [] };
        sections.push(currentSection);
      }
      continue;
    }

    // Contact-only lines (wrapped contact bar, footer, sidebar) belong to the header wherever they sit.
    if (hasContactToken(text) && stripContactTokens(text).length === 0) {
      headerLines.push(line);
      continue;
    }

    if (inHeader || !currentSection) {
      headerLines.push(line);
    } else {
      currentSection.lines.push(withGapMarker(line));
    }
  }

  return { headerLines, sections };
}

// ── Personal info parsing ──

/** "ALEX MORGAN" / "KADİR AY" → "Alex Morgan" / "Kadir Ay"; mixed-case names are kept. */
function normalizeName(name: string): string {
  if (!isAllCaps(name)) return name;
  const locale = /[İĞŞÖÜÇ]/.test(name) ? 'tr' : 'en';
  return name
    .toLocaleLowerCase(locale)
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase(locale));
}

function parsePersonalInfo(lines: LayoutLine[]): CVData['personalInfo'] {
  const info: CVData['personalInfo'] = {
    fullName: '',
    jobTitle: '',
    location: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    website: '',
    nationality: '',
    drivingLicense: '',
    birthDate: '',
    profilePhoto: '',
  };

  if (lines.length === 0) return info;

  // Name: largest-font line made of at least two words with no contact tokens.
  const isNameCandidate = (l: LayoutLine) =>
    !hasContactToken(l.text) && !/\d/.test(l.text) && l.text.trim().split(/\s+/).length >= 2 && l.text.length < 60;
  let nameIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!isNameCandidate(lines[i])) continue;
    if (nameIndex === -1 || lines[i].fontSize > lines[nameIndex].fontSize) nameIndex = i;
  }
  if (nameIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (hasContactToken(lines[i].text)) continue;
      if (nameIndex === -1 || lines[i].fontSize > lines[nameIndex].fontSize) nameIndex = i;
    }
  }
  if (nameIndex === -1) nameIndex = 0;
  info.fullName = normalizeName(lines[nameIndex].text.trim());

  const allText = lines.map((l) => l.text).join(' ');

  const emailMatch = allText.match(EMAIL_RE);
  if (emailMatch) info.email = emailMatch[0];

  const withoutEmail = allText.replace(new RegExp(EMAIL_RE.source, 'g'), ' ');

  const phoneMatches = withoutEmail.match(new RegExp(PHONE_RE.source, 'g'));
  if (phoneMatches) {
    for (const pm of phoneMatches) {
      const digits = pm.replace(/[^\d]/g, '');
      if (digits.length >= 7 && digits.length <= 15 && !YEAR_RE.test(pm.trim()) ) {
        info.phone = pm.trim();
        break;
      }
    }
  }

  const linkedinMatch = withoutEmail.match(LINKEDIN_RE);
  if (linkedinMatch) {
    const inMatch = linkedinMatch[0].match(/in\/[a-zA-Z0-9_-]+/i);
    info.linkedin = inMatch ? inMatch[0] : linkedinMatch[0];
  }

  const githubMatch = withoutEmail.match(GITHUB_RE);
  if (githubMatch) {
    info.github = githubMatch[0].replace(/^https?:\/\/(www\.)?/i, '');
  }

  // Website: any URL that's not linkedin or github
  const urls = withoutEmail.match(new RegExp(URL_RE.source, 'g')) || [];
  for (const url of urls) {
    if (LINKEDIN_RE.test(url) || GITHUB_RE.test(url)) continue;
    if (/linkedin|github/i.test(url)) continue;
    info.website = url;
    break;
  }

  // Job title: first short non-contact line that isn't the name
  let titleIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (i === nameIndex) continue;
    const t = lines[i].text.trim();
    if (
      !hasContactToken(t) &&
      !PHONE_RE.test(t) &&
      t.length > 2 &&
      t.length < 60 &&
      (!isAllCaps(t) || isTitleLike(t)) &&
      (t.match(/[•|·]/g) || []).length < 2 &&
      !/,/.test(t)
    ) {
      info.jobTitle = normalizeName(splitAtCompany(t)?.title ?? t);
      titleIndex = i;
      break;
    }
  }

  // Location: what's left of a contact line once every contact token is removed,
  // or a standalone "City, Country" line.
  const knownPlaces = /\b(Turkey|Türkiye|Istanbul|İstanbul|Ankara|İzmir|Adana|Bursa|Antalya|USA|UK|Germany|France|Netherlands|Berlin|London|New York|San Francisco|California|Texas|Remote)\b/i;
  for (let i = 0; i < lines.length; i++) {
    if (i === nameIndex || i === titleIndex) continue;
    const t = lines[i].text.trim();
    const hadContact = hasContactToken(t) || PHONE_RE.test(t);
    const rest = stripContactTokens(t).replace(/\s+,/g, ',');
    // Digits are fine inside a parenthetical note such as "(Remote, UTC+3)".
    if (!rest || rest.length > 40 || /\d/.test(rest.replace(/\([^)]*\)/g, ''))) continue;
    if (hadContact || /,/.test(rest) || knownPlaces.test(rest)) {
      // Rebuild "City, Country" punctuation lost by token stripping.
      const original = t.replace(new RegExp(EMAIL_RE.source, 'g'), ' ');
      const commaForm = original.match(/[\p{L}.\s-]+(?:,\s*[\p{L}.\s-]+)+(?:\s*\([^)]*\))?/u);
      info.location = commaForm ? commaForm[0].trim() : rest;
      break;
    }
  }

  return info;
}

// ── Date extraction helper ──

function extractDateRange(text: string): {
  startDate: string; endDate: string;
  beforeDate: string; afterDate: string;
} | null {
  const match = text.match(DATE_RANGE_RE);
  if (!match) return null;
  const parts = match[0].split(/\s*[-–—]\s*/);
  const beforeDate = text.substring(0, match.index!).replace(/[,|\s]+$/, '').trim();
  const afterDate = text.substring(match.index! + match[0].length).replace(/^[,|\s]+/, '').trim();
  return {
    startDate: parts[0]?.trim() || '',
    endDate: parts[1]?.trim() || '',
    beforeDate,
    afterDate,
  };
}

// ── Experience parsing ──

interface EntryBlock {
  head: string[];
  bullets: string[];
}

/** Sentence-like text under a header is a description, not another header line. */
function looksLikeProse(line: string): boolean {
  // Header lines carry dates or " | " fields, and legal suffixes end in a period ("Fabrikam Inc.").
  if (RANGE_RE.test(line) || line.includes(' | ')) return false;
  const words = line.split(/\s+/).length;
  const sentenceEnd = /[.!?]$/.test(line) && !/\b(?:Inc|Ltd|Co|Corp|LLC|Şti|A\.Ş)\.$/i.test(line);
  return line.length >= 90 || (words >= 6 && sentenceEnd);
}

/**
 * Cuts an experience section into one block per job. A job ends where the next header starts:
 * after its bullets, or at the next date line (taking back the header lines that precede
 * that date, which some layouts print above it).
 */
function splitExperienceBlocks(lines: string[]): EntryBlock[] {
  const blocks: EntryBlock[] = [];
  let cur: EntryBlock = { head: [], bullets: [] };
  const flush = () => {
    if (cur.head.length || cur.bullets.length) blocks.push(cur);
    cur = { head: [], bullets: [] };
  };
  const dateIndex = (b: EntryBlock) => b.head.findIndex((l) => RANGE_RE.test(l));

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (BULLET_RE.test(line) && line.replace(BULLET_RE, '').length > 0) {
      cur.bullets.push(line.replace(BULLET_RE, '').trim());
      continue;
    }
    if ((cur.bullets.length > 0 || dateIndex(cur) !== -1) && looksLikeProse(line)) {
      cur.bullets.push(line);
      continue;
    }

    if (cur.bullets.length > 0) {
      flush();
    } else if (RANGE_RE.test(line) && dateIndex(cur) !== -1) {
      const idx = dateIndex(cur);
      const take = idx >= 1 ? Math.min(idx, cur.head.length - idx - 1) : 0;
      const moved = take > 0 ? cur.head.splice(cur.head.length - take, take) : [];
      flush();
      cur.head.push(...moved);
    } else if (dateIndex(cur) === -1 && cur.head.length >= 3) {
      flush();
    }
    cur.head.push(line);
  }
  flush();
  return blocks;
}

/** "Company, City" → company + location; leaves "Acme, Inc." alone. */
function splitCompanyLocation(text: string): { company: string; location: string } {
  const idx = text.indexOf(',');
  if (idx === -1) return { company: text.trim(), location: '' };
  const head = text.slice(0, idx).trim();
  const tail = text.slice(idx + 1).trim();
  if (/^(Inc|Ltd|LLC|GmbH|Co|Corp|A\.Ş|Şti)\.?(?:\s*,|$)/i.test(tail)) {
    // "Acme, Inc., Austin": the legal suffix belongs to the company, the rest is the place.
    const next = tail.indexOf(',');
    return next === -1
      ? { company: text.trim(), location: '' }
      : { company: `${head}, ${tail.slice(0, next).trim()}`, location: tail.slice(next + 1).trim() };
  }
  return { company: head, location: tail };
}

function parseEntryHeader(head: string[]): Pick<ExperienceEntry, 'title' | 'company' | 'location' | 'startDate' | 'endDate'> {
  let startDate = '';
  let endDate = '';
  let location = '';
  const pieces: string[] = [];

  for (const raw of head) {
    const line = stripDuration(raw);
    const m = startDate ? null : line.match(RANGE_RE);
    if (!m || m.index === undefined) {
      pieces.push(line);
      continue;
    }
    startDate = m[1].trim();
    endDate = m[2].trim();
    const before = line.slice(0, m.index).trim();
    const afterRaw = line.slice(m.index + m[0].length);
    const after = afterRaw.replace(/^[\s,|·•–—-]+/, '').trim();
    if (before) pieces.push(before);
    if (after) {
      // "Mar 2023 - Present, Berlin": a comma right after the dates marks a place.
      if (/^\s*,/.test(afterRaw)) location = after;
      else pieces.push(after);
    }
  }

  let tokens = pieces.flatMap(splitTokens).flatMap((t) => {
    // "Title, Company (City, ST)": peel off a trailing place, then split a title from its employer.
    const paren = t.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (paren && paren[1] && !location && isLocationLike(paren[2])) {
      location = paren[2].trim();
      t = paren[1].trim();
    }
    const at = splitAtCompany(t);
    if (at) return [at.title, at.company];
    const comma = t.indexOf(',');
    if (comma > 0 && isTitleLike(t.slice(0, comma))) {
      const tail = t.slice(comma + 1).trim();
      if (COMPANY_WORDS_RE.test(tail) || (tail.split(/\s+/).length >= 2 && !isTitleLike(tail) && !isLocationLike(tail))) {
        return [t.slice(0, comma).trim(), tail];
      }
    }
    return [t];
  });

  let title = '';
  let company = '';
  const strictIdx = tokens.findIndex((t) => isTitleLike(t) && !COMPANY_WORDS_RE.test(t));
  const titleIdx = strictIdx !== -1 ? strictIdx : tokens.findIndex((t) => isTitleLike(t));
  if (titleIdx !== -1) {
    title = tokens[titleIdx];
    tokens = tokens.filter((_, i) => i !== titleIdx);
  }

  if (!title && tokens.length > 0) {
    // No job-title wording: an employer-looking piece is the company, the other leads as the title.
    const companyIdx = tokens.length >= 2 ? tokens.findIndex((t) => COMPANY_WORDS_RE.test(t)) : -1;
    if (companyIdx !== -1) {
      company = tokens[companyIdx];
      tokens = tokens.filter((_, i) => i !== companyIdx);
    }
    title = tokens.shift() ?? '';
  }

  if (!company && tokens.length === 1 && tokens[0].includes(',')) {
    // A lone "Company, City" piece (a bare place would otherwise look like the company).
    const split = splitCompanyLocation(tokens[0]);
    company = split.company;
    if (!location) location = split.location;
    tokens = [];
  }
  const places = tokens.filter((t) => isLocationLike(t));
  const others = tokens.filter((t) => !isLocationLike(t));
  if (!company) company = others[0] ?? (places.length > 1 ? places.shift()! : '');
  if (!location) location = places[0] ?? others[1] ?? '';
  if (company.includes(',') && !location) {
    const split = splitCompanyLocation(company);
    company = split.company;
    location = split.location;
  }

  return { title, company, location, startDate, endDate };
}

function parseExperience(lines: string[]): ExperienceEntry[] {
  return splitExperienceBlocks(lines)
    .map((block) => ({ ...parseEntryHeader(block.head), bullets: block.bullets }))
    .filter((e) => e.title || e.company)
    .map((e) => ({ id: generateId(), ...e }));
}

// ── Education parsing ──

const YEAR_RANGE_RE = new RegExp(`\\b((?:19|20)\\d{2})\\s*[-–—]\\s*((?:19|20)\\d{2}|${OPEN_END})\\b`, 'i');

type EduKind = 'institution' | 'degree' | 'unknown';

function eduKind(text: string): EduKind {
  if (isInstitutionLike(text)) return 'institution';
  if (isDegreeLike(text)) return 'degree';
  return 'unknown';
}

function parseEducation(lines: string[]): EducationEntry[] {
  const entries: EducationEntry[] = [];
  const blank = () => ({ degree: '', institution: '', startDate: '', year: '', gpa: '' });
  let cur = blank();
  const filled = (e: typeof cur) => e.degree || e.institution || e.year || e.startDate;
  const push = () => {
    if (cur.degree || cur.institution) entries.push({ id: generateId(), ...cur });
    cur = blank();
  };

  for (const line of lines) {
    let rest = line.trim();
    if (!rest) continue;

    // Dates and GPA first: a spaced en dash in "2016 – 2020" must not be taken for a field separator.
    let gpa = '';
    let startDate = '';
    let year = '';
    const gpaMatch = rest.match(GPA_RE);
    if (gpaMatch) {
      gpa = gpaMatch[1].replace(/\s+/g, '');
      rest = rest.replace(GPA_RE, ' ');
    }
    const rangeMatch = rest.match(YEAR_RANGE_RE);
    if (rangeMatch) {
      startDate = rangeMatch[1];
      year = rangeMatch[2];
      rest = rest.replace(YEAR_RANGE_RE, ' ');
    } else {
      const yearMatch = rest.match(YEAR_RE);
      if (yearMatch) {
        year = yearMatch[0];
        rest = rest.replace(YEAR_RE, ' ');
      }
    }
    rest = rest.replace(/\(\s*\)/g, ' ');

    let tokens = rest.split(/\s*[•·|;]\s*|\s+[—–]\s+/).map((t) => t.replace(/^[\s,|:–—-]+|[\s,|:–—-]+$/g, '').replace(/\s+/g, ' ')).filter(Boolean);
    // "Degree, University": split on commas only when each piece is recognisably a degree or a school.
    tokens = tokens.flatMap((t) => {
      const parts = t.split(/\s*,\s*/).filter(Boolean);
      return parts.length >= 2 && parts.every((p) => eduKind(p) !== 'unknown') ? parts : [t];
    });

    if ((startDate || year) && (cur.year || cur.startDate)) push();
    for (const token of tokens) {
      const kind = eduKind(token);
      if (kind === 'institution') {
        if (cur.institution) push();
        cur.institution = token;
      } else if (kind === 'degree') {
        if (cur.degree) push();
        cur.degree = token;
      } else if (!cur.degree) {
        cur.degree = token;
      } else if (!cur.institution) {
        cur.institution = token;
      } else {
        push();
        cur.degree = token;
      }
    }
    if (startDate && !cur.startDate) cur.startDate = startDate;
    if (year && !cur.year) cur.year = year;
    if (gpa && !cur.gpa) cur.gpa = gpa;
  }

  if (filled(cur)) push();
  return entries;
}

// ── Skills parsing ──

function toTitleCase(text: string): string {
  return text.toLowerCase().replace(/(^|\s|&)(\p{L})/gu, (m) => m.toUpperCase());
}

/** Rows that Europass and similar formats file under "skills" but that describe languages. */
const LANGUAGE_ROW_RE = /^(?:mother tongue|native language|other languages|foreign languages|ana dil(?:i|im)?|anadil(?:im)?|diğer diller|yabancı diller)\b/i;
const LANGUAGE_LABEL_RE = /^(?:languages?|diller|dil|language skills|yabancı diller|dil bilgisi)$/i;

/** A skills row that really lists spoken languages ("Languages: English (Native), Spanish (Fluent)"). */
function isLanguageRow(line: string): boolean {
  if (LANGUAGE_ROW_RE.test(line)) return true;
  const labelled = splitLabelled(line);
  return Boolean(labelled && LANGUAGE_LABEL_RE.test(labelled.label) && splitByProficiency(labelled.items).length >= 3);
}

/** "Label: items" or "Label | items" (a label/value table); null when the line is not one. */
function splitLabelled(line: string): { label: string; items: string } | null {
  const colon = line.indexOf(':');
  if (colon > 0 && colon < 35) return { label: line.slice(0, colon).trim(), items: line.slice(colon + 1).trim() };
  const pipe = line.indexOf(' | ');
  if (pipe > 0 && pipe < 35) return { label: line.slice(0, pipe).trim(), items: line.slice(pipe + 3).trim() };
  return null;
}

function parseSkills(lines: string[], sectionTitle = ''): SkillCategory[] {
  const categories: SkillCategory[] = [];
  const cleaned = lines.map((l) => l.replace(BULLET_RE, '').trim()).filter(Boolean);

  // A plain list of skills, one per line, has no category names to recover.
  const labelled = cleaned.some((l) => splitLabelled(l));
  if (!labelled && !cleaned.some((l) => l.includes(','))) {
    const items = cleaned.map((l) => l.replace(/^[,\s]+|[,\s|]+$/g, '')).filter(Boolean);
    if (items.length === 0) return [];
    const category = sectionTitle ? (isAllCaps(sectionTitle) ? toTitleCase(sectionTitle) : sectionTitle) : 'Skills';
    return [{ id: generateId(), category, items: items.join(', ') }];
  }

  const appendToLast = (items: string) => {
    const last = categories[categories.length - 1];
    if (last) {
      last.items = last.items ? `${last.items}, ${items}` : items;
    } else {
      categories.push({ id: generateId(), category: 'General', items });
    }
  };

  for (const trimmed of cleaned) {
    const labelledLine = splitLabelled(trimmed);
    if (labelledLine) {
      categories.push({ id: generateId(), category: labelledLine.label, items: labelledLine.items });
      continue;
    }

    // Category on its own line ("FRONTEND"), items on the following line(s)
    if (!trimmed.includes(',') && trimmed.length < 30 && trimmed.split(/\s+/).length <= 3) {
      const category = isAllCaps(trimmed) ? toTitleCase(trimmed) : trimmed;
      categories.push({ id: generateId(), category, items: '' });
      continue;
    }

    appendToLast(trimmed.replace(/^[,\s]+|[,\s]+$/g, ''));
  }

  // A lone category line with nothing under it is really an item.
  return categories.filter((c) => c.items).concat(
    categories.filter((c) => !c.items).map((c) => ({ ...c, category: 'General', items: c.category })),
  );
}

// ── Languages parsing ──

const PROFICIENCY_MAP: Record<string, LanguageEntry['proficiency']> = {
  'native': 'native', 'ana dil': 'native', 'anadil': 'native', 'mother tongue': 'native', 'c2': 'native',
  'native or bilingual': 'native', 'bilingual': 'native',
  'fluent': 'fluent', 'ileri': 'fluent', 'advanced': 'fluent', 'akıcı': 'fluent', 'proficient': 'fluent', 'c1': 'fluent',
  'full professional': 'fluent', 'professional working': 'fluent',
  'intermediate': 'intermediate', 'orta': 'intermediate', 'conversational': 'intermediate', 'b1': 'intermediate', 'b2': 'intermediate',
  'limited working': 'intermediate',
  'beginner': 'beginner', 'başlangıç': 'beginner', 'basic': 'beginner',
  'temel': 'beginner', 'elementary': 'beginner', 'a1': 'beginner', 'a2': 'beginner',
};

/** Folded keys so "İleri", "Akıcı" and "ileri" all match; folding keeps string length. */
const FOLDED_PROFICIENCY: Record<string, LanguageEntry['proficiency']> = Object.fromEntries(
  Object.entries(PROFICIENCY_MAP).map(([k, v]) => [foldTurkish(k), v]),
);
const PROFICIENCY_LABELS = Object.keys(FOLDED_PROFICIENCY).sort((a, b) => b.length - a.length);
const PROFICIENCY_SPLIT_RE = new RegExp(
  `\\s*[(:\\-–—]?\\s*(${PROFICIENCY_LABELS.map((l) => l.replace(/\s+/g, '\\s+')).join('|')})\\)?(?=[,;\\s]|$)`,
  'giu',
);

export function lookupProficiency(label: string): LanguageEntry['proficiency'] {
  return FOLDED_PROFICIENCY[foldTurkish(label).replace(/\s+/g, ' ')] || 'intermediate';
}

/** Splits "English (Native), German (Basic)" into [lang, level, lang, level, ..., tail] pieces. */
function splitByProficiency(text: string): string[] {
  const folded = foldTurkish(text);
  const pieces: string[] = [];
  let last = 0;
  for (const m of folded.matchAll(PROFICIENCY_SPLIT_RE)) {
    const label = m[1];
    const labelStart = m.index + m[0].indexOf(label);
    pieces.push(text.slice(last, m.index), text.slice(labelStart, labelStart + label.length));
    last = m.index + m[0].length;
  }
  pieces.push(text.slice(last));
  return pieces;
}

const NATIVE_ROW_RE = /^(?:mother tongue|ana dil(?:i|im)?|anadil(?:im)?)\s*[:|]?\s*/i;
const OTHER_ROW_RE = /^(?:other languages|foreign languages|diğer diller|yabancı diller)\s*[:|]?\s*/i;

function parseLanguages(lines: string[]): LanguageEntry[] {
  const entries: LanguageEntry[] = [];
  const strip = (s: string) => s.replace(/^[,;|\s]+|[,;|\s]+$/g, '');

  for (const raw of lines) {
    let trimmed = raw.replace(BULLET_RE, '').replace(/\s+\|\s+/g, ' ').trim();
    if (!trimmed) continue;

    // Europass-style rows: "Mother tongue English" / "Other languages Spanish (Fluent), German (Basic)".
    let defaultLevel: LanguageEntry['proficiency'] = 'intermediate';
    if (NATIVE_ROW_RE.test(trimmed)) {
      defaultLevel = 'native';
      trimmed = trimmed.replace(NATIVE_ROW_RE, '');
    } else {
      trimmed = trimmed.replace(OTHER_ROW_RE, '');
    }

    const pieces = splitByProficiency(trimmed);
    if (pieces.length >= 3) {
      // [lang, label, lang, label, ..., tail]
      for (let i = 0; i + 1 < pieces.length; i += 2) {
        const language = strip(pieces[i]);
        if (!language) continue;
        entries.push({ id: generateId(), language, proficiency: lookupProficiency(pieces[i + 1]) });
      }
      const tail = strip(pieces[pieces.length - 1]);
      if (tail && pieces.length % 2 === 1) {
        for (const p of tail.split(/[,;]/).map((s) => s.trim()).filter(Boolean)) {
          entries.push({ id: generateId(), language: p, proficiency: defaultLevel });
        }
      }
      continue;
    }

    for (const part of trimmed.split(/[,;]/)) {
      const p = strip(part);
      if (p.length > 1 && p.length < 30) entries.push({ id: generateId(), language: p, proficiency: defaultLevel });
    }
  }

  return entries;
}

// ── Projects parsing ──

function parseProjects(lines: string[]): ProjectEntry[] {
  const entries: ProjectEntry[] = [];
  let current: Partial<ProjectEntry> | null = null;

  const pushCurrent = () => {
    if (current && current.name) {
      entries.push({
        id: generateId(),
        name: current.name || '',
        link: current.link || '',
        date: current.date || '',
        bullets: current.bullets || [],
      });
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (BULLET_RE.test(trimmed) && trimmed.replace(BULLET_RE, '').length > 0) {
      if (!current) current = { name: '', link: '', date: '', bullets: [] };
      current.bullets = current.bullets || [];
      current.bullets.push(trimmed.replace(BULLET_RE, '').trim());
      continue;
    }

    if (current && current.name) {
      const hasUrl = URL_RE.test(trimmed);
      const dateMatch = trimmed.match(DATE_RANGE_RE);
      const yearMatch = trimmed.match(YEAR_RE);

      // Lines like "link • date" from the app's template
      if ((hasUrl || dateMatch || yearMatch) && trimmed.length < 80 && !current.bullets?.length) {
        if (hasUrl && !current.link) {
          const urlMatch = trimmed.match(URL_RE);
          if (urlMatch) current.link = urlMatch[0];
        }
        if (dateMatch && !current.date) {
          current.date = dateMatch[0];
        } else if (yearMatch && !current.date) {
          current.date = yearMatch[0];
        }
        continue;
      }

      pushCurrent();
      current = createProjectFromTitle(trimmed);
    } else {
      current = createProjectFromTitle(trimmed);
    }
  }

  pushCurrent();
  return entries;
}

function createProjectFromTitle(text: string): Partial<ProjectEntry> {
  const entry: Partial<ProjectEntry> = { name: text, link: '', date: '', bullets: [] };

  const dateInfo = extractDateRange(text);
  if (dateInfo) {
    entry.date = `${dateInfo.startDate} - ${dateInfo.endDate}`;
    entry.name = dateInfo.beforeDate || dateInfo.afterDate;
  }

  const urlMatch = entry.name!.match(URL_RE);
  if (urlMatch) {
    entry.link = urlMatch[0];
    entry.name = entry.name!
      .replace(URL_RE, '')
      .replace(/\(\s*\)/g, '')
      .replace(/[|,•·\s]+$/, '')
      .trim();
  }

  return entry;
}

// ── Certifications parsing ──

function parseCertifications(lines: string[]): CertificationEntry[] {
  const entries: CertificationEntry[] = [];
  let current: Partial<CertificationEntry> | null = null;

  const pushCurrent = () => {
    if (current && current.name) {
      entries.push({
        id: generateId(),
        name: current.name || '',
        issuer: current.issuer || '',
        year: current.year || '',
        description: current.description || '',
      });
    }
  };

  const startEntry = (text: string): Partial<CertificationEntry> => {
    const entry: Partial<CertificationEntry> = { name: text, issuer: '', year: '', description: '' };
    const clean = (t: string) => t.replace(/^[\s,|•·;]+|[\s,|•·;]+$/g, '').trim();
    // "2022 | Name" (year column first)
    const lead = text.match(/^((?:19|20)\d{2})\s*(?:\||[-–—:])?\s+(.+)$/);
    if (lead && !YEAR_RE.test(lead[2])) {
      const inner = startEntry(lead[2]);
      return { ...inner, year: inner.year || lead[1] };
    }
    const yearOnly = (t: string) => /^(?:19|20)\d{2}$/.test(t.trim());

    // "Name (Issuer, 2023)"
    const paren = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (paren && (YEAR_RE.test(paren[2]) || paren[2].includes(','))) {
      entry.name = clean(paren[1]);
      const inner = paren[2].split(',').map(clean).filter(Boolean);
      entry.year = inner.find(yearOnly) ?? '';
      entry.issuer = inner.filter((p) => !yearOnly(p)).join(', ');
      return entry;
    }

    // "Name - Issuer, 2023" / "Name | Issuer | 2023" / "Name, Issuer, 2023"
    const dashed = text.split(/\s+[—–-]\s+|\s+\|\s+/).map(clean).filter(Boolean);
    const parts = dashed.length >= 2 ? dashed : text.split(/\s*,\s*/).map(clean).filter(Boolean);
    const lastIsYear = parts.length >= 2 && yearOnly(parts[parts.length - 1]);
    if (parts.length >= 3 || (parts.length === 2 && (lastIsYear || dashed.length >= 2))) {
      const tail = lastIsYear ? parts.slice(1, -1) : parts.slice(1);
      entry.name = parts[0];
      if (lastIsYear) entry.year = parts[parts.length - 1];
      const tailYear = tail.map((t) => t.match(YEAR_RE)?.[0]).find(Boolean);
      if (!entry.year && tailYear) entry.year = tailYear;
      entry.issuer = tail.map((t) => clean(t.replace(YEAR_RE, ''))).filter(Boolean).join(', ');
      return entry;
    }

    const yearMatch = text.match(YEAR_RE);
    if (yearMatch) {
      entry.year = yearMatch[0];
      entry.name = text.replace(YEAR_RE, '').replace(/[-–—,|•·]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return entry;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (BULLET_RE.test(trimmed) && current) {
      const bulletText = trimmed.replace(BULLET_RE, '').trim();
      current.description = current.description ? `${current.description} ${bulletText}` : bulletText;
      continue;
    }

    if (!current) {
      current = startEntry(trimmed);
    } else if (!current.issuer) {
      // "issuer • year" format from app
      const parts = trimmed.split(/\s*[•·|]\s*|,\s*(?=(?:19|20)\d{2}$)/).map((p) => p.trim()).filter(Boolean);
      const yearPart = parts.find((p) => YEAR_RE.test(p));
      const issuerPart = parts.find((p) => !YEAR_RE.test(p));
      current.issuer = issuerPart || '';
      if (yearPart && !current.year) current.year = yearPart.match(YEAR_RE)![0];
      if (!issuerPart && !yearPart) current.issuer = trimmed;
    } else {
      pushCurrent();
      current = startEntry(trimmed);
    }
  }

  pushCurrent();
  return entries;
}

// ── Involvement parsing ──

function parseInvolvement(lines: string[]): InvolvementEntry[] {
  const entries: InvolvementEntry[] = [];
  let current: Partial<InvolvementEntry> | null = null;

  const pushCurrent = () => {
    if (current && (current.role || current.organization)) {
      entries.push({
        id: generateId(),
        role: current.role || '',
        organization: current.organization || '',
        institution: current.institution || '',
        startDate: current.startDate || '',
        endDate: current.endDate || '',
        bullets: current.bullets || [],
      });
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (BULLET_RE.test(trimmed) && current) {
      current.bullets = current.bullets || [];
      current.bullets.push(trimmed.replace(BULLET_RE, '').trim());
      continue;
    }

    const dateInfo = extractDateRange(trimmed);

    if (dateInfo) {
      if (current && current.role && !current.startDate && !current.organization && !current.bullets?.length && !dateInfo.beforeDate) {
        // Date on its own line right after the role line.
        current.startDate = dateInfo.startDate;
        current.endDate = dateInfo.endDate;
        if (dateInfo.afterDate) current.institution = dateInfo.afterDate;
        continue;
      }
      pushCurrent();
      current = {
        role: dateInfo.beforeDate,
        organization: '',
        institution: dateInfo.afterDate,
        startDate: dateInfo.startDate,
        endDate: dateInfo.endDate,
        bullets: [],
      };
      continue;
    }

    if (current) {
      if (current.role && !current.organization) {
        // App format: "Institution • Organization"
        const parts = trimmed.split(SEPARATOR_RE).map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          current.institution = parts[0];
          current.organization = parts.slice(1).join(' • ');
        } else {
          current.organization = trimmed;
        }
      } else if (current.role && !current.institution && !current.bullets?.length) {
        current.institution = trimmed;
      } else {
        pushCurrent();
        current = { role: trimmed, organization: '', institution: '', startDate: '', endDate: '', bullets: [] };
      }
    } else {
      current = { role: trimmed, organization: '', institution: '', startDate: '', endDate: '', bullets: [] };
    }
  }

  pushCurrent();
  return entries;
}

// ── Awards parsing ──

function parseAwards(lines: string[]): AwardEntry[] {
  const entries: AwardEntry[] = [];
  let current: Partial<AwardEntry> | null = null;

  const pushCurrent = () => {
    if (current && current.title) {
      entries.push({
        id: generateId(),
        title: current.title || '',
        issuer: current.issuer || '',
        year: current.year || '',
        description: current.description || '',
      });
    }
  };

  const startEntry = (text: string): Partial<AwardEntry> => {
    const yearMatch = text.match(YEAR_RE);
    const entry: Partial<AwardEntry> = { title: text, issuer: '', year: yearMatch?.[0] || '', description: '' };
    if (yearMatch) entry.title = text.replace(YEAR_RE, '').replace(/[-–—,|•·]/g, ' ').replace(/\s+/g, ' ').trim();
    return entry;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (BULLET_RE.test(trimmed) && current) {
      const bulletText = trimmed.replace(BULLET_RE, '').trim();
      current.description = current.description ? `${current.description} ${bulletText}` : bulletText;
      continue;
    }

    if (!current) {
      current = startEntry(trimmed);
    } else if (!current.issuer) {
      const parts = trimmed.split(/\s*[•·|]\s*|,\s*(?=(?:19|20)\d{2}$)/).map((p) => p.trim()).filter(Boolean);
      const yearPart = parts.find((p) => YEAR_RE.test(p));
      current.issuer = parts.find((p) => !YEAR_RE.test(p)) || (yearPart ? '' : trimmed);
      if (yearPart && !current.year) current.year = yearPart.match(YEAR_RE)![0];
    } else {
      pushCurrent();
      current = startEntry(trimmed);
    }
  }

  pushCurrent();
  return entries;
}

// ── References parsing ──

function parseReferences(lines: string[]): ReferenceEntry[] {
  const entries: ReferenceEntry[] = [];
  let current: Partial<ReferenceEntry> = {};

  const pushCurrent = () => {
    if (current.name) {
      entries.push({
        id: generateId(),
        name: current.name || '',
        title: current.title || '',
        company: current.company || '',
        email: current.email || '',
        phone: current.phone || '',
      });
    }
    current = {};
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isContact = EMAIL_RE.test(trimmed) || (PHONE_RE.test(trimmed) && trimmed.replace(/[^\d]/g, '').length >= 7);

    if (isContact) {
      const emailMatch = trimmed.match(EMAIL_RE);
      if (emailMatch) current.email = emailMatch[0];
      const phoneMatch = trimmed.replace(new RegExp(EMAIL_RE.source, 'g'), '').match(PHONE_RE);
      if (phoneMatch && phoneMatch[0].replace(/[^\d]/g, '').length >= 7) current.phone = phoneMatch[0].trim();
      continue;
    }

    // A new name after contact details closes the previous reference.
    if (current.name && (current.email || current.phone)) pushCurrent();

    if (!current.name) {
      current.name = trimmed;
    } else if (!current.title) {
      const parts = trimmed.split(/\s*[,•·|]\s*/).map((p) => p.trim());
      current.title = parts[0];
      if (parts[1]) current.company = parts.slice(1).join(', ');
    } else if (!current.company) {
      current.company = trimmed;
    } else {
      pushCurrent();
      current.name = trimmed;
    }
  }

  pushCurrent();
  return entries;
}

// ── Build sections list ──

export function buildSections(cvData: CVData): CVSection[] {
  const sectionDefs: { type: SectionType; title: string; hasData: boolean }[] = [
    { type: 'personalInfo', title: 'Personal Info', hasData: true },
    { type: 'summary', title: 'Summary', hasData: !!cvData.summary },
    { type: 'experience', title: 'Experience', hasData: cvData.experience.length > 0 },
    { type: 'projects', title: 'Projects', hasData: cvData.projects.length > 0 },
    { type: 'education', title: 'Education', hasData: cvData.education.length > 0 },
    { type: 'involvement', title: 'Involvement', hasData: cvData.involvement.length > 0 },
    { type: 'skills', title: 'Skills', hasData: cvData.skills.length > 0 },
    { type: 'certifications', title: 'Certifications', hasData: cvData.certifications.length > 0 },
    { type: 'languages', title: 'Languages', hasData: cvData.languages.length > 0 },
    { type: 'awards', title: 'Awards', hasData: cvData.awards.length > 0 },
    { type: 'hobbies', title: 'Hobbies', hasData: !!cvData.hobbies },
    { type: 'references', title: 'References', hasData: cvData.references.length > 0 },
  ];

  return sectionDefs.map((s) => ({
    id: generateId(),
    type: s.type,
    title: s.title,
    visible: s.hasData,
  }));
}

// ── Main export ──

/** Pure half of the import: layout lines → CVData. Used directly by tests. */
export function parseLinesToCV(textLines: LayoutLine[]): CVData {
  const { headerLines, sections } = detectSections(textLines);

  if (import.meta.env?.DEV && !import.meta.env?.TEST) {
    console.log('[PDF Import] Extracted lines:', textLines.map(l => ({
      text: l.text, fontSize: l.fontSize.toFixed(1), column: l.column,
    })));
    console.log('[PDF Import] Sections:', sections.map(s => ({
      type: s.type, lines: s.lines.length,
    })));
  }

  const personalInfo = parsePersonalInfo(headerLines);

  let summary = '';
  let experience: ExperienceEntry[] = [];
  let education: EducationEntry[] = [];
  let skills: SkillCategory[] = [];
  let projects: ProjectEntry[] = [];
  let certifications: CertificationEntry[] = [];
  let languages: LanguageEntry[] = [];
  let awards: AwardEntry[] = [];
  let hobbies = '';
  let references: ReferenceEntry[] = [];
  let involvement: InvolvementEntry[] = [];
  const customSections: CVSection[] = [];

  for (const section of sections) {
    switch (section.type) {
      case 'custom': {
        // Entries of a custom section print like Involvement (title, dates, subtitle, bullets).
        const items: CustomEntry[] = parseInvolvement(section.lines).map((e) => {
          // A single date is not a range, so it stays glued to the title ("Keynote | Sep 2024")
          // or, in timeline layouts, to the subtitle line ("ReactConf Istanbul, Sep 2024").
          const subtitle = [e.institution, e.organization].filter(Boolean).join(', ');
          const inTitle = e.startDate ? null : splitTrailingDate(e.role);
          const inSubtitle = e.startDate || inTitle ? null : splitTrailingDate(subtitle);
          return {
            id: e.id,
            title: inTitle?.text ?? e.role,
            subtitle: inSubtitle?.text ?? subtitle,
            startDate: inTitle?.date ?? inSubtitle?.date ?? e.startDate,
            endDate: e.endDate,
            bullets: e.bullets,
          };
        });
        customSections.push({ id: generateId(), type: 'custom', title: headingToTitle(section.title), visible: true, items });
        break;
      }
      case 'summary':
        summary = [summary, section.lines.join(' ').trim()].filter(Boolean).join(' ');
        break;
      case 'experience':
        experience = experience.concat(parseExperience(section.lines));
        break;
      case 'education':
        education = education.concat(parseEducation(section.lines));
        break;
      case 'skills': {
        const languageRows = section.lines.filter(isLanguageRow);
        skills = skills.concat(parseSkills(section.lines.filter((l) => !isLanguageRow(l)), section.title));
        languages = languages.concat(parseLanguages(languageRows.map((l) => (LANGUAGE_ROW_RE.test(l) ? l : (splitLabelled(l)?.items ?? l)))));
        break;
      }
      case 'projects':
        projects = projects.concat(parseProjects(section.lines));
        break;
      case 'certifications':
        certifications = certifications.concat(parseCertifications(section.lines));
        break;
      case 'languages':
        languages = languages.concat(parseLanguages(section.lines));
        break;
      case 'awards':
        awards = awards.concat(parseAwards(section.lines));
        break;
      case 'hobbies':
        hobbies = [hobbies, section.lines.join(', ').trim()].filter(Boolean).join(', ');
        break;
      case 'references':
        references = references.concat(parseReferences(section.lines));
        break;
      case 'involvement':
        involvement = involvement.concat(parseInvolvement(section.lines));
        break;
    }
  }

  const cvData: CVData = {
    personalInfo,
    summary,
    experience,
    projects,
    education,
    involvement,
    skills,
    certifications,
    languages,
    awards,
    hobbies,
    references,
    sections: [],
  };

  cvData.sections = [...buildSections(cvData), ...customSections];
  return cvData;
}

const TRAILING_DATE_RE = new RegExp(`^(.*?[^\\s,|])\\s*(?:[|,]\\s*)?((?:${MONTH_PATTERN}\\.?\\s+)?(?:19|20)\\d{2})$`, 'iu');

/** "Keynote Speaker | Sep 2024" or "ReactConf, Sep 2024" -> the text and "Sep 2024". */
function splitTrailingDate(text: string): { text: string; date: string } | null {
  const match = text.trim().match(TRAILING_DATE_RE);
  return match ? { text: match[1].trim(), date: match[2] } : null;
}

/** "GÖNÜLLÜLÜK ÇALIŞMALARI" (as printed) back to "Gönüllülük Çalışmaları". */
function headingToTitle(heading: string): string {
  const locale = /[çğıöşüİ]/i.test(heading) ? 'tr' : 'en';
  return capitalizeWords(heading.toLocaleLowerCase(locale), locale);
}

/** Thrown when a PDF has no recognizable CV structure (no sections and no contact details). */
export class PdfNotCvError extends Error {
  constructor() {
    super('PDF does not look like a CV');
    this.name = 'PdfNotCvError';
  }
}

/** True when the parse found nothing that identifies the document as a CV. */
export function looksLikeCv(cv: CVData): boolean {
  const { email, phone, linkedin, github } = cv.personalInfo;
  return cv.sections.some((s) => s.visible && s.type !== 'personalInfo') || Boolean(email || phone || linkedin || github);
}

export async function parsePdfToCV(file: File): Promise<CVData> {
  // Lazy import keeps pdfjs (~1 MB) out of the initial bundle.
  const { loadPdfPages } = await import('./pdf/textItems');
  const pages = await loadPdfPages(await file.arrayBuffer());
  const cv = parseLinesToCV(buildLayoutLines(pages));
  if (!looksLikeCv(cv)) throw new PdfNotCvError();
  return cv;
}
