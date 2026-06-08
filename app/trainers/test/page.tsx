'use client';

import { Header, Sidebar } from "@/containers";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { TrainerRegistry } from "@/components/trainers/registry";

export default function TestPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const searchParams = useSearchParams();
    const componentName = searchParams.get('component');
    const TrainerComponent = componentName ? TrainerRegistry[componentName] : null;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6 flex flex-col gap-4">
                    {TrainerComponent ? (
                        <TrainerComponent />
                    ) : (
                        <div className="text-gray-400 text-sm">
                            {componentName ? `Тренажёр «${componentName}» не найден` : 'Компонент не указан'}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}