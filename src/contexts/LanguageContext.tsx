import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { 
  languages, 
  getInitialLanguage, 
  saveLanguage, 
  t as translate 
} from '../i18n';
import type { Language, LanguageConfig } from '../i18n';

interface LanguageContextType {
  currentLanguage: Language;
  availableLanguages: LanguageConfig[];
  changeLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
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

  const value = useMemo((): LanguageContextType => ({
    currentLanguage,
    availableLanguages: languages,
    changeLanguage,
    t,
  }), [currentLanguage, changeLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
