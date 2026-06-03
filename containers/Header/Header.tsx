'use client';

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, Search, MessageSquare, Bell, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserStore, useNotificationsStore  } from '@/store';
import {Avatar} from "@/components";

const messages = [
    { msg: 'We talked about a project...', time: '30 min ago' },
    { msg: 'You sent an email to the client...', time: '1 hour ago' },
    { msg: 'Meeting with the design team...', time: '2 hours ago' },
    { msg: 'Reviewed the project documents...', time: 'Yesterday' },
    { msg: 'Finalized the project timeline...', time: '2 days ago' },
];

type HeaderProps = {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
};

export default function Header({ sidebarOpen, setSidebarOpen, mobileMenuOpen, setMobileMenuOpen }: HeaderProps) {
    const [messagesOpen, setMessagesOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const ref = useRef<HTMLElement>(null);
    const router = useRouter();
    const logout = useUserStore(state => state.logout);
    const { user, fetchUser } = useUserStore();
    const { notifications, unreadCount, fetch: fetchNotifications, markRead, markAllRead } = useNotificationsStore();

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60_000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
    }, []);

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        logout();
        router.push('/login');
    }

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setMessagesOpen(false);
                setNotificationsOpen(false);
                setProfileOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function formatTime(dateStr: string) {
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return 'только что';
        if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
        return new Date(dateStr).toLocaleDateString('ru-RU');
    }

    return (
        <header ref={ref} className="bg-white shadow-sm px-4 h-16 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-gray-500 hover:text-gray-800">
                    <Menu size={24} />
                </button>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="block lg:hidden text-gray-500 hover:text-gray-800">
                    <Menu size={24} />
                </button>
                <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <Search size={15} className="text-gray-400" />
                    <input type="text" placeholder="Search anything" className="bg-transparent text-sm outline-none text-gray-600 w-44" />
                </div>
            </div>

            <div className="flex items-center gap-1">
                {/* Messages */}
                {/*<div className="relative">*/}
                {/*    <button*/}
                {/*        onClick={() => { setMessagesOpen(!messagesOpen); setNotificationsOpen(false); setProfileOpen(false); }}*/}
                {/*        className="p-2 text-gray-500 hover:text-gray-800"*/}
                {/*    >*/}
                {/*        <MessageSquare size={22} />*/}
                {/*    </button>*/}
                {/*    {messagesOpen && (*/}
                {/*        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border z-50">*/}
                {/*            <div className="p-3 h-72 overflow-y-auto space-y-3">*/}
                {/*                {messages.map((m, i) => (*/}
                {/*                    <div key={i} className="flex gap-3 items-start">*/}
                {/*                        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />*/}
                {/*                        <div>*/}
                {/*                            <p className="text-sm font-medium text-gray-800">{m.msg}</p>*/}
                {/*                            <p className="text-xs text-gray-400 mt-0.5">{m.time}</p>*/}
                {/*                        </div>*/}
                {/*                    </div>*/}
                {/*                ))}*/}
                {/*            </div>*/}
                {/*            <a href="#" className="block text-center text-sm text-blue-600 py-2 border-t hover:bg-gray-50 rounded-b-xl">*/}
                {/*                See all messages →*/}
                {/*            </a>*/}
                {/*        </div>*/}
                {/*    )}*/}
                {/*</div>*/}

                {/* Notifications */}
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => { setNotificationsOpen(!notificationsOpen); setMessagesOpen(false); setProfileOpen(false); }}
                        className="p-2 text-gray-500 hover:text-gray-800 relative"
                    >
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
            </span>
                        )}
                    </button>
                    {notificationsOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border z-50">
                            <div className="flex items-center justify-between px-4 py-2 border-b">
                                <span className="text-sm font-semibold text-gray-700">Уведомления</span>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                                        Прочитать все
                                    </button>
                                )}
                            </div>
                            <div className="h-72 overflow-y-auto divide-y divide-gray-50">
                                {notifications.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-10">Нет уведомлений</p>
                                ) : notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => n.status === 'unread' && markRead(n.id)}
                                        className={`flex gap-3 items-start px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${n.status === 'unread' ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-lg">
                                            {n.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 leading-snug">{n.text}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{formatTime(n.created_at)}</p>
                                        </div>
                                        {n.status === 'unread' && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="relative ml-1">
                    <button
                        onClick={() => { setProfileOpen(!profileOpen); setMessagesOpen(false); setNotificationsOpen(false); }}
                        className="flex items-center gap-2 pl-2"
                    >
                        <Avatar src={user?.photo || ''} size="sm" className={'border-0'} />
                        <div className="hidden lg:block text-left">
                            <span className="block text-xs text-gray-400 leading-tight">{user?.role}</span>
                            <span className="block text-sm font-medium text-gray-700 leading-tight">{user?.last_name} {user?.first_name}</span>
                        </div>
                        <ChevronDown size={14} className="text-gray-400" />
                    </button>
                    {profileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border z-50">
                            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl">Профиль</Link>
                            <hr className="my-1" />
                            <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-b-xl">Выход</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}