'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import { Header, Sidebar, TeachersTable } from '@/containers';

export default function TeachersPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser } = useUserStore();

    useEffect(() => {
        fetchUser(() => router.push('/login'));
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex flex-col flex-1 min-w-0">
                <Header
                    sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                    mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}
                />
                <main className="flex-1 p-6">
                    <TeachersTable />
                </main>
            </div>
        </div>
    );
}