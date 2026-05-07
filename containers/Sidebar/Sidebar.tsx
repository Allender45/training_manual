'use client';

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
    Home, BookOpen, User, Users, Book, Building2, DollarSign,
    List, ChevronRight,
} from 'lucide-react';

type SidebarProps = {
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
};

export default function Sidebar({ sidebarOpen, mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
    const [pagesOpen, setPagesOpen] = useState(false);
    const [tablesOpen, setTablesOpen] = useState(false);
    const [componentsOpen, setComponentsOpen] = useState(false);

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
                    <Link href="/home" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-600 font-medium text-sm">
                        <Home size={18} className="flex-shrink-0" />
                        {sidebarOpen && <span>Dashboard</span>}
                    </Link>
                    {([
                        { href: '/courses', icon: BookOpen, label: 'Courses' },
                        { href: '/students', icon: User, label: 'Students' },
                        { href: '/teachers', icon: Users, label: 'Teachers' },
                        { href: '/library', icon: Book, label: 'Library' },
                        { href: '/department', icon: Building2, label: 'Department' },
                        { href: '/staff', icon: Users, label: 'Staff' },
                        { href: '/fees', icon: DollarSign, label: 'Fees' },
                    ] as const).map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
                            <Icon size={18} className="flex-shrink-0" />
                            {sidebarOpen && <span>{label}</span>}
                        </Link>
                    ))}

                    {sidebarOpen && (
                        <>
                            <button
                                onClick={() => setPagesOpen(!pagesOpen)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
                            >
                                <span className="flex items-center gap-3"><List size={18} />Pages</span>
                                <ChevronRight size={14} className={`transition-transform ${pagesOpen ? 'rotate-90' : ''}`} />
                            </button>
                            {pagesOpen && (
                                <div className="ml-9 space-y-0.5">
                                    {[
                                        { href: '/login', label: 'Login' },
                                        { href: '/register', label: 'Register' },
                                        { href: '/forgot-password', label: 'Forgot password' },
                                    ].map(({ href, label }) => (
                                        <Link key={href} href={href} className="block px-3 py-2 text-sm text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-50">
                                            {label}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => setTablesOpen(!tablesOpen)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
                            >
                                <span className="flex items-center gap-3"><List size={18} />Table</span>
                                <ChevronRight size={14} className={`transition-transform ${tablesOpen ? 'rotate-90' : ''}`} />
                            </button>
                            {tablesOpen && (
                                <div className="ml-9 space-y-0.5">
                                    <Link href="/table-bootstrap" className="block px-3 py-2 text-sm text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-50">Bootstrap</Link>
                                    <Link href="/data-table" className="block px-3 py-2 text-sm text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-50">DataTable</Link>
                                </div>
                            )}

                            <button
                                onClick={() => setComponentsOpen(!componentsOpen)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
                            >
                                <span className="flex items-center gap-3"><List size={18} />Components</span>
                                <ChevronRight size={14} className={`transition-transform ${componentsOpen ? 'rotate-90' : ''}`} />
                            </button>
                            {componentsOpen && (
                                <div className="ml-9 space-y-0.5">
                                    <Link href="/form" className="block px-3 py-2 text-sm text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-50">Form Element</Link>
                                </div>
                            )}
                        </>
                    )}
                </nav>
            </aside>
        </>
    );
}