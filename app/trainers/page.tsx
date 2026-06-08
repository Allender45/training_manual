'use client';

import { Header, Sidebar } from "@/containers";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TrainerRow {
    id: number;
    name: string;
    description: string;
    component: string;
}

export default function TrainersPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [trainers, setTrainers] = useState<TrainerRow[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/trainers').then(r => r.json()).then(d => setTrainers(d.trainers ?? []));
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    <h1 className="text-xl font-bold text-gray-800 mb-4">Тренажёры</h1>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Название</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Описание</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Компонент</th>
                                <th className="px-4 py-3" />
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {trainers.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{t.description}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{t.component}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => router.push(`/trainers/test?component=${t.component}`)}
                                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
                                            Тестировать
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {trainers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Нет тренажёров</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
}