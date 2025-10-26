import { api } from '../../shared/api';

export const leaderboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClusterLeaderboard: builder.query<any[], string>({
      query: (cluster) => `/leaderboard/cluster/${cluster}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
    getCityLeaderboard: builder.query<any[], number>({
      query: (cityId) => `/leaderboard/city/${cityId}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
    getMyRank: builder.query<any, number>({
      query: (employeeId) => `/leaderboard/my-rank/${employeeId}`,
    }),
    getUserProfile: builder.query<any, number>({
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
