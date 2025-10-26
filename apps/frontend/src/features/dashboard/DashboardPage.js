import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetSummaryQuery, useGetUrgentActionsQuery, useGetNearbyOpportunitiesQuery } from './dashboardApi';
import { useGetUserProfileQuery, useGetClusterLeaderboardQuery, useGetCityLeaderboardQuery } from '../leaderboard/leaderboardApi';
import { useTheme } from '../../shared/ThemeContext';
import { ThemedCard, ThemedBadge, ThemedProgress } from '../../shared';
import { useLiveActivity } from '../../shared/useLiveActivity';
// Clean Progress Component - Single Responsibility
function Progress({ value, color = 'green' }) {
    const { currentTheme } = useTheme();
    const colorClass = color === 'green' ? 'from-green-400 to-emerald-500' :
        color === 'orange' ? 'from-orange-400 to-red-500' :
            color === 'blue' ? 'from-blue-400 to-cyan-500' :
                'from-purple-400 to-pink-500';
    const displayWidth = Math.max(5, Math.min(100, Math.max(0, value)));
    const trackClass = currentTheme.isDark ? 'bg-gray-700 border-gray-500' : 'bg-gray-200 border-gray-300';
    return (_jsxs("div", { className: `h-6 rounded-full overflow-hidden shadow-inner border-2 ${trackClass}`, children: [_jsx("div", { className: `h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-1000 ease-out relative`, style: { width: `${displayWidth}%` } }), _jsx("div", { className: "absolute left-1 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-white/70 rounded-full animate-pulse" })] }));
}
// Enhanced Leaderboard Item Component - Premium Design
function LeaderboardItem({ person, rank, isCurrentUser }) {
    const { currentTheme } = useTheme();
    const getRankIcon = (rank) => {
        if (rank === 1)
            return '👑';
        if (rank === 2)
            return '🥈';
        if (rank === 3)
            return '🥉';
        return rank;
    };
    const getRankColor = (rank) => {
        if (rank === 1)
            return 'from-yellow-400 via-yellow-500 to-amber-500';
        if (rank === 2)
            return 'from-gray-300 via-gray-400 to-gray-500';
        if (rank === 3)
            return 'from-orange-400 via-orange-500 to-red-500';
        return 'from-indigo-400 via-blue-500 to-purple-500';
    };
    const getRankGlow = (rank) => {
        if (rank === 1)
            return 'shadow-lg shadow-yellow-500/30';
        if (rank === 2)
            return 'shadow-lg shadow-gray-400/30';
        if (rank === 3)
            return 'shadow-lg shadow-orange-500/30';
        return 'shadow-md shadow-indigo-500/20';
    };
    const achievements = typeof person.weekly_achievements === 'number'
        ? person.weekly_achievements
        : parseFloat(person.weekly_achievements) || 0;
    const orders = person.orders || 0;
    const textColor = currentTheme.isDark || currentTheme.isNeon ? 'text-white' : 'text-gray-900';
    const bgColor = isCurrentUser
        ? (currentTheme.isDark || currentTheme.isNeon
            ? 'bg-gradient-to-r from-blue-600/30 via-blue-500/20 to-indigo-600/30 border-blue-400/50 shadow-lg shadow-blue-500/20'
            : 'bg-gradient-to-r from-blue-50 via-blue-100 to-indigo-50 border-blue-300 shadow-lg shadow-blue-200/50')
        : (currentTheme.isDark || currentTheme.isNeon
            ? 'bg-gradient-to-r from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/50 hover:border-gray-500'
            : 'bg-gradient-to-r from-white via-gray-50 to-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md');
    return (_jsxs("div", { className: `group relative overflow-hidden rounded-2xl border-2 ${bgColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`, children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" }), _jsxs("div", { className: "relative flex items-center p-4", children: [_jsxs("div", { className: "flex items-center space-x-4 flex-1 min-w-0", children: [_jsxs("div", { className: `relative w-12 h-12 rounded-2xl bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center text-xl font-bold text-white ${getRankGlow(rank)} transition-all duration-300 group-hover:scale-110 flex-shrink-0`, children: [_jsx("span", { className: "drop-shadow-sm", children: getRankIcon(rank) }), rank === 1 && (_jsx("div", { className: "absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" }))] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("p", { className: `font-bold text-base truncate ${textColor} group-hover:text-opacity-90`, children: person.Name || person.name || 'Unknown User' }), isCurrentUser && (_jsx("span", { className: "px-2 py-1 text-xs font-bold text-blue-600 bg-blue-100 rounded-full animate-pulse flex-shrink-0", children: "YOU" }))] }), _jsx("p", { className: `text-sm ${currentTheme.isDark || currentTheme.isNeon ? 'text-gray-300' : 'text-gray-600'} group-hover:text-opacity-80`, children: person.cluster || 'Unknown Cluster' })] })] }), _jsxs("div", { className: "text-right space-y-1 ml-4 flex-shrink-0", children: [_jsxs("div", { className: "flex items-center space-x-2 justify-end", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDCCA" }), _jsx("p", { className: `font-bold text-lg ${textColor} group-hover:text-opacity-90 whitespace-nowrap`, children: achievements.toLocaleString() })] }), _jsxs("div", { className: "flex items-center space-x-2 justify-end", children: [_jsx("span", { className: "text-sm", children: "\uD83C\uDFAF" }), _jsx("p", { className: `text-sm font-medium ${currentTheme.isDark || currentTheme.isNeon ? 'text-gray-300' : 'text-gray-600'} group-hover:text-opacity-80 whitespace-nowrap`, children: "units achieved" })] })] })] })] }));
}
// Main Dashboard Component - Clean Architecture
export default function DashboardPage() {
    const { currentTheme } = useTheme();
    const [leaderboardType, setLeaderboardType] = useState('cluster');
    // Redux state
    const { user } = useSelector((state) => state.auth);
    // API queries - Only make calls when user is authenticated
    const employeeId = user?.employee_id;
    const { data: summary, isLoading: summaryLoading, error: summaryError } = useGetSummaryQuery(employeeId?.toString() || '', { skip: !employeeId });
    const { data: profile, isLoading: profileLoading, error: profileError } = useGetUserProfileQuery(employeeId, { skip: !employeeId });
    const { data: clusterLeaderboard, isLoading: clusterLoading } = useGetClusterLeaderboardQuery('BLR-Cluster1', {
        skip: !employeeId
    });
    const { data: cityLeaderboard, isLoading: cityLoading } = useGetCityLeaderboardQuery(2, {
        skip: !employeeId
    });
    const { data: urgentActions } = useGetUrgentActionsQuery(employeeId, { skip: !employeeId });
    const { data: nearbyOpportunities } = useGetNearbyOpportunitiesQuery();
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
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-red-500 text-6xl mb-4", children: "\uD83D\uDD12" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2", children: "Authentication Required" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Please log in to access the dashboard" })] }) }));
    }
    // Loading state
    if (summaryLoading || profileLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Loading dashboard..." })] }) }));
    }
    // Error state
    if (summaryError) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-red-500 text-6xl mb-4", children: "\u26A0\uFE0F" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2", children: "Error Loading Dashboard" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Please try refreshing the page" })] }) }));
    }
    return (_jsxs("div", { className: `min-h-screen ${currentTheme.isDark
            ? 'bg-gray-900'
            : currentTheme.isNeon
                ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900'
                : 'bg-gray-50'}`, children: [_jsxs("div", { className: `relative overflow-hidden ${currentTheme.isDark
                    ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800'
                    : currentTheme.isNeon
                        ? 'bg-gradient-to-r from-gray-800 via-blue-900 to-indigo-900'
                        : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50'}`, children: [_jsx("div", { className: "absolute inset-0 opacity-5", children: _jsx("div", { className: "absolute inset-0", style: {
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            } }) }), _jsx("div", { className: "relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: `w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${currentTheme.isDark
                                                ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                                                : currentTheme.isNeon
                                                    ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
                                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`, children: _jsx("span", { className: "text-lg text-white font-semibold", children: user?.name?.charAt(0) || 'S' }) }), _jsxs("div", { children: [_jsxs("h1", { className: `text-xl font-semibold ${currentTheme.isDark
                                                        ? 'text-white'
                                                        : currentTheme.isNeon
                                                            ? 'text-white'
                                                            : 'text-gray-900'}`, children: ["Welcome back, ", user?.name || 'Sales Executive', "! \uD83D\uDC4B"] }), _jsx("p", { className: `text-sm ${currentTheme.isDark
                                                        ? 'text-gray-300'
                                                        : currentTheme.isNeon
                                                            ? 'text-gray-300'
                                                            : 'text-gray-600'}`, children: "Ready to crush your targets today? \uD83D\uDE80" })] })] }), _jsxs("div", { className: "hidden md:flex items-center space-x-4", children: [_jsxs("div", { className: `text-center px-3 py-2 rounded-lg ${currentTheme.isDark
                                                ? 'bg-white/10 backdrop-blur-sm'
                                                : currentTheme.isNeon
                                                    ? 'bg-white/10 backdrop-blur-sm'
                                                    : 'bg-white/80 backdrop-blur-sm shadow-md'}`, children: [_jsx("div", { className: `text-lg font-semibold ${currentTheme.isDark
                                                        ? 'text-cyan-400'
                                                        : currentTheme.isNeon
                                                            ? 'text-cyan-400'
                                                            : 'text-blue-600'}`, children: cityRank }), _jsx("div", { className: `text-xs ${currentTheme.isDark
                                                        ? 'text-gray-400'
                                                        : currentTheme.isNeon
                                                            ? 'text-gray-400'
                                                            : 'text-gray-600'}`, children: "City Rank" })] }), _jsxs("div", { className: `text-center px-3 py-2 rounded-lg ${currentTheme.isDark
                                                ? 'bg-white/10 backdrop-blur-sm'
                                                : currentTheme.isNeon
                                                    ? 'bg-white/10 backdrop-blur-sm'
                                                    : 'bg-white/80 backdrop-blur-sm shadow-md'}`, children: [_jsxs("div", { className: `text-lg font-semibold ${currentTheme.isDark
                                                        ? 'text-green-400'
                                                        : currentTheme.isNeon
                                                            ? 'text-green-400'
                                                            : 'text-green-600'}`, children: [Math.round(dailyProgress), "%"] }), _jsx("div", { className: `text-xs ${currentTheme.isDark
                                                        ? 'text-gray-400'
                                                        : currentTheme.isNeon
                                                            ? 'text-gray-400'
                                                            : 'text-gray-600'}`, children: "Daily Progress" })] })] })] }) })] }), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs(ThemedCard, { accent: "amber", children: [_jsxs("div", { className: "flex items-start gap-4 mb-3", style: { minHeight: '80px' }, children: [_jsxs("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: [_jsx("div", { className: `w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${currentTheme.isDark
                                                                ? 'bg-white/5 ring-1 ring-white/10'
                                                                : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-300/30'}`, children: _jsx("span", { className: "text-3xl", children: "\uD83D\uDCB0" }) }), _jsxs("div", { className: "min-w-0 flex-1 pr-4", children: [_jsx("h3", { className: `text-xl font-bold whitespace-nowrap ${currentTheme.isDark ? 'text-[var(--text)]' : 'text-gray-900'}`, children: "Day Pending" }), _jsx("p", { className: `text-sm font-bold ${currentTheme.isDark ? 'text-yellow-200/90' : 'text-amber-900'}`, children: "Pending to earn" })] })] }), _jsx("div", { className: "flex flex-col items-end space-y-2 flex-shrink-0", children: _jsxs(ThemedBadge, { className: "text-xs px-3 py-1.5 whitespace-nowrap", children: ["CLUSTER RANK ", clusterRank] }) })] }), _jsxs("div", { children: [_jsxs("p", { className: `text-5xl font-extrabold mb-1 ${currentTheme.isDark ? 'text-cyan-300' : 'text-gray-900'}`, children: ["\u20B9", dailyPending.toFixed(0)] }), _jsxs("p", { className: `text-sm font-medium mb-3 ${currentTheme.isDark ? 'text-gray-400' : 'text-gray-600'}`, children: ["Target: \u20B9", summary?.data?.todayTarget?.toFixed(0) || '0', " \u2022 Earned: \u20B9", summary?.data?.todayEarnings?.toFixed(0) || '0'] }), _jsxs("div", { className: "flex justify-between text-sm mb-3", children: [_jsx("span", { className: `font-bold ${currentTheme.isDark ? 'text-yellow-200' : 'text-amber-900'}`, children: "Progress" }), _jsxs("span", { className: `font-bold ${currentTheme.isDark ? 'text-[var(--text)]' : 'text-gray-900'}`, children: [Math.round(dailyProgress), "% complete"] })] }), _jsx(ThemedProgress, { value: dailyProgressCapped, theme: "amber" })] })] }), _jsxs(ThemedCard, { accent: "purple", children: [_jsxs("div", { className: "flex items-start gap-4 mb-3", style: { minHeight: '80px' }, children: [_jsxs("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: [_jsx("div", { className: `w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${currentTheme.isDark
                                                                ? 'bg-white/5 ring-1 ring-white/10'
                                                                : 'bg-gradient-to-br from-pink-500 to-red-500 shadow-lg shadow-pink-300/30'}`, children: _jsx("span", { className: "text-3xl", children: "\uD83D\uDCC5" }) }), _jsxs("div", { className: "min-w-0 flex-1 pr-4", children: [_jsx("h3", { className: `text-xl font-bold whitespace-nowrap ${currentTheme.isDark ? 'text-[var(--text)]' : 'text-gray-900'}`, children: "Week Pending" }), _jsx("p", { className: `text-sm font-bold ${currentTheme.isDark ? 'text-purple-200/90' : 'text-green-800'}`, children: "Keep your streak alive" })] })] }), _jsx("div", { className: "flex flex-col items-end space-y-2 flex-shrink-0", children: _jsxs(ThemedBadge, { className: "text-xs px-3 py-1.5 whitespace-nowrap", children: ["CITY RANK ", cityRank] }) })] }), _jsxs("div", { children: [_jsxs("p", { className: `text-5xl font-extrabold mb-1 ${currentTheme.isDark ? 'text-cyan-300' : 'text-gray-900'}`, children: ["\u20B9", weeklyPending.toFixed(0)] }), _jsxs("p", { className: `text-sm font-medium mb-3 ${currentTheme.isDark ? 'text-gray-400' : 'text-gray-600'}`, children: ["Target: \u20B9", summary?.data?.weeklyTarget?.toFixed(0) || '0', " \u2022 Earned: \u20B9", summary?.data?.weeklyEarnings?.toFixed(0) || '0'] }), _jsxs("div", { className: "flex justify-between text-sm mb-3", children: [_jsx("span", { className: `font-bold ${currentTheme.isDark ? 'text-purple-200' : 'text-rose-800'}`, children: "Progress" }), _jsxs("span", { className: `font-bold ${currentTheme.isDark ? 'text-[var(--text)]' : 'text-gray-900'}`, children: [Math.round(weeklyProgress), "% complete"] })] }), _jsx(ThemedProgress, { value: weeklyProgressCapped, theme: "rose" })] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: `relative overflow-hidden rounded-2xl p-6 shadow-xl ${currentTheme.isDark
                                        ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800'
                                        : currentTheme.isNeon
                                            ? 'bg-gradient-to-br from-gray-800 via-blue-900 to-indigo-900'
                                            : 'bg-gradient-to-br from-white via-gray-50 to-white'}`, children: [_jsx("div", { className: "absolute inset-0 opacity-5", children: _jsx("div", { className: "absolute inset-0", style: {
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                                } }) }), _jsxs("div", { className: "relative flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center ${currentTheme.isDark
                                                                ? 'bg-gradient-to-br from-yellow-500 to-amber-600'
                                                                : currentTheme.isNeon
                                                                    ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
                                                                    : 'bg-gradient-to-br from-yellow-400 to-amber-500'} shadow-lg`, children: _jsx("span", { className: "text-xl", children: "\uD83C\uDFC6" }) }), _jsxs("div", { children: [_jsx("h2", { className: `text-2xl font-bold ${currentTheme.isDark
                                                                        ? 'text-white'
                                                                        : currentTheme.isNeon
                                                                            ? 'text-white'
                                                                            : 'text-gray-900'}`, children: "Leaderboard" }), _jsx("p", { className: `text-sm ${currentTheme.isDark
                                                                        ? 'text-gray-300'
                                                                        : currentTheme.isNeon
                                                                            ? 'text-gray-300'
                                                                            : 'text-gray-600'}`, children: "Top performers this week" })] })] }), _jsxs("div", { className: `flex rounded-xl p-1 shadow-lg ${currentTheme.isDark
                                                        ? 'bg-gray-700/50 backdrop-blur-sm'
                                                        : currentTheme.isNeon
                                                            ? 'bg-gray-700/30 backdrop-blur-sm'
                                                            : 'bg-gray-100 shadow-gray-200/50'}`, children: [_jsx("button", { onClick: () => setLeaderboardType('cluster'), className: `px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${leaderboardType === 'cluster'
                                                                ? currentTheme.isDark || currentTheme.isNeon
                                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                                                : currentTheme.isDark || currentTheme.isNeon
                                                                    ? 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`, children: "Cluster" }), _jsx("button", { onClick: () => setLeaderboardType('city'), className: `px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${leaderboardType === 'city'
                                                                ? currentTheme.isDark || currentTheme.isNeon
                                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                                                : currentTheme.isDark || currentTheme.isNeon
                                                                    ? 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`, children: "City" })] })] }), _jsx("div", { className: "space-y-4", children: leaderboardLoading ? (_jsxs("div", { className: "text-center py-12", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto mb-4" }), _jsx("div", { className: "absolute inset-0 rounded-full border-4 border-transparent border-t-blue-300 animate-spin", style: { animationDirection: 'reverse', animationDuration: '1.5s' } })] }), _jsx("p", { className: `text-lg font-medium ${currentTheme.isDark
                                                            ? 'text-gray-300'
                                                            : currentTheme.isNeon
                                                                ? 'text-gray-300'
                                                                : 'text-gray-600'}`, children: "Loading leaderboard..." }), _jsx("p", { className: `text-sm ${currentTheme.isDark
                                                            ? 'text-gray-400'
                                                            : currentTheme.isNeon
                                                                ? 'text-gray-400'
                                                                : 'text-gray-500'}`, children: "Fetching top performers" })] })) : currentLeaderboard?.length > 0 ? (_jsxs("div", { className: "space-y-3", children: [currentLeaderboard.slice(0, 5).map((person, index) => (_jsx("div", { className: "animate-fadeInUp", style: { animationDelay: `${index * 100}ms` }, children: _jsx(LeaderboardItem, { person: person, rank: index + 1, isCurrentUser: person.id === user?.id || person.employee_id === user?.id }) }, person.id || person.employee_id || index))), currentLeaderboard.length > 5 && (_jsx("div", { className: "text-center pt-2", children: _jsxs("p", { className: `text-xs ${currentTheme.isDark
                                                                ? 'text-gray-400'
                                                                : currentTheme.isNeon
                                                                    ? 'text-gray-400'
                                                                    : 'text-gray-500'}`, children: ["Showing top 5 of ", currentLeaderboard.length, " participants"] }) }))] })) : (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: `w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${currentTheme.isDark
                                                            ? 'bg-gray-700'
                                                            : currentTheme.isNeon
                                                                ? 'bg-gray-700/50'
                                                                : 'bg-gray-100'}`, children: _jsx("span", { className: "text-2xl", children: "\uD83D\uDCCA" }) }), _jsx("p", { className: `text-lg font-medium ${currentTheme.isDark
                                                            ? 'text-gray-300'
                                                            : currentTheme.isNeon
                                                                ? 'text-gray-300'
                                                                : 'text-gray-600'}`, children: "No leaderboard data available" }), _jsx("p", { className: `text-sm ${currentTheme.isDark
                                                            ? 'text-gray-400'
                                                            : currentTheme.isNeon
                                                                ? 'text-gray-400'
                                                                : 'text-gray-500'}`, children: "Check back later for updates" })] })) })] }), liveActivities.length > 0 && (_jsxs("div", { className: `rounded-2xl p-6 shadow-lg ${currentTheme.isDark
                                        ? 'bg-gray-800'
                                        : currentTheme.isNeon
                                            ? 'bg-gray-800/90'
                                            : 'bg-white'}`, children: [_jsx("h3", { className: `text-lg font-bold mb-4 ${currentTheme.isDark
                                                ? 'text-white'
                                                : currentTheme.isNeon
                                                    ? 'text-white'
                                                    : 'text-gray-900'}`, children: "Live Activity" }), _jsx("div", { className: "space-y-2", children: liveActivities.slice(0, 5).map((activity, index) => (_jsxs("div", { className: `flex items-center space-x-3 p-2 rounded-lg ${currentTheme.isDark
                                                    ? 'bg-gray-700'
                                                    : currentTheme.isNeon
                                                        ? 'bg-gray-700/50'
                                                        : 'bg-gray-50'}`, children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: `text-sm ${currentTheme.isDark
                                                                    ? 'text-gray-300'
                                                                    : currentTheme.isNeon
                                                                        ? 'text-gray-300'
                                                                        : 'text-gray-700'}`, children: activity.message }), _jsxs("p", { className: `text-xs mt-1 ${currentTheme.isDark
                                                                    ? 'text-gray-400'
                                                                    : currentTheme.isNeon
                                                                        ? 'text-gray-400'
                                                                        : 'text-gray-500'}`, children: [activity.employee_name, " \u2022 ", activity.cluster, " \u2022 ", activity.timestamp] })] }), activity.variable_pay && (_jsx("div", { className: "text-right", children: _jsxs("span", { className: "text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded", children: ["\u20B9", activity.variable_pay] }) }))] }, activity.id || index))) }), liveActivities.length > 5 && (_jsxs("p", { className: `text-xs mt-3 text-center ${currentTheme.isDark
                                                ? 'text-gray-400'
                                                : currentTheme.isNeon
                                                    ? 'text-gray-400'
                                                    : 'text-gray-500'}`, children: ["Showing 5 of ", liveActivities.length, " recent activities"] }))] }))] })] }) })] }));
}
