'use client';

import React from 'react';
import Link from 'next/link';
import {
    Home, FileText, Dumbbell, ClipboardList,
    Users, Building2, Shield, Trophy, BarChart2,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarButton } from '@/components';

type SidebarProps = {
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
};

export default function Sidebar({ sidebarOpen, mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                ${sidebarOpen ? 'w-60' : 'w-16'}
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                fixed lg:static inset-y-0 left-0 z-50 bg-white shadow-sm
                transition-all duration-300 flex flex-col flex-shrink-0
            `}>
                <div className="flex items-center justify-center h-16 border-b px-3">
                    {sidebarOpen
                        ? <Link href="/home"><img src="/raz_logo.png" alt="logo" className="p-5 object-contain" /></Link>
                        : <Link href="/home"><img src="/raz_logo_noText.png" alt="logo" className="object-contain" /></Link>
                    }
                </div>

                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                    {([
                        { href: '/home',        icon: Home,          label: 'Dashboard'     },
                        { href: '/courses',     icon: FileText,      label: 'Материалы'     },
                        { href: '/trainers',    icon: Dumbbell,      label: 'Тренажёры'     },
                        { href: '/tests',       icon: ClipboardList, label: 'Тесты'         },
                        { href: '/users',       icon: Users,         label: 'Пользователи'  },
                        { href: '/departments',  icon: Building2,     label: 'Подразделения' },
                        { href: '/roles',       icon: Shield,        label: 'Роли'          },
                        { href: '/achivments',  icon: Trophy,        label: 'Награды'       },
                        { href: '/reports',     icon: BarChart2,     label: 'Отчёты'        },
                    ] as const).map(({ href, icon, label }) => (
                        <SidebarButton
                            key={href}
                            href={href}
                            icon={icon}
                            label={label}
                            sidebarOpen={sidebarOpen}
                            active={pathname === href}
                        />
                    ))}
                </nav>
            </aside>
        </>
    );
}