import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ThemeUtils } from './ThemeSystem';
export function ThemedCard({ children, accent = 'amber', className = '' }) {
    // This would receive theme from context in real implementation
    // For now, showing the pattern
    return (_jsx("div", { className: `${ThemeUtils.getCardClasses({}, accent)} ${className}`, children: children }));
}
export function ThemedText({ children, variant, className = '' }) {
    return (_jsx("span", { className: `${ThemeUtils.getTextClasses({}, variant)} ${className}`, children: children }));
}
export function ThemedProgress({ value, className = '' }) {
    const clamped = Math.max(0, Math.min(100, value));
    return (_jsxs("div", { className: `w-full h-3 rounded-xl overflow-hidden relative ${className}`, children: [_jsx("div", { className: `absolute inset-0 rounded-xl ${ThemeUtils.getProgressClasses({}, 'track')}` }), _jsx("div", { className: `h-full rounded-full ${ThemeUtils.getProgressClasses({}, 'fill')}`, style: { width: `${clamped}%` } })] }));
}
