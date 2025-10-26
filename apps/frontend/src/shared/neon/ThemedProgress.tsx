import React from 'react';
import { useTheme } from '../ThemeContext';

interface ThemedProgressProps {
  value: number;
  theme?: 'amber' | 'rose' | 'default';
  className?: string;
}

export function ThemedProgress({ value, theme = 'default', className = '' }: ThemedProgressProps) {
  const { currentTheme } = useTheme();
  const clamped = Math.max(0, Math.min(100, value));

  const getProgressClasses = () => {
    if (currentTheme.isNeon) {
      // Dark Neon Theme
      return {
        track: 'bg-white/8',
        fill: 'h-full rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink'
      };
    } else if (currentTheme.isDark) {
      // Dark Theme
      return {
        track: 'bg-white/8',
        fill: 'h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-500'
      };
    } else {
      // Light Theme
      const trackColor = theme === 'amber' 
        ? 'bg-amber-200' 
        : theme === 'rose' 
        ? 'bg-rose-200' 
        : 'bg-gray-200';

      return {
        track: trackColor,
        fill: 'h-full rounded-full bg-gray-800 shadow-sm'
      };
    }
  };

  const { track, fill } = getProgressClasses();

  return (
    <div className={`w-full h-3 rounded-xl overflow-hidden relative ${className}`}>
      <div className={`absolute inset-0 rounded-xl ${track}`} />
      <div
        className={fill}
        style={{
          width: `${clamped}%`,
          transition: 'width 0.5s ease'
        }}
      />
    </div>
  );
}
