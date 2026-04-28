import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      // expo/tsconfig.base sets "jsx":"react-native" which esbuild treats as
      // the classic transform (React.createElement). Override to automatic so
      // files without `import React` work correctly in the browser preview.
      esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react',
      },
      resolve: {
        alias: {
          'react-native': 'react-native-web',
          '@': path.resolve(__dirname, '..'),
        },
      },
    }),
};

export default config;
