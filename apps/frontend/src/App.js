import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Provider, useSelector } from 'react-redux';
import { store } from './app/store';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './shared/ThemeContext';
import './shared/apiRegistry'; // Ensure all APIs are registered
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ThemeTestPage from './features/dashboard/ThemeTestPage';
import TargetsPage from './features/targets/TargetsPage';
import CustomersPage from './features/customers/CustomersPage';
import LeaderBoardPage from './features/leaderboard/LeaderBoardPage';
import Layout from './shared/Layout';
import SignupPage from './features/auth/SignupPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
function RequireAuth({ children }) {
    const token = useSelector((s) => s.auth.token);
    if (!token)
        return _jsx(Navigate, { to: "/login", replace: true });
    return children;
}
function AppInner() {
    return (_jsx(BrowserRouter, { future: { v7_startTransition: true, v7_relativeSplatPath: true }, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/signup", element: _jsx(SignupPage, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPasswordPage, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPasswordPage, {}) }), _jsx(Route, { path: "/theme-test", element: _jsx(ThemeTestPage, {}) }), _jsxs(Route, { element: _jsx(RequireAuth, { children: _jsx(Layout, {}) }), children: [_jsx(Route, { path: "/", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/targets", element: _jsx(TargetsPage, {}) }), _jsx(Route, { path: "/customers", element: _jsx(CustomersPage, {}) }), _jsx(Route, { path: "/leaderboard", element: _jsx(LeaderBoardPage, {}) })] })] }) }));
}
export default function App() {
    return (_jsx(Provider, { store: store, children: _jsx(ThemeProvider, { children: _jsx(AppInner, {}) }) }));
}
