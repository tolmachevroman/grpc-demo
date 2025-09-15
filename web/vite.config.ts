import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from '@rollup/plugin-commonjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), commonjs()],
  server: {
    port: 3000,
    proxy: {
      // Proxy gRPC-Web requests to Envoy
      '/dashboard.DashboardService': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
