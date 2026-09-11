import type {
  CVData,
  CVSection,
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
import { buildLayoutLines, foldTurkish, BULLET_RE, type LayoutLine } from './pdf/layout';

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

const MONTH = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık|Oca|Şub|Nis|May|Haz|Tem|Ağu|Eyl|Eki|Kas|Ara)';
const DATE_TOKEN = `(?:${MONTH}\\.?\\s*\\d{4}|\\d{1,2}[./]\\d{4}|\\b(?:19|20)\\d{2}\\b)`;
const OPEN_END = '(?:Present|Current|Now|Günümüz|Devam(?:\\s+Ediyor)?|Halen|Şu\\s+an)';
const DATE_RANGE_RE = new RegExp(`${DATE_TOKEN}\\s*[-–—]\\s*(?:${DATE_TOKEN}|${OPEN_END})`, 'i');
const YEAR_RE = /\b(19|20)\d{2}\b/;
const GPA_RE = /\b(?:GPA|Not(?:\s*Ort(?:alaması|\.)?)?|Ortalama)\s*:?\s*([\d.,]+(?:\s*\/\s*[\d.,]+)?)/i;
const SEPARATOR_RE = /\s*[•·|]\s*/;

const TITLE_WORDS_RE = /\b(developer|engineer|manager|intern|analyst|designer|lead|specialist|consultant|architect|scientist|director|coordinator|officer|assistant|administrator|researcher|teacher|instructor|stajyer|mühendis(?:i)?|geliştirici(?:si)?|uzman(?:ı)?|yönetici(?:si)?|müdür(?:ü)?|danışman(?:ı)?|asistan(?:ı)?|koordinatör(?:ü)?|analist(?:i)?|tasarımcı(?:sı)?|araştırmacı(?:sı)?|öğretmen(?:i)?)\b/i;
const COMPANY_WORDS_RE = /\b(GmbH|Inc\.?|Ltd\.?|LLC|Corp\.?|Co\.|A\.Ş\.?|Ltd\.?\s*Şti\.?|Holding|Group|Technologies|Solutions|Studio|Agency|University|Üniversitesi|Bank|Bankası)\b/i;

// ── Section detection ──

interface Section {
  type: SectionType;
  title: string;
  lines: string[];
}

function matchHeading(text: string): HeadingType | undefined {
  const key = headingKey(text);
  if (!key) return undefined;
  const exact = HEADING_LOOKUP[key];
  if (exact) return exact;
  // Decorated headings: "Work Experience & Internships", "Skills (Technical)".
  for (const known of HEADING_KEYS_BY_LENGTH) {
    if (known.length >= 6 && key.includes(known)) return HEADING_LOOKUP[known];
  }
  return undefined;
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

  for (const line of lines) {
    const text = line.text.trim();
    const matchedType = matchHeading(text);
    const looksLikeHeading =
      text.length < 40 && !line.isBullet && (line.fontSize >= bodyFontSize * 0.95 || isAllCaps(text));

    if (matchedType && looksLikeHeading) {
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
      currentSection.lines.push(text);
    }
  }

  return { headerLines, sections };
}

// ── Personal info parsing ──

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
  info.fullName = lines[nameIndex].text.trim();

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
      !isAllCaps(t) &&
      (t.match(/[•|·]/g) || []).length < 2 &&
      !/,/.test(t)
    ) {
      info.jobTitle = t;
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
    if (!rest || rest.length > 40 || /\d/.test(rest)) continue;
    if (hadContact || /,/.test(rest) || knownPlaces.test(rest)) {
      // Rebuild "City, Country" punctuation lost by token stripping.
      const original = t.replace(new RegExp(EMAIL_RE.source, 'g'), ' ');
      const commaForm = original.match(/[\p{L}.\s-]+,\s*[\p{L}.\s-]+/u);
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

/** "Company, City, Country" → company + location; leaves "Acme, Inc." alone. */
function splitCompanyLocation(text: string): { company: string; location: string } {
  const idx = text.indexOf(',');
  if (idx === -1) return { company: text.trim(), location: '' };
  const head = text.slice(0, idx).trim();
  const tail = text.slice(idx + 1).trim();
  if (/^(Inc|Ltd|LLC|GmbH|Co|Corp|A\.Ş|Şti)\.?$/i.test(tail)) return { company: text.trim(), location: '' };
  return { company: head, location: tail };
}

// ── Experience parsing ──

function parseExperience(lines: string[]): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  let current: Partial<ExperienceEntry> | null = null;

  const pushCurrent = () => {
    if (current && (current.title || current.company)) {
      let title = current.title || '';
      let company = current.company || '';
      // Some templates print the employer on the lead line and the role beneath it.
      const leadLooksLikeCompany = COMPANY_WORDS_RE.test(title) && !TITLE_WORDS_RE.test(title);
      const secondLooksLikeTitle = TITLE_WORDS_RE.test(company) && !TITLE_WORDS_RE.test(title);
      if (company && (leadLooksLikeCompany || secondLooksLikeTitle)) {
        [title, company] = [company, title];
      }
      entries.push({
        id: generateId(),
        title,
        company,
        location: current.location || '',
        startDate: current.startDate || '',
        endDate: current.endDate || '',
        bullets: current.bullets || [],
      });
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (BULLET_RE.test(trimmed) && trimmed.replace(BULLET_RE, '').length > 0) {
      if (!current) current = { title: '', company: '', location: '', startDate: '', endDate: '', bullets: [] };
      current.bullets = current.bullets || [];
      current.bullets.push(trimmed.replace(BULLET_RE, '').trim());
      continue;
    }

    const dateInfo = extractDateRange(trimmed);

    if (dateInfo) {
      if (current && current.title && !current.startDate && !current.company && !current.bullets?.length && !dateInfo.beforeDate) {
        // Date on its own line right after the title line.
        current.startDate = dateInfo.startDate;
        current.endDate = dateInfo.endDate;
        if (dateInfo.afterDate) current.location = dateInfo.afterDate;
        continue;
      }
      pushCurrent();
      current = {
        title: dateInfo.beforeDate,
        company: '',
        location: dateInfo.afterDate,
        startDate: dateInfo.startDate,
        endDate: dateInfo.endDate,
        bullets: [],
      };
      continue;
    }

    if (current) {
      if (current.title && !current.company) {
        const split = current.location ? { company: trimmed, location: '' } : splitCompanyLocation(trimmed);
        current.company = split.company;
        if (split.location) current.location = split.location;
      } else if (current.title && current.company && !current.location && trimmed.length < 50 && !current.bullets?.length) {
        current.location = trimmed;
      } else {
        pushCurrent();
        current = { title: trimmed, company: '', location: '', startDate: '', endDate: '', bullets: [] };
      }
    } else {
      current = { title: trimmed, company: '', location: '', startDate: '', endDate: '', bullets: [] };
    }
  }

  pushCurrent();
  return entries;
}

// ── Education parsing ──

const YEAR_RANGE_RE = new RegExp(`\\b((?:19|20)\\d{2})\\s*[-–—]\\s*((?:19|20)\\d{2}|${OPEN_END})\\b`, 'i');

function parseEducation(lines: string[]): EducationEntry[] {
  const entries: EducationEntry[] = [];
  let current: Partial<EducationEntry> | null = null;

  const pushCurrent = () => {
    if (current && (current.institution || current.degree)) {
      entries.push({
        id: generateId(),
        degree: current.degree || '',
        institution: current.institution || '',
        startDate: current.startDate || '',
        year: current.year || '',
        gpa: current.gpa || '',
      });
    }
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(SEPARATOR_RE).map((p) => p.trim()).filter(Boolean);
    const texts: string[] = [];
    let startDate = '';
    let year = '';
    let gpa = '';

    for (const part of parts) {
      let rest = part;
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
      rest = rest.replace(/^[\s,|:–—-]+|[\s,|:–—-]+$/g, '').replace(/\s+/g, ' ');
      if (rest) texts.push(rest);
    }

    const startsNewEntry = texts.length > 0 && !!current && !!current.degree && !!current.institution;
    if (startsNewEntry) pushCurrent();
    if (!current) current = { degree: '', institution: '', startDate: '', year: '', gpa: '' };

    for (const text of texts) {
      if (!current.degree) current.degree = text;
      else if (!current.institution) current.institution = text;
      else current.institution += `, ${text}`;
    }
    if (startDate && !current.startDate) current.startDate = startDate;
    if (year && !current.year) current.year = year;
    if (gpa && !current.gpa) current.gpa = gpa;
  }

  pushCurrent();
  return entries;
}

// ── Skills parsing ──

function toTitleCase(text: string): string {
  return text.toLowerCase().replace(/(^|\s|&)(\p{L})/gu, (m) => m.toUpperCase());
}

function parseSkills(lines: string[]): SkillCategory[] {
  const categories: SkillCategory[] = [];

  const appendToLast = (items: string) => {
    const last = categories[categories.length - 1];
    if (last) {
      last.items = last.items ? `${last.items}, ${items}` : items;
    } else {
      categories.push({ id: generateId(), category: 'General', items });
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // "Category: item1, item2, item3"
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0 && colonIndex < 35) {
      const category = trimmed.substring(0, colonIndex).trim();
      const items = trimmed.substring(colonIndex + 1).trim();
      categories.push({ id: generateId(), category, items });
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
  'fluent': 'fluent', 'ileri': 'fluent', 'advanced': 'fluent', 'akıcı': 'fluent', 'proficient': 'fluent', 'c1': 'fluent',
  'intermediate': 'intermediate', 'orta': 'intermediate', 'conversational': 'intermediate', 'b1': 'intermediate', 'b2': 'intermediate',
  'beginner': 'beginner', 'başlangıç': 'beginner', 'basic': 'beginner',
  'temel': 'beginner', 'elementary': 'beginner', 'a1': 'beginner', 'a2': 'beginner',
};

const PROFICIENCY_LABELS = Object.keys(PROFICIENCY_MAP).sort((a, b) => b.length - a.length);
const PROFICIENCY_SPLIT_RE = new RegExp(
  `\\s*[(:\\-–—]?\\s*(${PROFICIENCY_LABELS.map((l) => l.replace(/\s+/g, '\\s+')).join('|')})\\)?(?=[,;\\s]|$)`,
  'iu',
);

function lookupProficiency(label: string): LanguageEntry['proficiency'] {
  return PROFICIENCY_MAP[foldTurkish(label).replace(/\s+/g, ' ')] || PROFICIENCY_MAP[label.toLowerCase()] || 'intermediate';
}

function parseLanguages(lines: string[]): LanguageEntry[] {
  const entries: LanguageEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const pieces = trimmed.split(new RegExp(PROFICIENCY_SPLIT_RE.source, 'giu'));
    if (pieces.length >= 3) {
      // [lang, label, lang, label, ..., tail]
      for (let i = 0; i + 1 < pieces.length; i += 2) {
        const language = pieces[i].replace(/^[,;\s]+|[,;\s]+$/g, '');
        if (!language) continue;
        entries.push({ id: generateId(), language, proficiency: lookupProficiency(pieces[i + 1]) });
      }
      const tail = pieces[pieces.length - 1].replace(/^[,;\s]+|[,;\s]+$/g, '');
      if (tail && pieces.length % 2 === 1) {
        for (const p of tail.split(/[,;]/).map((s) => s.trim()).filter(Boolean)) {
          entries.push({ id: generateId(), language: p, proficiency: 'intermediate' });
        }
      }
      continue;
    }

    for (const part of trimmed.split(/[,;]/)) {
      const p = part.trim();
      if (p.length > 1 && p.length < 30) entries.push({ id: generateId(), language: p, proficiency: 'intermediate' });
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
    entry.name = entry.name!.replace(URL_RE, '').replace(/[|,•·\s]+$/, '').trim();
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
      const parts = trimmed.split(SEPARATOR_RE).map((p) => p.trim()).filter(Boolean);
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
      const parts = trimmed.split(SEPARATOR_RE).map((p) => p.trim()).filter(Boolean);
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

  for (const section of sections) {
    switch (section.type) {
      case 'summary':
        summary = [summary, section.lines.join(' ').trim()].filter(Boolean).join(' ');
        break;
      case 'experience':
        experience = experience.concat(parseExperience(section.lines));
        break;
      case 'education':
        education = education.concat(parseEducation(section.lines));
        break;
      case 'skills':
        skills = skills.concat(parseSkills(section.lines));
        break;
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

  cvData.sections = buildSections(cvData);
  return cvData;
}

export async function parsePdfToCV(file: File): Promise<CVData> {
  // Lazy import keeps pdfjs (~1 MB) out of the initial bundle.
  const { loadPdfPages } = await import('./pdf/textItems');
  const pages = await loadPdfPages(await file.arrayBuffer());
  return parseLinesToCV(buildLayoutLines(pages));
}
