import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTheme } from '../ThemeContext';
export function ThemedBadge({ children, className = '' }) {
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
        }
        else if (currentTheme.isDark) {
            // Dark Theme
            return [
                'relative inline-flex items-center justify-center px-3 py-1.5 rounded-lg',
                'text-xs font-bold tracking-wide uppercase',
                'text-white/90',
                'bg-white/5',
                'ring-1 ring-white/15',
                'whitespace-nowrap'
            ].join(' ');
        }
        else {
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
    return (_jsxs("span", { className: `${getBadgeClasses()} ${className}`, children: [_jsx("span", { className: "absolute inset-0 rounded-xl bg-amber-100 dark:bg-white/5" }), _jsx("span", { className: "absolute inset-0 rounded-xl ring-1 ring-amber-200 dark:ring-white/15" }), _jsx("span", { className: "relative z-10", children: children })] }));
}
