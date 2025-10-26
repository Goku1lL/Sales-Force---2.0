import { api } from '../../shared/api';
export const incentivesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getIncentiveBreakdown: builder.query({
            query: ({ employeeId, period }) => `/incentives/breakdown/${employeeId}/${period}`,
        }),
        // Detailed achievements with comprehensive SQL queries
        getDetailedDailyAchievements: builder.query({
            query: ({ employeeId, date }) => `/achievements/detailed/daily/${employeeId}/${date}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
        getDetailedWeeklyAchievements: builder.query({
            query: ({ employeeId, yearweek }) => `/achievements/detailed/weekly/${employeeId}/${yearweek}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
    }),
});
export const { useGetIncentiveBreakdownQuery, useGetDetailedDailyAchievementsQuery, useGetDetailedWeeklyAchievementsQuery, } = incentivesApi;
