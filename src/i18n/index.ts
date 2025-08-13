import viTranslations from './locales/vi.json';
import enTranslations from './locales/en.json';
import jaTranslations from './locales/ja.json';

export type Language = 'vi' | 'en' | 'ja';

export interface LanguageConfig {
  code: Language;
  name: string;
  country: string;
}

export const languages: LanguageConfig[] = [
  {
    code: 'vi',
    name: 'Tiếng Việt',
    country: 'vi'
  },
  {
    code: 'en',
    name: 'English',
    country: 'en'
  },
  {
    code: 'ja',
    name: '日本語',
    country: 'ja'
  }
];

export const translations = {
  vi: viTranslations,
  en: enTranslations,
  ja: jaTranslations,
};

export const defaultLanguage: Language = 'vi';

// Get language from localStorage or use default
export const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return defaultLanguage;
  
  const saved = localStorage.getItem('language') as Language;
  if (saved && languages.find(lang => lang.code === saved)) {
    return saved;
  }
  
  // Try to detect from browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('vi')) return 'vi';
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('en')) return 'en';
  
  return defaultLanguage;
};

// Save language to localStorage
export const saveLanguage = (language: Language): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', language);
  }
};

// Get nested object value using dot notation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

// Translation function
export const t = (key: string, language: Language = defaultLanguage): string => {
  const translation = getNestedValue(translations[language], key);
  
  if (translation) {
    return translation;
  }
  
  // Fallback to default language
  if (language !== defaultLanguage) {
    const fallback = getNestedValue(translations[defaultLanguage], key);
    if (fallback) {
      return fallback;
    }
  }
  
  // If no translation found, return the key
  console.warn(`Translation missing for key: ${key} in language: ${language}`);
  return key;
};

export default {
  languages,
  translations,
  defaultLanguage,
  getInitialLanguage,
  saveLanguage,
  t,
};