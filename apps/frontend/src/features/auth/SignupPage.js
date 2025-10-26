import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [full_name, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const onSubmit = async (e) => {
        e.preventDefault();
        setStatus(null);
        setLoading(true);
        try {
            const res = await fetch('/api/v1/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, full_name, password })
            });
            let data = {};
            try {
                data = await res.json();
            }
            catch { }
            if (!res.ok) {
                setStatus({ type: 'error', message: data?.message || `Signup failed (${res.status})` });
            }
            else {
                setStatus({ type: 'success', message: data?.message || 'Signup successful. Check your email to verify.' });
            }
        }
        catch (err) {
            setStatus({ type: 'error', message: err?.message || 'Network error' });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 px-4", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Create account" }), _jsx("p", { className: "text-sm text-gray-600", children: "Use your company email" })] }), _jsxs("form", { onSubmit: onSubmit, className: "bg-white p-5 rounded-lg shadow border border-gray-200 space-y-4", children: [status ? (_jsx("p", { className: `text-sm ${status.type === 'error' ? 'text-red-600' : 'text-green-700'}`, children: status.message })) : null, _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Full name" }), _jsx("input", { autoComplete: "name", className: "w-full border border-gray-300 rounded px-3 py-2", value: full_name, onChange: (e) => setFullName(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { autoComplete: "email", type: "email", className: "w-full border border-gray-300 rounded px-3 py-2", value: email, onChange: (e) => setEmail(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }), _jsx("input", { autoComplete: "new-password", type: "password", className: "w-full border border-gray-300 rounded px-3 py-2", value: password, onChange: (e) => setPassword(e.target.value) })] }), _jsx("button", { disabled: loading, type: "submit", className: "w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded transition", children: loading ? 'Creating...' : 'Create account' }), _jsxs("div", { className: "text-sm text-gray-700 text-center", children: ["Already have an account? ", _jsx(Link, { to: "/login", className: "text-green-700 hover:underline", children: "Sign in" })] })] })] }) }));
}
