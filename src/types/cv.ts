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
  profilePhoto: string;
}

export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
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
  year: string;
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

export interface LanguageEntry {
  id: string;
  language: string;
  proficiency: 'native' | 'fluent' | 'intermediate' | 'beginner';
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

export interface CVSection {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
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
  | 'references';

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

export type TemplateType = 'classic' | 'modern' | 'minimalist' | 'creative' | 'academic' | 'compact' | 'twoColumn';

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
}

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
