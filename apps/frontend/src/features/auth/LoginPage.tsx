import { FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from './authApi';
import { eventTracker } from '../../services/eventTracker';

export default function LoginPage() {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Helper function to determine if input is email or employee ID
  const isEmail = (input: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!loginInput || !password) {
      setFormError('Please enter your login credentials and password');
      return;
    }

    const loginMethod = isEmail(loginInput) ? 'email' : 'employee_id';
    
    try {
      const loginData = isEmail(loginInput) 
        ? { email: loginInput, password }
        : { employee_id: loginInput, password };
      
      const result = await login(loginData).unwrap();
      
      // Track successful login
      if (result.user?.employee_id) {
        eventTracker.track('user_login', {
          success: true,
          method: loginMethod,
          employee_id: result.user.employee_id
        });
      }
      
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Track failed login attempt (without setting employee_id)
      const tempTracker = eventTracker;
      const errorType = err?.data?.message || 'unknown';
      
      if (err?.data?.message === 'Please verify your email') {
        setFormError('Please check your email and verify your account before logging in');
      } else if (err?.data?.message === 'Invalid credentials') {
        setFormError('Invalid login credentials or password');
      } else {
        setFormError(`Login failed: ${err?.data?.message || err?.message || 'Please try again.'}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="h-12 w-12 rounded-lg object-contain" />
          </div>
          <h1 className="mt-3 text-xl font-bold text-gray-900">Login</h1>
          <p className="text-sm text-gray-600">Sign in to continue</p>
        </div>
        <form onSubmit={onSubmit} className="bg-white p-5 rounded-lg shadow border border-gray-200 space-y-4">
          {formError ? (<p className="text-sm text-red-600">{formError}</p>) : null}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee ID or Email
            </label>
            <input 
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" 
              value={loginInput} 
              onChange={(e) => setLoginInput(e.target.value)} 
              placeholder="Enter employee ID or email address"
              autoComplete="username" 
            />
            <p className="text-xs text-gray-500 mt-1">
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <button disabled={isLoading} type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded transition">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="flex items-center justify-between text-sm">
            <a href="/forgot-password" className="text-green-700 hover:underline">Forgot password?</a>
            <a href="/signup" className="text-gray-700 hover:underline">Create account</a>
          </div>
        </form>
      </div>
    </div>
  );
}
