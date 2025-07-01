import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getColor, getSpacing, getBorderRadius } from '@/lib/design-system';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    setIsDark(shouldBeDark);
    
    // Apply theme to document
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    // Update document class
    document.documentElement.classList.toggle('dark', newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: getBorderRadius('full'),
        border: `1px solid ${getColor('outline.variant')}`,
        background: getColor('surface.main'),
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginLeft: getSpacing('sm')
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = getColor('surface.variant');
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = getColor('surface.main');
      }}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? (
        <Sun size={20} style={{ color: getColor('surface.onSurface') }} />
      ) : (
        <Moon size={20} style={{ color: getColor('surface.onSurface') }} />
      )}
    </button>
  );
}