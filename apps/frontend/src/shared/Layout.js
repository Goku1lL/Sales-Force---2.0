import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useGetUserProfileQuery } from '../features/leaderboard/leaderboardApi';
import { useTheme } from './ThemeContext';
export default function Layout() {
    const dispatch = useDispatch();
    const { pathname } = useLocation();
    const user = useSelector((state) => state.auth.user);
    const employeeId = user?.employee_id || 0;
    const { data: profile } = useGetUserProfileQuery(employeeId, { skip: !employeeId });
    const { currentTheme, toggleTheme } = useTheme();
    const isDark = currentTheme.isDark;
    const isActive = (p) => pathname === p;
    return (_jsxs("div", { className: `min-h-screen transition-colors ${isDark ? 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900' : 'bg-gray-50'}`, children: [_jsx("header", { className: `sticky top-0 z-50 border-b-2 transition-colors ${isDark
                    ? 'bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 border-cyan-400/50'
                    : 'bg-white border-gray-200'}`, children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-indigo-600'}`, children: _jsx("img", { src: "/logo.png", alt: "Sales Force", className: "w-12 h-12 object-contain" }) }), _jsxs("div", { children: [_jsx("h1", { className: `text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`, children: "Sales Force" }), _jsx("p", { className: `text-sm ${isDark ? 'text-cyan-300' : 'text-gray-500'}`, children: profile?.cluster || 'Loading...' })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: toggleTheme, className: `p-2 rounded-lg transition-colors ${isDark
                                                ? 'text-yellow-400 hover:bg-gray-700'
                                                : 'text-gray-600 hover:bg-gray-100'}`, title: isDark ? 'Switch to light mode' : 'Switch to dark mode', children: isDark ? (_jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z", clipRule: "evenodd" }) })) : (_jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { d: "M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" }) })) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-indigo-100'}`, children: _jsx("span", { className: `text-lg font-bold ${isDark ? 'text-black' : 'text-indigo-700'}`, children: user?.name?.charAt(0) || 'U' }) }), _jsxs("div", { className: "hidden sm:block", children: [_jsx("p", { className: `text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`, children: user?.name || 'User' }), _jsxs("p", { className: `text-sm ${isDark ? 'text-cyan-300' : 'text-gray-500'}`, children: ["Level ", profile?.cluster_rank ? `${profile.cluster_rank}` : 'N/A'] })] })] }), _jsx("button", { onClick: () => dispatch(logout()), className: `p-2 rounded-lg transition-colors ${isDark
                                                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`, title: "Logout", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) }) })] })] }), _jsx("nav", { className: `mt-6 flex justify-between rounded-2xl p-3 transition-colors ${isDark ? 'bg-gray-800/50 border border-gray-600' : 'bg-gray-100'}`, children: [
                                { href: '/', label: 'Home', icon: '🏠' },
                                { href: '/targets', label: 'Targets', icon: '🎯' },
                                { href: '/customers', label: 'Customers', icon: '👥' },
                                { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
                            ].map(({ href, label, icon }) => (_jsxs(Link, { to: href, className: `flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-xl text-sm font-bold transition-all min-w-0 flex-1 ${isActive(href)
                                    ? isDark
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black'
                                        : 'bg-green-100 text-green-700'
                                    : isDark
                                        ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`, children: [_jsx("span", { className: "text-2xl leading-none", children: icon }), _jsx("span", { className: "text-xs leading-tight text-center font-bold", children: label })] }, href))) })] }) }), _jsx("main", { className: "pb-6", children: _jsx(Outlet, {}) })] }));
}
