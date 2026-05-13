'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Header, Sidebar, EntityTable, Modal } from '@/containers';
import { Button } from '@/components';
import type { TestRow, EntityRow } from '@/containers';

export default function TestsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser } = useUserStore();

    const [tests, setTests] = useState<TestRow[]>([]);
    const [testToDelete, setTestToDelete] = useState<TestRow | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    async function fetchTests() {
        const res = await fetch('/api/courseTests');
        const data = await res.json();
        if (res.ok) setTests(data.tests ?? []);
    }

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetchTests();
    }, []);

    async function handleDeleteConfirm() {
        if (!testToDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            const res = await fetch(`/api/courstTests/${testToDelete.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) { setDeleteError(data.error ?? 'Ошибка удаления'); return; }
            setTestToDelete(null);
            fetchTests();
        } catch {
            setDeleteError('Ошибка соединения с сервером');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    <EntityTable
                        entityType="tests"
                        data={tests}
                        onEdit={(row) => router.push(`/courseTests/edit?id=${row.id}`)}
                        onDelete={(row) => { setTestToDelete(row as TestRow); setDeleteError(null); }}
                    />
                </main>
            </div>

            <Modal isOpen={!!testToDelete} onClose={() => setTestToDelete(null)} title="Удаление теста">
                <div className="flex flex-col gap-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                        ⚠️ Удалять следует только <strong>ошибочно созданные</strong> тесты.
                        Для остальных случаев используйте функцию <strong>деактивации</strong>.
                    </div>
                    <p className="text-sm text-gray-600">
                        Вы уверены, что хотите удалить тест <strong>{testToDelete?.title}</strong>?
                        Это действие нельзя отменить.
                    </p>
                    {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={() => setTestToDelete(null)} disabled={deleting}>Отмена</Button>
                        <Button onClick={handleDeleteConfirm} loading={deleting}>Удалить</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}