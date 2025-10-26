import { api } from '../../shared/api';
export const dashboardApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getSummary: builder.query({
            query: (employeeId) => `/dashboard/summary?employeeId=${employeeId}`,
        }),
        getUrgentActions: builder.query({
            query: (employeeId) => `/dashboard/urgent-actions?employeeId=${employeeId}`,
        }),
        getNearbyOpportunities: builder.query({
            query: () => '/dashboard/nearby-opportunities',
        }),
    }),
});
export const { useGetSummaryQuery, useGetUrgentActionsQuery, useGetNearbyOpportunitiesQuery } = dashboardApi;
