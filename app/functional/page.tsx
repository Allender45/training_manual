'use client';

import { useState } from 'react';
import { Header, Sidebar, EntityTable } from '@/containers';
import type { FunctionalRow } from '@/containers';

export default function FunctionalPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const functional: FunctionalRow[] = [
        {
            id: 1,
            title: 'Звонки/обращения',
            description: 'Звонки/обращения',
            href: '/functional/calls_requests'
        },
        {
            id: 2,
            title: 'Cоставление заявки',
            description: 'Звонки/обращения',
            href: '/functional/request_create'
        },
        {
            id: 3,
            title: 'Рейтинг',
            description: 'Рейтинг',
            href: '/functional/rating'
        },
    ];

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    <EntityTable
                        entityType="functional"
                        data={functional}
                    />
                </main>
            </div>
        </div>
    );
}