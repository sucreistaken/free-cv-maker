import type { CVProfile, CVData, TemplateType, ThemeConfig } from '../types/cv';
import { defaultCV, defaultCoverLetter } from '../data/defaultCV';
import { generateId } from './id';

const PROFILES_KEY = 'cv-builder-profiles';
const OLD_CV_KEY = 'cv-builder-data';
const OLD_APP_KEY = 'cv-builder-app';

export function migrateToProfiles(): { profiles: CVProfile[]; activeProfileId: string } | null {
  // Already migrated?
  const existing = localStorage.getItem(PROFILES_KEY);
  if (existing) return null;

  // Read old data
  let cvData: CVData = { ...defaultCV };
  let appSettings: { template: TemplateType; theme: ThemeConfig } = {
    template: 'classic',
    theme: {
      primaryColor: '#1a1a2e',
      accentColor: '#4a6cf7',
      fontFamily: 'Inter',
      fontSize: 'medium',
      lineSpacing: 'normal',
      pageMargins: 'normal',
      sectionTitleStyle: 'uppercase',
      sectionSpacing: 'normal',
      photoSize: 'md',
      photoShape: 'circle',
      photoVisible: true,
    },
  };

  try {
    const oldCV = localStorage.getItem(OLD_CV_KEY);
    if (oldCV) {
      const parsed = JSON.parse(oldCV);
      if (parsed.state) {
        cvData = { ...defaultCV, ...parsed.state };
        // Ensure profilePhoto field exists
        if (!cvData.personalInfo.profilePhoto) {
          cvData.personalInfo = { ...cvData.personalInfo, profilePhoto: '' };
        }
      }
    }
  } catch { /* use defaults */ }

  try {
    const oldApp = localStorage.getItem(OLD_APP_KEY);
    if (oldApp) {
      const parsed = JSON.parse(oldApp);
      if (parsed.state) {
        appSettings = {
          template: parsed.state.template || appSettings.template,
          theme: { ...appSettings.theme, ...(parsed.state.theme || {}) },
        };
      }
    }
  } catch { /* use defaults */ }

  const id = generateId();
  const now = new Date().toISOString();
  const profile: CVProfile = {
    id,
    name: 'My CV',
    createdAt: now,
    updatedAt: now,
    cvData,
    coverLetterData: { ...defaultCoverLetter },
    appSettings,
  };

  return { profiles: [profile], activeProfileId: id };
}
