import { api } from '../../shared/api';

export const leaderboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClusterLeaderboard: builder.query<any[], { cluster: string; period: 'day' | 'week' }>({
      query: ({ cluster, period }) => `/leaderboard/cluster/${cluster}?period=${period}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
    getCityLeaderboard: builder.query<any[], { cityId: number; period: 'day' | 'week' }>({
      query: ({ cityId, period }) => `/leaderboard/city/${cityId}?period=${period}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
    getMyRank: builder.query<any, string>({
      query: (employeeId) => `/leaderboard/my-rank/${employeeId}`,
    }),
    getUserProfile: builder.query<any, string>({
      query: (employeeId) => `/leaderboard/profile/${employeeId}`,
      transformResponse: (resp: any) => resp?.data ?? null,
    }),
    getEmployeeDetails: builder.query<any, string>({
      query: (employeeId) => `/leaderboard/employee-details/${employeeId}`,
      transformResponse: (resp: any) => resp?.data ?? null,
    }),
  }),
});

export const { useGetClusterLeaderboardQuery, useGetCityLeaderboardQuery, useGetMyRankQuery, useGetUserProfileQuery, useGetEmployeeDetailsQuery } = leaderboardApi;
