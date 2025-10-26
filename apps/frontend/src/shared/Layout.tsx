import { Link, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useGetUserProfileQuery } from '../features/leaderboard/leaderboardApi';
import { useTheme } from './ThemeContext';
import type { RootState } from '../app/store';

export default function Layout() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const employeeId = user?.employee_id || 0;
  const { data: profile } = useGetUserProfileQuery(employeeId, { skip: !employeeId });
  const { currentTheme, toggleTheme } = useTheme();
  const isDark = currentTheme.isDark;
  const isActive = (p: string) => pathname === p;
  
  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900' : 'bg-gray-50'}`}>
        <header className={`sticky top-0 z-50 border-b-2 transition-colors ${
          isDark
            ? 'bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 border-cyan-400/50'
            : 'bg-white border-gray-200'
        }`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Header with Theme Toggle */}
          <div className="flex items-center justify-between">
            {/* Gamified Logo & Brand */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${
                isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-indigo-600'
              }`}>
                <img src="/logo.png" alt="Sales Force" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Sales Force
                </h1>
                <p className={`text-sm ${isDark ? 'text-cyan-300' : 'text-gray-500'}`}>
                  {profile?.cluster || 'Loading...'}
                </p>
              </div>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-yellow-400 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* Gamified User Info */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-indigo-100'
                }`}>
                  <span className={`text-lg font-bold ${
                    isDark ? 'text-black' : 'text-indigo-700'
                  }`}>
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {user?.name || 'User'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-cyan-300' : 'text-gray-500'}`}>
                    Level {profile?.cluster_rank ? `${profile.cluster_rank}` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={() => dispatch(logout())}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Gamified Navigation */}
          <nav className={`mt-6 flex justify-between rounded-2xl p-3 transition-colors ${
            isDark ? 'bg-gray-800/50 border border-gray-600' : 'bg-gray-100'
          }`}>
            {[
              { href: '/', label: 'Home', icon: '🏠' },
              { href: '/targets', label: 'Targets', icon: '🎯' },
              { href: '/customers', label: 'Customers', icon: '👥' },
              { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
            ].map(({ href, label, icon }) => (
              <Link
                key={href}
                to={href}
                className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-xl text-sm font-bold transition-all min-w-0 flex-1 ${
                  isActive(href)
                    ? isDark
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black'
                      : 'bg-green-100 text-green-700'
                    : isDark
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                <span className="text-2xl leading-none">{icon}</span>
                <span className="text-xs leading-tight text-center font-bold">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      
      <main className="pb-6">
        <Outlet />
      </main>
    </div>
  );
}
