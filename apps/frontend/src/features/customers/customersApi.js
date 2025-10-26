import { api } from '../../shared/api';
export const customersApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getAssignedCustomers: builder.query({
            query: (employeeId) => `/customers/assigned/${employeeId}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
        getInactiveCustomers: builder.query({
            query: (employeeId) => `/customers/inactive/${employeeId}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
        getHighValueCustomers: builder.query({
            query: (employeeId) => `/customers/high-value/${employeeId}`,
            transformResponse: (resp) => resp?.data ?? [],
        }),
    }),
});
export const { useGetAssignedCustomersQuery, useGetInactiveCustomersQuery, useGetHighValueCustomersQuery, } = customersApi;
