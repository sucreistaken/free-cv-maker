export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
  nationality: string;
  drivingLicense: string;
  birthDate: string;
  profilePhoto: string;
  /** Optional, printed by the Europass template (e.g. "Weiblich"). */
  gender?: string;
}

export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  /** Optional site for the employer or product, turns the company into a link. */
  link?: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  link: string;
  date: string;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  startDate: string;
  year: string;
  gpa: string;
  /** Optional, printed by the Europass template (e.g. "Izmir, Türkei"). */
  location?: string;
  /** Optional school site, printed by the Europass template. */
  website?: string;
}

export interface InvolvementEntry {
  id: string;
  role: string;
  organization: string;
  institution: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface SkillCategory {
  id: string;
  category: string;
  items: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  year: string;
  description: string;
}

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/** The five self-assessment skills of the Europass language grid, in print order. */
export const CEFR_SKILLS = ['listening', 'reading', 'writing', 'spokenProduction', 'spokenInteraction'] as const;
export type CefrSkill = (typeof CEFR_SKILLS)[number];
export type CefrGrid = Record<CefrSkill, CefrLevel>;

export interface LanguageEntry {
  id: string;
  language: string;
  proficiency: 'native' | 'fluent' | 'intermediate' | 'beginner';
  /** Optional explicit mother-tongue flag; when absent, proficiency 'native' decides. */
  isNative?: boolean;
  /** Optional CEFR self-assessment, printed by the Europass template. */
  cefr?: CefrGrid;
}

export interface AwardEntry {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
}

export interface ReferenceEntry {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
}

/** One entry of a section the user added (type 'custom'). */
export interface CustomEntry {
  id: string;
  title: string;
  /** Organization, place or a short note, printed under the title. */
  subtitle: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface CVSection {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  /** Entries of a user-added section; only present when `type` is 'custom'. */
  items?: CustomEntry[];
}

export type SectionType =
  | 'personalInfo'
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'involvement'
  | 'skills'
  | 'certifications'
  | 'languages'
  | 'awards'
  | 'hobbies'
  | 'references'
  | 'custom';

/** The sections every CV starts with; 'custom' sections are added by the user. */
export type BuiltInSectionType = Exclude<SectionType, 'custom'>;

export interface CVData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  involvement: InvolvementEntry[];
  skills: SkillCategory[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  awards: AwardEntry[];
  hobbies: string;
  references: ReferenceEntry[];
  sections: CVSection[];
}

export type TemplateType = 'classic' | 'modern' | 'minimalist' | 'creative' | 'academic' | 'compact' | 'twoColumn' | 'europass';

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  lineSpacing: 'compact' | 'normal' | 'relaxed';
  pageMargins: 'narrow' | 'normal' | 'wide';
  sectionTitleStyle: 'uppercase' | 'capitalize' | 'normal';
  sectionSpacing: 'tight' | 'normal' | 'loose';
  photoSize: 'sm' | 'md' | 'lg';
  photoShape: 'circle' | 'rounded' | 'square';
  photoVisible: boolean;
  /** When false the CV drops every icon and badge in favour of plain text. */
  showIcons: boolean;
  /**
   * Fine-tuning overrides. The three-step presets above stay the default; when
   * one of these is set it wins, so a user can nudge a value until the page
   * breaks where they want. Undefined means "follow the preset".
   */
  fontScaleOverride?: number;
  lineHeightOverride?: number;
  pageMarginsOverride?: number;
  sectionSpacingOverride?: number;
}

/** Bounds and step for each fine-tuning slider, shared by the panel and the theme hook. */
export const fineTuneRanges = {
  fontScale: { min: 0.8, max: 1.2, step: 0.01 },
  lineHeight: { min: 1.1, max: 1.9, step: 0.05 },
  pageMargins: { min: 16, max: 90, step: 2 },
  sectionSpacing: { min: 2, max: 28, step: 1 },
} as const;

export interface ExportData {
  version: string;
  exportDate: string;
  cvData: CVData;
  coverLetterData?: CoverLetterData;
  appSettings: { template: TemplateType; theme: ThemeConfig };
}

export interface CoverLetterData {
  recipientName: string;
  recipientTitle: string;
  company: string;
  address: string;
  date: string;
  greeting: string;
  body: string;
  closing: string;
  signature: string;
}

export type DocumentType = 'cv' | 'coverLetter';

export interface CVProfile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  cvData: CVData;
  coverLetterData: CoverLetterData;
  appSettings: { template: TemplateType; theme: ThemeConfig };
}

export interface ProfilesState {
  profiles: CVProfile[];
  activeProfileId: string;
}
