import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetEmployeeDetailsQuery } from '../leaderboard/leaderboardApi';

export default function TargetsPage() {
  const { user, token } = useSelector((s: RootState) => s.auth);
  const employeeId = user?.employee_id;

  // Don't render anything if user is not authenticated
  if (!token || !employeeId) {
    return <div className="p-4">Please log in to view targets.</div>;
  }

  const { data: employeeDetails, isLoading, error } = useGetEmployeeDetailsQuery(
    employeeId?.toString() || '',
    {
      skip: !employeeId
    }
  );

  const formatCurrency = (amount: number) => {
    const numAmount = Number(amount) || 0;
    return `₹${numAmount.toLocaleString()}`;
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const renderMetricRow = (metric: any, type: 'daily' | 'weekly') => (
    <tr key={`${type}-${metric.metric}`} className="border-b border-gray-200">
      <td className="px-4 py-2 font-medium">{metric.metric}</td>
      <td className="px-4 py-2 text-center">{metric.target.toLocaleString()}</td>
      <td className="px-4 py-2 text-center font-semibold">{metric.achievement.toLocaleString()}</td>
      <td className="px-4 py-2">
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressBarColor(metric.achievement_percentage)}`}
              style={{ width: `${Math.min(metric.achievement_percentage, 100)}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium w-12">{metric.achievement_percentage.toFixed(1)}%</span>
        </div>
      </td>
      <td className="px-4 py-2 text-center font-semibold text-green-600">
        {metric.earnings !== undefined && metric.earnings !== null
          ? formatCurrency(metric.earnings)
          : '₹0'}
      </td>
    </tr>
  );

  if (!employeeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-2">No employee information available</p>
          <p className="text-sm text-gray-500">Please ensure you are logged in with valid credentials</p>
          <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>User: {JSON.stringify(user, null, 2)}</p>
            <p>Employee ID: {employeeId}</p>
            <p>Token: {token ? 'Present' : 'Missing'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            </div>
          <p className="text-lg text-gray-600 mb-2">Failed to load performance data</p>
          <p className="text-sm text-gray-500">Please try refreshing the page</p>
          <div className="mt-4 p-4 bg-red-50 rounded text-left text-xs">
            <p><strong>Error Details:</strong></p>
            <p>{JSON.stringify(error, null, 2)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!employeeDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg text-gray-600 mb-2">No performance data available</p>
          <p className="text-sm text-gray-500">Your performance metrics will appear here once data is available</p>
        </div>
              </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My Performance Dashboard</h1>
        <p className="text-gray-600">Detailed view of your targets vs achievements</p>

        {/* Employee Info */}
        {employeeDetails && (
          <div className="bg-blue-50 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{employeeDetails.employee.name}</h2>
                <p className="text-gray-600">Cluster: {employeeDetails.employee.cluster} • City: {employeeDetails.employee.city}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="text-lg font-bold text-blue-600">{employeeDetails.employee.employee_id}</p>
              </div>
            </div>
                </div>
              )}
            </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Daily Performance ({employeeDetails?.daily.date})</h2>
          </div>
          {employeeDetails?.daily?.metrics?.length > 0 ? (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Metric</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Target</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Achieved</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Progress</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeDetails.daily.metrics.map((metric: any) => renderMetricRow(metric, 'daily'))}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-3">TOTAL</td>
                      <td className="px-4 py-3 text-center">{employeeDetails.daily.totals.target.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">{employeeDetails.daily.totals.achievement.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        {employeeDetails.daily.totals.target > 0
                          ? `${((employeeDetails.daily.totals.achievement / employeeDetails.daily.totals.target) * 100).toFixed(1)}%`
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center text-green-600">
                        {employeeDetails.daily.totals.earnings !== undefined && employeeDetails.daily.totals.earnings !== null
                          ? formatCurrency(employeeDetails.daily.totals.earnings)
                          : '₹0'}
                      </td>
                    </tr>
                  </tbody>
                </table>
                    </div>
                  </div>
              ) : (
            <div className="p-8 text-center text-gray-500">
              No daily performance data available
                </div>
              )}
            </div>

        {/* Weekly Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Weekly Performance</h2>
          </div>
          {employeeDetails?.weekly?.metrics?.length > 0 ? (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Metric</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Target</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Achieved</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Progress</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeDetails.weekly.metrics.map((metric: any) => renderMetricRow(metric, 'weekly'))}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-3">TOTAL</td>
                      <td className="px-4 py-3 text-center">{employeeDetails.weekly.totals.target.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">{employeeDetails.weekly.totals.achievement.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        {employeeDetails.weekly.totals.target > 0
                          ? `${((employeeDetails.weekly.totals.achievement / employeeDetails.weekly.totals.target) * 100).toFixed(1)}%`
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center text-green-600">
                        {employeeDetails.weekly.totals.earnings !== undefined && employeeDetails.weekly.totals.earnings !== null
                          ? formatCurrency(employeeDetails.weekly.totals.earnings)
                          : '₹0'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No weekly performance data available
                </div>
              )}
            </div>
                    </div>

      {/* Performance Summary */}
      {employeeDetails && (employeeDetails.daily.metrics.length > 0 || employeeDetails.weekly.metrics.length > 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Daily Achievement</p>
                  <p className="text-2xl font-bold text-green-900">{employeeDetails.daily.totals.achievement.toLocaleString()}</p>
                </div>
                <div className="text-green-500">
                  <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                  <div>
                  <p className="text-sm font-medium text-blue-800">Weekly Achievement</p>
                  <p className="text-2xl font-bold text-blue-900">{employeeDetails.weekly.totals.achievement.toLocaleString()}</p>
                </div>
                <div className="text-blue-500">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
                  </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                  <div>
                  <p className="text-sm font-medium text-yellow-800">Daily Earnings</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {employeeDetails.daily.totals.earnings !== undefined && employeeDetails.daily.totals.earnings !== null
                      ? formatCurrency(employeeDetails.daily.totals.earnings)
                      : '₹0'}
                  </p>
                </div>
                <div className="text-yellow-500">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Weekly Earnings</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {employeeDetails.weekly.totals.earnings !== undefined && employeeDetails.weekly.totals.earnings !== null
                      ? formatCurrency(employeeDetails.weekly.totals.earnings)
                      : '₹0'}
                  </p>
                </div>
                <div className="text-purple-500">
                  <span className="text-2xl">💎</span>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
