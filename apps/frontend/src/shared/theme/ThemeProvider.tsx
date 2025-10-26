import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, ThemeFactory, ThemeConfig, ThemeContextType } from './ThemeSystem';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('sfa-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'darkNeon') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const currentTheme = ThemeFactory.createTheme(theme);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('sfa-theme', newTheme);
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'darkNeon' : 'light';
    setTheme(nextTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', currentTheme.isDark);
    root.classList.toggle('theme-dark-neon', currentTheme.isNeon);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
