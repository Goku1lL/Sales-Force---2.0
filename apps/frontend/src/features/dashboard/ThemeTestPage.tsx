import React from 'react';
import { useTheme } from '../../shared/ThemeContext';
import { ThemedCard, ThemedBadge, ThemedProgress } from '../../shared';

export default function ThemeTestPage() {
  const { currentTheme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Theme System Test
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Toggle Theme (Current: {currentTheme.name})
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              isDark: {currentTheme.isDark.toString()}, isNeon: {currentTheme.isNeon.toString()}
            </div>
          </div>
        </div>

        {/* Test Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Daily Target Card */}
          <ThemedCard accent="amber">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  currentTheme.isDark 
                    ? 'bg-white/5 ring-1 ring-white/10' 
                    : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-300/30'
                }`}>
                  <span className="text-3xl">💰</span>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${
                    currentTheme.isDark ? 'text-[var(--text)]' : 'text-gray-900'
                  }`}>
                    Daily Target
                  </h3>
                  <p className={`text-sm font-bold ${
                    currentTheme.isDark ? 'text-yellow-200/90' : 'text-amber-900'
                  }`}>
                    Pending to earn
                  </p>
                </div>
              </div>
              <ThemedBadge>RANK 1</ThemedBadge>
            </div>
            <div>
              <p className={`text-5xl font-extrabold mb-3 ${
                currentTheme.isDark ? 'text-cyan-300' : 'text-gray-900'
              }`}>
                ₹1,500
              </p>
              <div className="flex justify-between text-sm mb-3">
                <span className={`font-bold ${
                  currentTheme.isDark ? 'text-yellow-200' : 'text-amber-900'
                }`}>
                  Progress
                </span>
                <span className={`font-bold ${
                  currentTheme.isDark ? 'text-[var(--text)]' : 'text-gray-900'
                }`}>
                  75% complete
                </span>
              </div>
              <ThemedProgress value={75} theme="amber" />
            </div>
          </ThemedCard>

          {/* Weekly Target Card */}
          <ThemedCard accent="purple">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  currentTheme.isDark 
                    ? 'bg-white/5 ring-1 ring-white/10' 
                    : 'bg-gradient-to-br from-pink-500 to-red-500 shadow-lg shadow-pink-300/30'
                }`}>
                  <span className="text-3xl">📅</span>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${
                    currentTheme.isDark ? 'text-[var(--text)]' : 'text-gray-900'
                  }`}>
                    Weekly Target
                  </h3>
                  <p className={`text-sm font-bold ${
                    currentTheme.isDark ? 'text-purple-200/90' : 'text-green-800'
                  }`}>
                    Keep your streak alive
                  </p>
                </div>
              </div>
              <ThemedBadge>5 DAY STREAK</ThemedBadge>
            </div>
            <div>
              <p className={`text-5xl font-extrabold mb-3 ${
                currentTheme.isDark ? 'text-cyan-300' : 'text-gray-900'
              }`}>
                ₹8,500
              </p>
              <div className="flex justify-between text-sm mb-3">
                <span className={`font-bold ${
                  currentTheme.isDark ? 'text-purple-200' : 'text-rose-800'
                }`}>
                  Progress
                </span>
                <span className={`font-bold ${
                  currentTheme.isDark ? 'text-[var(--text)]' : 'text-gray-900'
                }`}>
                  60% complete
                </span>
              </div>
              <ThemedProgress value={60} theme="rose" />
            </div>
          </ThemedCard>

        </div>

        {/* Theme Information */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Current Theme Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Theme Properties:</h3>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>Name: {currentTheme.name}</li>
                <li>Is Dark: {currentTheme.isDark.toString()}</li>
                <li>Is Neon: {currentTheme.isNeon.toString()}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Colors:</h3>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>Primary: {currentTheme.colors.primary}</li>
                <li>Secondary: {currentTheme.colors.secondary}</li>
                <li>Background: {currentTheme.colors.background}</li>
                <li>Text: {currentTheme.colors.text}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
