import type { Meta, StoryObj } from '@storybook/react';
import SidebarButton from './SidebarButton';
import { Home, BookOpen } from 'lucide-react';

const meta: Meta<typeof SidebarButton> = {
    title: 'Components/SidebarButton',
    component: SidebarButton,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof SidebarButton>;

export const Default: Story = {
    args: { href: '/courses', icon: BookOpen, label: 'Courses', sidebarOpen: true },
};

export const Active: Story = {
    args: { href: '/home', icon: Home, label: 'Dashboard', sidebarOpen: true, active: true },
};

export const Collapsed: Story = {
    args: { href: '/courses', icon: BookOpen, label: 'Courses', sidebarOpen: false },
};

export const CollapsedActive: Story = {
    args: { href: '/home', icon: Home, label: 'Dashboard', sidebarOpen: false, active: true },
};