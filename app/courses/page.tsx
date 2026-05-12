'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Header, Sidebar, CoursesTable, Modal } from '@/containers';
import { Button } from '@/components';
import { CourseRow } from '@/containers/CoursesTable/CoursesTable';

export default function CoursesPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser } = useUserStore();

    const [courses, setCourses] = useState<CourseRow[]>([]);
    const [courseToDelete, setCourseToDelete] = useState<CourseRow | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    async function fetchCourses() {
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (res.ok) setCourses(data.courses ?? []);
    }

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetchCourses();
    }, []);

    async function handleDeleteConfirm() {
        if (!courseToDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            const res = await fetch(`/api/courses/${courseToDelete.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) { setDeleteError(data.error ?? 'Ошибка удаления'); return; }
            setCourseToDelete(null);
            fetchCourses();
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
                    <CoursesTable
                        data={courses}
                        onEdit={(row) => router.push(`/courses/edit?id=${row.id}`)}
                        onDelete={(row) => { setCourseToDelete(row); setDeleteError(null); }}
                    />
                </main>
            </div>

            <Modal
                isOpen={!!courseToDelete}
                onClose={() => setCourseToDelete(null)}
                title="Удаление курса"
            >
                <div className="flex flex-col gap-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                        ⚠️ Удалять следует только <strong>ошибочно созданные</strong> курсы.
                        Для остальных случаев используйте функцию <strong>деактивации</strong>.
                    </div>
                    <p className="text-sm text-gray-600">
                        Вы уверены, что хотите удалить курс <strong>{courseToDelete?.title}</strong>?
                        Это действие нельзя отменить.
                    </p>
                    {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={() => setCourseToDelete(null)} disabled={deleting}>
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