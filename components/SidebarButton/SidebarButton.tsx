import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

type SidebarButtonProps = {
    href: string;
    icon: LucideIcon;
    label: string;
    sidebarOpen: boolean;
    active?: boolean;
};

export default function SidebarButton({ href, icon: Icon, label, sidebarOpen, active = false }: SidebarButtonProps) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                active
                    ? 'bg-[#41A141] text-white font-medium'
                    : 'text-gray-600 hover:bg-[#6dbf6d] hover:text-white font-medium'
            }`}
        >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
        </Link>
    );
}