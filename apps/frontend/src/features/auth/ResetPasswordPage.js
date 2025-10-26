import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const token = params.get('token') || '';
    const [newPassword, setNewPassword] = useState('');
    const [status, setStatus] = useState(null);
    const onSubmit = async (e) => {
        e.preventDefault();
        setStatus(null);
        const res = await fetch('/api/v1/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });
        const data = await res.json();
        if (!res.ok)
            setStatus(data.message || 'Reset failed');
        else
            setStatus('Password updated. You can login now.');
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 px-4", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Reset Password" }), _jsx("p", { className: "text-sm text-gray-600", children: "Enter your new password" })] }), _jsxs("form", { onSubmit: onSubmit, className: "bg-white p-5 rounded-lg shadow border border-gray-200 space-y-4", children: [status ? _jsx("p", { className: "text-sm text-gray-700", children: status }) : null, _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "New Password" }), _jsx("input", { type: "password", className: "w-full border border-gray-300 rounded px-3 py-2", value: newPassword, onChange: (e) => setNewPassword(e.target.value) })] }), _jsx("button", { type: "submit", className: "w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded transition", children: "Update password" })] })] }) }));
}
