'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Header, Sidebar, EntityTable, Modal } from '@/containers';
import { Button } from '@/components';
import type { ManualRow, EntityRow } from '@/containers';

export default function ManualsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser } = useUserStore();

    const [manuals, setManuals] = useState<ManualRow[]>([]);
    const [manualToDelete, setManualToDelete] = useState<ManualRow | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    async function fetchManuals() {
        const res = await fetch('/api/manuals');
        const data = await res.json();
        if (res.ok) setManuals(data.manuals ?? []);
    }

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetchManuals();
    }, []);

    async function handleDeleteConfirm() {
        if (!manualToDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            const res = await fetch(`/api/manuals/${manualToDelete.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) { setDeleteError(data.error ?? 'Ошибка удаления'); return; }
            setManualToDelete(null);
            fetchManuals();
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
                        entityType="manuals"
                        data={manuals}
                        buttonEdit
                        buttonDel
                        onEdit={(row) => router.push(`/manuals/new?id=${row.id}`)}
                        onDelete={(row) => { setManualToDelete(row as ManualRow); setDeleteError(null); }}
                    />
                </main>
            </div>

            <Modal isOpen={!!manualToDelete} onClose={() => setManualToDelete(null)} title="Удаление материала">
                <div className="flex flex-col gap-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                        ⚠️ Удалять следует только <strong>ошибочно созданные</strong> материалы.
                        Для остальных случаев используйте функцию <strong>деактивации</strong>.
                    </div>
                    <p className="text-sm text-gray-600">
                        Вы уверены, что хотите удалить материал <strong>{manualToDelete?.title}</strong>?
                        Это действие нельзя отменить.
                    </p>
                    {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={() => setManualToDelete(null)} disabled={deleting}>Отмена</Button>
                        <Button onClick={handleDeleteConfirm} loading={deleting}>Удалить</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}