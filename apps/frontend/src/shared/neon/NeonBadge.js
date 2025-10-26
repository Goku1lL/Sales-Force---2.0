import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function NeonBadge({ children, className = '' }) {
    return (_jsxs("span", { className: [
            'relative inline-flex items-center justify-center px-4 py-2 rounded-xl text-[13px] font-bold tracking-wider uppercase',
            'text-gray-900 dark:text-[var(--text)]/90',
            className
        ].join(' '), children: [_jsx("span", { className: "absolute inset-0 rounded-xl bg-amber-100 dark:bg-white/5" }), _jsx("span", { className: "absolute inset-0 rounded-xl ring-1 ring-amber-200 dark:ring-white/15" }), _jsx("span", { className: "relative z-10", children: children })] }));
}
