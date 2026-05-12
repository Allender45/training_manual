import type { Preview } from '@storybook/react';
import * as React from 'react';
import '../app/globals.css';

(window as any).React = React;

const preview: Preview = {
    parameters: {
        backgrounds: {
            default: 'gray',
            values: [
                { name: 'white', value: '#ffffff' },
                { name: 'gray',  value: '#f3f4f6' },
                { name: 'dark',  value: '#1f2937' },
            ],
        },
        actions: {},
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },
};

export default preview;