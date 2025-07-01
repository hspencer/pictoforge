import React, { useState, useEffect, createContext, useContext } from 'react';
import { Language, languages, translations } from './i18n-types';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'es-CL';
    
    const saved = localStorage.getItem('pictonet-language');
    if (saved && saved in languages) {
      return saved as Language;
    }
    
    const browserLang = navigator.language;
    if (browserLang === 'es-CL' || browserLang.startsWith('es-CL')) return 'es-CL';
    if (browserLang === 'en' || browserLang.startsWith('en')) return 'en';
    if (browserLang === 'mi' || browserLang.startsWith('mi')) return 'mi';
    if (browserLang === 'pt' || browserLang.startsWith('pt')) return 'pt';
    if (browserLang === 'de' || browserLang.startsWith('de')) return 'de';
    if (browserLang === 'fr' || browserLang.startsWith('fr')) return 'fr';
    if (browserLang === 'ca' || browserLang.startsWith('ca')) return 'ca';
    if (browserLang === 'arn' || browserLang.startsWith('arn')) return 'arn';
    if (browserLang === 'qu' || browserLang.startsWith('qu')) return 'qu';
    
    return 'es-CL';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pictonet-language', language);
    }
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    // Fallback to English if translation not found
    if (language !== 'en') {
      value = translations.en;
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }
      if (typeof value === 'string') {
        return value;
      }
    }
    
    return key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}