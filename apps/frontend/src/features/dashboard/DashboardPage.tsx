import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../app/store';
import { useGetSummaryQuery, useGetUrgentActionsQuery, useGetNearbyOpportunitiesQuery } from './dashboardApi';
import { useGetUserProfileQuery, useGetClusterLeaderboardQuery, useGetCityLeaderboardQuery, useGetEmployeeDetailsQuery } from '../leaderboard/leaderboardApi';
import { useGetAssignedCustomersQuery, useGetInactiveCustomersQuery, useGetHighValueCustomersQuery } from '../customers/customersApi';
import { CUSTOMER_TAB_LABELS } from '../customers/customerConstants';
import { CustomerCard } from '../customers/CustomerCard';
import { useTheme } from '../../shared/ThemeContext';
import { ThemedCard, ThemedBadge, ThemedProgress } from '../../shared';
import { useLiveActivity } from '../../shared/useLiveActivity';

// Clean Progress Component - Single Responsibility
function Progress({ value, color = 'green' }: { value: number; color?: 'green' | 'orange' | 'blue' | 'purple' }) {
  const { currentTheme } = useTheme();
  
  const colorClass = color === 'green' ? 'from-green-400 to-emerald-500' : 
                    color === 'orange' ? 'from-orange-400 to-red-500' : 
                    color === 'blue' ? 'from-blue-400 to-cyan-500' :
                    'from-purple-400 to-pink-500';
  
  const displayWidth = Math.max(5, Math.min(100, Math.max(0, value)));
  
  const trackClass = currentTheme.isDark ? 'bg-gray-700 border-gray-500' : 'bg-gray-200 border-gray-300';
  
  return (
    <div className={`h-6 rounded-full overflow-hidden shadow-inner border-2 ${trackClass}`}>
      <div 
        className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-1000 ease-out relative`} 
        style={{ width: `${displayWidth}%` }}
      />
      <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-white/70 rounded-full animate-pulse"></div>
    </div>
  );
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper function to get progress color based on percentage
function getProgressBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

// Enhanced Leaderboard Item Component - Premium Design
function LeaderboardItem({ person, rank, isCurrentUser }: { person: any; rank: number; isCurrentUser: boolean }) {
  const { currentTheme } = useTheme();
  
  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 via-yellow-500 to-amber-500';
    if (rank === 2) return 'from-gray-300 via-gray-400 to-gray-500';
    if (rank === 3) return 'from-orange-400 via-orange-500 to-red-500';
    return 'from-indigo-400 via-blue-500 to-purple-500';
  };

  const getRankGlow = (rank: number) => {
    if (rank === 1) return 'shadow-lg shadow-yellow-500/30';
    if (rank === 2) return 'shadow-lg shadow-gray-400/30';
    if (rank === 3) return 'shadow-lg shadow-orange-500/30';
    return 'shadow-md shadow-indigo-500/20';
  };

  const achievementPercentage = person.achievement_percentage !== undefined && person.achievement_percentage !== null
    ? Number(person.achievement_percentage)
    : 0;

  const textColor = currentTheme.isDark || currentTheme.isNeon ? 'text-white' : 'text-gray-900';
  const bgColor = isCurrentUser 
    ? (currentTheme.isDark || currentTheme.isNeon 
        ? 'bg-gradient-to-r from-blue-600/30 via-blue-500/20 to-indigo-600/30 border-blue-400/50 shadow-lg shadow-blue-500/20' 
        : 'bg-gradient-to-r from-blue-50 via-blue-100 to-indigo-50 border-blue-300 shadow-lg shadow-blue-200/50')
    : (currentTheme.isDark || currentTheme.isNeon 
        ? 'bg-gradient-to-r from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/50 hover:border-gray-500' 
        : 'bg-gradient-to-r from-white via-gray-50 to-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md');

  return (
    <div className={`group relative overflow-hidden rounded-2xl border-2 ${bgColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <div className="relative flex items-center p-4">
        {/* Left side - Rank and User Info */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Enhanced Rank Badge */}
          <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center text-xl font-bold text-white ${getRankGlow(rank)} transition-all duration-300 group-hover:scale-110 flex-shrink-0`}>
            <span className="drop-shadow-sm">{getRankIcon(rank)}</span>
            {/* Crown animation for rank 1 */}
            {rank === 1 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className={`font-bold text-base truncate ${textColor} group-hover:text-opacity-90`}>
                {person.Name || person.name || 'Unknown User'}
              </p>
              {isCurrentUser && (
                <span className="px-2 py-1 text-xs font-bold text-blue-600 bg-blue-100 rounded-full animate-pulse flex-shrink-0">
                  YOU
                </span>
              )}
            </div>
            <p className={`text-sm ${currentTheme.isDark || currentTheme.isNeon ? 'text-gray-300' : 'text-gray-600'} group-hover:text-opacity-80`}>
              {person.cluster || 'Unknown Cluster'}
            </p>
          </div>
        </div>

        {/* Right side - Stats */}
        <div className="text-right space-y-1 ml-4 flex-shrink-0">
          <div className="flex items-center space-x-2 justify-end">
            <span className="text-2xl">📊</span>
            <p className={`font-bold text-lg ${textColor} group-hover:text-opacity-90 whitespace-nowrap`}>
              {achievementPercentage.toFixed(1)}%
            </p>
          </div>
          <div className="flex items-center space-x-2 justify-end">
            <span className="text-sm">🎯</span>
            <p className={`text-sm font-medium ${currentTheme.isDark || currentTheme.isNeon ? 'text-gray-300' : 'text-gray-600'} group-hover:text-opacity-80 whitespace-nowrap`}>
              target achieved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component - Clean Architecture
export default function DashboardPage() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [leaderboardType, setLeaderboardType] = useState<'cluster' | 'city'>('cluster');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [leaderboardViewMode, setLeaderboardViewMode] = useState<'day' | 'week'>('day');
  // Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  
  // API queries - Only make calls when user is authenticated
  const employeeId = user?.employee_id;
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useGetSummaryQuery(employeeId?.toString() || '', { skip: !employeeId });
  const { data: profile, isLoading: profileLoading, error: profileError } = useGetUserProfileQuery(employeeId, { skip: !employeeId });
  const { data: employeeDetails } = useGetEmployeeDetailsQuery(employeeId || '', { skip: !employeeId });
  
  const { data: clusterLeaderboard, isLoading: clusterLoading } = useGetClusterLeaderboardQuery(
    { cluster: profile?.cluster || '', period: leaderboardViewMode }, 
    { skip: !employeeId || !profile?.cluster }
  );
  const { data: cityLeaderboard, isLoading: cityLoading } = useGetCityLeaderboardQuery(
    { cityId: Number(profile?.CityId) || 0, period: leaderboardViewMode }, 
    { skip: !employeeId || !profile?.CityId }
  );
  const { data: urgentActions } = useGetUrgentActionsQuery(employeeId, { skip: !employeeId });
  const { data: nearbyOpportunities } = useGetNearbyOpportunitiesQuery();
  const { data: priorityCustomers, isLoading: priorityLoading } = useGetHighValueCustomersQuery(employeeId || '', { skip: !employeeId });
  const { data: assignedCustomers, isLoading: assignedLoading } = useGetAssignedCustomersQuery(employeeId || '', { skip: !employeeId });
  const { data: inactiveCustomers, isLoading: inactiveLoading } = useGetInactiveCustomersQuery(employeeId || '', { skip: !employeeId });

  // Live activity with client-side polling
  const { activities: liveActivities, isLoading: liveActivityLoading } = useLiveActivity();

  // Calculate derived values using correct API data
  const dailyProgress = summary?.data?.dailyPercent || 0;
  const weeklyProgress = summary?.data?.weeklyPercent || 0;
  const dailyProgressCapped = Math.min(100, dailyProgress);
  const weeklyProgressCapped = Math.min(100, weeklyProgress);

  // Pending amounts (what they still need to earn - this is still valid)
  const dailyPending = Math.max(0, (summary?.data?.todayTarget || 0) - (summary?.data?.todayEarnings || 0));
  const weeklyPending = Math.max(0, (summary?.data?.weeklyTarget || 0) - (summary?.data?.weeklyEarnings || 0));

  const cityRank = profile?.city_rank || 'N/A';
  const clusterRank = profile?.cluster_rank || 'N/A';
  const currentLeaderboard = leaderboardType === 'cluster' ? clusterLeaderboard : cityLeaderboard;
  const leaderboardLoading = leaderboardType === 'cluster' ? clusterLoading : cityLoading;


  // Authentication check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400">Please log in to access the dashboard</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (summaryLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (summaryError) {
  return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Please try refreshing the page</p>
      </div>
    </div>
  );
}

  // Helper function to render performance view (metric summaries without slabs)
  const renderPerformanceView = (metrics: any[], totals: any, employeeVariablePay: number, periodType: 'day' | 'week') => {
    // Group metrics by name and aggregate across slabs
    const metricSummaries: Record<string, {
      metric: string;
      target: number;
      achievement: number;
      earnings: number;
      contribution: number;
      maxPotentialEarnings: number;
      pendingToEarn: number;
    }> = {};
    
    // Convert monthly variable_pay to daily or weekly
    // variable_pay is monthly, so for day = monthly / 30, for week = monthly / 4
    const periodMultiplier = periodType === 'day' ? (1 / 30) : (1 / 4);
    const periodVariablePay = employeeVariablePay * periodMultiplier;

    metrics.forEach(item => {
      const metricName = item.metric;
      if (!metricSummaries[metricName]) {
        metricSummaries[metricName] = {
          metric: metricName,
          target: 0,
          achievement: 0,
          earnings: 0,
          contribution: item.contribution || 0,
          maxPotentialEarnings: 0,
          pendingToEarn: 0
        };
      }
      
      // For targets, take the maximum slab target
      metricSummaries[metricName].target = Math.max(
        metricSummaries[metricName].target,
        Number(item.target || 0)
      );
      
      // For achievements and earnings, sum across slabs
      metricSummaries[metricName].achievement += Number(item.achievement || 0);
      metricSummaries[metricName].earnings += Number(item.earnings || 0);
      
      // Calculate potential earnings using incentive_percent from database
      // incentive_percent is stored as 1, 1.5, 2 (for 100%, 150%, 200%)
      // If incentive_percent is 0 in database (data not populated), use slab number as fallback
      let incentivePercent = Number(item.incentive_percent || 0);
      
      // Fallback: derive incentive from slab number if database value is missing
      if (incentivePercent === 0 && item.slab_Segment) {
        const slabNum = parseInt(item.slab_Segment.replace('slab', ''));
        if (slabNum === 1) incentivePercent = 1;
        else if (slabNum === 2) incentivePercent = 1.5;
        else if (slabNum === 3) incentivePercent = 2;
      }
      
      const potentialEarnings = periodVariablePay * incentivePercent;
      
      // Track the maximum potential earnings across all slabs
      metricSummaries[metricName].maxPotentialEarnings = Math.max(
        metricSummaries[metricName].maxPotentialEarnings,
        potentialEarnings
      );
    });

    // Calculate pending to earn for each metric
    Object.keys(metricSummaries).forEach(metricName => {
      const summary = metricSummaries[metricName];
      // Pending = Max possible - Already earned
      summary.pendingToEarn = Math.max(0, summary.maxPotentialEarnings - summary.earnings);
    });

    const summaryList = Object.values(metricSummaries);
    
    // Calculate totals
    const totalTarget = summaryList.reduce((sum, m) => sum + m.target, 0);
    const totalAchievement = summaryList.reduce((sum, m) => sum + m.achievement, 0);
    const totalEarnings = summaryList.reduce((sum, m) => sum + m.earnings, 0);
    const totalPending = summaryList.reduce((sum, m) => sum + m.pendingToEarn, 0);
    const overallProgress = totalTarget > 0 ? (totalAchievement / totalTarget) * 100 : 0;

    return (
      <>
        {/* Total Pending to Earn - Hero Section */}
        <div className="mb-3 sm:mb-6">
          <div className="text-center mb-2">
            <div className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
              💵 TOTAL PENDING TO EARN
            </div>
            <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${
              currentTheme.isDark ? 'text-green-400' : 'text-green-600'
            }`}>
              {formatCurrency(totalPending)}
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${getProgressBarColor(overallProgress)}`}
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium w-16">{overallProgress.toFixed(1)}%</span>
          </div>
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-6 mt-3 text-sm">
            <div>
              <span className="text-gray-500">Max Potential:</span>
              <span className="ml-1 font-semibold">{formatCurrency(summaryList.reduce((sum, m) => sum + m.maxPotentialEarnings, 0))}</span>
            </div>
            <div>
              <span className="text-gray-500">Earned:</span>
              <span className="ml-1 font-semibold text-green-600">{formatCurrency(totalEarnings)}</span>
            </div>
            <div>
              <span className="text-gray-500">Pending:</span>
              <span className="ml-1 font-semibold text-orange-600">{formatCurrency(totalPending)}</span>
            </div>
          </div>
        </div>

        {/* Metrics Summary Separator */}
        <div className="flex items-center justify-center my-3 sm:my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <h4 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider px-2 sm:px-4">
            METRICS SUMMARY
          </h4>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Metric-Level Summary Cards */}
        <div className="space-y-2 sm:space-y-4">
          {summaryList.map((summary) => {
            const achievementPercentage = summary.target > 0 
              ? (summary.achievement / summary.target) * 100 
              : 0;
            
            return (
              <div
                key={summary.metric}
                className={`p-2 sm:p-4 rounded-lg border ${
                  currentTheme.isDark 
                    ? 'bg-gray-800/50 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {/* Metric Header */}
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {summary.metric === 'FruitsAB' ? '🍎' : 
                       summary.metric === 'GT OC' ? '📦' : 
                       summary.metric === 'VegetablesAB' ? '🥬' : '📊'}
                    </span>
                    <span className="font-bold text-lg">{summary.metric}</span>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
                    currentTheme.isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {summary.contribution * 100}% contribution
                  </span>
                </div>

                {/* Metric Stats */}
                <div className="grid grid-cols-2 gap-3 mb-2 text-sm">
                  <div>
                    <span className="text-gray-500">Target:</span>
                    <span className="ml-1 font-semibold">{summary.target.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Achieved:</span>
                    <span className="ml-1 font-semibold">{summary.achievement.toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressBarColor(achievementPercentage)}`}
                      style={{ width: `${Math.min(achievementPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-14">{achievementPercentage.toFixed(1)}%</span>
                </div>

                {/* Earnings */}
                <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
                  <div>
                    <span className="text-gray-500">Earned:</span>
                    <span className="ml-1 font-semibold text-green-600">
                      {formatCurrency(summary.earnings)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">💰 Pending:</span>
                    <span className="ml-1 font-semibold text-orange-600">
                      {formatCurrency(summary.pendingToEarn)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className={`min-h-screen ${
      currentTheme.isDark 
        ? 'bg-gray-900' 
        : currentTheme.isNeon 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900'
        : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`relative overflow-hidden ${
        currentTheme.isDark 
          ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800' 
          : currentTheme.isNeon 
          ? 'bg-gradient-to-r from-gray-800 via-blue-900 to-indigo-900'
          : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
      </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar/Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                currentTheme.isDark 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                  : currentTheme.isNeon 
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}>
                <span className="text-lg text-white font-semibold">
                  {user?.name?.charAt(0) || 'S'}
                </span>
    </div>
              
              {/* Welcome Text */}
              <div>
                <h1 className={`text-xl font-semibold ${
                  currentTheme.isDark 
                    ? 'text-white' 
                    : currentTheme.isNeon 
                    ? 'text-white'
                    : 'text-gray-900'
                }`}>
                  Welcome back, {user?.name || 'Sales Executive'}! 👋
                </h1>
                <p className={`text-sm ${
                  currentTheme.isDark 
                    ? 'text-gray-300' 
                    : currentTheme.isNeon 
                    ? 'text-gray-300'
                    : 'text-gray-600'
                }`}>
                  Ready to crush your targets today? 🚀
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-4">
              <div className={`text-center px-3 py-2 rounded-lg ${
                currentTheme.isDark 
                  ? 'bg-white/10 backdrop-blur-sm' 
                  : currentTheme.isNeon 
                  ? 'bg-white/10 backdrop-blur-sm'
                  : 'bg-white/80 backdrop-blur-sm shadow-md'
              }`}>
                <div className={`text-lg font-semibold ${
                  currentTheme.isDark
                    ? 'text-cyan-400'
                    : currentTheme.isNeon
                    ? 'text-cyan-400'
                    : 'text-blue-600'
                }`}>
                  {cityRank}
                </div>
                <div className={`text-xs ${
                  currentTheme.isDark
                    ? 'text-gray-400'
                    : currentTheme.isNeon
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}>
                  City Rank
            </div>
          </div>

              <div className={`text-center px-3 py-2 rounded-lg ${
                currentTheme.isDark 
                  ? 'bg-white/10 backdrop-blur-sm' 
                  : currentTheme.isNeon 
                  ? 'bg-white/10 backdrop-blur-sm'
                  : 'bg-white/80 backdrop-blur-sm shadow-md'
              }`}>
                <div className={`text-lg font-semibold ${
                  currentTheme.isDark 
                    ? 'text-green-400' 
                    : currentTheme.isNeon 
                    ? 'text-green-400'
                    : 'text-green-600'
                }`}>
                  {Math.round(dailyProgress)}%
                </div>
                <div className={`text-xs ${
                  currentTheme.isDark 
                    ? 'text-gray-400' 
                    : currentTheme.isNeon 
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}>
                  Daily Progress
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Target Cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Performance Overview Card - Unified Day/Week View */}
            {employeeDetails && (
              <ThemedCard accent="purple">
                <div className="mb-2 sm:mb-4">
                  {/* Card Header with Toggle */}
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        currentTheme.isDark ? 'bg-purple-500/20' : 'bg-purple-500'
                      }`}>
                        <span className="text-xl">💰</span>
                      </div>
                      <h3 className={`text-xl font-bold ${
                        currentTheme.isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        Performance Overview
                      </h3>
                    </div>
                    
                    {/* Day/Week Toggle */}
                    <div className="flex gap-1 sm:gap-2">
                      <button
                        onClick={() => setViewMode('day')}
                        className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-semibold transition-all ${
                          viewMode === 'day'
                            ? 'bg-purple-500 text-white shadow-lg'
                            : currentTheme.isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        DAY
                      </button>
                      <button
                        onClick={() => setViewMode('week')}
                        className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-semibold transition-all ${
                          viewMode === 'week'
                            ? 'bg-purple-500 text-white shadow-lg'
                            : currentTheme.isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        WEEK
                      </button>
                    </div>
                  </div>

                  {/* Cluster and City Ranks */}
                  <div className="flex items-center mb-2 sm:mb-4">
                    <div className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg flex-shrink-0 ${
                      currentTheme.isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
                    }`}>
                      <span className="text-xs sm:text-sm font-medium">🏆 CLUSTER RANK</span>
                      <span className={`ml-1 sm:ml-2 text-base sm:text-lg font-bold ${
                        currentTheme.isDark ? 'text-yellow-400' : 'text-yellow-700'
                      }`}>
                        {clusterRank}
                      </span>
                    </div>
                    <div className="flex-1"></div>
                    <div className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg flex-shrink-0 ${
                      currentTheme.isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                    }`}>
                      <span className="text-xs sm:text-sm font-medium">🌆 CITY RANK</span>
                      <span className={`ml-1 sm:ml-2 text-base sm:text-lg font-bold ${
                        currentTheme.isDark ? 'text-blue-400' : 'text-blue-700'
                      }`}>
                        {cityRank}
                      </span>
                    </div>
                  </div>

                  {/* Render based on view mode */}
                  {viewMode === 'day' ? (
                    <>
                      {/* Daily Performance */}
                      {renderPerformanceView(
                        employeeDetails.daily?.metrics || [],
                        employeeDetails.daily?.totals || {},
                        employeeDetails.daily?.employee_variable_pay || 0,
                        'day'
                      )}
                    </>
                  ) : (
                    <>
                      {/* Weekly Performance */}
                      {renderPerformanceView(
                        employeeDetails.weekly?.metrics || [],
                        employeeDetails.weekly?.totals || {},
                        employeeDetails.weekly?.employee_variable_pay || 0,
                        'week'
                      )}
                    </>
                  )}
                  
                  {/* Call to Action */}
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => navigate('/targets')}
                      className={`text-sm font-semibold underline ${
                        currentTheme.isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                      }`}
                    >
                      👉 View Detailed Slab Breakdown
                    </button>
                  </div>
                </div>
              </ThemedCard>
            )}

            {/* Customer Cards - Desktop grid layout - Show available cards first */}
            {(assignedCustomers?.length > 0 || inactiveCustomers?.length > 0 || priorityCustomers?.length > 0) && (
              <div className="mt-6 hidden lg:block">
                <div className="space-y-6">
                  {/* Collect all available customer cards */}
                  {(() => {
                    const availableCards = [];
                    
                    if (assignedCustomers && assignedCustomers.length > 0) {
                      availableCards.push(
                        <div key="assigned">
                          <CustomerCard
                            customers={assignedCustomers.slice(0, 3)}
                            title={`${CUSTOMER_TAB_LABELS.assigned} (${assignedCustomers.length})`}
                            isLoading={assignedLoading}
                            showDescription={false}
                            showLastOrder={true}
                            tabType="assigned"
                          />
                        </div>
                      );
                    }
                    
                    if (inactiveCustomers && inactiveCustomers.length > 0) {
                      availableCards.push(
                        <div key="inactive">
                          <CustomerCard
                            customers={inactiveCustomers.slice(0, 3)}
                            title={`${CUSTOMER_TAB_LABELS.inactive} (${inactiveCustomers.length})`}
                            isLoading={inactiveLoading}
                            showDescription={false}
                            showLastOrder={true}
                            tabType="inactive"
                          />
                        </div>
                      );
                    }
                    
                    if (priorityCustomers && priorityCustomers.length > 0) {
                      availableCards.push(
                        <div key="high">
                          <CustomerCard
                            customers={priorityCustomers.slice(0, 3)}
                            title={`${CUSTOMER_TAB_LABELS.high} (${priorityCustomers.length})`}
                            isLoading={priorityLoading}
                            showDescription={false}
                            showLastOrder={true}
                            tabType="high"
                          />
                        </div>
                      );
                    }

                    // Render in a dynamic grid based on number of available cards
                    if (availableCards.length === 1) {
                      return <div className="grid grid-cols-1 gap-6">{availableCards}</div>;
                    } else if (availableCards.length === 2) {
                      return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{availableCards}</div>;
                    } else {
                      // Three cards: 2 in first row, 1 in second
                      return (
                        <>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {availableCards.slice(0, 2)}
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {availableCards.slice(2)}
                          </div>
                        </>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            </div>

          {/* Right Column - Leaderboard */}
          <div className="space-y-6">
            
            {/* Enhanced Leaderboard Header */}
            <div className={`relative overflow-hidden rounded-2xl p-6 shadow-xl ${
              currentTheme.isDark 
                ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800' 
                : currentTheme.isNeon 
                ? 'bg-gradient-to-br from-gray-800 via-blue-900 to-indigo-900'
                : 'bg-gradient-to-br from-white via-gray-50 to-white'
            }`}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
              </div>
              
              {/* Header with Day/Week Toggle */}
              <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    currentTheme.isDark 
                      ? 'bg-gradient-to-br from-yellow-500 to-amber-600' 
                      : currentTheme.isNeon 
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
                      : 'bg-gradient-to-br from-yellow-400 to-amber-500'
                  } shadow-lg`}>
                    <span className="text-xl">🏆</span>
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${
                      currentTheme.isDark 
                        ? 'text-white' 
                        : currentTheme.isNeon 
                        ? 'text-white'
                        : 'text-gray-900'
                    }`}>
                      Leaderboard
                    </h2>
                  </div>
                </div>
                
                {/* Day/Week Toggle */}
                <div className={`flex rounded-xl p-1 shadow-lg ${
                  currentTheme.isDark 
                    ? 'bg-gray-700/50 backdrop-blur-sm' 
                    : currentTheme.isNeon 
                    ? 'bg-gray-700/30 backdrop-blur-sm'
                    : 'bg-gray-100 shadow-gray-200/50'
                  }`}>
                  <button
                    onClick={() => setLeaderboardViewMode('day')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      leaderboardViewMode === 'day'
                        ? currentTheme.isDark || currentTheme.isNeon
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                        : currentTheme.isDark || currentTheme.isNeon
                          ? 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setLeaderboardViewMode('week')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      leaderboardViewMode === 'week'
                        ? currentTheme.isDark || currentTheme.isNeon
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                        : currentTheme.isDark || currentTheme.isNeon
                          ? 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Week
                  </button>
                </div>
              </div>

              {/* Subtitle */}
              <div className="mb-4">
                <p className={`text-sm ${
                  currentTheme.isDark 
                    ? 'text-gray-300' 
                    : currentTheme.isNeon 
                    ? 'text-gray-300'
                    : 'text-gray-600'
                }`}>
                  Top performers this {leaderboardViewMode === 'day' ? 'day' : 'week'}
                </p>
              </div>

              {/* Cluster/City Toggle - below Leaderboard title */}
              <div className="mb-6 relative z-10">
                <div className={`flex rounded-xl p-1 shadow-lg relative z-10 ${
                  currentTheme.isDark 
                    ? 'bg-gray-700/50 backdrop-blur-sm' 
                    : currentTheme.isNeon 
                    ? 'bg-gray-700/30 backdrop-blur-sm'
                    : 'bg-gray-100 shadow-gray-200/50'
                  }`}>
                  <button
                    type="button"
                    onClick={() => setLeaderboardType('cluster')}
                    className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 min-h-[44px] w-full touch-manipulation ${
                      leaderboardType === 'cluster'
                        ? currentTheme.isDark || currentTheme.isNeon
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                        : currentTheme.isDark || currentTheme.isNeon
                          ? 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Cluster
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardType('city')}
                    className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 min-h-[44px] w-full touch-manipulation ${
                      leaderboardType === 'city'
                        ? currentTheme.isDark || currentTheme.isNeon
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                        : currentTheme.isDark || currentTheme.isNeon
                          ? 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    City
                  </button>
                </div>
              </div>
              
              {/* Enhanced Leaderboard Content */}
              <div className="space-y-4">
                {leaderboardLoading ? (
                  <div className="text-center py-12">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto mb-4"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-300 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                    <p className={`text-lg font-medium ${
                      currentTheme.isDark 
                        ? 'text-gray-300' 
                        : currentTheme.isNeon 
                        ? 'text-gray-300'
                        : 'text-gray-600'
                    }`}>Loading leaderboard...</p>
                    <p className={`text-sm ${
                      currentTheme.isDark 
                        ? 'text-gray-400' 
                        : currentTheme.isNeon 
                        ? 'text-gray-400'
                        : 'text-gray-500'
                    }`}>Fetching top performers</p>
                  </div>
                ) : (currentLeaderboard as any)?.length > 0 ? (
              <div className="space-y-3">
                    {(currentLeaderboard as any).slice(0, 5).map((person: any, index: number) => (
                      <div key={person.id || person.employee_id || index} className="animate-fadeInUp" style={{ animationDelay: `${index * 100}ms` }}>
                        <LeaderboardItem
                          person={person}
                          rank={index + 1}
                          isCurrentUser={person.id === user?.id || person.employee_id === user?.id}
                        />
                      </div>
                    ))}
                    {(currentLeaderboard as any).length > 5 && (
                      <div className="text-center pt-2">
                        <p className={`text-xs ${
                          currentTheme.isDark 
                            ? 'text-gray-400' 
                            : currentTheme.isNeon 
                            ? 'text-gray-400'
                            : 'text-gray-500'
                        }`}>
                          Showing top 5 of {(currentLeaderboard as any).length} participants
                        </p>
              </div>
            )}
          </div>
                ) : (
                  <div className="text-center py-12">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      currentTheme.isDark 
                        ? 'bg-gray-700' 
                        : currentTheme.isNeon 
                        ? 'bg-gray-700/50'
                        : 'bg-gray-100'
                    }`}>
                      <span className="text-2xl">📊</span>
                    </div>
                    <p className={`text-lg font-medium ${
                      currentTheme.isDark 
                        ? 'text-gray-300' 
                        : currentTheme.isNeon 
                        ? 'text-gray-300'
                        : 'text-gray-600'
                    }`}>No leaderboard data available</p>
                    <p className={`text-sm ${
                      currentTheme.isDark 
                        ? 'text-gray-400' 
                        : currentTheme.isNeon 
                        ? 'text-gray-400'
                        : 'text-gray-500'
                    }`}>Check back later for updates</p>
                  </div>
                )}
              </div>
                      </div>

            {/* Live Activity */}
            {liveActivities.length > 0 && (
              <div className={`rounded-2xl p-6 shadow-lg ${
                currentTheme.isDark
                  ? 'bg-gray-800'
                  : currentTheme.isNeon
                    ? 'bg-gray-800/90'
                    : 'bg-white'
              }`}>
                <h3 className={`text-lg font-bold mb-4 ${
                  currentTheme.isDark
                    ? 'text-white'
                    : currentTheme.isNeon
                      ? 'text-white'
                      : 'text-gray-900'
                }`}>
                  Live Activity
                </h3>
                <div className="space-y-2">
                  {liveActivities.slice(0, 5).map((activity: any, index: number) => (
                    <div key={activity.id || index} className={`flex items-center space-x-3 p-2 rounded-lg ${
                      currentTheme.isDark
                        ? 'bg-gray-700'
                        : currentTheme.isNeon
                          ? 'bg-gray-700/50'
                          : 'bg-gray-50'
                    }`}>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <p className={`text-sm ${
                          currentTheme.isDark
                            ? 'text-gray-300'
                            : currentTheme.isNeon
                              ? 'text-gray-300'
                              : 'text-gray-700'
                        }`}>{activity.message}</p>
                        <p className={`text-xs mt-1 ${
                          currentTheme.isDark
                            ? 'text-gray-400'
                            : currentTheme.isNeon
                              ? 'text-gray-400'
                              : 'text-gray-500'
                        }`}>
                          {activity.employee_name} • {activity.cluster} • {activity.timestamp}
                        </p>
                      </div>
                      {activity.variable_pay && (
                        <div className="text-right">
                          <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                            ₹{activity.variable_pay}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {liveActivities.length > 5 && (
                  <p className={`text-xs mt-3 text-center ${
                    currentTheme.isDark
                      ? 'text-gray-400'
                      : currentTheme.isNeon
                        ? 'text-gray-400'
                        : 'text-gray-500'
                  }`}>
                    Showing 5 of {liveActivities.length} recent activities
                  </p>
                )}
              </div>
            )}

            {/* Customer Cards - Mobile view (below leaderboard) */}
            {/* Target Customers Card */}
            {assignedCustomers && assignedCustomers.length > 0 && (
              <div className="mt-6 lg:hidden">
                <CustomerCard
                  customers={assignedCustomers.slice(0, 5)}
                  title={`${CUSTOMER_TAB_LABELS.assigned} (${assignedCustomers.length})`}
                  isLoading={assignedLoading}
                  showDescription={false}
                  showLastOrder={true}
                  tabType="assigned"
                />
              </div>
            )}

            {/* App Funnel Card */}
            {inactiveCustomers && inactiveCustomers.length > 0 && (
              <div className="mt-6 lg:hidden">
                <CustomerCard
                  customers={inactiveCustomers.slice(0, 5)}
                  title={`${CUSTOMER_TAB_LABELS.inactive} (${inactiveCustomers.length})`}
                  isLoading={inactiveLoading}
                  showDescription={false}
                  showLastOrder={true}
                  tabType="inactive"
                />
              </div>
            )}

            {/* Priority Customers Card */}
            {priorityCustomers && priorityCustomers.length > 0 && (
              <div className="mt-6 lg:hidden">
                <CustomerCard
                  customers={priorityCustomers.slice(0, 5)}
                  title={`${CUSTOMER_TAB_LABELS.high} (${priorityCustomers.length})`}
                  isLoading={priorityLoading}
                  showDescription={false}
                  showLastOrder={true}
                  tabType="high"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}