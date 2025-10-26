import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from './authApi';
export default function LoginPage() {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [login, { isLoading, error }] = useLoginMutation();
    const [formError, setFormError] = useState(null);
    const navigate = useNavigate();
    // Helper function to determine if input is email or employee ID
    const isEmail = (input) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    };
    const onSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        if (!loginInput || !password) {
            setFormError('Please enter your login credentials and password');
            return;
        }
        // Validate employee ID if it's not an email
        if (!isEmail(loginInput)) {
            const employeeId = Number(loginInput);
            if (isNaN(employeeId) || employeeId <= 0) {
                setFormError('Please enter a valid employee ID (numbers only) or email address');
                return;
            }
        }
        try {
            const loginData = isEmail(loginInput)
                ? { email: loginInput, password }
                : { employee_id: Number(loginInput), password };
            await login(loginData).unwrap();
            navigate('/', { replace: true });
        }
        catch (err) {
            console.error('Login error:', err);
            if (err?.data?.message === 'Please verify your email') {
                setFormError('Please check your email and verify your account before logging in');
            }
            else if (err?.data?.message === 'Invalid credentials') {
                setFormError('Invalid login credentials or password');
            }
            else {
                setFormError(`Login failed: ${err?.data?.message || err?.message || 'Please try again.'}`);
            }
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 px-4", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "inline-flex items-center justify-center", children: _jsx("img", { src: "/logo.png", alt: "Logo", className: "h-12 w-12 rounded-lg object-contain" }) }), _jsx("h1", { className: "mt-3 text-xl font-bold text-gray-900", children: "Login" }), _jsx("p", { className: "text-sm text-gray-600", children: "Sign in to continue" })] }), _jsxs("form", { onSubmit: onSubmit, className: "bg-white p-5 rounded-lg shadow border border-gray-200 space-y-4", children: [formError ? (_jsx("p", { className: "text-sm text-red-600", children: formError })) : null, _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Employee ID or Email" }), _jsx("input", { className: "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600", value: loginInput, onChange: (e) => setLoginInput(e.target.value), placeholder: "Enter employee ID or email address", autoComplete: "username" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "You can login with either your employee ID (e.g., 1761215080220) or email address" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }), _jsx("input", { type: "password", className: "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600", value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "current-password" })] }), _jsx("button", { disabled: isLoading, type: "submit", className: "w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded transition", children: isLoading ? 'Signing in...' : 'Sign In' }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("a", { href: "/forgot-password", className: "text-green-700 hover:underline", children: "Forgot password?" }), _jsx("a", { href: "/signup", className: "text-gray-700 hover:underline", children: "Create account" })] })] })] }) }));
}
