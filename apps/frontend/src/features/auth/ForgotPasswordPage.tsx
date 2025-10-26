import { FormEvent, useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-sm text-gray-600">We will send a reset link to your email</p>
        </div>
        <form onSubmit={onSubmit} className="bg-white p-5 rounded-lg shadow border border-gray-200 space-y-4">
          {status ? <p className="text-sm text-gray-700">{status}</p> : null}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full border border-gray-300 rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded transition">Send reset link</button>
        </form>
      </div>
    </div>
  );
}
