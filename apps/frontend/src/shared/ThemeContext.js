import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeFactory } from './theme/ThemeSystem';
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem('sfa-theme');
        if (saved === 'light' || saved === 'dark' || saved === 'darkNeon') {
            return saved;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const currentTheme = ThemeFactory.createTheme(theme);
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('sfa-theme', newTheme);
    };
    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'darkNeon' : 'light';
        setTheme(nextTheme);
    };
    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', currentTheme.isDark);
        root.classList.toggle('theme-dark-neon', currentTheme.isNeon);
    }, [currentTheme]);
    return (_jsx(ThemeContext.Provider, { value: { currentTheme, setTheme, toggleTheme }, children: children }));
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
