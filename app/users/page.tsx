'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { useUsersListStore } from '@/store/usersListStore';
import { Header, Sidebar, UsersTable, Modal } from '@/containers';
import { Button } from '@/components';
import { UserRow } from '@/containers/UsersTable/UsersTable';

export default function UsersPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser } = useUserStore();
    const { users, fetchUsers } = useUsersListStore();

    const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetchUsers();
    }, []);

    async function handleDeleteConfirm() {
        if (!userToDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            const res = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) { setDeleteError(data.error ?? 'Ошибка удаления'); return; }
            setUserToDelete(null);
            fetchUsers();
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
                    <UsersTable
                        data={users}
                        onEdit={(row) => router.push(`/users/edit?id=${row.id}`)}
                        onDelete={(row) => { setUserToDelete(row); setDeleteError(null); }}
                    />
                </main>
            </div>

            <Modal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                title="Удаление пользователя"
            >
                <div className="flex flex-col gap-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                        ⚠️ Удалять следует только <strong>ошибочно созданных</strong> пользователей.
                        Для реальных пользователей используйте функцию <strong>деактивации</strong>.
                    </div>
                    <p className="text-sm text-gray-600">
                        Вы уверены, что хотите удалить пользователя <strong>{userToDelete?.name}</strong>?
                        Это действие нельзя отменить.
                    </p>
                    {deleteError && (
                        <p className="text-sm text-red-600">{deleteError}</p>
                    )}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={() => setUserToDelete(null)} disabled={deleting}>
                            Отмена
                        </Button>
                        <Button onClick={handleDeleteConfirm} loading={deleting}>
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}