import React from 'react';
import { ThemeConfig, ThemeUtils } from './ThemeSystem';

// Themed Card Component - Single Responsibility
interface ThemedCardProps {
  children: React.ReactNode;
  accent?: 'amber' | 'purple';
  className?: string;
}

export function ThemedCard({ children, accent = 'amber', className = '' }: ThemedCardProps) {
  // This would receive theme from context in real implementation
  // For now, showing the pattern
  return (
    <div className={`${ThemeUtils.getCardClasses({} as ThemeConfig, accent)} ${className}`}>
      {children}
    </div>
  );
}

// Themed Text Component - Single Responsibility
interface ThemedTextProps {
  children: React.ReactNode;
  variant: 'primary' | 'secondary' | 'accent';
  className?: string;
}

export function ThemedText({ children, variant, className = '' }: ThemedTextProps) {
  return (
    <span className={`${ThemeUtils.getTextClasses({} as ThemeConfig, variant)} ${className}`}>
      {children}
    </span>
  );
}

// Themed Progress Component - Single Responsibility
interface ThemedProgressProps {
  value: number;
  className?: string;
}

export function ThemedProgress({ value, className = '' }: ThemedProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  
  return (
    <div className={`w-full h-3 rounded-xl overflow-hidden relative ${className}`}>
      <div className={`absolute inset-0 rounded-xl ${ThemeUtils.getProgressClasses({} as ThemeConfig, 'track')}`} />
      <div
        className={`h-full rounded-full ${ThemeUtils.getProgressClasses({} as ThemeConfig, 'fill')}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
