import { api } from '../../shared/api';

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSummary: builder.query<any, string>({
      query: (employeeId) => `/dashboard/summary?employeeId=${employeeId}`,
    }),
    getUrgentActions: builder.query<any[], number>({
      query: (employeeId) => `/dashboard/urgent-actions?employeeId=${employeeId}`,
    }),
    getNearbyOpportunities: builder.query<any[], void>({
      query: () => '/dashboard/nearby-opportunities',
    }),
  }),
});

export const { useGetSummaryQuery, useGetUrgentActionsQuery, useGetNearbyOpportunitiesQuery } = dashboardApi;
