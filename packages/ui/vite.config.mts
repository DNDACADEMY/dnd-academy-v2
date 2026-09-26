import { readFileSync } from 'fs';
import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import preserveDirectives from 'rollup-preserve-directives';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import svgr from 'vite-plugin-svgr';

const stylesMainPath = resolve(import.meta.dirname, 'src/styles/main.scss');

const packageJson = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};
const externalPackages = [
  ...Object.keys(packageJson.dependencies),
  ...Object.keys(packageJson.peerDependencies),
].filter((name) => !name.startsWith('@dnd-academy/') && name !== 'sanitize.css' && name !== 'sass');
const external = externalPackages.map((name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(/.*)?$`));

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['./src'],
      outDir: 'dist',
      insertTypesEntry: true,
    }),
    svgr(),
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss'],
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        server: resolve(import.meta.dirname, 'src/server.ts'),
        client: resolve(import.meta.dirname, 'src/client.ts'),
      },
      formats: ['es', 'cjs'],
      name: '@dnd-academy/ui',
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rolldownOptions: {
      plugins: [preserveDirectives()],
      external,
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) {
            return 'assets/[name].[ext]';
          }

          if (assetInfo.name.endsWith('.css')) {
            return 'style.css';
          }

          return assetInfo.name;
        },
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@use "${stylesMainPath}" as *;`,
      },
    },
  },
});
