'use client';

import {useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {Header, Sidebar} from '@/containers';
import {UserContent} from '@/components';

export default function EditUserPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const searchParams = useSearchParams();
    const userId = searchParams.get('id');

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
                <UserContent userId={userId}/>
            </div>
        </div>
    );
}