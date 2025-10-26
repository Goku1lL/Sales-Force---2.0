import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTheme } from '../ThemeContext';
export function ThemedProgress({ value, theme = 'default', className = '' }) {
    const { currentTheme } = useTheme();
    const clamped = Math.max(0, Math.min(100, value));
    const getProgressClasses = () => {
        if (currentTheme.isNeon) {
            // Dark Neon Theme
            return {
                track: 'bg-white/8',
                fill: 'h-full rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink'
            };
        }
        else if (currentTheme.isDark) {
            // Dark Theme
            return {
                track: 'bg-white/8',
                fill: 'h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-500'
            };
        }
        else {
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
    return (_jsxs("div", { className: `w-full h-3 rounded-xl overflow-hidden relative ${className}`, children: [_jsx("div", { className: `absolute inset-0 rounded-xl ${track}` }), _jsx("div", { className: fill, style: {
                    width: `${clamped}%`,
                    transition: 'width 0.5s ease'
                } })] }));
}
