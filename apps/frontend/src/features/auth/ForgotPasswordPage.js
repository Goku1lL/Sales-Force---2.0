import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(null);
    const onSubmit = async (e) => {
        e.preventDefault();
        setStatus(null);
        const res = await fetch('/api/v1/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        setStatus(data.message || 'If the email exists, a reset link has been sent');
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 px-4", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Forgot Password" }), _jsx("p", { className: "text-sm text-gray-600", children: "We will send a reset link to your email" })] }), _jsxs("form", { onSubmit: onSubmit, className: "bg-white p-5 rounded-lg shadow border border-gray-200 space-y-4", children: [status ? _jsx("p", { className: "text-sm text-gray-700", children: status }) : null, _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { type: "email", className: "w-full border border-gray-300 rounded px-3 py-2", value: email, onChange: (e) => setEmail(e.target.value) })] }), _jsx("button", { type: "submit", className: "w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded transition", children: "Send reset link" })] })] }) }));
}
