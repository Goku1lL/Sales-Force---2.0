import { api } from '../../shared/api';

export const targetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDailyTargets: builder.query<any[], { employeeId: number; date: string }>({
      query: ({ employeeId, date }) => `/targets/daily/${employeeId}/${date}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
    getWeeklyTargets: builder.query<any[], { employeeId: number; yearweek: number }>({
      query: ({ employeeId, yearweek }) => `/targets/weekly/${employeeId}/${yearweek}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
    getDailyAchievements: builder.query<any[], { employeeId: number; date: string }>({
      query: ({ employeeId, date }) => `/achievements/daily/${employeeId}/${date}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
    getWeeklyAchievements: builder.query<any[], { employeeId: number; yearweek: number }>({
      query: ({ employeeId, yearweek }) => `/achievements/weekly/${employeeId}/${yearweek}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
    // Detailed targets with comprehensive SQL queries
    getDetailedDailyTargets: builder.query<any[], { employeeId: number; date: string }>({
      query: ({ employeeId, date }) => `/targets/detailed/daily/${employeeId}/${date}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
    getDetailedWeeklyTargets: builder.query<any[], { employeeId: number; yearweek: number }>({
      query: ({ employeeId, yearweek }) => `/targets/detailed/weekly/${employeeId}/${yearweek}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
  }),
});

export const {
  useGetDailyTargetsQuery,
  useGetWeeklyTargetsQuery,
  useGetDailyAchievementsQuery,
  useGetWeeklyAchievementsQuery,
  useGetDetailedDailyTargetsQuery,
  useGetDetailedWeeklyTargetsQuery,
} = targetsApi;
