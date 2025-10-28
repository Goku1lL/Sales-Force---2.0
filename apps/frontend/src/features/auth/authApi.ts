import { api } from '../../shared/api';
import { setCredentials } from './authSlice';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<any, { employee_id?: string; email?: string; password: string }>(
      {
        query: (body) => ({ url: '/auth/login', method: 'POST', body }),
        async onQueryStarted(arg, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            dispatch(setCredentials(data));
          } catch (error) {
            // Error will be handled by the component
            console.error('Login failed:', error);
          }
        },
      }
    ),
    me: builder.query<any, void>({
      query: () => '/auth/me',
    }),
  }),
});

export const { useLoginMutation, useMeQuery } = authApi;
