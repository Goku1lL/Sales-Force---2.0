import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prefer TypeScript sources when both .ts(x) and .js(x) exist
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy all API requests to production Vercel deployment for now
      '/api': {
        target: 'https://sales-force-2-0.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
});
