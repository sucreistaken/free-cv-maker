import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './tr.json';
import en from './en.json';

// Read persisted language from localStorage
function getStoredLanguage(): 'tr' | 'en' {
  try {
    const raw = localStorage.getItem('cv-builder-app');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.language === 'en') return 'en';
    }
  } catch { /* ignore */ }
  return 'tr';
}

const lng = getStoredLanguage();

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Sync html lang attribute on init
document.documentElement.lang = lng;

export default i18n;
