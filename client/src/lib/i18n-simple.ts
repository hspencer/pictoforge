import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es-CL' | 'en' | 'mi' | 'pt' | 'de' | 'en-GB' | 'fr' | 'ca' | 'arn' | 'qu';

export const languages: Record<Language, string> = {
  'es-CL': 'Español (Chile)',
  'en': 'English',
  'mi': 'Te Reo Māori',
  'pt': 'Português',
  'de': 'Deutsch',
  'en-GB': 'English (UK)',
  'fr': 'Français',
  'ca': 'Català',
  'arn': 'Mapudungún',
  'qu': 'Runasimi'
};

const translations: Record<Language, Record<string, string>> = {
  'es-CL': {
    'nav.home': 'Inicio',
    'nav.dictionary': 'Diccionario',
    'nav.back': 'Volver al inicio',
    'place.editor': 'Editor',
    'place.styles': 'Estilos',
    'place.vocabulary': 'Vocabulario',
    'place.settings': 'Configuración',
    'action.edit': 'Editar',
    'action.save': 'Guardar',
    'preview.title': 'Vista previa en vivo',
  },
  'en': {
    'nav.home': 'Home',
    'nav.dictionary': 'Dictionary',
    'nav.back': 'Back to home',
    'place.editor': 'Editor',
    'place.styles': 'Styles',
    'place.vocabulary': 'Vocabulary',
    'place.settings': 'Settings',
    'action.edit': 'Edit',
    'action.save': 'Save',
    'preview.title': 'Live Preview',
  },
  'mi': {
    'nav.home': 'Kāinga',
    'nav.dictionary': 'Pukapuka kupu',
    'nav.back': 'Hoki ki te kāinga',
    'place.editor': 'Kaiwhakatikatika',
    'place.styles': 'Ngā momo',
    'place.vocabulary': 'Pukapuka kupu',
    'place.settings': 'Ngā tautuhinga',
    'action.edit': 'Whakatika',
    'action.save': 'Tiaki',
    'preview.title': 'Matapihi Reo',
  },
  'pt': {
    'nav.home': 'Início',
    'nav.dictionary': 'Dicionário',
    'nav.back': 'Voltar ao início',
    'place.editor': 'Editor',
    'place.styles': 'Estilos',
    'place.vocabulary': 'Vocabulário',
    'place.settings': 'Configurações',
    'action.edit': 'Editar',
    'action.save': 'Salvar',
    'preview.title': 'Visualização ao Vivo',
  },
  'de': {
    'nav.home': 'Startseite',
    'nav.dictionary': 'Wörterbuch',
    'nav.back': 'Zurück zur Startseite',
    'place.editor': 'Editor',
    'place.styles': 'Stile',
    'place.vocabulary': 'Vokabular',
    'place.settings': 'Einstellungen',
    'action.edit': 'Bearbeiten',
    'action.save': 'Speichern',
    'preview.title': 'Live-Vorschau',
  },
  'en-GB': {
    'nav.home': 'Home',
    'nav.dictionary': 'Dictionary',
    'nav.back': 'Back to home',
    'place.editor': 'Editor',
    'place.styles': 'Styles',
    'place.vocabulary': 'Vocabulary',
    'place.settings': 'Settings',
    'action.edit': 'Edit',
    'action.save': 'Save',
    'preview.title': 'Live Preview',
  },
  'fr': {
    'nav.home': 'Accueil',
    'nav.dictionary': 'Dictionnaire',
    'nav.back': 'Retour à l\'accueil',
    'place.editor': 'Éditeur',
    'place.styles': 'Styles',
    'place.vocabulary': 'Vocabulaire',
    'place.settings': 'Paramètres',
    'action.edit': 'Modifier',
    'action.save': 'Sauvegarder',
    'preview.title': 'Aperçu en Direct',
  },
  'ca': {
    'nav.home': 'Inici',
    'nav.dictionary': 'Diccionari',
    'nav.back': 'Tornar a l\'inici',
    'place.editor': 'Editor',
    'place.styles': 'Estils',
    'place.vocabulary': 'Vocabulari',
    'place.settings': 'Configuració',
    'action.edit': 'Editar',
    'action.save': 'Desar',
    'preview.title': 'Vista Prèvia en Directe',
  },
  'arn': {
    'nav.home': 'Ruka',
    'nav.dictionary': 'Dungu kiñe',
    'nav.back': 'Rukapan',
    'place.editor': 'Kimelfe',
    'place.styles': 'Adkintun',
    'place.vocabulary': 'Dungu',
    'place.settings': 'Tuwün',
    'action.edit': 'Kimeluwün',
    'action.save': 'Küdawün',
    'preview.title': 'Peñi',
  },
  'qu': {
    'nav.home': 'Wasi',
    'nav.dictionary': 'Simi qillqa',
    'nav.back': 'Wasiman kutiy',
    'place.editor': 'Allichaq',
    'place.styles': 'Rikch\'aykuna',
    'place.vocabulary': 'Simikuna',
    'place.settings': 'Churanakuna',
    'action.edit': 'Allichay',
    'action.save': 'Waqaychay',
    'preview.title': 'Qhaway',
  }
};

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
  const [language, setLanguage] = useState<Language>('es-CL');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pictonet-language');
      if (saved && saved in languages) {
        setLanguage(saved as Language);
      }
      
      const browserLang = navigator.language;
      if (browserLang === 'es-CL') setLanguage('es-CL');
      else if (browserLang.startsWith('es')) setLanguage('es-CL');
      else if (browserLang.startsWith('en')) setLanguage('en');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pictonet-language', language);
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key: string): string => {
    const langTranslations = translations[language];
    if (langTranslations && key in langTranslations) {
      return langTranslations[key];
    }
    
    const fallback = translations['es-CL'];
    if (fallback && key in fallback) {
      return fallback[key];
    }
    
    return key;
  };

  return React.createElement(
    I18nContext.Provider,
    { value: { language, setLanguage, t } },
    children
  );
}