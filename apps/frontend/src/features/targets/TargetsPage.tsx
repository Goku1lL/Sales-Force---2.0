import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetEmployeeDetailsQuery } from '../leaderboard/leaderboardApi';
import { useTheme } from '../../shared/ThemeContext';

export default function TargetsPage() {
  const { currentTheme } = useTheme();
  const { user, token } = useSelector((s: RootState) => s.auth);
  const employeeId = user?.employee_id;
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

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

  const getSlabEmoji = (slabSegment: string) => {
    if (slabSegment.includes('1')) return '🥉';
    if (slabSegment.includes('2')) return '🥈';
    if (slabSegment.includes('3')) return '🥇';
    return '📊';
  };

  const getMetricEmoji = (metric: string) => {
    if (metric.toLowerCase().includes('fruit')) return '🍎';
    if (metric.toLowerCase().includes('vegetable')) return '🥬';
    if (metric.toLowerCase().includes('gt') || metric.toLowerCase().includes('oc')) return '📦';
    return '📊';
  };

  // Helper function to render performance view with slab badges
  const renderPerformanceView = (metrics: any[], totals: any, employeeVariablePay: number, periodType: 'day' | 'week') => {
    // Separate AB and non-AB metrics for different period calculations
    const abMetrics = metrics.filter(m => m.metric.includes('AB'));
    const nonABMetrics = metrics.filter(m => !m.metric.includes('AB'));
    
    // Convert monthly variable_pay to daily or weekly for non-AB metrics
    const nonABPeriodMultiplier = periodType === 'day' ? (1 / 30) : (1 / 4);
    const nonABPeriodVariablePay = employeeVariablePay * nonABPeriodMultiplier;

    // Convert monthly variable_pay to weekly for AB metrics (always weekly)
    const abPeriodMultiplier = 1 / 4; // Always weekly for AB metrics
    const abPeriodVariablePay = employeeVariablePay * abPeriodMultiplier;

    // Group metrics by name
    const metricSummaries: Record<string, {
      metric: string;
      slabs: any[];
      maxPotentialEarnings: number;
      totalEarnings: number;
      totalAchievement: number;
      maxTarget: number;
      contribution: number;
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

    // Process non-AB metrics
    nonABMetrics.forEach(item => {
      const metricName = item.metric;
      if (!metricSummaries[metricName]) {
        metricSummaries[metricName] = {
          metric: metricName,
          slabs: [],
          maxPotentialEarnings: 0,
          totalEarnings: 0,
          totalAchievement: 0,
          maxTarget: 0,
          contribution: item.contribution || 0,
          pendingToEarn: 0
        };
      }

      // Calculate potential earnings for this slab
      let incentivePercent = Number(item.incentive_percent || 0);
      if (incentivePercent === 0 && item.slab_Segment) {
        const slabNum = parseInt(item.slab_Segment.replace('slab', ''));
        if (slabNum === 1) incentivePercent = 1;
        else if (slabNum === 2) incentivePercent = 1.5;
        else if (slabNum === 3) incentivePercent = 2;
      }

      const potentialEarnings = nonABPeriodVariablePay * incentivePercent;
      const earnings = Number(item.earnings || 0);
      const pendingToEarn = Math.max(0, potentialEarnings - earnings);

      // Add slab to the list
      metricSummaries[metricName].slabs.push({
        slab_Segment: item.slab_Segment,
        target: Number(item.target || 0),
        achievement: Number(item.achievement || 0),
        achievement_percentage: item.achievement_percentage || 0,
        earnings,
        potentialEarnings,
        pendingToEarn,
        incentivePercent
      });

      // Track max potential and totals
      metricSummaries[metricName].maxPotentialEarnings = Math.max(
        metricSummaries[metricName].maxPotentialEarnings,
        potentialEarnings
      );
      
      // For earnings, only take the first occurrence (avoid duplication)
      if (metricSummaries[metricName].totalEarnings === 0) {
        metricSummaries[metricName].totalEarnings = earnings;
      }
      
      // For achievements, only take the first occurrence (avoid duplication)
      if (metricSummaries[metricName].totalAchievement === 0) {
        metricSummaries[metricName].totalAchievement = Number(item.achievement || 0);
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
      
      metricSummaries[metricName].maxTarget = Math.max(
        metricSummaries[metricName].maxTarget,
        Number(item.target || 0)
      );
    });

    // Process AB metrics (always weekly)
    abMetrics.forEach(item => {
      const metricName = item.metric;
      if (!metricSummaries[metricName]) {
        metricSummaries[metricName] = {
          metric: metricName,
          slabs: [],
          maxPotentialEarnings: 0,
          totalEarnings: 0,
          totalAchievement: 0,
          maxTarget: 0,
          contribution: item.contribution || 0,
          pendingToEarn: 0
        };
      }

      // Calculate potential earnings for this slab
      let incentivePercent = Number(item.incentive_percent || 0);
      if (incentivePercent === 0 && item.slab_Segment) {
        const slabNum = parseInt(item.slab_Segment.replace('slab', ''));
        if (slabNum === 1) incentivePercent = 1;
        else if (slabNum === 2) incentivePercent = 1.5;
        else if (slabNum === 3) incentivePercent = 2;
      }

      const potentialEarnings = abPeriodVariablePay * incentivePercent;
      const earnings = Number(item.earnings || 0);
      const pendingToEarn = Math.max(0, potentialEarnings - earnings);

      // Add slab to the list
      metricSummaries[metricName].slabs.push({
        slab_Segment: item.slab_Segment,
        target: Number(item.target || 0),
        achievement: Number(item.achievement || 0),
        achievement_percentage: item.achievement_percentage || 0,
        earnings,
        potentialEarnings,
        pendingToEarn,
        incentivePercent
      });

      // Track max potential and totals
      metricSummaries[metricName].maxPotentialEarnings = Math.max(
        metricSummaries[metricName].maxPotentialEarnings,
        potentialEarnings
      );
      
      // For earnings, only take the first occurrence (avoid duplication)
      if (metricSummaries[metricName].totalEarnings === 0) {
        metricSummaries[metricName].totalEarnings = earnings;
      }
      
      // For achievements, only take the first occurrence (avoid duplication)
      if (metricSummaries[metricName].totalAchievement === 0) {
        metricSummaries[metricName].totalAchievement = Number(item.achievement || 0);
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
      
      metricSummaries[metricName].maxTarget = Math.max(
        metricSummaries[metricName].maxTarget,
        Number(item.target || 0)
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
      summary.pendingToEarn = Math.max(0, summary.maxPotentialEarnings - summary.totalEarnings);
    });

    const summaryList = Object.values(metricSummaries);

    // Calculate overall totals
    const totalPending = summaryList.reduce((sum, m) => sum + m.pendingToEarn, 0);
    const totalMaxPotential = summaryList.reduce((sum, m) => sum + m.maxPotentialEarnings, 0);
    const totalEarnings = summaryList.reduce((sum, m) => sum + m.totalEarnings, 0);
    const totalAchievement = summaryList.reduce((sum, m) => sum + m.totalAchievement, 0);
    const totalMaxTarget = summaryList.reduce((sum, m) => sum + m.maxTarget, 0);
    const overallProgress = totalMaxTarget > 0 ? (totalAchievement / totalMaxTarget) * 100 : 0;

    // Find priority metric (highest pending)
    const priorityMetric = summaryList.reduce((max, m) => m.pendingToEarn > max.pendingToEarn ? m : max, summaryList[0]);

    return (
      <>
        {/* Eligibility Warning Banner */}
        {(() => {
          const eligibilityStatus = viewMode === 'day' 
            ? employeeDetails?.daily?.eligibilityStatus 
            : employeeDetails?.weekly?.eligibilityStatus;
          
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
        
        {/* Hero Section: Total Pending to Earn */}
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
              <span className="ml-1 font-semibold">{formatCurrency(totalMaxPotential)}</span>
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
        <div className="flex items-center justify-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider px-4">
            METRICS SUMMARY
          </h4>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Metric Sections with Slab Badges */}
        {(() => {
          // Check if all metrics have empty/null slab_Segment or single slab
          // Empty slab_Segment means the slab details are essentially empty
          const hasEmptyOrSingleSlabs = summaryList.every(summary => {
            if (!summary.slabs || summary.slabs.length === 0) return true;
            // Check if all slabs have empty/null slab_Segment
            const allEmptySlabs = summary.slabs.every(slab => !slab.slab_Segment || slab.slab_Segment.trim() === '');
            // Or if there's only one slab
            return allEmptySlabs || summary.slabs.length <= 1;
          });
          
          // If all metrics have empty or single slab, display as grid cards
          if (hasEmptyOrSingleSlabs) {
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {summaryList.map((summary) => {
                  const slab = summary.slabs && summary.slabs.length > 0 ? summary.slabs[0] : null;
                  
                  return (
                    <div 
                      key={summary.metric} 
                      className={`p-6 rounded-lg border-2 space-y-4 ${
                        currentTheme.isDark 
                          ? 'bg-gray-800/50 border-gray-700' 
                          : 'bg-white border-gray-200 shadow-md'
                      }`}
                    >
                      {/* Metric Header */}
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-3xl">{getMetricEmoji(summary.metric)}</span>
                          <h4 className="text-base font-bold text-gray-800 uppercase tracking-wide">
                            {summary.metric}
                          </h4>
                          {summary.metric.includes('AB') && viewMode === 'day' && (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              currentTheme.isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                            }`}>
                              Weekly
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full inline-block ${
                          currentTheme.isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {(summary.contribution * 100).toFixed(0)}% contribution
                        </span>
                      </div>

                      {/* Target & Achievement Summary */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Target:</span>
                          <span className="font-bold">{summary.maxTarget.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Achieved:</span>
                          <span className="font-bold">{summary.totalAchievement.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressBarColor(
                                summary.maxTarget > 0 ? (summary.totalAchievement / summary.maxTarget) * 100 : 0
                              )}`}
                              style={{ width: `${Math.min((summary.maxTarget > 0 ? (summary.totalAchievement / summary.maxTarget) * 100 : 0), 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium w-12 text-right">
                            {summary.maxTarget > 0 ? ((summary.totalAchievement / summary.maxTarget) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>

                      {/* Slab Details (if exists) */}
                      {slab && (
                        <div className={`p-3 rounded-lg border ${
                          currentTheme.isDark
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-blue-400 bg-blue-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getSlabEmoji(slab.slab_Segment)}</span>
                              <span className="font-bold text-xs uppercase">{slab.slab_Segment || 'Slab'}</span>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded bg-green-500 text-white">
                              ACTIVE ⚡
                            </span>
                          </div>
                          <div className="text-center mb-2">
                            <div className="text-sm font-bold">
                              {slab.achievement.toLocaleString()} / {slab.target.toLocaleString()}
                            </div>
                          </div>
                          <div className="space-y-1 text-xs border-t border-gray-300 pt-2 mt-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Earned:</span>
                              <span className="font-semibold text-green-600">{formatCurrency(slab.earnings)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pending:</span>
                              <span className="font-semibold text-orange-600">{formatCurrency(slab.pendingToEarn)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-gray-200">
                              <span>{(slab.incentivePercent * 100).toFixed(0)}% incentive</span>
                              <span>Max: {formatCurrency(slab.potentialEarnings)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary Info (if no slab) */}
                      {!slab && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Earned:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(summary.totalEarnings)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pending:</span>
                            <span className="font-semibold text-orange-600">{formatCurrency(summary.pendingToEarn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Max Potential:</span>
                            <span className="font-semibold text-blue-600">{formatCurrency(summary.maxPotentialEarnings)}</span>
                          </div>
                        </div>
                      )}

                      {/* Rank Bonus (compact) */}
                      {summary.rankBonus && (
                        <div className={`p-2 rounded border text-xs ${
                          currentTheme.isDark 
                            ? 'bg-yellow-500/10 border-yellow-500/30' 
                            : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">🏆 Rank {summary.rankBonus.rank}</span>
                            <span className="text-yellow-700 font-bold">+{formatCurrency(summary.rankBonus.bonusAmount)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }
          
          // Otherwise, use vertical layout (existing behavior)
          return (
            <div className="space-y-6">
              {summaryList.map((summary) => (
                <div key={summary.metric} className="space-y-4">
                  {/* Metric Separator */}
                  <div className="flex items-center justify-center">
                    <div className="flex-1 border-t-2 border-gray-400"></div>
                    <h4 className="text-base font-bold text-gray-800 uppercase tracking-wide px-4">
                      {summary.metric}
                    </h4>
                    <div className="flex-1 border-t-2 border-gray-400"></div>
                  </div>

                  {/* Metric Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {getMetricEmoji(summary.metric)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xl">{summary.metric}</span>
                          {/* Weekly badge for AB metrics in Day view */}
                          {summary.metric.includes('AB') && viewMode === 'day' && (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              currentTheme.isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                            }`}>
                              Weekly
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          💵 Pending: <span className="font-semibold text-orange-600">{formatCurrency(summary.pendingToEarn)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
                      currentTheme.isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {(summary.contribution * 100).toFixed(0)}% contribution
                    </span>
                  </div>

                  {/* Rank Bonus Display */}
                  {summary.rankBonus && (
                    <div className={`mb-4 p-3 rounded-lg border ${
                      currentTheme.isDark 
                        ? 'bg-yellow-500/10 border-yellow-500/30' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            currentTheme.isDark ? 'text-yellow-400' : 'text-yellow-700'
                          }`}>
                            🏆 Rank {summary.rankBonus.rank}
                            {summary.rankBonus.rank <= 5 && ' 🎯'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
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
                      <div className="mt-2 text-xs text-gray-500">
                        <span>Base: {formatCurrency(summary.totalEarnings - summary.rankBonus.bonusAmount)}</span>
                        <span className="mx-2">+</span>
                        <span>Bonus: {formatCurrency(summary.rankBonus.bonusAmount)}</span>
                        <span className="mx-2">=</span>
                        <span className="font-semibold text-green-600">Total: {formatCurrency(summary.totalEarnings)}</span>
                      </div>
                    </div>
                  )}

                  {/* Bonus Tier Visualization - Motivational Display */}
                  {summary.bonusTiers && summary.bonusTiers.length > 0 && (
                    <div className={`mb-4 p-4 rounded-lg border ${
                      currentTheme.isDark 
                        ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30' 
                        : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                    }`}>
                      <div className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <span>🏆</span>
                        <span>Bonus Tiers Available</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                              className={`p-3 rounded-lg border-2 ${
                                isCurrentTier
                                  ? currentTheme.isDark
                                    ? 'bg-yellow-500/20 border-yellow-500/50 shadow-lg'
                                    : 'bg-yellow-100 border-yellow-300 shadow-lg'
                                  : isAchieved
                                  ? currentTheme.isDark
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-green-50 border-green-200'
                                  : currentTheme.isDark
                                  ? 'bg-gray-700/50 border-gray-600'
                                  : 'bg-gray-100 border-gray-300'
                              }`}
                            >
                              <div className="text-center">
                                <div className={`text-lg font-bold mb-1 ${
                                  isCurrentTier 
                                    ? currentTheme.isDark ? 'text-yellow-400' : 'text-yellow-700'
                                    : isAchieved
                                    ? currentTheme.isDark ? 'text-green-400' : 'text-green-700'
                                    : currentTheme.isDark ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  Rank {tier.startRank}-{tier.endRank}
                                </div>
                                <div className={`text-2xl font-bold mb-1 ${
                                  isCurrentTier || isAchieved
                                    ? currentTheme.isDark ? 'text-yellow-400' : 'text-yellow-700'
                                    : currentTheme.isDark ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  {(tier.bonusPercent * 100).toFixed(0)}%
                                </div>
                                <div className="text-xs text-gray-600 mb-2">Bonus Multiplier</div>
                                {isCurrentTier && (
                                  <div className="text-xs font-semibold text-yellow-600 animate-pulse">
                                    ⭐ You're Here!
                                  </div>
                                )}
                                {isAchieved && !isCurrentTier && (
                                  <div className="text-xs font-semibold text-green-600">
                                    ✓ Achieved
                                  </div>
                                )}
                                {isNextTier && !isCurrentTier && (
                                  <div className="text-xs font-semibold text-blue-600">
                                    🎯 Next Goal!
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {summary.rankBonus && summary.rankBonus.rank > 15 && (
                        <div className="mt-3 text-sm text-center text-gray-600 font-semibold">
                          You're ranked #{summary.rankBonus.rank} - Keep pushing for higher tiers! 💪
                        </div>
                      )}
                      
                      {/* Motivational Message */}
                      {(() => {
                        let motivationalMessage = '';
                        
                        if (summary.rankBonus) {
                          const currentTier = summary.bonusTiers!.find(t => 
                            summary.rankBonus!.rank >= t.startRank && summary.rankBonus!.rank <= t.endRank
                          );
                          const currentTierIdx = currentTier ? summary.bonusTiers!.indexOf(currentTier) : -1;
                          if (currentTierIdx > 0) {
                            const nextTier = summary.bonusTiers![currentTierIdx - 1];
                            const rankGap = nextTier.startRank - summary.rankBonus.rank;
                            motivationalMessage = `🎯 Only ${rankGap} rank${rankGap > 1 ? 's' : ''} away from Rank ${nextTier.startRank}-${nextTier.endRank} bonus!`;
                          }
                        } else {
                          const slab3Target = summary.bonusTiers![0]?.target || 0;
                          const unitsNeeded = Math.max(0, slab3Target - summary.totalAchievement);
                          if (unitsNeeded > 0) {
                            motivationalMessage = `🚀 Reach ${slab3Target} units to unlock bonus tiers! ${unitsNeeded} more needed.`;
                          }
                        }
                        
                        return motivationalMessage ? (
                          <div className={`mt-3 p-3 rounded-lg ${
                            currentTheme.isDark 
                              ? 'bg-blue-500/20 border border-blue-500/30' 
                              : 'bg-blue-50 border border-blue-200'
                          }`}>
                            <div className="text-sm font-semibold text-center">
                              {motivationalMessage}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* Slab Badges Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {summary.slabs.map((slab, index) => {
                      const isActive = slab.achievement > 0 || index === 0;
                      const status = isActive ? 'ACTIVE ⚡' : 'LOCKED';

                      return (
                        <div
                          key={`${summary.metric}-${slab.slab_Segment}`}
                          className={`p-4 rounded-lg border-2 ${
                            isActive
                              ? currentTheme.isDark
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-blue-400 bg-blue-50'
                              : currentTheme.isDark
                              ? 'border-gray-600 bg-gray-800/50'
                              : 'border-gray-300 bg-gray-100'
                          }`}
                        >
                          {/* Slab Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getSlabEmoji(slab.slab_Segment)}</span>
                              <span className="font-bold text-sm uppercase">{slab.slab_Segment || 'Slab'}</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              isActive
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-400 text-gray-700'
                            }`}>
                              {status}
                            </span>
                          </div>

                          {/* Target Progress */}
                          <div className="text-center mb-2">
                            <div className="text-lg font-bold">
                              {slab.achievement.toLocaleString()} / {slab.target.toLocaleString()}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getProgressBarColor(slab.achievement_percentage)}`}
                                style={{ width: `${Math.min(slab.achievement_percentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium w-12">{slab.achievement_percentage.toFixed(1)}%</span>
                          </div>

                          {/* Earnings Section */}
                          <div className="border-t border-gray-300 pt-2 mt-2 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Earned:</span>
                              <span className="font-semibold text-green-600">{formatCurrency(slab.earnings)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pending:</span>
                              <span className="font-semibold text-orange-600">{formatCurrency(slab.pendingToEarn)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1 pt-1 border-t border-gray-200">
                              <span>{(slab.incentivePercent * 100).toFixed(0)}% incentive</span>
                              <span>Max: {formatCurrency(slab.potentialEarnings)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Priority Hint */}
        {priorityMetric && (
          <div className={`mt-6 p-4 rounded-lg ${
            currentTheme.isDark ? 'bg-purple-500/20' : 'bg-purple-50'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="font-semibold">PRIORITY: Focus on {priorityMetric.metric}</div>
                <div className="text-sm text-gray-600">
                  Highest pending earnings: {formatCurrency(priorityMetric.pendingToEarn)}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  if (!employeeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-2">No employee information available</p>
          <p className="text-sm text-gray-500">Please ensure you are logged in with valid credentials</p>
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
    <div className={`min-h-screen ${
      currentTheme.isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header with Employee Info */}
        <div className={`rounded-lg shadow p-3 sm:p-4 md:p-6 ${
          currentTheme.isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h1 className={`text-xl sm:text-2xl font-bold mb-2 sm:mb-4 ${
            currentTheme.isDark ? 'text-white' : 'text-gray-900'
          }`}>
            My Performance Dashboard
          </h1>
          <p className={currentTheme.isDark ? 'text-gray-300' : 'text-gray-600'}>
            Detailed view of your targets vs achievements
          </p>

        {/* Employee Info */}
        {employeeDetails && (
            <div className={`rounded-lg p-4 mt-4 ${
              currentTheme.isDark ? 'bg-blue-500/20' : 'bg-blue-50'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                  <p className={`text-xs ${currentTheme.isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Name</p>
                  <h2 className={`text-sm font-semibold ${
                    currentTheme.isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {employeeDetails.employee.name}
                  </h2>
                </div>
                <div>
                  <p className={`text-xs ${currentTheme.isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Location</p>
                  <p className={`text-sm ${currentTheme.isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {employeeDetails.employee.cluster} • {employeeDetails.employee.city}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${currentTheme.isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Employee ID</p>
                  <p className={`text-sm font-semibold ${
                    currentTheme.isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {employeeDetails.employee.employee_id}
                  </p>
                </div>
              </div>
                </div>
          )}
                </div>

        {/* Performance Overview Card */}
        <div className={`rounded-lg shadow p-3 sm:p-4 md:p-6 ${
          currentTheme.isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Card Header with Day/Week Toggle */}
          <div className="flex items-center justify-between mb-2 sm:mb-4 md:mb-6">
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
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
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
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
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

          {/* Render Performance View based on viewMode with AB metrics logic */}
          {(() => {
            // Function to filter metrics
            const filterMetrics = (metrics: any[], period: 'day' | 'week') => {
              if (period === 'day') {
                // For day view, exclude AB metrics (they're weekly-only)
                return metrics.filter(m => !m.metric.includes('AB'));
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

            // Get AB metrics from weekly data
            const abMetrics = employeeDetails.weekly?.metrics.filter(m => m.metric.includes('AB')) || [];

            // Combine appropriately
            const displayMetrics = viewMode === 'day'
              ? [
                  ...filterMetrics(employeeDetails.daily?.metrics || [], 'day'),
                  ...abMetrics // Always include AB metrics from weekly
                ]
              : (employeeDetails.weekly?.metrics || []);

            const displayTotals = recalculateTotals(displayMetrics);

            // Show info message if Day view has AB metrics
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
                        AB metrics are displayed at weekly level
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
        </div>
      </div>
    </div>
  );
}
