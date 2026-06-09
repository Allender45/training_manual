'use client';

import { Header, Sidebar } from "@/containers";
import { useState } from "react";
import { CallCardResult, NewOrderTrainer } from "@/components";

export default function WorkplacePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [result, setResult] = useState<CallCardResult | null>(null);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6 flex flex-col gap-4">
                    <NewOrderTrainer />
                    {result && (
                        <pre className="text-xs bg-white border rounded-xl p-3 text-gray-600">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    )}
                </main>
            </div>
        </div>
    );
}