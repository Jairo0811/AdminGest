/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.spec.{ts,tsx}', 'src/**/*.test.{ts,tsx}', 'src/main.tsx'],
      reporter: ['text-summary', 'html', 'lcov'],
      // Security-critical output builders must stay covered (see docs/TESTING.md).
      thresholds: {
        'src/utils/html.ts': { lines: 90, functions: 90 },
        'src/utils/quote-print.ts': { lines: 90, functions: 90 },
        'src/utils/gantt-print.ts': { lines: 90, functions: 90 },
      },
    },
  },
});
