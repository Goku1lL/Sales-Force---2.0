import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTheme } from './ThemeProvider';
// Theme Selector Component - Single Responsibility
export function ThemeSelector() {
    const { currentTheme, setTheme } = useTheme();
    const themes = [
        { value: 'light', label: 'Light', icon: '☀️' },
        { value: 'dark', label: 'Dark', icon: '🌙' },
        { value: 'darkNeon', label: 'Neon', icon: '⚡' }
    ];
    return (_jsx("div", { className: "flex items-center space-x-2", children: themes.map((theme) => (_jsxs("button", { onClick: () => setTheme(theme.value), className: `px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentTheme.name === theme.value
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`, children: [_jsx("span", { className: "mr-2", children: theme.icon }), theme.label] }, theme.value))) }));
}
