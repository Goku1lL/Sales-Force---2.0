import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
const LinkComponent = Link as any;

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [full_name, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name, password })
      });
      let data: any = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) {
        setStatus({ type: 'error', message: data?.message || `Signup failed (${res.status})` });
      } else {
        setStatus({ type: 'success', message: data?.message || 'Signup successful. Check your email to verify.' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err?.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-600">Use your company email</p>
        </div>
        <form onSubmit={onSubmit} className="bg-white p-5 rounded-lg shadow border border-gray-200 space-y-4">
          {status ? (
            <p className={`text-sm ${status.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>{status.message}</p>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input autoComplete="name" className="w-full border border-gray-300 rounded px-3 py-2" value={full_name} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input autoComplete="email" type="email" className="w-full border border-gray-300 rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input autoComplete="new-password" type="password" className="w-full border border-gray-300 rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded transition">{loading ? 'Creating...' : 'Create account'}</button>
          <div className="text-sm text-gray-700 text-center">
            Already have an account? <LinkComponent to="/login" className="text-green-700 hover:underline">Sign in</LinkComponent>
          </div>
        </form>
      </div>
    </div>
  );
}
