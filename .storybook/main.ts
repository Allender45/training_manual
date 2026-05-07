import type { StorybookConfig } from '@storybook/react-vite';
import * as path from 'path';

const config: StorybookConfig = {
    stories: [
        '../components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
        '../containers/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    ],
    addons: [
        '@storybook/addon-essentials',
        '@storybook/addon-interactions',
        '@storybook/addon-links',
    ],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    async viteFinal(config) {
        config.define = {
            ...config.define,
            'process.env': {},
        };
        config.resolve = {
            ...config.resolve,
            alias: {
                ...(config.resolve?.alias as Record<string, string> ?? {}),
                'next/link':       path.resolve(__dirname, './mocks/next-link.tsx'),
                'next/navigation': path.resolve(__dirname, './mocks/next-navigation.ts'),
                '@':               path.resolve(__dirname, '..'),
            },
        };
        return config;
    },
};

export default config;