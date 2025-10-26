import React from 'react';
import { useTheme } from '../ThemeContext';

export function NeonCard(props: React.PropsWithChildren<{ accent?: 'cyan' | 'purple' | 'pink' | 'amber'; className?: string }>) {
  const { currentTheme } = useTheme();
  const isNeon = currentTheme.isNeon;
  const isDark = currentTheme.isDark;

  const accentColor = props.accent ?? 'cyan';
  const gradientBorder = {
    cyan: 'from-neon-cyan to-neon-purple',
    purple: 'from-neon-purple to-neon-pink',
    pink: 'from-neon-pink to-neon-cyan',
    amber: 'from-neon-amber to-neon-pink'
  }[accentColor];

  // Design system card background and border with very light pastel colors
  const cardBg = isNeon ? 'bg-[var(--card)]/75' : isDark ? 'bg-gray-800' : 
    props.accent === 'amber' ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100' :
    props.accent === 'purple' ? 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100' :
    'bg-gradient-to-br from-blue-50 to-indigo-50';
  
  const cardBorder = isNeon ? `ring-1 ring-inset ring-white/10 before:absolute before:inset-0 before:rounded-[var(--radius)] before:p-[1.5px] before:bg-gradient-to-r before:${gradientBorder} before:bg-clip-content before:opacity-30` : 
    isDark ? 'border border-gray-700' : 
    props.accent === 'amber' ? 'border-2 border-amber-500 hover:border-amber-600' :
    props.accent === 'purple' ? 'border-2 border-rose-500 hover:border-rose-600' :
    'border-2 border-gray-400 hover:border-gray-500';
  
  const hoverEffects = isDark ? '' : 'hover:shadow-2xl hover:-translate-y-1 transition-all duration-300';

  return (
    <div
      className={[
        'relative rounded-2xl p-6 overflow-hidden shadow-lg',
        cardBg,
        cardBorder,
        hoverEffects,
        props.className
      ].join(' ')}
    >
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
           style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)' }} />
      {props.children}
    </div>
  );
}


