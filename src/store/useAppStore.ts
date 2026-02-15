import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TemplateType, ThemeConfig, DocumentType } from '../types/cv';
import { useProfileStore } from './useProfileStore';
import i18n from '../i18n';
import { useCVStore } from './useCVStore';

interface AppStore {
  template: TemplateType;
  theme: ThemeConfig;
  activeTab: 'editor' | 'preview';
  activeDocument: DocumentType;
  language: 'tr' | 'en';
  pageBreakHeights: { small: number; medium: number; large: number };
  setTemplate: (template: TemplateType) => void;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  setActiveTab: (tab: 'editor' | 'preview') => void;
  setActiveDocument: (doc: DocumentType) => void;
  setLanguage: (lang: 'tr' | 'en') => void;
  setPageBreakHeight: (size: 'small' | 'medium' | 'large', h: number) => void;
  loadFromImport: (settings: { template: TemplateType; theme: ThemeConfig }) => void;
  _syncFromProfile: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
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
      activeTab: 'editor',
      activeDocument: 'cv',
      language: 'tr',
      pageBreakHeights: { small: 1110, medium: 1121, large: 1210 },
      setTemplate: (template) => {
        set({ template });
        useProfileStore.getState().updateActiveAppSettings({ template });
      },
      setTheme: (partial) => {
        set((state) => {
          const merged = { ...state.theme, ...partial };
          useProfileStore.getState().updateActiveAppSettings({ theme: merged });
          return { theme: merged };
        });
      },
      setActiveTab: (activeTab) => set({ activeTab }),
      setActiveDocument: (activeDocument) => set({ activeDocument }),
      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
        document.documentElement.lang = language;
        // Update CV section titles to match new language
        const cvState = useCVStore.getState();
        const updated = cvState.sections.map((s) => ({
          ...s,
          title: i18n.t(`sections.${s.type}`) || s.title,
        }));
        cvState.reorderSections(updated);
      },
      setPageBreakHeight: (size, h) => set((state) => ({
        pageBreakHeights: { ...state.pageBreakHeights, [size]: h },
      })),
      loadFromImport: (settings) => {
        set({ template: settings.template, theme: settings.theme });
        useProfileStore.getState().updateActiveAppSettings(settings);
      },
      _syncFromProfile: () => {
        const profile = useProfileStore.getState().getActiveProfile();
        if (profile) {
          set({
            template: profile.appSettings.template,
            theme: profile.appSettings.theme,
          });
        }
      },
    }),
    {
      name: 'cv-builder-app',
    }
  )
);
