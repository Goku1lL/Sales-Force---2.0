import React, { useState } from 'react';
import { useGetClusterLeaderboardQuery, useGetCityLeaderboardQuery, useGetUserProfileQuery, useGetEmployeeDetailsQuery } from './leaderboardApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

export default function LeaderBoardPage() {
  const [activeTab, setActiveTab] = useState<'cluster' | 'city'>('cluster');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const employeeId = useSelector((s: RootState) => s.auth.user?.employee_id || 0);

  const { data: userProfile } = useGetUserProfileQuery(employeeId, { skip: !employeeId });
  const { data: clusterData } = useGetClusterLeaderboardQuery(userProfile?.cluster || '', { skip: !userProfile?.cluster });
  const { data: cityData } = useGetCityLeaderboardQuery(Number(userProfile?.CityId) || 0, { skip: !userProfile?.CityId });
  const { data: employeeDetails } = useGetEmployeeDetailsQuery(Number(selectedEmployee) || 0, {
    skip: !selectedEmployee
  });

  const leaderboardData = activeTab === 'cluster' ? clusterData : cityData;

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
        {metric.earnings !== undefined && metric.earnings !== null ? formatCurrency(metric.earnings) : '₹0'}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Leaderboard</h1>

        {/* User Info */}
        {userProfile && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{userProfile.name}</h2>
                <p className="text-gray-600">Cluster: {userProfile.cluster} • City: {userProfile.city}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Your Rankings</p>
                <p className="text-lg font-bold text-blue-600">
                  #{userProfile.cluster_rank} in Cluster • #{userProfile.city_rank} in City
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('cluster')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'cluster'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cluster Leaderboard ({userProfile?.cluster})
          </button>
          <button
            onClick={() => setActiveTab('city')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'city'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            City Leaderboard ({userProfile?.city})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {activeTab === 'cluster' ? 'Cluster Rankings' : 'City Rankings'}
            </h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {leaderboardData?.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {leaderboardData.map((employee: any, index: number) => (
                  <div
                    key={employee.employee_id || index}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      employee.employee_id?.toString() === employeeId?.toString() ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedEmployee(employee.employee_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          #{employee.rank}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{employee.Name || `Employee ${employee.employee_id}`}</p>
                          <p className="text-sm text-gray-600">
                            {activeTab === 'cluster' ? employee.cluster : employee.city_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">
                          {employee.weekly_achievements !== undefined && employee.weekly_achievements !== null
                            ? employee.weekly_achievements.toLocaleString()
                            : '0'
                          }
                        </p>
                        <p className="text-xs text-gray-500">Weekly Units</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No leaderboard data available
              </div>
            )}
          </div>
        </div>

        {/* Employee Details */}
        <div className="bg-white rounded-lg shadow">
          {selectedEmployee ? (
            <>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Employee Details</h2>
              </div>
              {employeeDetails ? (
                <div className="p-6 space-y-6">
                  {/* Employee Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{employeeDetails.employee.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Employee ID:</span>
                        <span className="ml-2">{employeeDetails.employee.employee_id}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Cluster:</span>
                        <span className="ml-2">{employeeDetails.employee.cluster}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">City:</span>
                        <span className="ml-2">{employeeDetails.employee.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Daily Performance */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Daily Performance ({employeeDetails.daily.date})</h4>
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

                  {/* Weekly Performance */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Weekly Performance</h4>
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
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Loading employee details...
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Click on an employee to view detailed performance metrics
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
