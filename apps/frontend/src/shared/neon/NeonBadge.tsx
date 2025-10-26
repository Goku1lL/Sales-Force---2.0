import React from 'react';

export function NeonBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={[
      'relative inline-flex items-center justify-center px-4 py-2 rounded-xl text-[13px] font-bold tracking-wider uppercase',
        'text-gray-900 dark:text-[var(--text)]/90',
      className
    ].join(' ')}>
      <span className="absolute inset-0 rounded-xl bg-amber-100 dark:bg-white/5" />
      <span className="absolute inset-0 rounded-xl ring-1 ring-amber-200 dark:ring-white/15" />
      {/* remove bloom glow */}
      <span className="relative z-10">{children}</span>
    </span>
  );
}


