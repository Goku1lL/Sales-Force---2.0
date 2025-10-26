import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetIncentiveBreakdownQuery, useGetDetailedDailyAchievementsQuery, useGetDetailedWeeklyAchievementsQuery } from './incentivesApi';

export default function IncentivesPage() {
  const employeeId = useSelector((s: RootState) => s.auth.user?.employee_id || 0);
  const [period, setPeriod] = useState<'daily' | 'weekly'>('weekly');
  const [showDetailed, setShowDetailed] = useState(false);
  const { data, isLoading } = useGetIncentiveBreakdownQuery({ employeeId, period }, { skip: !employeeId });
  
  // Detailed achievements with comprehensive SQL queries
  const today = new Date().toISOString().slice(0, 10);
  const yearweek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) + 1970; // Simple yearweek calculation
  const { data: detailedDailyAchievements, isLoading: loadingDetailedDaily, error: errorDetailedDaily } = useGetDetailedDailyAchievementsQuery(
    { employeeId, date: today }, 
    { skip: !employeeId || !showDetailed || period !== 'daily' }
  );
  const { data: detailedWeeklyAchievements, isLoading: loadingDetailedWeekly, error: errorDetailedWeekly } = useGetDetailedWeeklyAchievementsQuery(
    { employeeId, yearweek }, 
    { skip: !employeeId || !showDetailed || period !== 'weekly' }
  );

  // Debug logging
  console.log('💰 Detailed Achievements Debug:', {
    showDetailed,
    period,
    employeeId,
    today,
    yearweek,
    detailedDailyAchievements,
    detailedWeeklyAchievements,
    loadingDetailedDaily,
    loadingDetailedWeekly,
    errorDetailedDaily,
    errorDetailedWeekly
  });

  if (!employeeId) return <p className="p-4">No employee selected</p>;

  const metrics = (data?.data?.metrics ?? []) as any[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Incentives & Earnings</h1>
              <p className="text-gray-600">Track your performance-based earnings</p>
            </div>
            <button
              onClick={() => setShowDetailed(!showDetailed)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                showDetailed
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {showDetailed ? 'Hide Detailed View' : 'Show Detailed View'}
            </button>
          </div>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setPeriod('daily')} 
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              period==='daily'
                ?'bg-green-500 text-white shadow-sm' 
                :'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Daily
          </button>
          <button 
            onClick={() => setPeriod('weekly')} 
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              period==='weekly'
                ?'bg-green-500 text-white shadow-sm' 
                :'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Weekly
          </button>
        </div>

        {/* Incentives Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading incentives...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.length > 0 ? (
              metrics.map((m: any, i: number) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">💰</span>
                    </div>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                      {Math.round(Number(m.contribution||0))}% done
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">{m.metric}</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-2">₹{m.variable_pay}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, Math.max(0, Number(m.contribution||0)))}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No incentives found</h3>
                <p className="text-gray-500">No incentive data available for the selected period</p>
              </div>
            )}
          </div>
        )}

        {/* Detailed Achievements View */}
        {showDetailed && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Detailed Performance Achievements</h2>
            
            {/* Loading and Error States */}
            {(loadingDetailedDaily || loadingDetailedWeekly) && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading detailed achievements...</p>
              </div>
            )}
            
            {(errorDetailedDaily || errorDetailedWeekly) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">Error loading detailed achievements. Please try again.</p>
                {errorDetailedDaily && <p className="text-sm text-red-500 mt-1">Daily: {JSON.stringify(errorDetailedDaily)}</p>}
                {errorDetailedWeekly && <p className="text-sm text-red-500 mt-1">Weekly: {JSON.stringify(errorDetailedWeekly)}</p>}
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Detailed Daily Achievements */}
              {period === 'daily' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📊</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Detailed Daily Achievements</h3>
                      <p className="text-sm text-gray-500">{today}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {(detailedDailyAchievements ?? []).length > 0 ? (
                      (detailedDailyAchievements ?? []).map((achievement: any, i: number) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">{achievement.metric}</span>
                            <span className="text-lg font-bold text-green-600">{achievement.Achievement || 0}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Employee: {achievement.employee_id} | Date: {achievement.date}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No detailed daily achievements found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Weekly Achievements */}
              {period === 'weekly' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📈</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Detailed Weekly Achievements</h3>
                      <p className="text-sm text-gray-500">Week {yearweek}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {(detailedWeeklyAchievements ?? []).length > 0 ? (
                      (detailedWeeklyAchievements ?? []).map((achievement: any, i: number) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">{achievement.metric}</span>
                            <span className="text-lg font-bold text-green-600">{achievement.Achievement || 0}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Employee: {achievement.employee_id} | YearWeek: {achievement.yearweek}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No detailed weekly achievements found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Achievement Metrics Breakdown */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Achievement Metrics Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📦</span>
                    <span className="font-semibold text-green-800">Order Count (OC)</span>
                  </div>
                  <p className="text-sm text-green-600">Total orders placed</p>
                  <p className="text-xs text-gray-500 mt-1">City ID: 2, Order Types: 1,2, Excludes B2C</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🍎</span>
                    <span className="font-semibold text-orange-800">Fruits OC</span>
                  </div>
                  <p className="text-sm text-orange-600">Red Gold category orders</p>
                  <p className="text-xs text-gray-500 mt-1">SubCategory: "Red Gold"</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">👥</span>
                    <span className="font-semibold text-blue-800">Account Base (AB)</span>
                  </div>
                  <p className="text-sm text-blue-600">New customers acquired</p>
                  <p className="text-xs text-gray-500 mt-1">Unique customers this week</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
