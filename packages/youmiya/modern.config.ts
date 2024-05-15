import { moduleTools, defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildPreset: 'npm-library',
  buildConfig: {
    autoExternal: false,
    copy: {
      patterns: [
        {
          context: __dirname,
          from: '../../README.md',
          to: '../',
        },
      ],
    },
  },
});
