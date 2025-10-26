import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NODE_ENV === 'production' ? '/api' : '/api/v1',
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token)
                headers.set('authorization', `Bearer ${token}`);
            return headers;
        },
    }),
    endpoints: () => ({}),
});
