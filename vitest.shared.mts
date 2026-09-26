import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export const createVitestConfig = (packageDir: string) =>
  defineConfig({
    plugins: [react()],
    resolve: {
      alias: [
        { find: /^@\/(.*)$/, replacement: resolve(packageDir, 'src/$1') },
        { find: /^.+\.(css|less|scss)$/, replacement: 'identity-obj-proxy' },
        { find: /^.+\.svg(\?react)?$/, replacement: resolve(packageDir, '__mocks__/svg.tsx') },
        {
          find: /^.+\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$/,
          replacement: resolve(import.meta.dirname, '__mocks__/fileMock.js'),
        },
      ],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: [resolve(import.meta.dirname, 'vitest.setup.ts')],
      include: ['**/*.test.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**', 'cypress/**'],
    },
  });
