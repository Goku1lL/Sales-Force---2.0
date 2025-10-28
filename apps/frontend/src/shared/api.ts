import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../app/store';

// Debug: Log the backend URL being used
const backendUrl = process.env.NODE_ENV === 'development'
  ? '/api'
  : process.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1';

console.log('🔧 API Base URL:', backendUrl);
console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('🔗 VITE_BACKEND_URL:', process.env.VITE_BACKEND_URL);

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: backendUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: () => ({}),
});
