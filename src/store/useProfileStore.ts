import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CVProfile, CVData, CoverLetterData, TemplateType, ThemeConfig } from '../types/cv';
import { defaultCV, defaultCoverLetter } from '../data/defaultCV';
import { generateId } from '../utils/id';
import { migrateToProfiles } from '../utils/migration';

interface ProfileStore {
  profiles: CVProfile[];
  activeProfileId: string;
  _initialized: boolean;

  // Init
  initialize: () => void;

  // Profile CRUD
  createProfile: (name: string) => void;
  deleteProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
  switchProfile: (id: string) => void;
  duplicateProfile: (id: string) => void;

  // Active profile data access
  getActiveProfile: () => CVProfile;
  updateActiveCVData: (partial: Partial<CVData>) => void;
  updateActiveCoverLetter: (partial: Partial<CoverLetterData>) => void;
  updateActiveAppSettings: (partial: { template?: TemplateType; theme?: ThemeConfig }) => void;
}

function createDefaultProfile(): CVProfile {
  const id = generateId();
  const now = new Date().toISOString();
  return {
    id,
    name: 'My CV',
    createdAt: now,
    updatedAt: now,
    cvData: { ...defaultCV },
    coverLetterData: { ...defaultCoverLetter },
    appSettings: {
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
    },
  };
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: '',
      _initialized: false,

      initialize: () => {
        const state = get();
        if (state._initialized) return;

        if (state.profiles.length === 0) {
          // Try migration from old format
          const migrated = migrateToProfiles();
          if (migrated) {
            set({
              profiles: migrated.profiles,
              activeProfileId: migrated.activeProfileId,
              _initialized: true,
            });
          } else {
            // Fresh start
            const profile = createDefaultProfile();
            set({
              profiles: [profile],
              activeProfileId: profile.id,
              _initialized: true,
            });
          }
        } else {
          // Already has profiles, just mark initialized
          const validActive = state.profiles.some((p) => p.id === state.activeProfileId);
          set({
            _initialized: true,
            activeProfileId: validActive ? state.activeProfileId : state.profiles[0].id,
          });
        }
      },

      createProfile: (name) => {
        const profile = createDefaultProfile();
        profile.name = name;
        set((state) => ({
          profiles: [...state.profiles, profile],
          activeProfileId: profile.id,
        }));
      },

      deleteProfile: (id) => {
        const state = get();
        if (state.profiles.length <= 1) return; // Can't delete last profile
        const remaining = state.profiles.filter((p) => p.id !== id);
        const newActiveId = state.activeProfileId === id ? remaining[0].id : state.activeProfileId;
        set({ profiles: remaining, activeProfileId: newActiveId });
      },

      renameProfile: (id, name) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      switchProfile: (id) => {
        const state = get();
        if (state.profiles.some((p) => p.id === id)) {
          set({ activeProfileId: id });
        }
      },

      duplicateProfile: (id) => {
        const state = get();
        const source = state.profiles.find((p) => p.id === id);
        if (!source) return;
        const newId = generateId();
        const now = new Date().toISOString();
        const duplicate: CVProfile = {
          ...structuredClone(source),
          id: newId,
          name: `${source.name} (Copy)`,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          profiles: [...s.profiles, duplicate],
          activeProfileId: newId,
        }));
      },

      getActiveProfile: () => {
        const state = get();
        return state.profiles.find((p) => p.id === state.activeProfileId) || state.profiles[0];
      },

      updateActiveCVData: (partial) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === state.activeProfileId
              ? { ...p, cvData: { ...p.cvData, ...partial }, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      updateActiveCoverLetter: (partial) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === state.activeProfileId
              ? { ...p, coverLetterData: { ...p.coverLetterData, ...partial }, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      updateActiveAppSettings: (partial) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === state.activeProfileId
              ? {
                  ...p,
                  appSettings: {
                    template: partial.template ?? p.appSettings.template,
                    theme: partial.theme ? { ...p.appSettings.theme, ...partial.theme } : p.appSettings.theme,
                  },
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },
    }),
    {
      name: 'cv-builder-profiles',
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
      }),
    }
  )
);
