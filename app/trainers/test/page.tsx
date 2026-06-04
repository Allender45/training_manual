'use client';

import { Header, Sidebar } from "@/containers";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TrainerRegistry } from "@/components/trainers/registry";
import { CallCardResult } from "@/components";

function WorkplaceContent() {
    const params = useSearchParams();
    const component = params.get('component') ?? '';
    const [result, setResult] = useState<CallCardResult | null>(null);

    const Trainer = TrainerRegistry[component];

    return (
        <main className="flex-1 p-6 flex flex-col gap-4">
            {Trainer
                ? <Trainer onComplete={(r: CallCardResult) => setResult(r)} />
                : <p className="text-gray-400 text-sm">Тренажёр не найден: <code>{component}</code></p>
            }
            {result && (
                <pre className="text-xs bg-white border rounded-xl p-3 text-gray-600">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </main>
    );
}

export default function WorkplacePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <Suspense>
                    <WorkplaceContent />
                </Suspense>
            </div>
        </div>
    );
}