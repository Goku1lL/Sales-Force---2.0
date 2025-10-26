import { api } from '../../shared/api';

export const incentivesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getIncentiveBreakdown: builder.query<any, { employeeId: number; period: 'daily' | 'weekly' }>(
      {
        query: ({ employeeId, period }) => `/incentives/breakdown/${employeeId}/${period}`,
      }
    ),
    // Detailed achievements with comprehensive SQL queries
    getDetailedDailyAchievements: builder.query<any[], { employeeId: number; date: string }>({
      query: ({ employeeId, date }) => `/achievements/detailed/daily/${employeeId}/${date}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
    getDetailedWeeklyAchievements: builder.query<any[], { employeeId: number; yearweek: number }>({
      query: ({ employeeId, yearweek }) => `/achievements/detailed/weekly/${employeeId}/${yearweek}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
  }),
});

export const { 
  useGetIncentiveBreakdownQuery,
  useGetDetailedDailyAchievementsQuery,
  useGetDetailedWeeklyAchievementsQuery,
} = incentivesApi;
