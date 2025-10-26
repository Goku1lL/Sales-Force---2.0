import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTheme } from '../ThemeContext';
export function NeonProgress({ value = 0, className = '', theme = 'default' }) {
    const { currentTheme } = useTheme();
    const isNeon = currentTheme.isNeon;
    const isDark = currentTheme.isDark;
    const clamped = Math.max(0, Math.min(100, value));
    const progressFillClasses = isNeon
        ? 'h-full rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink'
        : isDark
            ? 'h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-500'
            : 'h-full rounded-full bg-gray-800 shadow-sm';
    const progressBgClasses = isDark
        ? 'bg-white/8'
        : theme === 'amber'
            ? 'bg-amber-200'
            : theme === 'rose'
                ? 'bg-rose-200'
                : 'bg-gray-200';
    return (_jsxs("div", { className: ['w-full h-3 rounded-xl overflow-hidden relative', className].join(' '), children: [_jsx("div", { className: `absolute inset-0 rounded-xl ${progressBgClasses}` }), _jsx("div", { className: progressFillClasses, style: {
                    width: `${clamped}%`,
                    transition: 'width 0.5s ease'
                } })] }));
}
