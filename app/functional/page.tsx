'use client';

import React, { useState } from 'react';
import { Header, Sidebar } from '@/containers';
import type { FunctionalRow } from '@/containers';
import {Button} from "@/components";
import Image from "next/image";
import { useRouter } from 'next/navigation';

export default function FunctionalPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();

    const functional: FunctionalRow[] = [
        {
            id: 1,
            title: 'Звонки/обращения',
            description: 'Описание раздела АТС',
            href: '/functional/calls_requests'
        },
        {
            id: 2,
            title: 'Cоставление заявки',
            description: 'Правильное оформление и ценообразование',
            href: '/functional/request_create'
        },
        {
            id: 3,
            title: 'Рейтинг',
            description: 'Как много зарабатывать',
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
                    {functional.map(trainer => {
                        return (
                            <div key={trainer.id} className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <Image
                                            src="/achievements/1779966059793.png"
                                            alt="АТС"
                                            width={800}
                                            height={600}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{trainer.title}</p>
                                        <p className="text-sm text-gray-400">
                                            {trainer.description}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant={'primary'}
                                    onClick={() => router.push(trainer.href)}
                                >
                                    Читать
                                </Button>
                            </div>
                        );
                    })}
                </main>
            </div>
        </div>
    );
}