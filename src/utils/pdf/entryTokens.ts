// Classification helpers for the pieces of a CV entry header ("Title | Company | City | dates").
// Documents differ in which piece comes first, so the importer decides by what a piece looks
// like (job title, employer, place, school, degree) rather than by its line position.
import { MONTH_PATTERN } from './layout';

/** Matches `words` (a regex source) only as whole words; \b is not Unicode aware. */
function wholeWord(words: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${words})(?![\\p{L}\\p{N}])`, 'iu');
}

export const TITLE_WORDS_RE = wholeWord(
  'developer|engineer|manager|intern|analyst|designer|lead|specialist|consultant|architect|scientist|director|coordinator|' +
    'officer|assistant|administrator|researcher|teacher|instructor|founder|co-founder|ceo|cto|coo|head|president|associate|' +
    'programmer|tester|technician|representative|executive|supervisor|freelancer|trainee|apprentice|' +
    'stajyer|mühendis(?:i)?|geliştirici(?:si)?|uzman(?:ı)?|yönetici(?:si)?|müdür(?:ü)?|danışman(?:ı)?|asistan(?:ı)?|' +
    'koordinatör(?:ü)?|analist(?:i)?|tasarımcı(?:sı)?|araştırmacı(?:sı)?|öğretmen(?:i)?|kurucu(?:su)?|sorumlusu|yardımcısı|temsilcisi',
);

export const COMPANY_WORDS_RE = wholeWord(
  'GmbH|AG|Inc\\.?|Ltd\\.?|LLC|Corp\\.?|Co\\.|PLC|S\\.?A\\.?|A\\.Ş\\.?|Ltd\\.?\\s*Şti\\.?|Şti\\.?|Holding|Group|Technologies|Solutions|' +
    'Studio|Agency|Systems|Labs|Software|Bank|Bankası|Consulting|Partners|Ventures|Foundation|Association',
);

const INSTITUTION_RE = wholeWord(
  'university|college|institute|school|academy|polytechnic|universität|hochschule|üniversitesi|üniversite|enstitüsü|okulu|lisesi|fakültesi|akademi',
);

const DEGREE_RE = new RegExp(
  '(?<![\\p{L}\\p{N}])(?:b\\.?\\s?sc|m\\.?\\s?sc|ph\\.?\\s?d|b\\.?\\s?eng|m\\.?\\s?eng|b\\.?\\s?a|m\\.?\\s?a|mba|bachelor|master|doctorate|diploma|degree|associate|' +
    'lisans|yüksek lisans|doktora|önlisans|ön lisans|bölümü|mühendisliği)(?![\\p{L}\\p{N}])',
  'iu',
);

const REMOTE_RE = /^(?:remote|hybrid|on-?site|uzaktan|hibrit)$/i;
const KNOWN_PLACE_RE =
  /(?<![\p{L}])(?:Turkey|Türkiye|Istanbul|İstanbul|Ankara|İzmir|Izmir|Bursa|Antalya|Adana|USA|U\.S\.A?\.?|UK|Germany|France|Netherlands|Spain|Italy|Berlin|London|Paris|Amsterdam|Munich|Remote)(?![\p{L}])/iu;

export function isInstitutionLike(text: string): boolean {
  return INSTITUTION_RE.test(text);
}

export function isDegreeLike(text: string): boolean {
  return DEGREE_RE.test(text);
}

export function isTitleLike(text: string): boolean {
  return TITLE_WORDS_RE.test(text);
}

/**
 * "City, ST", "City, Country", "Remote", a known place: short pieces with no digits, no job
 * title and no company wording. Does not decide between a place and a bare employer name.
 */
export function isLocationLike(token: string): boolean {
  const t = token.trim().replace(/^[([]+|[)\]]+$/g, '').trim();
  if (!t || t.length > 50 || /\d/.test(t)) return false;
  if (REMOTE_RE.test(t)) return true;
  if (TITLE_WORDS_RE.test(t) || COMPANY_WORDS_RE.test(t) || INSTITUTION_RE.test(t) || DEGREE_RE.test(t)) return false;
  const parts = t.split(',').map((p) => p.trim());
  if (parts.length >= 2) return parts.every((p) => p.length > 0 && p.split(/\s+/).length <= 3);
  return KNOWN_PLACE_RE.test(t);
}

const DURATION_RE = /\s*[(·]?\s*\d+\s*(?:years?|yrs?|yıl)(?:\s*\d+\s*(?:months?|mos?|ay))?\s*\)?|\s*[(·]?\s*\d+\s*(?:months?|mos?|ay)\s*\)?/gi;

/** Drops LinkedIn-style durations such as "(2 years 5 months)". */
export function stripDuration(text: string): string {
  return text.replace(DURATION_RE, ' ').replace(/\(\s*\)/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Splits a header line into pieces on pipes, bullets and spaced dashes. */
export function splitTokens(line: string): string[] {
  return line
    .split(/\s*[|•·]\s*|\s+[–—]\s+/)
    .map((t) => t.replace(/^[\s,;:|()-]+|[\s,;:|(-]+$/g, '').replace(/\s+/g, ' '))
    .filter(Boolean);
}

/** "Role at Company" / "Role @ Company". */
export function splitAtCompany(text: string): { title: string; company: string } | null {
  const m = text.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
  return m && TITLE_WORDS_RE.test(m[1]) ? { title: m[1].trim(), company: m[2].trim() } : null;
}

const DATE_PART = `(?:${MONTH_PATTERN}\\.?\\s*)?(?:19|20)\\d{2}|\\d{1,2}[./]\\d{4}`;
const OPEN = '(?:Present|Current|Now|Günümüz|Devam(?:\\s+Ediyor)?|Halen|Şu\\s+an)';
/** Start and end of a date range, with or without spaces around the dash. */
export const RANGE_RE = new RegExp(`(${DATE_PART})\\s*[-–—]\\s*(${DATE_PART}|${OPEN})`, 'iu');
