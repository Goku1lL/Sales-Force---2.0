import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTheme } from '../ThemeContext';
export function ThemedCard({ children, accent = 'amber', className = '' }) {
    const { currentTheme } = useTheme();
    // Get theme-specific styling
    const getCardClasses = () => {
        if (currentTheme.isNeon) {
            // Dark Neon Theme
            const gradientBorder = {
                cyan: 'from-neon-cyan to-neon-purple',
                purple: 'from-neon-purple to-neon-pink',
                pink: 'from-neon-pink to-neon-cyan',
                amber: 'from-neon-amber to-neon-pink'
            }[accent];
            return [
                'relative rounded-2xl p-6 overflow-hidden',
                'bg-[var(--card)]/75',
                'ring-1 ring-inset ring-white/10',
                'before:absolute before:inset-0 before:rounded-2xl before:p-[1.5px]',
                `before:bg-gradient-to-r before:${gradientBorder}`,
                'before:bg-clip-content before:opacity-30',
                'shadow-2xl shadow-cyan-500/20'
            ].join(' ');
        }
        else if (currentTheme.isDark) {
            // Dark Theme
            return [
                'relative rounded-2xl p-6 overflow-hidden',
                'bg-gray-800',
                'border border-gray-700',
                'shadow-2xl'
            ].join(' ');
        }
        else {
            // Light Theme
            const cardBg = accent === 'amber'
                ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100'
                : accent === 'purple'
                    ? 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50';
            const cardBorder = accent === 'amber'
                ? 'border-2 border-amber-500 hover:border-amber-600'
                : accent === 'purple'
                    ? 'border-2 border-rose-500 hover:border-rose-600'
                    : 'border-2 border-gray-400 hover:border-gray-500';
            return [
                'relative rounded-2xl p-6 overflow-hidden',
                'shadow-lg',
                cardBg,
                cardBorder,
                'hover:shadow-2xl hover:-translate-y-1 transition-all duration-300'
            ].join(' ');
        }
    };
    return (_jsxs("div", { className: `${getCardClasses()} ${className}`, children: [_jsx("div", { className: "absolute inset-0 rounded-2xl pointer-events-none", style: { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)' } }), children] }));
}
