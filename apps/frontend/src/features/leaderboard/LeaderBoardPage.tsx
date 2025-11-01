import React, { useState } from 'react';
import { useGetClusterLeaderboardQuery, useGetCityLeaderboardQuery, useGetUserProfileQuery, useGetEmployeeDetailsQuery } from './leaderboardApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

function EmployeeDetailsCard({ 
  employeeDetails, 
  onClose,
  renderSlabBadge,
  renderMetricSection
}: { 
  employeeDetails: any; 
  onClose: () => void;
  renderSlabBadge: (slab: any) => JSX.Element;
  renderMetricSection: (metrics: any[], period: 'day' | 'week') => JSX.Element[] | null;
}) {
  const [localPeriod, setLocalPeriod] = useState<'day' | 'week'>('day');

  if (!employeeDetails) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading employee details...
      </div>
    );
  }

  // Apply AB metrics logic
  const getDisplayMetrics = () => {
    // Function to filter metrics
    const filterMetrics = (metrics: any[], period: 'day' | 'week') => {
      if (period === 'day') {
        // For day view, exclude AB metrics (they're weekly-only)
        return metrics.filter(m => !m.metric.includes('AB'));
      }
      return metrics; // Week view shows all metrics
    };

    // Get AB metrics from weekly data
    const abMetrics = employeeDetails.weekly?.metrics.filter(m => m.metric.includes('AB')) || [];

    // Combine appropriately
    const displayMetrics = localPeriod === 'day'
      ? [
          ...filterMetrics(employeeDetails.daily?.metrics || [], 'day'),
          ...abMetrics // Always include AB metrics from weekly
        ]
      : (employeeDetails.weekly?.metrics || []);

    return displayMetrics;
  };

  const currentMetrics = getDisplayMetrics();

  return (
    <>
      {/* Compact Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{employeeDetails.employee.name}</h2>
          <p className="text-sm text-gray-600">ID: {employeeDetails.employee.employee_id}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Day/Week Toggle */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => setLocalPeriod('day')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              localPeriod === 'day'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            DAY
          </button>
          <button
            onClick={() => setLocalPeriod('week')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              localPeriod === 'week'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            WEEK
          </button>
        </div>
      </div>

      {/* Info message for AB metrics in Day view */}
      {(() => {
        const abMetrics = employeeDetails.weekly?.metrics.filter(m => m.metric.includes('AB')) || [];
        const hasABMetrics = localPeriod === 'day' && abMetrics.length > 0;
        
        return hasABMetrics ? (
          <div className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-blue-500">ℹ️</span>
              <span className="text-sm text-blue-700">
                AB metrics are displayed at weekly level
              </span>
            </div>
          </div>
        ) : null;
      })()}

      {/* Metrics Section */}
      <div className="p-6">
        {renderMetricSection(currentMetrics, localPeriod)}
      </div>
    </>
  );
}

export default function LeaderBoardPage() {
  const [activeTab, setActiveTab] = useState<'cluster' | 'city'>('cluster');
  const [period, setPeriod] = useState<'day' | 'week'>('week');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const { user, token } = useSelector((s: RootState) => s.auth);
  const employeeId = user?.employee_id;

  // Don't render anything if user is not authenticated
  if (!token || !employeeId) {
    return <div className="p-4">Please log in to view the leaderboard.</div>;
  }

  const { data: userProfile } = useGetUserProfileQuery(employeeId, { skip: !employeeId });
  const { data: clusterData } = useGetClusterLeaderboardQuery(
    { cluster: userProfile?.cluster || '', period },
    { skip: !userProfile?.cluster }
  );
  const { data: cityData } = useGetCityLeaderboardQuery(
    { cityId: Number(userProfile?.CityId) || 0, period },
    { skip: !userProfile?.CityId }
  );
  const { data: employeeDetails } = useGetEmployeeDetailsQuery(
    selectedEmployee || '', 
    {
      skip: !selectedEmployee
    }
  );

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

  const getSlabEmoji = (slabSegment: string) => {
    if (slabSegment === 'slab1') return '🥉';
    if (slabSegment === 'slab2') return '🥈';
    if (slabSegment === 'slab3') return '🥇';
    return '🏅';
  };

  const getMetricEmoji = (metricName: string) => {
    if (metricName === 'FruitsAB') return '🍎';
    if (metricName === 'GT OC') return '📦';
    if (metricName === 'VegetablesAB') return '🥬';
    return '📊';
  };

  const renderSlabBadge = (slab: any) => {
    const achievement = Number(slab.achievement || 0);
    const target = Number(slab.target || 0);
    const achievementPercentage = slab.target > 0 ? ((achievement / target) * 100) : 0;
    const isCompleted = achievementPercentage >= 100;

    return (
      <div
        key={slab.slab_Segment}
        className={`p-4 rounded-lg border text-center ${
          isCompleted
            ? 'bg-green-50 border-green-200'
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="text-2xl mb-2">{getSlabEmoji(slab.slab_Segment)}</div>
        <div className="font-semibold text-sm mb-1">
          {slab.slab_Segment?.toUpperCase() || 'DEFAULT'}
        </div>
        <div className={`text-xs mb-2 ${isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
          {isCompleted ? 'COMPLETED 🎉' : 'ACTIVE ⚡'}
        </div>
        <div className="text-lg font-bold text-gray-800">
          {achievement.toLocaleString()} / {target.toLocaleString()}
        </div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressBarColor(achievementPercentage)}`}
              style={{ width: `${Math.min(achievementPercentage, 100)}%` }}
            ></div>
          </div>
          <span className="text-xs font-medium w-10">{achievementPercentage.toFixed(1)}%</span>
        </div>
      </div>
    );
  };

  const renderMetricSection = (metrics: any[], period: 'day' | 'week') => {
    // Group by metric name
    const grouped = metrics.reduce((acc: Record<string, any[]>, metric: any) => {
      const key = metric.metric || 'Unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(metric);
      return acc;
    }, {});

    const groups = Object.entries(grouped);
    
    if (groups.length === 0) return null;

    return groups.map(([metricName, slabMetrics]) => {
      // Sort slabs by priority (slab3 > slab2 > slab1)
      const sortedSlabs = (slabMetrics as any[]).sort((a, b) => {
        const slabOrder = { 'slab3': 3, 'slab2': 2, 'slab1': 1 };
        return (slabOrder[b.slab_Segment as keyof typeof slabOrder] || 0) - (slabOrder[a.slab_Segment as keyof typeof slabOrder] || 0);
      });

      // Find the highest slab that's not completed (or the highest slab if all are completed)
      const highestSlab = sortedSlabs.find(slab => {
        const achievement = Number(slab.achievement || 0);
        const target = Number(slab.target || 0);
        return achievement < target;
      }) || sortedSlabs[0]; // If all completed, show the highest slab

      const highestSlabTarget = Number(highestSlab?.target || 0);
      const highestSlabAchievement = Number(highestSlab?.achievement || 0);
      const remaining = Math.max(0, highestSlabTarget - highestSlabAchievement);
      const avgContribution = slabMetrics[0]?.contribution || 0;

      return (
        <div
          key={metricName}
          className="p-4 rounded-lg border bg-gray-50 border-gray-200 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getMetricEmoji(metricName)}</span>
              <span className="font-bold text-lg">{metricName}</span>
              {/* Weekly badge for AB metrics in Day view */}
              {metricName.includes('AB') && period === 'day' && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                  Weekly
                </span>
              )}
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-blue-100 text-blue-700">
              {(Number(avgContribution) * 100).toFixed(0)}% contribution
            </span>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Units remaining ({highestSlab?.slab_Segment?.toUpperCase()}): <span className="font-semibold text-orange-600">{remaining.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(slabMetrics as any[]).map(slab => renderSlabBadge(slab))}
          </div>
        </div>
  );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Leaderboard</h1>

        {/* User Info */}
        {userProfile && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Name</p>
                <h2 className="text-sm font-semibold text-gray-900">{userProfile.name}</h2>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Location</p>
                <p className="text-sm text-gray-900">{userProfile.cluster} • {userProfile.city}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Your Rankings</p>
                <p className="text-sm font-semibold text-blue-600">
                  Cluster #{userProfile.cluster_rank} • City #{userProfile.city_rank}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('cluster')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'cluster'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cluster
          </button>
          <button
            onClick={() => setActiveTab('city')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'city'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            City
          </button>
          </div>
          
          {/* Period Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('day')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                period === 'day'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              DAY
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                period === 'week'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              WEEK
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {activeTab === 'cluster' ? 'Cluster Rankings' : 'City Rankings'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {period === 'day' ? 'Daily Target Achievement' : 'Weekly Target Achievement'}
            </p>
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
                          <p className="font-medium text-sm text-gray-900">{employee.Name || `Employee ${employee.employee_id}`}</p>
                          <p className="text-xs text-gray-600">
                            {activeTab === 'cluster' ? employee.cluster : employee.city_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {employee.achievement_percentage !== undefined && employee.achievement_percentage !== null ? (
                          <>
                            <p className="text-sm font-semibold text-blue-600">
                              {Number(employee.achievement_percentage).toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {period === 'day' ? 'Daily Target' : 'Weekly Target'}
                            </p>
                          </>
                        ) : employee.weekly_achievements !== undefined && employee.weekly_achievements !== null ? (
                          <>
                            <p className="text-sm font-semibold text-blue-600">
                              {employee.weekly_achievements.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">Units</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-blue-600">0%</p>
                            <p className="text-xs text-gray-500">
                              {period === 'day' ? 'Daily Target' : 'Weekly Target'}
                            </p>
                          </>
                        )}
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
              <EmployeeDetailsCard
                employeeDetails={employeeDetails}
                onClose={() => setSelectedEmployee(null)}
                renderSlabBadge={renderSlabBadge}
                renderMetricSection={renderMetricSection}
              />
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
