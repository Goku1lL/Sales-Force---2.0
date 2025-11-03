import { FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/api/v1'
      : 'https://sales-force-2-0.onrender.com/api/v1';
    try {
      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch (err) {
        // Handle case where response is not JSON
        if (!res.ok) {
          setStatus(`Error: ${res.status} ${res.statusText}`);
          return;
        }
      }
      if (!res.ok) setStatus(data.message || 'Reset failed'); else setStatus('Password updated. You can login now.');
    } catch (err: any) {
      setStatus('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-sm text-gray-600">Enter your new password</p>
        </div>
        <form onSubmit={onSubmit} className="bg-white p-5 rounded-lg shadow border border-gray-200 space-y-4">
          {status ? <p className="text-sm text-gray-700">{status}</p> : null}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" className="w-full border border-gray-300 rounded px-3 py-2" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded transition">Update password</button>
        </form>
      </div>
    </div>
  );
}
