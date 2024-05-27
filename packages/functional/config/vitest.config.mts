import { defineConfig } from 'vitest/config';

import swc from 'vite-plugin-swc-transform';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*'],
      reporter: ['text', 'json', 'html', 'lcovonly']
    }
  },
  plugins: [
    tsconfigPaths(),
    swc({
      swcOptions: {
        jsc: {
          target: 'es2022',
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            decoratorMetadata: true,
          },
        },
      },
    }),
  ],
});
