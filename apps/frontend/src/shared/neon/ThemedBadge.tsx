import React from 'react';
import { useTheme } from '../ThemeContext';

interface ThemedBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function ThemedBadge({ children, className = '' }: ThemedBadgeProps) {
  const { currentTheme } = useTheme();

  const getBadgeClasses = () => {
    if (currentTheme.isNeon) {
      // Dark Neon Theme
      return [
        'relative inline-flex items-center justify-center px-3 py-1.5 rounded-lg',
        'text-xs font-bold tracking-wide uppercase',
        'text-[var(--text)]/90',
        'bg-white/5',
        'ring-1 ring-white/15',
        'whitespace-nowrap'
      ].join(' ');
    } else if (currentTheme.isDark) {
      // Dark Theme
      return [
        'relative inline-flex items-center justify-center px-3 py-1.5 rounded-lg',
        'text-xs font-bold tracking-wide uppercase',
        'text-white/90',
        'bg-white/5',
        'ring-1 ring-white/15',
        'whitespace-nowrap'
      ].join(' ');
    } else {
      // Light Theme
      return [
        'relative inline-flex items-center justify-center px-3 py-1.5 rounded-lg',
        'text-xs font-bold tracking-wide uppercase',
        'text-gray-900',
        'bg-amber-100',
        'ring-1 ring-amber-200',
        'whitespace-nowrap'
      ].join(' ');
    }
  };

  return (
    <span className={`${getBadgeClasses()} ${className}`}>
      <span className="absolute inset-0 rounded-xl bg-amber-100 dark:bg-white/5" />
      <span className="absolute inset-0 rounded-xl ring-1 ring-amber-200 dark:ring-white/15" />
      <span className="relative z-10">{children}</span>
    </span>
  );
}
