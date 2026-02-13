import type { CVData, CoverLetterData, ExportData, TemplateType, ThemeConfig } from '../types/cv';
import { defaultCV, defaultCoverLetter } from '../data/defaultCV';
import { generateId } from './id';

const CURRENT_VERSION = '1.0';

export function exportToJson(
  cvData: CVData,
  appSettings: { template: TemplateType; theme: ThemeConfig },
  coverLetterData?: CoverLetterData
): string {
  const exportData: ExportData = {
    version: CURRENT_VERSION,
    exportDate: new Date().toISOString(),
    cvData,
    coverLetterData,
    appSettings,
  };
  return JSON.stringify(exportData, null, 2);
}

export function downloadJsonFile(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateImportData(jsonString: string): { valid: true; data: ExportData } | { valid: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { valid: false, error: 'Invalid JSON format.' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { valid: false, error: 'Import data must be a JSON object.' };
  }

  const obj = parsed as Record<string, unknown>;

  if (!obj.cvData || typeof obj.cvData !== 'object') {
    return { valid: false, error: 'Missing or invalid cvData in import file.' };
  }

  const cvData = obj.cvData as Record<string, unknown>;
  if (!cvData.personalInfo || typeof cvData.personalInfo !== 'object') {
    return { valid: false, error: 'Missing personalInfo in cvData.' };
  }

  const merged = mergeWithDefaults(obj as Partial<ExportData>);
  return { valid: true, data: merged };
}

export function mergeWithDefaults(partial: Partial<ExportData>): ExportData {
  const defaultSections = defaultCV.sections.map((s) => ({
    ...s,
    id: generateId(),
  }));

  const partialCV = (partial.cvData || {}) as Partial<CVData>;
  const personalInfo = { ...defaultCV.personalInfo, ...(partialCV.personalInfo || {}) };

  const cvData: CVData = {
    personalInfo,
    summary: partialCV.summary ?? defaultCV.summary,
    experience: partialCV.experience ?? defaultCV.experience,
    projects: partialCV.projects ?? defaultCV.projects,
    education: partialCV.education ?? defaultCV.education,
    involvement: partialCV.involvement ?? defaultCV.involvement,
    skills: partialCV.skills ?? defaultCV.skills,
    certifications: partialCV.certifications ?? defaultCV.certifications,
    languages: partialCV.languages ?? defaultCV.languages,
    awards: partialCV.awards ?? defaultCV.awards,
    hobbies: partialCV.hobbies ?? defaultCV.hobbies,
    references: partialCV.references ?? defaultCV.references,
    sections: partialCV.sections ?? defaultSections,
  };

  const coverLetterData: CoverLetterData = partial.coverLetterData
    ? { ...defaultCoverLetter, ...partial.coverLetterData }
    : { ...defaultCoverLetter };

  const defaultAppSettings = {
    template: 'classic' as TemplateType,
    theme: {
      primaryColor: '#1a1a2e',
      accentColor: '#4a6cf7',
      fontFamily: 'Inter',
      fontSize: 'medium' as const,
      lineSpacing: 'normal' as const,
      pageMargins: 'normal' as const,
      sectionTitleStyle: 'uppercase' as const,
      sectionSpacing: 'normal' as const,
      photoSize: 'md' as const,
      photoShape: 'circle' as const,
      photoVisible: true,
    },
  };

  const appSettings = partial.appSettings
    ? {
        template: partial.appSettings.template || defaultAppSettings.template,
        theme: { ...defaultAppSettings.theme, ...(partial.appSettings.theme || {}) },
      }
    : defaultAppSettings;

  return {
    version: partial.version || CURRENT_VERSION,
    exportDate: partial.exportDate || new Date().toISOString(),
    cvData,
    coverLetterData,
    appSettings,
  };
}
