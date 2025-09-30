import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/hooks/useI18n.jsx';

/**
 * Componente selector de idioma
 */
export const LanguageSelector = () => {
  const { currentLanguage, changeLanguage, availableLanguages, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  const getCurrentLanguageFlag = () => {
    const flags = {
      en: '🇺🇸',
      es: '🇪🇸', 
      mi: '🇳🇿'
    };
    return flags[currentLanguage] || '🌐';
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title={t('changeLanguage')}
        >
          <Globe size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center gap-2 ${
              currentLanguage === lang.code ? 'bg-accent' : ''
            }`}
          >
            <span className="text-lg">
              {lang.code === 'en' && '🇺🇸'}
              {lang.code === 'es' && '🇪🇸'}
              {lang.code === 'mi' && '🇳🇿'}
            </span>
            <div className="flex flex-col">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-xs text-muted-foreground">{lang.name}</span>
            </div>
            {currentLanguage === lang.code && (
              <span className="ml-auto text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
