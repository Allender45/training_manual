'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useUserStore} from '@/store/userStore';
import {Header, Sidebar} from '@/containers';
import {UserContent} from '@/components';

export default function ProfilePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const {user, fetchUser} = useUserStore();

    useEffect(() => {
        fetchUser(() => router.push('/login'));
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} mobileMenuOpen={mobileMenuOpen}
                        setMobileMenuOpen={setMobileMenuOpen}/>
                {user && <UserContent userId={String(user.id)}/>}
            </div>
        </div>
    );
}