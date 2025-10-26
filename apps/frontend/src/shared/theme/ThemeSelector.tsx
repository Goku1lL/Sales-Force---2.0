import React from 'react';
import { useTheme } from './ThemeProvider';
import { Theme } from './ThemeSystem';

// Theme Selector Component - Single Responsibility
export function ThemeSelector() {
  const { currentTheme, setTheme } = useTheme();

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'darkNeon', label: 'Neon', icon: '⚡' }
  ];

  return (
    <div className="flex items-center space-x-2">
      {themes.map((theme) => (
        <button
          key={theme.value}
          onClick={() => setTheme(theme.value)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            currentTheme.name === theme.value
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <span className="mr-2">{theme.icon}</span>
          {theme.label}
        </button>
      ))}
    </div>
  );
}
