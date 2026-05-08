'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useUserStore} from '@/store/userStore';
import {Header, Sidebar, Modal} from '@/containers';
import {Button, Table, Input, Checkbox} from '@/components';
import {Column} from '@/components/Table/Table';
import {Plus} from 'lucide-react';

type Department = { id: number; name: string; active: boolean; comment: string };

const emptyForm = {name: '', comment: ''};
type EditForm = { id: number; name: string; comment: string; active: boolean };
const emptyEditForm: EditForm = {id: 0, name: '', comment: '', active: true};

export default function DepartmentsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [adding, setAdding] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();
    const {fetchUser} = useUserStore();

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetchDepartments();
    }, []);

    async function fetchDepartments() {
        const res = await fetch('/api/departments');
        if (res.ok) {
            const data = await res.json();
            setDepartments(data.departments);
        }
    }

    async function handleAdd() {
        if (!form.name.trim()) {
            setFormError('Название обязательно');
            return;
        }
        setAdding(true);
        setFormError(null);
        try {
            const res = await fetch('/api/departments', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                setFormError(data.error ?? 'Ошибка');
                return;
            }
            setDepartments(prev => [...prev, data.departments]);
            setModalOpen(false);
            setForm(emptyForm);
        } catch {
            setFormError('Ошибка соединения с сервером');
        } finally {
            setAdding(false);
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm(prev => ({...prev, [e.target.name]: e.target.value}));
        setFormError(null);
    }

    function handleCloseModal() {
        setModalOpen(false);
        setForm(emptyForm);
        setFormError(null);
    }

    function handleEdit(department: Department) {
        setEditForm({id: department.id, name: department.name, comment: department.comment ?? '', active: department.active});
        setEditModalOpen(true);
    }

    function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
        const {name, value, type, checked} = e.target;
        setEditForm(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
        setEditError(null);
    }

    function handleCloseEditModal() {
        setEditModalOpen(false);
        setEditError(null);
    }

    async function handleSaveEdit() {
        if (!editForm.name.trim()) {
            setEditError('Название обязательно');
            return;
        }
        setSaving(true);
        setEditError(null);
        try {
            const res = await fetch(`/api/departments/${editForm.id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (!res.ok) {
                setEditError(data.error ?? 'Ошибка');
                return;
            }
            setDepartments(prev => prev.map(r => r.id === editForm.id ? data.departments : r));
            setEditModalOpen(false);
        } catch {
            setEditError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    function handleDelete(id: number) {
        setDeleteId(id);
    }

    async function handleConfirmDelete() {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/departments/${deleteId}`, {method: 'DELETE'});
            if (res.ok) {
                setDepartments(prev => prev.filter(r => r.id !== deleteId));
                setDeleteId(null);
            }
        } catch (error) {
            console.error('[handleConfirmDelete]', error);
        } finally {
            setDeleting(false);
        }
    }

    const columns: Column<Department>[] = [
        {key: 'name', header: 'Название'},
        {
            key: 'active', header: 'Активна',
            render: (row) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    row.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                    {row.active ? 'Активна' : 'Неактивна'}
                </span>
            ),
        },
        {key: 'comment', header: 'Комментарий'},
    ];

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} mobileMenuOpen={mobileMenuOpen}
                        setMobileMenuOpen={setMobileMenuOpen}/>
                <main className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-800">Роли</h3>
                        <Button size="sm" onClick={() => setModalOpen(true)}>
                            <Plus size={14} className="mr-1"/>
                            Добавить подразделение
                        </Button>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <Table<Department>
                            columns={columns}
                            data={departments}
                            keyField="id"
                            emptyText="Подразделения не найдены"
                            buttonEdit
                            buttonDel
                            onEdit={handleEdit}
                            onDelete={(row) => handleDelete(row.id)}
                        />
                    </div>
                </main>
            </div>

            <Modal isOpen={modalOpen} onClose={handleCloseModal} title="Добавление подразделения">
                <div className="flex flex-col gap-4">
                    <Input label="Название подразделения" name="name" value={form.name} onChange={handleChange}/>
                    <Input label="Комментарий" name="comment" value={form.comment} onChange={handleChange}/>
                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={handleCloseModal}>Отменить</Button>
                        <Button onClick={handleAdd} loading={adding}>Добавить</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={editModalOpen} onClose={handleCloseEditModal} title="Изменение подразделения">
                <div className="flex flex-col gap-4">
                    <Input label="Название" name="name" value={editForm.name} onChange={handleEditChange}/>
                    <Input label="Комментарий" name="comment" value={editForm.comment} onChange={handleEditChange}/>
                    <Checkbox
                        label="Активно"
                        name="active"
                        checked={editForm.active}
                        onChange={handleEditChange}
                        variant="switch"
                    />
                    {editError && <p className="text-red-500 text-sm">{editError}</p>}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={handleCloseEditModal}>Отменить</Button>
                        <Button onClick={handleSaveEdit} loading={saving}>Сохранить</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Подтверждение удаления">
                <p className="text-sm text-gray-600 mb-6">
                    Вы уверены, что хотите удалить подразделение <span className="font-medium text-gray-800">
            {departments.find(r => r.id === deleteId)?.name}
        </span>? Это действие нельзя отменить.
                </p>
                <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setDeleteId(null)}>Отменить</Button>
                    <Button className="bg-red-600 hover:bg-red-700" onClick={handleConfirmDelete}
                            loading={deleting}>Удалить</Button>
                </div>
            </Modal>
        </div>
    );
}