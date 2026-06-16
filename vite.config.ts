import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import netlify from '@netlify/vite-plugin-tanstack-start';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3002,
    host: '0.0.0.0',
  },
  resolve: {
    conditions: ['netlify', 'import', 'module', 'browser', 'default'],
    alias: {
      clsx: path.resolve(__dirname, 'node_modules/clsx'),
      'tailwind-merge': path.resolve(__dirname, 'node_modules/tailwind-merge'),
      'drizzle-orm': path.resolve(__dirname, 'node_modules/drizzle-orm'),
    },
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      router: {
        routesDirectory: 'app',
        generatedRouteTree: './routeTree.gen.ts',
        routeFileIgnorePattern: '\\.test\\.',
      },
    }),
    netlify(),
    react(),
    tailwindcss(),
  ],
});
