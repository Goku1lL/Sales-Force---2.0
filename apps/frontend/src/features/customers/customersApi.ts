import { api } from '../../shared/api';

export const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAssignedCustomers: builder.query<any[], string>({
      query: (employeeId) => `/customers/assigned/${employeeId}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
    getInactiveCustomers: builder.query<any[], string>({
      query: (employeeId) => `/customers/inactive/${employeeId}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
    getHighValueCustomers: builder.query<any[], string>({
      query: (employeeId) => `/customers/high-value/${employeeId}`,
      transformResponse: (resp: any) => resp?.data ?? [],
    }),
  }),
});

export const {
  useGetAssignedCustomersQuery,
  useGetInactiveCustomersQuery,
  useGetHighValueCustomersQuery,
} = customersApi;
