import { api } from '../../shared/api';
export const targetsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getDailyTargets: builder.query({
            query: ({ employeeId, date }) => `/targets/daily/${employeeId}/${date}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
        getWeeklyTargets: builder.query({
            query: ({ employeeId, yearweek }) => `/targets/weekly/${employeeId}/${yearweek}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
        getDailyAchievements: builder.query({
            query: ({ employeeId, date }) => `/achievements/daily/${employeeId}/${date}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
        getWeeklyAchievements: builder.query({
            query: ({ employeeId, yearweek }) => `/achievements/weekly/${employeeId}/${yearweek}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
        // Detailed targets with comprehensive SQL queries
        getDetailedDailyTargets: builder.query({
            query: ({ employeeId, date }) => `/targets/detailed/daily/${employeeId}/${date}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
        getDetailedWeeklyTargets: builder.query({
            query: ({ employeeId, yearweek }) => `/targets/detailed/weekly/${employeeId}/${yearweek}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
    }),
});
export const { useGetDailyTargetsQuery, useGetWeeklyTargetsQuery, useGetDailyAchievementsQuery, useGetWeeklyAchievementsQuery, useGetDetailedDailyTargetsQuery, useGetDetailedWeeklyTargetsQuery, } = targetsApi;
