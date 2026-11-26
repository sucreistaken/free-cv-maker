import type { CefrSkill, LanguageEntry, SectionType } from '../../../types/cv';

/** Fixed German wording of the Europass CV; it does not follow the UI language or custom section titles. */
export const EUROPASS_SECTION_TITLES: Record<Exclude<SectionType, 'personalInfo'>, string> = {
  summary: 'Über mich',
  experience: 'Praktische Erfahrung',
  projects: 'Projekte',
  education: 'Bildung',
  involvement: 'Ehrenamtliches Engagement',
  skills: 'Kompetenzen',
  certifications: 'Zertifikate',
  languages: 'Sprachkenntnisse',
  awards: 'Auszeichnungen',
  hobbies: 'Hobbys und Interessen',
  references: 'Referenzen',
};

export const EUROPASS_LABELS = {
  birthDate: 'Geburtsdatum',
  nationality: 'Staatsangehörigkeit',
  gender: 'Geschlecht',
  drivingLicense: 'Führerschein',
  contact: 'Kontakt',
  website: 'Website',
  grade: 'Abschlussnote',
  nativeLanguages: 'Muttersprache(n)',
  otherLanguages: 'Weitere Sprache(n)',
  cefrLegend: 'Stufen: A1 und A2: Elementar; B1 und B2: Selbstständig; C1 und C2: Kompetent',
} as const;

export const EUROPASS_CEFR_LABELS: Record<CefrSkill, string> = {
  listening: 'Hören',
  reading: 'Lesen',
  writing: 'Schreiben',
  spokenProduction: 'Zusammenhängendes Sprechen',
  spokenInteraction: 'An Gesprächen teilnehmen',
};

/** Shown for a language that has no CEFR grid. */
export const EUROPASS_PROFICIENCY_LABELS: Record<LanguageEntry['proficiency'], string> = {
  native: 'Muttersprache',
  fluent: 'Fließend',
  intermediate: 'Gute Kenntnisse',
  beginner: 'Grundkenntnisse',
};

/** Europass look: grey sidebar, blue accents, Open Sans. */
export const EUROPASS_STYLE = {
  fontFamily: "'Open Sans', sans-serif",
  sidebarWidth: 255,
  sidebarBg: '#f3f3f3',
  blue: '#1f3f8f',
  text: '#4d4d4d',
  heading: '#3d3d3d',
  rule: '#dcdcdc',
} as const;

/** Paints the sidebar column across the full width of a page; reused for the print canvas. */
export const EUROPASS_PAGE_BACKGROUND = `linear-gradient(to right, ${EUROPASS_STYLE.sidebarBg} 0, ${EUROPASS_STYLE.sidebarBg} ${EUROPASS_STYLE.sidebarWidth}px, #ffffff ${EUROPASS_STYLE.sidebarWidth}px)`;
