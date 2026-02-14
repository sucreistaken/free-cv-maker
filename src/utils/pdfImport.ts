import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
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

// Use Vite ?url import for reliable worker loading
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

// ── Section keyword dictionary (TR + EN) ──

const SECTION_KEYWORDS: Record<string, SectionType> = {
  'summary': 'summary', 'profile': 'summary', 'profil': 'summary',
  'about': 'summary', 'about me': 'summary', 'hakkımda': 'summary',
  'özet': 'summary', 'objective': 'summary', 'career objective': 'summary',

  'experience': 'experience', 'work experience': 'experience',
  'professional experience': 'experience', 'deneyim': 'experience',
  'iş deneyimi': 'experience', 'employment': 'experience',
  'employment history': 'experience', 'work history': 'experience',

  'education': 'education', 'eğitim': 'education',

  'skills': 'skills', 'technical skills': 'skills', 'beceriler': 'skills',
  'yetenekler': 'skills', 'core competencies': 'skills',

  'projects': 'projects', 'projeler': 'projects', 'personal projects': 'projects',
  'project': 'projects',

  'certifications': 'certifications', 'certificates': 'certifications',
  'sertifikalar': 'certifications', 'certification': 'certifications',

  'languages': 'languages', 'diller': 'languages',

  'awards': 'awards', 'honors': 'awards', 'ödüller': 'awards',
  'honors & awards': 'awards', 'awards & honors': 'awards',

  'hobbies': 'hobbies', 'interests': 'hobbies', 'hobiler': 'hobbies',
  'ilgi alanları': 'hobbies',

  'references': 'references', 'referanslar': 'references',

  'involvement': 'involvement', 'volunteering': 'involvement',
  'volunteer': 'involvement', 'gönüllülük': 'involvement',
  'aktiviteler': 'involvement', 'activities': 'involvement',
  'extracurricular': 'involvement', 'extracurricular activities': 'involvement',
};

// ── Regex patterns ──

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{0,4})?/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s,)]*)?/;

// Matches: "Mon YYYY - Mon YYYY", "Mon YYYY - Present", etc.
const DATE_RANGE_RE = /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\.?\s*\d{4})\s*[-–—]\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\.?\s*\d{4}|Present|Current|Günümüz|Devam|Halen)/i;
const YEAR_RE = /\b(19|20)\d{2}\b/;
const BULLET_RE = /^[\u2022•\-\*\u25E6\u25AA\u25CF\u2023\u2043\u27A2➢]\s*/;

// ── PDF text extraction ──

interface TextLine {
  text: string;
  y: number;
  fontSize: number;
}

async function extractTextLines(file: File): Promise<TextLine[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines: TextLine[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const pageHeight = viewport.height;
    const pageOffset = (pageNum - 1) * pageHeight;
    const content = await page.getTextContent();

    const rawItems = content.items.filter(
      (item): item is TextItem => 'str' in item && item.str.trim().length > 0,
    );

    // Group items by y-coordinate into lines
    // Items on the same visual line share (approximately) the same y
    const lineMap = new Map<number, { texts: { str: string; x: number }[]; fontSize: number }>();

    for (const item of rawItems) {
      // PDF y is bottom-up; convert to top-down global coordinate
      const y = pageOffset + (pageHeight - item.transform[5]);
      const x = item.transform[4];
      const fontSize = Math.abs(item.transform[0]);

      // Find existing line within threshold (half the font size, min 2)
      const threshold = Math.max(fontSize * 0.5, 2);
      let matchedKey: number | null = null;
      for (const key of lineMap.keys()) {
        if (Math.abs(key - y) < threshold) {
          matchedKey = key;
          break;
        }
      }

      if (matchedKey !== null) {
        const entry = lineMap.get(matchedKey)!;
        entry.texts.push({ str: item.str, x });
        if (fontSize > entry.fontSize) entry.fontSize = fontSize;
      } else {
        lineMap.set(y, { texts: [{ str: item.str, x }], fontSize });
      }
    }

    // Sort lines top-to-bottom, and within each line sort items left-to-right
    const sorted = [...lineMap.entries()].sort((a, b) => a[0] - b[0]);
    for (const [y, val] of sorted) {
      val.texts.sort((a, b) => a.x - b.x);
      const text = val.texts.map((t) => t.str).join(' ').trim();
      if (text) lines.push({ text, y, fontSize: val.fontSize });
    }
  }

  return lines;
}

// ── Section detection ──

interface Section {
  type: SectionType;
  title: string;
  lines: string[];
}

function normalizeForKeyword(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[:\-–—_|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectSections(textLines: TextLine[]): { headerLines: string[]; sections: Section[] } {
  const headerLines: string[] = [];
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  // Compute body font size (the most common font size = body text)
  const fontSizeCounts = new Map<number, number>();
  for (const line of textLines) {
    const rounded = Math.round(line.fontSize * 2) / 2; // round to 0.5
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

  for (const line of textLines) {
    const normalized = normalizeForKeyword(line.text);
    const matchedType = SECTION_KEYWORDS[normalized];

    // A section heading if:
    // 1. Matches a keyword AND
    // 2. Font size >= body size (headings are same size or larger) AND
    // 3. The line is short (headings are typically just the title)
    if (matchedType && line.fontSize >= bodyFontSize * 0.95 && line.text.trim().length < 40) {
      currentSection = { type: matchedType, title: line.text.trim(), lines: [] };
      sections.push(currentSection);
      continue;
    }

    if (currentSection) {
      currentSection.lines.push(line.text);
    } else {
      headerLines.push(line.text);
    }
  }

  return { headerLines, sections };
}

// ── Personal info parsing ──

function parsePersonalInfo(lines: string[]): CVData['personalInfo'] {
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
    profilePhoto: '',
  };

  if (lines.length === 0) return info;

  // First line is always the name (largest font, first element)
  info.fullName = lines[0].trim();

  // Scan all header lines for contact info
  const allText = lines.join(' ');

  // Email
  const emailMatch = allText.match(EMAIL_RE);
  if (emailMatch) info.email = emailMatch[0];

  // Phone — find the longest valid phone match
  const phoneMatches = allText.match(new RegExp(PHONE_RE.source, 'g'));
  if (phoneMatches) {
    for (const pm of phoneMatches) {
      const digits = pm.replace(/[^\d]/g, '');
      if (digits.length >= 7 && digits.length <= 15) {
        info.phone = pm.trim();
        break;
      }
    }
  }

  // LinkedIn
  const linkedinMatch = allText.match(LINKEDIN_RE);
  if (linkedinMatch) {
    const raw = linkedinMatch[0];
    const inMatch = raw.match(/in\/[a-zA-Z0-9_-]+/i);
    info.linkedin = inMatch ? inMatch[0] : raw;
  }

  // GitHub
  const githubMatch = allText.match(GITHUB_RE);
  if (githubMatch) {
    info.github = githubMatch[0].replace(/https?:\/\/(www\.)?github\.com\//i, '');
  }

  // Job title: second line if it's not contact info
  for (let i = 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (
      !EMAIL_RE.test(t) &&
      !PHONE_RE.test(t) &&
      !URL_RE.test(t) &&
      t.length > 2 &&
      t.length < 60 &&
      !t.includes('@') &&
      // Not a contact bar line (multiple items separated by pipes/bullets)
      (t.match(/[•|·]/g) || []).length < 2
    ) {
      info.jobTitle = t;
      break;
    }
  }

  // Location: look for city/country patterns in contact lines
  const locationPatterns = /\b(Turkey|Türkiye|Istanbul|İstanbul|Ankara|İzmir|Adana|Bursa|Antalya|USA|UK|Germany|France|Netherlands|Berlin|London|New York|San Francisco|California|Texas)\b/i;
  for (const line of lines.slice(1)) {
    const t = line.trim();
    if (locationPatterns.test(t)) {
      // Extract just the location part — strip emails, phones, URLs
      let loc = t
        .replace(EMAIL_RE, '')
        .replace(PHONE_RE, '')
        .replace(LINKEDIN_RE, '')
        .replace(GITHUB_RE, '')
        .replace(URL_RE, '')
        .replace(/[•|·]/g, ',')
        .trim();
      // Take the part that contains the location keyword
      const parts = loc.split(',').map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        if (locationPatterns.test(part)) {
          info.location = part;
          break;
        }
      }
      if (info.location) break;
    }
  }

  // Website: any URL that's not linkedin or github
  for (const line of lines) {
    const urls = line.match(new RegExp(URL_RE.source, 'g'));
    if (urls) {
      for (const url of urls) {
        if (!LINKEDIN_RE.test(url) && !GITHUB_RE.test(url) && !/[@]/.test(url)) {
          info.website = url;
          break;
        }
      }
      if (info.website) break;
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

function parseExperience(lines: string[]): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  let current: Partial<ExperienceEntry> | null = null;

  const pushCurrent = () => {
    if (current && (current.title || current.company)) {
      entries.push({
        id: generateId(),
        title: current.title || '',
        company: current.company || '',
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

    const isBullet = BULLET_RE.test(trimmed);

    // Bullet point → add to current entry
    if (isBullet) {
      if (current) {
        current.bullets = current.bullets || [];
        current.bullets.push(trimmed.replace(BULLET_RE, '').trim());
      }
      continue;
    }

    // Try to extract a date range from this line
    const dateInfo = extractDateRange(trimmed);

    if (dateInfo) {
      // Line has a date range — this starts a new entry
      // Format from app: "Title  Jul 2025 - Aug 2025, Location"
      // beforeDate = title, afterDate = location (after date, comma-stripped)
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

    // Non-bullet, no date: title line, company line, or location line
    if (current) {
      if (current.title && !current.company) {
        current.company = trimmed;
      } else if (current.title && current.company && !current.location && trimmed.length < 50) {
        current.location = trimmed;
      } else {
        // New entry without a date
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

function parseEducation(lines: string[]): EducationEntry[] {
  const entries: EducationEntry[] = [];
  let current: Partial<EducationEntry> | null = null;

  const pushCurrent = () => {
    if (current && (current.institution || current.degree)) {
      entries.push({
        id: generateId(),
        degree: current.degree || '',
        institution: current.institution || '',
        year: current.year || '',
      });
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Handle "Institution • Year" or "Degree  Institution • Year" format
    const bulletSep = trimmed.match(/^(.+?)\s*[•·]\s*(.+)$/);
    const yearMatch = trimmed.match(YEAR_RE);

    if (bulletSep) {
      // "Something • Something" — could be "Institution • Year" or "Degree • Institution"
      const left = bulletSep[1].trim();
      const right = bulletSep[2].trim();
      const rightYear = right.match(YEAR_RE);

      if (rightYear) {
        // "Institution • 2021" or "Degree  Institution • 2021"
        if (current && current.degree && !current.institution) {
          // Degree already set, institution missing — merge into same entry
          current.institution = left;
          current.year = rightYear[0];
        } else if (current && current.degree && current.institution) {
          // Both filled — truly a new entry
          pushCurrent();
          current = { degree: '', institution: left, year: rightYear[0] };
        } else if (current && !current.degree) {
          // First line was degree, this is institution + year
          current.institution = left;
          current.year = rightYear[0];
        } else {
          current = { degree: '', institution: left, year: rightYear[0] };
        }
      } else {
        pushCurrent();
        current = { degree: left, institution: right, year: '' };
      }
      continue;
    }

    if (!current) {
      current = { degree: '', institution: '', year: '' };
    }

    if (yearMatch && !current.year) {
      current.year = yearMatch[0];
      const rest = trimmed.replace(YEAR_RE, '').replace(/[-–—,|•·]/g, ' ').trim();
      if (rest) {
        if (!current.institution) current.institution = rest;
        else if (!current.degree) current.degree = rest;
      }
    } else if (!current.degree) {
      current.degree = trimmed;
    } else if (!current.institution) {
      current.institution = trimmed;
    } else {
      pushCurrent();
      current = { degree: trimmed, institution: '', year: '' };
    }
  }

  pushCurrent();
  return entries;
}

// ── Skills parsing ──

function parseSkills(lines: string[]): SkillCategory[] {
  const categories: SkillCategory[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // "Category: item1, item2, item3" format
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0 && colonIndex < 35) {
      const category = trimmed.substring(0, colonIndex).trim();
      const items = trimmed.substring(colonIndex + 1).trim();
      if (items) {
        categories.push({ id: generateId(), category, items });
        continue;
      }
    }

    // Comma-separated items without category label
    const existing = categories.find((c) => c.category === 'General');
    if (existing) {
      existing.items += existing.items ? `, ${trimmed}` : trimmed;
    } else {
      categories.push({ id: generateId(), category: 'General', items: trimmed });
    }
  }

  return categories;
}

// ── Languages parsing ──

const PROFICIENCY_MAP: Record<string, LanguageEntry['proficiency']> = {
  'native': 'native', 'ana dil': 'native', 'mother tongue': 'native',
  'fluent': 'fluent', 'ileri': 'fluent', 'advanced': 'fluent',
  'intermediate': 'intermediate', 'orta': 'intermediate',
  'beginner': 'beginner', 'başlangıç': 'beginner', 'basic': 'beginner',
  'temel': 'beginner', 'elementary': 'beginner',
};

function parseLanguages(lines: string[]): LanguageEntry[] {
  const entries: LanguageEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Handle comma/space separated languages on one line
    const parts = trimmed.split(/[,;]/);
    for (const part of parts) {
      const p = part.trim();
      if (!p) continue;

      // "Language (Level)" or "Language - Level" or "Language: Level"
      const match = p.match(/^(.+?)\s*[\(\-–—:]\s*(.+?)\s*\)?$/);
      if (match) {
        const lang = match[1].trim();
        const levelStr = match[2].trim().toLowerCase();
        const proficiency = PROFICIENCY_MAP[levelStr] || 'intermediate';
        entries.push({ id: generateId(), language: lang, proficiency });
      } else if (p.length > 1 && p.length < 30) {
        // Check if this is "Language Level" (two words)
        const twoWord = p.match(/^(\S+)\s+(Native|Fluent|Intermediate|Beginner|Advanced|Basic|Ana\s+Dil|İleri|Orta|Başlangıç|Temel)$/i);
        if (twoWord) {
          const proficiency = PROFICIENCY_MAP[twoWord[2].toLowerCase()] || 'intermediate';
          entries.push({ id: generateId(), language: twoWord[1], proficiency });
        } else {
          entries.push({ id: generateId(), language: p, proficiency: 'intermediate' });
        }
      }
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

    const isBullet = BULLET_RE.test(trimmed);

    if (isBullet) {
      if (current) {
        current.bullets = current.bullets || [];
        current.bullets.push(trimmed.replace(BULLET_RE, '').trim());
      }
      continue;
    }

    // Non-bullet line
    if (current && current.name) {
      // Check if this is metadata for the current project
      const hasUrl = URL_RE.test(trimmed);
      const dateMatch = trimmed.match(DATE_RANGE_RE);
      const yearMatch = trimmed.match(YEAR_RE);

      // Lines like "link • date" from the app's template
      if ((hasUrl || dateMatch || yearMatch) && trimmed.length < 80) {
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

      // Otherwise it's a new project name
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

  // Extract inline date range
  const dateInfo = extractDateRange(text);
  if (dateInfo) {
    entry.date = `${dateInfo.startDate} - ${dateInfo.endDate}`;
    entry.name = dateInfo.beforeDate || dateInfo.afterDate;
  }

  // Extract inline URL
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

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isBullet = BULLET_RE.test(trimmed);

    if (isBullet && current) {
      // Bullet = description
      const bulletText = trimmed.replace(BULLET_RE, '').trim();
      current.description = current.description
        ? current.description + ' ' + bulletText
        : bulletText;
      continue;
    }

    const yearMatch = trimmed.match(YEAR_RE);

    if (!current) {
      current = { name: trimmed, issuer: '', year: '', description: '' };
      if (yearMatch) {
        current.year = yearMatch[0];
        current.name = trimmed.replace(YEAR_RE, '').replace(/[-–—,|•·]/g, ' ').trim();
      }
    } else if (!current.issuer) {
      // "issuer • year" format from app
      const bulletSep = trimmed.match(/^(.+?)\s*[•·]\s*(.+)$/);
      if (bulletSep) {
        current.issuer = bulletSep[1].trim();
        const ym = bulletSep[2].match(YEAR_RE);
        if (ym) current.year = ym[0];
      } else {
        current.issuer = trimmed;
        if (yearMatch && !current.year) current.year = yearMatch[0];
      }
    } else {
      // Next cert entry
      pushCurrent();
      current = { name: trimmed, issuer: '', year: '', description: '' };
      if (yearMatch) {
        current.year = yearMatch[0];
        current.name = trimmed.replace(YEAR_RE, '').replace(/[-–—,|•·]/g, ' ').trim();
      }
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

    const isBullet = BULLET_RE.test(trimmed);

    if (isBullet && current) {
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
        current.organization = trimmed;
      } else if (current.role && !current.institution) {
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

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const yearMatch = trimmed.match(YEAR_RE);

    if (!current) {
      current = { title: trimmed, issuer: '', year: yearMatch?.[0] || '', description: '' };
      if (yearMatch) current.title = trimmed.replace(YEAR_RE, '').replace(/[-–—,|•·]/g, ' ').trim();
    } else if (!current.issuer) {
      current.issuer = trimmed;
      if (yearMatch && !current.year) current.year = yearMatch[0];
    } else {
      entries.push({
        id: generateId(),
        title: current.title || '',
        issuer: current.issuer || '',
        year: current.year || '',
        description: current.description || '',
      });
      current = { title: trimmed, issuer: '', year: yearMatch?.[0] || '', description: '' };
      if (yearMatch) current.title = trimmed.replace(YEAR_RE, '').replace(/[-–—,|•·]/g, ' ').trim();
    }
  }

  if (current && current.title) {
    entries.push({
      id: generateId(),
      title: current.title || '',
      issuer: current.issuer || '',
      year: current.year || '',
      description: current.description || '',
    });
  }

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
      current = {};
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      pushCurrent();
      continue;
    }

    if (EMAIL_RE.test(trimmed)) {
      current.email = trimmed.match(EMAIL_RE)![0];
    } else if (PHONE_RE.test(trimmed) && trimmed.replace(/[^\d]/g, '').length >= 7) {
      current.phone = trimmed.match(PHONE_RE)![0];
    } else if (!current.name) {
      current.name = trimmed;
    } else if (!current.title) {
      // "title, company" format
      const parts = trimmed.split(',').map((p) => p.trim());
      current.title = parts[0];
      if (parts[1]) current.company = parts[1];
    } else if (!current.company) {
      current.company = trimmed;
    }
  }

  pushCurrent();
  return entries;
}

// ── Build sections list ──

function buildSections(cvData: CVData): CVSection[] {
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

export async function parsePdfToCV(file: File): Promise<CVData> {
  const textLines = await extractTextLines(file);
  const { headerLines, sections } = detectSections(textLines);

  if (import.meta.env.DEV) {
    console.log('[PDF Import] Extracted lines:', textLines.map(l => ({
      text: l.text, fontSize: l.fontSize.toFixed(1),
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
        summary = section.lines.join(' ').trim();
        break;
      case 'experience':
        experience = parseExperience(section.lines);
        break;
      case 'education':
        education = parseEducation(section.lines);
        break;
      case 'skills':
        skills = parseSkills(section.lines);
        break;
      case 'projects':
        projects = parseProjects(section.lines);
        break;
      case 'certifications':
        certifications = parseCertifications(section.lines);
        break;
      case 'languages':
        languages = parseLanguages(section.lines);
        break;
      case 'awards':
        awards = parseAwards(section.lines);
        break;
      case 'hobbies':
        hobbies = section.lines.join(', ').trim();
        break;
      case 'references':
        references = parseReferences(section.lines);
        break;
      case 'involvement':
        involvement = parseInvolvement(section.lines);
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
