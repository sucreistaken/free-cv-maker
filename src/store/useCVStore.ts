import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CVData,
  PersonalInfo,
  ExperienceEntry,
  ProjectEntry,
  EducationEntry,
  InvolvementEntry,
  SkillCategory,
  CertificationEntry,
  LanguageEntry,
  AwardEntry,
  ReferenceEntry,
  CVSection,
  CoverLetterData,
} from '../types/cv';
import { defaultCV, defaultCoverLetter } from '../data/defaultCV';
import { generateId } from '../utils/id';
import { useProfileStore } from './useProfileStore';

interface CVStore extends CVData {
  coverLetterData: CoverLetterData;

  // Personal Info
  updatePersonalInfo: (field: keyof PersonalInfo, value: string) => void;

  // Summary
  updateSummary: (value: string) => void;

  // Experience
  addExperience: () => void;
  updateExperience: (id: string, field: keyof ExperienceEntry, value: string | string[]) => void;
  removeExperience: (id: string) => void;
  reorderExperience: (entries: ExperienceEntry[]) => void;

  // Projects
  addProject: () => void;
  updateProject: (id: string, field: keyof ProjectEntry, value: string | string[]) => void;
  removeProject: (id: string) => void;
  reorderProjects: (entries: ProjectEntry[]) => void;

  // Education
  addEducation: () => void;
  updateEducation: (id: string, field: keyof EducationEntry, value: string) => void;
  removeEducation: (id: string) => void;
  reorderEducation: (entries: EducationEntry[]) => void;

  // Involvement
  addInvolvement: () => void;
  updateInvolvement: (id: string, field: keyof InvolvementEntry, value: string | string[]) => void;
  removeInvolvement: (id: string) => void;
  reorderInvolvement: (entries: InvolvementEntry[]) => void;

  // Skills
  addSkillCategory: () => void;
  updateSkillCategory: (id: string, field: keyof SkillCategory, value: string) => void;
  removeSkillCategory: (id: string) => void;
  reorderSkills: (entries: SkillCategory[]) => void;

  // Certifications
  addCertification: () => void;
  updateCertification: (id: string, field: keyof CertificationEntry, value: string) => void;
  removeCertification: (id: string) => void;
  reorderCertifications: (entries: CertificationEntry[]) => void;

  // Languages
  addLanguage: () => void;
  updateLanguage: (id: string, field: keyof LanguageEntry, value: string) => void;
  removeLanguage: (id: string) => void;
  reorderLanguages: (entries: LanguageEntry[]) => void;

  // Awards
  addAward: () => void;
  updateAward: (id: string, field: keyof AwardEntry, value: string) => void;
  removeAward: (id: string) => void;
  reorderAwards: (entries: AwardEntry[]) => void;

  // Hobbies
  updateHobbies: (value: string) => void;

  // References
  addReference: () => void;
  updateReference: (id: string, field: keyof ReferenceEntry, value: string) => void;
  removeReference: (id: string) => void;
  reorderReferences: (entries: ReferenceEntry[]) => void;

  // Sections
  updateSectionTitle: (id: string, title: string) => void;
  toggleSectionVisibility: (id: string) => void;
  reorderSections: (sections: CVSection[]) => void;

  // Cover Letter
  updateCoverLetter: (field: keyof CoverLetterData, value: string) => void;

  // Import
  loadFromImport: (data: CVData) => void;

  // Reset
  resetToDefault: () => void;

  // Sync from profile store
  _syncFromProfile: () => void;
}

export const useCVStore = create<CVStore>()(
  persist(
    (set) => ({
      ...defaultCV,
      coverLetterData: { ...defaultCoverLetter },

      // Personal Info
      updatePersonalInfo: (field, value) => {
        set((state) => {
          const updated = { ...state.personalInfo, [field]: value };
          useProfileStore.getState().updateActiveCVData({ personalInfo: updated });
          return { personalInfo: updated };
        });
      },

      // Summary
      updateSummary: (value) => {
        set({ summary: value });
        useProfileStore.getState().updateActiveCVData({ summary: value });
      },

      // Experience
      addExperience: () => {
        set((state) => {
          const updated = [
            ...state.experience,
            { id: generateId(), title: '', company: '', location: '', startDate: '', endDate: '', bullets: [''] },
          ];
          useProfileStore.getState().updateActiveCVData({ experience: updated });
          return { experience: updated };
        });
      },
      updateExperience: (id, field, value) => {
        set((state) => {
          const updated = state.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e));
          useProfileStore.getState().updateActiveCVData({ experience: updated });
          return { experience: updated };
        });
      },
      removeExperience: (id) => {
        set((state) => {
          const updated = state.experience.filter((e) => e.id !== id);
          useProfileStore.getState().updateActiveCVData({ experience: updated });
          return { experience: updated };
        });
      },
      reorderExperience: (entries) => {
        set({ experience: entries });
        useProfileStore.getState().updateActiveCVData({ experience: entries });
      },

      // Projects
      addProject: () => {
        set((state) => {
          const updated = [...state.projects, { id: generateId(), name: '', link: '', date: '', bullets: [''] }];
          useProfileStore.getState().updateActiveCVData({ projects: updated });
          return { projects: updated };
        });
      },
      updateProject: (id, field, value) => {
        set((state) => {
          const updated = state.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p));
          useProfileStore.getState().updateActiveCVData({ projects: updated });
          return { projects: updated };
        });
      },
      removeProject: (id) => {
        set((state) => {
          const updated = state.projects.filter((p) => p.id !== id);
          useProfileStore.getState().updateActiveCVData({ projects: updated });
          return { projects: updated };
        });
      },
      reorderProjects: (entries) => {
        set({ projects: entries });
        useProfileStore.getState().updateActiveCVData({ projects: entries });
      },

      // Education
      addEducation: () => {
        set((state) => {
          const updated = [...state.education, { id: generateId(), degree: '', institution: '', year: '' }];
          useProfileStore.getState().updateActiveCVData({ education: updated });
          return { education: updated };
        });
      },
      updateEducation: (id, field, value) => {
        set((state) => {
          const updated = state.education.map((e) => (e.id === id ? { ...e, [field]: value } : e));
          useProfileStore.getState().updateActiveCVData({ education: updated });
          return { education: updated };
        });
      },
      removeEducation: (id) => {
        set((state) => {
          const updated = state.education.filter((e) => e.id !== id);
          useProfileStore.getState().updateActiveCVData({ education: updated });
          return { education: updated };
        });
      },
      reorderEducation: (entries) => {
        set({ education: entries });
        useProfileStore.getState().updateActiveCVData({ education: entries });
      },

      // Involvement
      addInvolvement: () => {
        set((state) => {
          const updated = [
            ...state.involvement,
            { id: generateId(), role: '', organization: '', institution: '', startDate: '', endDate: '', bullets: [''] },
          ];
          useProfileStore.getState().updateActiveCVData({ involvement: updated });
          return { involvement: updated };
        });
      },
      updateInvolvement: (id, field, value) => {
        set((state) => {
          const updated = state.involvement.map((i) => (i.id === id ? { ...i, [field]: value } : i));
          useProfileStore.getState().updateActiveCVData({ involvement: updated });
          return { involvement: updated };
        });
      },
      removeInvolvement: (id) => {
        set((state) => {
          const updated = state.involvement.filter((i) => i.id !== id);
          useProfileStore.getState().updateActiveCVData({ involvement: updated });
          return { involvement: updated };
        });
      },
      reorderInvolvement: (entries) => {
        set({ involvement: entries });
        useProfileStore.getState().updateActiveCVData({ involvement: entries });
      },

      // Skills
      addSkillCategory: () => {
        set((state) => {
          const updated = [...state.skills, { id: generateId(), category: '', items: '' }];
          useProfileStore.getState().updateActiveCVData({ skills: updated });
          return { skills: updated };
        });
      },
      updateSkillCategory: (id, field, value) => {
        set((state) => {
          const updated = state.skills.map((s) => (s.id === id ? { ...s, [field]: value } : s));
          useProfileStore.getState().updateActiveCVData({ skills: updated });
          return { skills: updated };
        });
      },
      removeSkillCategory: (id) => {
        set((state) => {
          const updated = state.skills.filter((s) => s.id !== id);
          useProfileStore.getState().updateActiveCVData({ skills: updated });
          return { skills: updated };
        });
      },
      reorderSkills: (entries) => {
        set({ skills: entries });
        useProfileStore.getState().updateActiveCVData({ skills: entries });
      },

      // Certifications
      addCertification: () => {
        set((state) => {
          const updated = [
            ...state.certifications,
            { id: generateId(), name: '', issuer: '', year: '', description: '' },
          ];
          useProfileStore.getState().updateActiveCVData({ certifications: updated });
          return { certifications: updated };
        });
      },
      updateCertification: (id, field, value) => {
        set((state) => {
          const updated = state.certifications.map((c) => (c.id === id ? { ...c, [field]: value } : c));
          useProfileStore.getState().updateActiveCVData({ certifications: updated });
          return { certifications: updated };
        });
      },
      removeCertification: (id) => {
        set((state) => {
          const updated = state.certifications.filter((c) => c.id !== id);
          useProfileStore.getState().updateActiveCVData({ certifications: updated });
          return { certifications: updated };
        });
      },
      reorderCertifications: (entries) => {
        set({ certifications: entries });
        useProfileStore.getState().updateActiveCVData({ certifications: entries });
      },

      // Languages
      addLanguage: () => {
        set((state) => {
          const updated = [
            ...state.languages,
            { id: generateId(), language: '', proficiency: 'intermediate' as const },
          ];
          useProfileStore.getState().updateActiveCVData({ languages: updated });
          return { languages: updated };
        });
      },
      updateLanguage: (id, field, value) => {
        set((state) => {
          const updated = state.languages.map((l) => (l.id === id ? { ...l, [field]: value } : l));
          useProfileStore.getState().updateActiveCVData({ languages: updated });
          return { languages: updated };
        });
      },
      removeLanguage: (id) => {
        set((state) => {
          const updated = state.languages.filter((l) => l.id !== id);
          useProfileStore.getState().updateActiveCVData({ languages: updated });
          return { languages: updated };
        });
      },
      reorderLanguages: (entries) => {
        set({ languages: entries });
        useProfileStore.getState().updateActiveCVData({ languages: entries });
      },

      // Awards
      addAward: () => {
        set((state) => {
          const updated = [
            ...state.awards,
            { id: generateId(), title: '', issuer: '', year: '', description: '' },
          ];
          useProfileStore.getState().updateActiveCVData({ awards: updated });
          return { awards: updated };
        });
      },
      updateAward: (id, field, value) => {
        set((state) => {
          const updated = state.awards.map((a) => (a.id === id ? { ...a, [field]: value } : a));
          useProfileStore.getState().updateActiveCVData({ awards: updated });
          return { awards: updated };
        });
      },
      removeAward: (id) => {
        set((state) => {
          const updated = state.awards.filter((a) => a.id !== id);
          useProfileStore.getState().updateActiveCVData({ awards: updated });
          return { awards: updated };
        });
      },
      reorderAwards: (entries) => {
        set({ awards: entries });
        useProfileStore.getState().updateActiveCVData({ awards: entries });
      },

      // Hobbies
      updateHobbies: (value) => {
        set({ hobbies: value });
        useProfileStore.getState().updateActiveCVData({ hobbies: value });
      },

      // References
      addReference: () => {
        set((state) => {
          const updated = [
            ...state.references,
            { id: generateId(), name: '', title: '', company: '', email: '', phone: '' },
          ];
          useProfileStore.getState().updateActiveCVData({ references: updated });
          return { references: updated };
        });
      },
      updateReference: (id, field, value) => {
        set((state) => {
          const updated = state.references.map((r) => (r.id === id ? { ...r, [field]: value } : r));
          useProfileStore.getState().updateActiveCVData({ references: updated });
          return { references: updated };
        });
      },
      removeReference: (id) => {
        set((state) => {
          const updated = state.references.filter((r) => r.id !== id);
          useProfileStore.getState().updateActiveCVData({ references: updated });
          return { references: updated };
        });
      },
      reorderReferences: (entries) => {
        set({ references: entries });
        useProfileStore.getState().updateActiveCVData({ references: entries });
      },

      // Sections
      updateSectionTitle: (id, title) => {
        set((state) => {
          const updated = state.sections.map((s) => (s.id === id ? { ...s, title } : s));
          useProfileStore.getState().updateActiveCVData({ sections: updated });
          return { sections: updated };
        });
      },
      toggleSectionVisibility: (id) => {
        set((state) => {
          const updated = state.sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s));
          useProfileStore.getState().updateActiveCVData({ sections: updated });
          return { sections: updated };
        });
      },
      reorderSections: (sections) => {
        set({ sections });
        useProfileStore.getState().updateActiveCVData({ sections });
      },

      // Cover Letter
      updateCoverLetter: (field, value) => {
        set((state) => {
          const updated = { ...state.coverLetterData, [field]: value };
          useProfileStore.getState().updateActiveCoverLetter({ [field]: value });
          return { coverLetterData: updated };
        });
      },

      // Import
      loadFromImport: (data) => {
        set({ ...data });
        useProfileStore.getState().updateActiveCVData(data);
      },

      // Reset
      resetToDefault: () => {
        set({ ...defaultCV, coverLetterData: { ...defaultCoverLetter } });
        useProfileStore.getState().updateActiveCVData({ ...defaultCV });
        useProfileStore.getState().updateActiveCoverLetter({ ...defaultCoverLetter });
      },

      // Sync from profile store
      _syncFromProfile: () => {
        const profile = useProfileStore.getState().getActiveProfile();
        if (profile) {
          set({
            ...profile.cvData,
            coverLetterData: profile.coverLetterData || { ...defaultCoverLetter },
          });
        }
      },
    }),
    {
      name: 'cv-builder-data',
    }
  )
);
