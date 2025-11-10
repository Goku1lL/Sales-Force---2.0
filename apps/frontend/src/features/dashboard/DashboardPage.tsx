import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../app/store';
import { useGetSummaryQuery, useGetUrgentActionsQuery, useGetNearbyOpportunitiesQuery } from './dashboardApi';
import { useGetUserProfileQuery, useGetClusterLeaderboardQuery, useGetCityLeaderboardQuery, useGetEmployeeDetailsQuery } from '../leaderboard/leaderboardApi';
import { useGetAssignedCustomersQuery, useGetInactiveCustomersQuery, useGetHighValueCustomersQuery, useGetCustomerPageCustomersQuery } from '../customers/customersApi';
import { CustomerCard } from '../customers/CustomerCard';
import { useTheme } from '../../shared/ThemeContext';
import { ThemedCard, ThemedBadge, ThemedProgress } from '../../shared';
import { useLiveActivity } from '../../shared/useLiveActivity';
import { usePageView, useEventTracking } from '../../hooks/useEventTracking';

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
  
  // Event tracking
  usePageView('dashboard');
  const { track } = useEventTracking();
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
  const { data: customerPageCustomers, isLoading: customerPageLoading } = useGetCustomerPageCustomersQuery(employeeId || '', { skip: !employeeId });

  // Group customers by description (same logic as CustomersPage)
  const groupedCustomers = useMemo(() => {
    const groups: Record<string, { customers: any[]; source: 'assigned' | 'inactive' | 'high' | 'customerPage' }> = {};
    const seenKeys = new Set<string>();

    // Process in priority order: assigned > high > inactive > customerPage
    const allCustomers = [
      ...(assignedCustomers ?? []).map(c => ({ ...c, _source: 'assigned' })),
      ...(priorityCustomers ?? []).map(c => ({ ...c, _source: 'high' })),
      ...(inactiveCustomers ?? []).map(c => ({ ...c, _source: 'inactive' })),
      ...(customerPageCustomers ?? []).map(c => ({ ...c, _source: 'customerPage' }))
    ];

    allCustomers.forEach((customer: any) => {
      const desc = customer.description || 'Uncategorized';
      
      // Create unique key: use customer_id + description for customerPage, Id for others
      const uniqueKey = customer._source === 'customerPage' && customer.customer_id
        ? `${customer.customer_id}_${desc}`
        : `${customer.Id}_${desc}`;
      
      if (seenKeys.has(uniqueKey)) return;
      seenKeys.add(uniqueKey);
      
      if (!groups[desc]) {
        groups[desc] = { customers: [], source: customer._source };
      }
      const { _source, ...cleanCustomer } = customer;
      groups[desc].customers.push(cleanCustomer);
    });

    // Sort each group by time/date fields (most recent first)
    Object.keys(groups).forEach(desc => {
      groups[desc].customers.sort((a: any, b: any) => {
        // For SA_CustomerPageCustomers, sort by date (most recent first)
        if (a.date && b.date) {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA; // DESC: most recent first
        }
        
        // For LastOpened (hours ago - lower is more recent)
        if (a.LastOpened !== undefined && b.LastOpened !== undefined) {
          return a.LastOpened - b.LastOpened; // ASC: lower hours = more recent
        }
        
        // For LastOrder (days ago - lower is more recent)
        if (a.LastOrder !== undefined && b.LastOrder !== undefined) {
          return a.LastOrder - b.LastOrder; // ASC: lower days = more recent
        }
        
        // Fallback: maintain original order
        return 0;
      });
    });

    return groups;
  }, [assignedCustomers, priorityCustomers, inactiveCustomers, customerPageCustomers]);

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
    // Separate AB/NOB (weekly-only) and non-AB/NOB metrics for different period calculations
    const abMetrics = metrics.filter(m => m.metric.includes('AB') || m.metric.includes('NOB'));
    const nonABMetrics = metrics.filter(m => !m.metric.includes('AB') && !m.metric.includes('NOB'));
    
    // Group metrics by name and aggregate across slabs
    const metricSummaries: Record<string, {
      metric: string;
      target: number;
      achievement: number;
      earnings: number;
      contribution: number;
      maxPotentialEarnings: number;
      pendingToEarn: number;
      rankBonus?: {
        rank: number;
        bonusAmount: number;
      };
      bonusTiers?: Array<{
        startRank: number;
        endRank: number;
        bonusPercent: number;
        multiplier: number;
        target: number;
      }>;
      maxPotentialBreakdown?: {
        base: number;
        bonus: number;
        multiplier: number;
        total: number;
      };
    }> = {};
    
    // Process non-AB metrics with appropriate period multiplier
    const nonABPeriodMultiplier = periodType === 'day' ? (1 / 30) : (1 / 4);
    const nonABPeriodVariablePay = employeeVariablePay * nonABPeriodMultiplier;
    
    nonABMetrics.forEach(item => {
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
      
      // For achievements and earnings, only take the first occurrence (avoid duplication)
      if (metricSummaries[metricName].achievement === 0) {
        metricSummaries[metricName].achievement = Number(item.achievement || 0);
      }
      if (metricSummaries[metricName].earnings === 0) {
        metricSummaries[metricName].earnings = Number(item.earnings || 0);
      }
      // Capture rank bonus if available
      if (item.rankBonus && !metricSummaries[metricName].rankBonus) {
        metricSummaries[metricName].rankBonus = {
          rank: Number(item.rankBonus.rank),
          bonusAmount: Number(item.rankBonus.bonusAmount || 0)
        };
      }
      // Capture bonus tiers if available
      if (item.bonusTiers && !metricSummaries[metricName].bonusTiers) {
        metricSummaries[metricName].bonusTiers = item.bonusTiers;
      }
      
      // Calculate potential earnings using incentive_percent from database
      let incentivePercent = Number(item.incentive_percent || 0);
      
      // Fallback: derive incentive from slab number if database value is missing
      if (incentivePercent === 0 && item.slab_Segment) {
        const slabNum = parseInt(item.slab_Segment.replace('slab', ''));
        if (slabNum === 1) incentivePercent = 1;
        else if (slabNum === 2) incentivePercent = 1.5;
        else if (slabNum === 3) incentivePercent = 2;
      }
      
      // Variable Pay should be split based on contribution % only
      const contribution = metricSummaries[metricName].contribution || 0;
      const potentialEarnings = nonABPeriodVariablePay * incentivePercent * contribution;
      
      // Track the maximum potential earnings across all slabs
      metricSummaries[metricName].maxPotentialEarnings = Math.max(
        metricSummaries[metricName].maxPotentialEarnings,
        potentialEarnings
      );
    });

    // Process AB metrics with weekly period multiplier (always weekly)
    const abPeriodMultiplier = 1 / 4; // Always weekly for AB metrics
    const abPeriodVariablePay = employeeVariablePay * abPeriodMultiplier;
    
    abMetrics.forEach(item => {
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
      
      // For achievements and earnings, only take the first occurrence (avoid duplication)
      if (metricSummaries[metricName].achievement === 0) {
        metricSummaries[metricName].achievement = Number(item.achievement || 0);
      }
      if (metricSummaries[metricName].earnings === 0) {
        metricSummaries[metricName].earnings = Number(item.earnings || 0);
      }
      // Capture rank bonus if available
      if (item.rankBonus && !metricSummaries[metricName].rankBonus) {
        metricSummaries[metricName].rankBonus = {
          rank: Number(item.rankBonus.rank),
          bonusAmount: Number(item.rankBonus.bonusAmount || 0)
        };
      }
      // Capture bonus tiers if available
      if (item.bonusTiers && !metricSummaries[metricName].bonusTiers) {
        metricSummaries[metricName].bonusTiers = item.bonusTiers;
      }
      
      // Calculate potential earnings using incentive_percent from database
      let incentivePercent = Number(item.incentive_percent || 0);
      
      // Fallback: derive incentive from slab number if database value is missing
      if (incentivePercent === 0 && item.slab_Segment) {
        const slabNum = parseInt(item.slab_Segment.replace('slab', ''));
        if (slabNum === 1) incentivePercent = 1;
        else if (slabNum === 2) incentivePercent = 1.5;
        else if (slabNum === 3) incentivePercent = 2;
      }
      
      // Variable Pay should be split based on contribution % only
      const contribution = metricSummaries[metricName].contribution || 0;
      const potentialEarnings = abPeriodVariablePay * incentivePercent * contribution;
      
      // Track the maximum potential earnings across all slabs
      metricSummaries[metricName].maxPotentialEarnings = Math.max(
        metricSummaries[metricName].maxPotentialEarnings,
        potentialEarnings
      );
    });

    // Calculate max potential and pending to earn for each metric (including bonus multipliers)
    Object.keys(metricSummaries).forEach(metricName => {
      const summary = metricSummaries[metricName];
      
      // Base max potential (from slabs)
      const baseMaxPotential = summary.maxPotentialEarnings;
      
      // If bonus tiers exist, calculate max potential including highest bonus multiplier
      if (summary.bonusTiers && summary.bonusTiers.length > 0) {
        // Get highest bonus multiplier (typically the first tier, rank 1-5 = 200% = 2.0)
        // Bonus tiers are ordered by start_rank (ascending), so first tier has highest multiplier
        const highestBonusMultiplier = summary.bonusTiers[0]?.multiplier || 1;
        
        // Max potential = Base earnings at highest slab × Highest bonus multiplier
        summary.maxPotentialEarnings = baseMaxPotential * highestBonusMultiplier;
        
        // Store breakdown for display
        summary.maxPotentialBreakdown = {
          base: baseMaxPotential,
          bonus: baseMaxPotential * (highestBonusMultiplier - 1), // Bonus amount only
          multiplier: highestBonusMultiplier,
          total: summary.maxPotentialEarnings
        };
      } else {
        summary.maxPotentialBreakdown = {
          base: baseMaxPotential,
          bonus: 0,
          multiplier: 1,
          total: baseMaxPotential
        };
      }
      
      // Pending = Max possible (with bonus) - Already earned (base + current bonus)
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
          <div className="flex justify-center gap-4 mt-3 text-xs sm:text-sm flex-wrap">
            <div>
              <span className="text-gray-500">Max Potential:</span>
              <span className="ml-1 font-semibold">{formatCurrency(summaryList.reduce((sum, m) => sum + m.maxPotentialEarnings, 0))}</span>
              {summaryList.some(m => m.maxPotentialBreakdown && m.maxPotentialBreakdown.bonus > 0) && (
                <div className="text-xs text-gray-400 mt-0.5">
                  (Includes bonus)
                </div>
              )}
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
          
          {/* Max Potential Breakdown (if bonus included) */}
          {summaryList.some(m => m.maxPotentialBreakdown && m.maxPotentialBreakdown.bonus > 0) && (
            <div className={`mt-3 p-2 rounded-lg text-xs ${
              currentTheme.isDark 
                ? 'bg-purple-500/10 border border-purple-500/20' 
                : 'bg-purple-50 border border-purple-200'
            }`}>
              <div className="text-center text-gray-600">
                <span>💰 Max Potential includes highest bonus tier (e.g., {(summaryList.find(m => m.maxPotentialBreakdown && m.maxPotentialBreakdown.multiplier > 1)?.maxPotentialBreakdown?.multiplier || 2) * 100}% for Rank 1-5)</span>
              </div>
            </div>
          )}
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
                    {/* Weekly badge for AB/NOB metrics in Day view */}
                    {(summary.metric.includes('AB') || summary.metric.includes('NOB')) && viewMode === 'day' && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        currentTheme.isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                      }`}>
                        Weekly
                      </span>
                    )}
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
                <div className="space-y-2">
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
                  
                  {/* Rank Bonus Display with Motivational Elements */}
                  {summary.rankBonus && (
                    <div className={`mt-2 p-2 rounded-lg border ${
                      currentTheme.isDark 
                        ? 'bg-yellow-500/10 border-yellow-500/30' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            currentTheme.isDark ? 'text-yellow-400' : 'text-yellow-700'
                          }`}>
                            🏆 Rank {summary.rankBonus.rank}
                            {summary.rankBonus.rank <= 5 && ' 🎯'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            summary.rankBonus.rank <= 5 
                              ? currentTheme.isDark 
                                ? 'bg-yellow-500/20 text-yellow-400' 
                                : 'bg-yellow-100 text-yellow-800'
                              : summary.rankBonus.rank <= 10
                              ? currentTheme.isDark 
                                ? 'bg-orange-500/20 text-orange-400' 
                                : 'bg-orange-100 text-orange-800'
                              : currentTheme.isDark 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {summary.rankBonus.rank <= 5 ? 'Top 5' : 
                             summary.rankBonus.rank <= 10 ? 'Top 10' : 'Top 15'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Bonus:</span>
                          <span className={`ml-1 font-semibold ${
                            currentTheme.isDark ? 'text-yellow-400' : 'text-yellow-700'
                          }`}>
                            +{formatCurrency(summary.rankBonus.bonusAmount)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        <span>Base: {formatCurrency(summary.earnings - summary.rankBonus.bonusAmount)}</span>
                        <span className="mx-2">+</span>
                        <span>Bonus: {formatCurrency(summary.rankBonus.bonusAmount)}</span>
                        <span className="mx-2">=</span>
                        <span className="font-semibold text-green-600">Total: {formatCurrency(summary.earnings)}</span>
                      </div>
                    </div>
                  )}

                  {/* Bonus Tier Visualization - Motivational Display */}
                  {summary.bonusTiers && summary.bonusTiers.length > 0 && (
                    <div className={`mt-3 p-3 rounded-lg border ${
                      currentTheme.isDark 
                        ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30' 
                        : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                    }`}>
                      <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        🏆 Bonus Tiers Available
                      </div>
                      <div className="space-y-2">
                        {summary.bonusTiers.map((tier, idx) => {
                          const isCurrentTier = summary.rankBonus && 
                            summary.rankBonus.rank >= tier.startRank && 
                            summary.rankBonus.rank <= tier.endRank;
                          const isAchieved = summary.rankBonus && summary.rankBonus.rank <= tier.endRank;
                          const nextTierIndex = summary.bonusTiers!.findIndex(t => 
                            summary.rankBonus && summary.rankBonus.rank >= t.startRank && summary.rankBonus.rank <= t.endRank
                          );
                          const isNextTier = !summary.rankBonus && idx === 0 || 
                            (summary.rankBonus && summary.rankBonus.rank > tier.endRank && idx === (nextTierIndex >= 0 ? nextTierIndex + 1 : 0));
                          
                          return (
                            <div 
                              key={idx}
                              className={`p-2 rounded border ${
                                isCurrentTier
                                  ? currentTheme.isDark
                                    ? 'bg-yellow-500/20 border-yellow-500/50'
                                    : 'bg-yellow-100 border-yellow-300'
                                  : isAchieved
                                  ? currentTheme.isDark
                                    ? 'bg-green-500/10 border-green-500/30 opacity-60'
                                    : 'bg-green-50 border-green-200 opacity-60'
                                  : currentTheme.isDark
                                  ? 'bg-gray-700/50 border-gray-600 opacity-40'
                                  : 'bg-gray-100 border-gray-300 opacity-40'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${
                                    isCurrentTier 
                                      ? currentTheme.isDark ? 'text-yellow-400' : 'text-yellow-700'
                                      : isAchieved
                                      ? currentTheme.isDark ? 'text-green-400' : 'text-green-700'
                                      : currentTheme.isDark ? 'text-gray-500' : 'text-gray-400'
                                  }`}>
                                    Rank {tier.startRank}-{tier.endRank}
                                  </span>
                                  {isCurrentTier && <span className="text-yellow-500">⭐</span>}
                                  {isAchieved && !isCurrentTier && <span className="text-green-500">✓</span>}
                                </div>
                                <span className={`font-semibold ${
                                  isCurrentTier || isAchieved
                                    ? currentTheme.isDark ? 'text-yellow-400' : 'text-yellow-700'
                                    : currentTheme.isDark ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  {(tier.bonusPercent * 100).toFixed(0)}% Bonus
                                </span>
                              </div>
                              {isNextTier && !isCurrentTier && (
                                <div className="mt-1 text-xs text-blue-600 font-semibold">
                                  🎯 Push to reach this tier!
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {summary.rankBonus && summary.rankBonus.rank > 15 && (
                        <div className="mt-2 text-xs text-center text-gray-500">
                          You're ranked #{summary.rankBonus.rank} - Keep pushing! 💪
                        </div>
                      )}
                    </div>
                  )}

                  {/* Motivational Message - Next Tier Opportunity */}
                  {summary.bonusTiers && summary.bonusTiers.length > 0 && (
                    (() => {
                      let nextTier: typeof summary.bonusTiers[0] | null = null;
                      let motivationalMessage = '';
                      
                      if (summary.rankBonus) {
                        // Find next tier they could reach
                        const currentTier = summary.bonusTiers.find(t => 
                          summary.rankBonus!.rank >= t.startRank && summary.rankBonus!.rank <= t.endRank
                        );
                        const currentTierIdx = currentTier ? summary.bonusTiers.indexOf(currentTier) : -1;
                        if (currentTierIdx > 0) {
                          nextTier = summary.bonusTiers[currentTierIdx - 1];
                          const rankGap = nextTier.startRank - summary.rankBonus.rank;
                          motivationalMessage = `🎯 Only ${rankGap} rank${rankGap > 1 ? 's' : ''} away from Rank ${nextTier.startRank}-${nextTier.endRank} (${(nextTier.bonusPercent * 100).toFixed(0)}% bonus)!`;
                        }
                      } else {
                        // They haven't reached slab 3 yet
                        const slab3Target = summary.bonusTiers[0]?.target || 0;
                        const unitsNeeded = Math.max(0, slab3Target - summary.achievement);
                        if (unitsNeeded > 0) {
                          motivationalMessage = `🚀 Reach ${slab3Target} units to unlock bonus tiers! You need ${unitsNeeded} more.`;
                        }
                      }
                      
                      return motivationalMessage ? (
                        <div className={`mt-3 p-2 rounded-lg ${
                          currentTheme.isDark 
                            ? 'bg-blue-500/20 border border-blue-500/30' 
                            : 'bg-blue-50 border border-blue-200'
                        }`}>
                          <div className="text-xs font-semibold text-center">
                            {motivationalMessage}
                          </div>
                        </div>
                      ) : null;
                    })()
                  )}
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
        {/* Eligibility Warning Banner - Show regardless of day/week toggle */}
        {(() => {
          // Check both daily and weekly eligibility, prioritize weekly (since NOB is weekly)
          const weeklyEligibility = summary?.data?.weeklyEligibilityStatus;
          const dailyEligibility = summary?.data?.dailyEligibilityStatus;
          
          // Use weekly eligibility if available, otherwise fall back to daily
          const eligibilityStatus = weeklyEligibility || dailyEligibility;
          
          // Show alert if either status indicates not eligible
          if (eligibilityStatus && !eligibilityStatus.isEligible) {
            return (
              <div className={`mb-6 p-4 rounded-lg border-2 ${
                currentTheme.isDark 
                  ? 'bg-yellow-500/10 border-yellow-500/30' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <div className={`font-semibold mb-1 ${
                      currentTheme.isDark ? 'text-yellow-400' : 'text-yellow-800'
                    }`}>
                      Eligibility requirement: Achieve {eligibilityStatus.metric} target of {eligibilityStatus.target.toLocaleString()} to be eligible for Variable Pay
                    </div>
                    <div className={`text-sm ${
                      currentTheme.isDark ? 'text-yellow-300' : 'text-yellow-700'
                    }`}>
                      Current achievement: {eligibilityStatus.achievement.toLocaleString()} / {eligibilityStatus.target.toLocaleString()} 
                      ({eligibilityStatus.target > 0 ? ((eligibilityStatus.achievement / eligibilityStatus.target) * 100).toFixed(1) : '0.0'}%)
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
        
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
                        onClick={() => {
                          track('period_toggled', { from: viewMode, to: 'day', page: 'dashboard' });
                          setViewMode('day');
                        }}
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
                        onClick={() => {
                          track('period_toggled', { from: viewMode, to: 'week', page: 'dashboard' });
                          setViewMode('week');
                        }}
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

                  {/* Render based on view mode with AB metrics logic */}
                  {(() => {
                    // Function to filter metrics
                    const filterMetrics = (metrics: any[], period: 'day' | 'week') => {
                      if (period === 'day') {
                        // For day view, exclude AB/NOB metrics (they're weekly-only)
                        return metrics.filter(m => !m.metric.includes('AB') && !m.metric.includes('NOB'));
                      }
                      return metrics; // Week view shows all metrics
                    };

                    // Function to recalculate totals after filtering
                    const recalculateTotals = (metrics: any[]) => {
                      const groupedMetrics = metrics.reduce((acc, m) => {
                        if (!acc[m.metric]) {
                          acc[m.metric] = { achievement: 0, target: 0, earnings: 0 };
                        }
                        // Only count first occurrence (avoid slab duplication)
                        if (acc[m.metric].achievement === 0) {
                          acc[m.metric].achievement = m.achievement;
                          acc[m.metric].earnings = m.earnings;
                        }
                        acc[m.metric].target = Math.max(acc[m.metric].target, m.target);
                        return acc;
                      }, {});

                      const groups = Object.values(groupedMetrics);
                      return {
                        achievement: groups.reduce((sum: number, g: any) => sum + g.achievement, 0),
                        target: groups.reduce((sum: number, g: any) => sum + g.target, 0),
                        earnings: groups.reduce((sum: number, g: any) => sum + g.earnings, 0)
                      };
                    };

                    // Get AB/NOB metrics from weekly data (weekly-only metrics)
                    const abMetrics = employeeDetails.weekly?.metrics.filter(m => m.metric.includes('AB') || m.metric.includes('NOB')) || [];

                    // Combine appropriately
                    const displayMetrics = viewMode === 'day'
                      ? [
                          ...filterMetrics(employeeDetails.daily?.metrics || [], 'day'),
                          ...abMetrics // Always include AB/NOB metrics from weekly
                        ]
                      : (employeeDetails.weekly?.metrics || []);

                    const displayTotals = recalculateTotals(displayMetrics);

                    // Show info message if Day view has AB/NOB metrics
                    const hasABMetrics = viewMode === 'day' && abMetrics.length > 0;

                    return (
                      <>
                        {/* Info message for AB metrics in Day view */}
                        {hasABMetrics && (
                          <div className={`mb-4 p-3 rounded-lg border ${
                    currentTheme.isDark
                              ? 'bg-blue-500/10 border-blue-500/20' 
                              : 'bg-blue-50 border-blue-200'
                  }`}>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-500">ℹ️</span>
                              <span className={`text-sm ${
                                currentTheme.isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                                AB/NOB metrics are displayed at weekly level
                              </span>
                  </div>
                </div>
                        )}

                        {/* Performance View */}
                        {renderPerformanceView(
                          displayMetrics,
                          displayTotals,
                          employeeDetails.daily?.employee_variable_pay || 0,
                          viewMode
                        )}
                      </>
                    );
                  })()}
                  
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

            {/* Customer Cards - Desktop grid layout - Grouped by description */}
            {Object.keys(groupedCustomers).length > 0 && (
              <div className="mt-6 hidden lg:block">
                <div className="space-y-6">
                  {/* Collect all available customer cards grouped by description */}
                  {(() => {
                    const descriptions = Object.keys(groupedCustomers).sort();
                    const availableCards = descriptions.map((desc) => {
                      const group = groupedCustomers[desc];
                      const customers = group.customers.slice(0, 3);
                      const isLoading = assignedLoading || inactiveLoading || priorityLoading || customerPageLoading;
                      
                      return (
                        <div key={desc}>
                          <CustomerCard
                            customers={customers}
                            title={`${desc} (${group.customers.length})`}
                            isLoading={isLoading}
                            showDescription={false}
                            showLastOrder={true}
                            tabType={group.source}
                          />
                        </div>
                      );
                    });

                    // Render in a dynamic grid based on number of available cards
                    if (availableCards.length === 1) {
                      return <div className="grid grid-cols-1 gap-6">{availableCards}</div>;
                    } else if (availableCards.length === 2) {
                      return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{availableCards}</div>;
                    } else {
                      // Three or more cards: 2 in first row, rest in second
                      return (
                        <>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {availableCards.slice(0, 2)}
                          </div>
                          {availableCards.length > 2 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {availableCards.slice(2)}
                            </div>
                          )}
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

            {/* Customer Cards - Mobile - Grouped by description */}
            {Object.keys(groupedCustomers).length > 0 && (
              <>
                {Object.keys(groupedCustomers).sort().map((desc) => {
                  const group = groupedCustomers[desc];
                  const customers = group.customers.slice(0, 5);
                  const isLoading = assignedLoading || inactiveLoading || priorityLoading || customerPageLoading;
                  
                  return (
                    <div key={desc} className="mt-6 lg:hidden">
                      <CustomerCard
                        customers={customers}
                        title={`${desc} (${group.customers.length})`}
                        isLoading={isLoading}
                        showDescription={false}
                        showLastOrder={true}
                        tabType={group.source}
                      />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}