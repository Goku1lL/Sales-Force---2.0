import { api } from '../../shared/api';
export const leaderboardApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getClusterLeaderboard: builder.query({
            query: (cluster) => `/leaderboard/cluster/${cluster}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
        getCityLeaderboard: builder.query({
            query: (cityId) => `/leaderboard/city/${cityId}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
        getMyRank: builder.query({
            query: (employeeId) => `/leaderboard/my-rank/${employeeId}`,
        }),
        getUserProfile: builder.query({
            query: (employeeId) => `/leaderboard/profile/${employeeId}`,
            transformResponse: (resp) => resp?.data ?? null,
        }),
        getEmployeeDetails: builder.query({
            query: (employeeId) => `/leaderboard/employee-details/${employeeId}`,
            transformResponse: (resp) => resp?.data ?? null,
        }),
    }),
});
export const { useGetClusterLeaderboardQuery, useGetCityLeaderboardQuery, useGetMyRankQuery, useGetUserProfileQuery, useGetEmployeeDetailsQuery } = leaderboardApi;
