import { FormEvent, useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions
    setStatus(null);
    setLoading(true);
    
    // Use Vite environment variables with fallback
    const baseUrl = (import.meta.env.VITE_BACKEND_URL || 
      (import.meta.env.DEV 
        ? 'http://localhost:3000/api/v1' 
        : 'https://sales-force-2-0.onrender.com/api/v1'
      ));
    
    try {
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
      
      let data: any = {};
      try {
        const text = await res.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseErr) {
        // Handle case where response is not JSON
        if (!res.ok) {
          const errorMsg = `Error ${res.status}: ${res.statusText || 'Server error'}`;
          console.error('Forgot password error:', errorMsg);
          setStatus(errorMsg);
          setLoading(false);
          return;
        }
      }
      
      if (!res.ok) {
        setStatus(data.message || `Error ${res.status}: ${res.statusText || 'Request failed'}`);
        setLoading(false);
        return;
      }
      
    setStatus(data.message || 'If the email exists, a reset link has been sent');
    } catch (err: any) {
      console.error('Network error:', err);
      setStatus(`Network error: ${err.message || 'Please check your connection and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-sm text-gray-600">We will send a reset link to your email</p>
        </div>
        <form onSubmit={onSubmit} className="bg-white p-5 rounded-lg shadow border border-gray-200 space-y-4">
          {status && (
            <div className={`p-3 rounded text-sm ${
              status.toLowerCase().includes('error') || status.toLowerCase().includes('failed')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {status}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full border border-gray-300 rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-semibold py-2.5 rounded transition ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
}
