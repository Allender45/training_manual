'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header, Sidebar } from '@/containers';
import { Button } from '@/components';

type Instruction = {
    id: number;
    title: string;
    content: string | null;
    is_active: boolean;
};

export default function InstructionPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { id } = useParams<{ id: string }>();

    const [instruction, setInstruction] = useState<Instruction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/functional/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) setError(data.error);
                else setInstruction(data.instruction);
            })
            .catch(() => setError('Ошибка соединения с сервером'))
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="bg-white rounded-2xl shadow-sm p-6 m-6">

                    <div className="mb-4">
                        <Button variant="outline" size="sm" onClick={() => router.push('/functional')}>
                            ← Назад
                        </Button>
                    </div>

                    {loading && <p className="text-gray-400 text-sm">Загрузка...</p>}
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    {instruction && (
                        <>
                            <h1 className="text-2xl font-bold mb-6 text-center">{instruction.title}</h1>
                            <div
                                className="ck-content"
                                dangerouslySetInnerHTML={{ __html: instruction.content ?? '' }}
                            />
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}