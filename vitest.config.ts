import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'drizzle-orm': path.resolve(__dirname, 'node_modules/drizzle-orm'),
      clsx: path.resolve(__dirname, 'node_modules/clsx'),
      'tailwind-merge': path.resolve(__dirname, 'node_modules/tailwind-merge'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    env: {
      BETTER_AUTH_URL: 'http://localhost:3002',
      BETTER_AUTH_SECRET: 'test-secret-key-at-least-32-chars-long',
    },
  },
});
