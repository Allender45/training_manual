'use client';

import React, {useState} from 'react';
import Link from 'next/link';
import {
    Home, FileText, Dumbbell, ClipboardList,
    Users, Building2, Shield, Trophy, BarChart2,
    BookOpen, ChevronRight,
} from 'lucide-react';
import {usePathname} from 'next/navigation';
import {SidebarButton} from '@/components';
import {useUserStore} from '@/store/userStore';
import {hasFeature} from '@/lib/permissions';

type SidebarProps = {
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
};

const LEARNING_HREFS = ['/courses', '/manuals', '/trainers', '/courseTests'];

export default function Sidebar({sidebarOpen, mobileMenuOpen, setMobileMenuOpen}: SidebarProps) {
    const pathname = usePathname();
    const user = useUserStore(s => s.user);
    const rid = user?.role_id ?? null;
    const [learningOpen, setLearningOpen] = useState(
        LEARNING_HREFS.some(h => pathname.startsWith(h))
    );

    return (
        <>
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <aside className={`
                ${sidebarOpen ? 'w-60' : 'w-16'}
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                fixed lg:static inset-y-0 left-0 z-50 bg-white shadow-sm
                transition-all duration-300 flex flex-col flex-shrink-0
            `}>
                <div className="flex items-center justify-center h-16 border-b px-3">
                    {sidebarOpen
                        ? <Link href="/home"><img src="/raz_logo.png" alt="logo" className="p-5 object-contain"/></Link>
                        : <Link href="/home"><img src="/raz_logo_noText.png" alt="logo"
                                                  className="object-contain"/></Link>
                    }
                </div>

                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                    <SidebarButton
                        href="/home" icon={Home} label="Dashboard"
                        sidebarOpen={sidebarOpen} active={pathname === '/home'}
                    />
                    <SidebarButton href="/courses" icon={FileText} label="Курсы" sidebarOpen={sidebarOpen}
                                   active={pathname.startsWith('/courses')}/>
                    <SidebarButton href="/reports" icon={BarChart2} label="Отчёты" sidebarOpen={sidebarOpen}
                                   active={pathname.startsWith('/reports')}/>
                    {/* Обучение — группа с подменю */}
                    <div>
                        <button
                            onClick={() => setLearningOpen(o => !o)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                LEARNING_HREFS.some(h => pathname.startsWith(h))
                                    ? 'bg-[#e8f5e8] text-[#41A141]'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <BookOpen size={18} className="flex-shrink-0"/>
                            {sidebarOpen && (
                                <>
                                    <span className="flex-1 text-left">Администрирование</span>
                                    <ChevronRight
                                        size={16}
                                        className={`transition-transform duration-200 ${learningOpen ? 'rotate-90' : ''}`}
                                    />
                                </>
                            )}
                        </button>

                        {sidebarOpen && learningOpen && (
                            <div className="mt-0.5 ml-4 pl-3 border-l border-gray-200 space-y-0.5">
                                {hasFeature(rid, 'manuals') &&
                                    <SidebarButton href="/manuals" icon={FileText} label="Материалы"
                                                   sidebarOpen={sidebarOpen} active={pathname.startsWith('/manuals')}/>}
                                {hasFeature(rid, 'trainers') &&
                                    <SidebarButton href="/trainers" icon={Dumbbell} label="Тренажёры"
                                                   sidebarOpen={sidebarOpen}
                                                   active={pathname.startsWith('/trainers')}/>}
                                {hasFeature(rid, 'courseTests') &&
                                    <SidebarButton href="/courseTests" icon={ClipboardList} label="Тесты"
                                                   sidebarOpen={sidebarOpen}
                                                   active={pathname.startsWith('/courseTests')}/>}
                                {hasFeature(rid, 'users') &&
                                    <SidebarButton href="/users" icon={Users} label="Пользователи"
                                                   sidebarOpen={sidebarOpen} active={pathname.startsWith('/users')}/>}
                                {hasFeature(rid, 'departments') &&
                                    <SidebarButton href="/departments" icon={Building2} label="Подразделения"
                                                   sidebarOpen={sidebarOpen}
                                                   active={pathname.startsWith('/departments')}/>}
                                {hasFeature(rid, 'roles') &&
                                    <SidebarButton href="/roles" icon={Shield} label="Роли" sidebarOpen={sidebarOpen}
                                                   active={pathname.startsWith('/roles')}/>}
                                {hasFeature(rid, 'achievements') &&
                                    <SidebarButton href="/achievements" icon={Trophy} label="Награды"
                                                   sidebarOpen={sidebarOpen}
                                                   active={pathname.startsWith('/achivments')}/>}
                            </div>
                        )}
                    </div>
                </nav>
            </aside>
        </>
    );
}