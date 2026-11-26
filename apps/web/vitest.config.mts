import { createVitestConfig } from '../../vitest.shared.mts';

const config = createVitestConfig(import.meta.dirname);
export default {
  ...config,
  resolve: {
    ...config.resolve,
    alias: [
      ...(config.resolve?.alias ?? []),
      { find: 'server-only', replacement: new URL('../../__mocks__/server-only.ts', import.meta.url).pathname },
    ],
  },
};
