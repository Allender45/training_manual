import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import Sidebar from './Sidebar';

const meta: Meta<typeof Sidebar> = {
    title: 'Containers/Sidebar',
    component: Sidebar,
    tags: ['autodocs'],
    args: {
        setMobileMenuOpen: fn(),
    },
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (
            <div style={{ minHeight: '100vh', display: 'flex' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
    args: {
        sidebarOpen: true,
        mobileMenuOpen: false,
    },
};

export const Collapsed: Story = {
    args: {
        sidebarOpen: false,
        mobileMenuOpen: false,
    },
};

export const MobileOpen: Story = {
    args: {
        sidebarOpen: true,
        mobileMenuOpen: true,
    },
    parameters: {
        viewport: { defaultViewport: 'mobile1' },
    },
};