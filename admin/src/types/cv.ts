// Structural subset of the main app's CV types, needed to render a stored snapshot.
// Pure interfaces, no runtime code — keep in sync with ../../../src/types/cv.ts

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
}

export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
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

export interface CVSection {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
}

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

/** One row from the `cv_snapshots` D1 table, as returned by the admin API. */
export interface CvSnapshot {
  id: number;
  device_id: string;
  profile_id: string;
  profile_name: string;
  full_name: string | null;
  cv_data: string;
  cover_letter_data: string | null;
  template: string;
  theme: string | null;
  language: string;
  user_agent: string | null;
  first_seen_at: string;
  last_synced_at: string;
  sync_count: number;
}
