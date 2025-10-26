import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prefer TypeScript sources when both .ts(x) and .js(x) exist
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      }
    }
  }
});
