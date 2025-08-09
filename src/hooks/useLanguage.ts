import { useState, useEffect, useCallback } from 'react';
import { 
  languages, 
  getInitialLanguage, 
  saveLanguage, 
  t as translate 
} from '../i18n';
import type { Language, LanguageConfig } from '../i18n';

interface UseLanguageReturn {
  currentLanguage: Language;
  availableLanguages: LanguageConfig[];
  changeLanguage: (language: Language) => void;
  t: (key: string) => string;
}

export const useLanguage = (): UseLanguageReturn => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getInitialLanguage);

  // Update document language attribute when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  const changeLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
    saveLanguage(language);
    
    // Dispatch custom event for other components to listen
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language } 
      }));
    }
  }, []);

  const t = useCallback((key: string) => {
    return translate(key, currentLanguage);
  }, [currentLanguage]);

  return {
    currentLanguage,
    availableLanguages: languages,
    changeLanguage,
    t,
  };
};