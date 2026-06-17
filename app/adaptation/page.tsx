'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import { Header, Sidebar } from '@/containers';
import { AdaptationContent } from '@/components';

export default function AdaptationPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { user, fetchUser } = useUserStore();

    useEffect(() => {
        fetchUser(() => router.push('/login'));
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Адаптация</h3>
                    {user && <AdaptationContent userId={user.id} crmUserId={user.crm_id} />}
                </main>
            </div>
        </div>
    );
}