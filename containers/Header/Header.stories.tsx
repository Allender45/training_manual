import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import Header from './Header';

const meta: Meta<typeof Header> = {
    title: 'Containers/Header',
    component: Header,
    tags: ['autodocs'],
    args: {
        setSidebarOpen: fn(),
        setMobileMenuOpen: fn(),
    },
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
    args: {
        sidebarOpen: true,
        mobileMenuOpen: false,
    },
};

export const SidebarCollapsed: Story = {
    args: {
        sidebarOpen: false,
        mobileMenuOpen: false,
    },
};