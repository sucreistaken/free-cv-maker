import type { CVData } from '../types/cv';
import { useAppStore } from '../store/useAppStore';
import { useCVStore } from '../store/useCVStore';
import { exportToJson, downloadJsonFile } from './export';

const CV_KEYS: (keyof CVData)[] = [
  'personalInfo', 'summary', 'experience', 'projects', 'education', 'involvement',
  'skills', 'certifications', 'languages', 'awards', 'hobbies', 'references', 'sections',
];

/** The CV fields of the editor state (the store also holds actions). */
export function currentCvData(): CVData {
  const state = useCVStore.getState();
  const cv = {} as Record<keyof CVData, unknown>;
  for (const key of CV_KEYS) cv[key] = state[key];
  return cv as CVData;
}

/** Downloads the active CV, cover letter and look as a JSON file that "Load backup" reads back. */
export function downloadCvBackup() {
  const { template, theme } = useAppStore.getState();
  const cvData = currentCvData();
  const json = exportToJson(cvData, { template, theme }, useCVStore.getState().coverLetterData);
  const name = cvData.personalInfo.fullName.replace(/\s+/g, '_') || 'cv';
  downloadJsonFile(json, `${name}_cv.json`);
}
