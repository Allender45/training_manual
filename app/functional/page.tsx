'use client';

import React, {useState, useEffect} from 'react';
import {Header, Sidebar, Modal} from '@/containers';
import {Button, Input, Checkbox, CKEditorField} from '@/components';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {Pencil} from 'lucide-react';
import {hasFeature} from "@/lib/permissions";
import {useUserStore} from "@/store";

type InstructionRow = {
    id: number;
    title: string;
    content: string | null;
    is_active: boolean;
    created_at: string;
};

// убирает HTML-теги для превью
function stripHtml(html: string | null): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').slice(0, 120);
}

export default function FunctionalPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const user = useUserStore(s => s.user);
    const rid = user?.role_id ?? null;

    // --- состояние модалки ---
    const [modalOpen, setModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    // --- список инструкций ---
    const [instructions, setInstructions] = useState<InstructionRow[]>([]);

    async function fetchInstructions() {
        const res = await fetch('/api/functional');
        const data = await res.json();
        if (res.ok) setInstructions(data.instructions ?? []);
    }

    useEffect(() => {
        fetchInstructions();
    }, []);

    function openModal() {
        setEditingId(null);
        setTitle('');
        setContent('');
        setIsActive(true);
        setSaveError(null);
        setModalOpen(true);
    }

    function openEditModal(item: InstructionRow) {
        setEditingId(item.id);
        setTitle(item.title);
        setContent(item.content ?? '');
        setIsActive(item.is_active);
        setSaveError(null);
        setModalOpen(true);
    }

    async function handleSave() {
        if (!title.trim()) {
            setSaveError('Заполните обязательное поле: название');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const url = editingId ? `/api/functional/${editingId}` : '/api/functional';
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({title: title.trim(), content, is_active: isActive}),
            });
            const data = await res.json();
            if (!res.ok) {
                setSaveError(data.error ?? 'Ошибка');
                return;
            }
            setModalOpen(false);
            fetchInstructions();
        } catch {
            setSaveError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
                <main className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">Функционал CRM</h3>
                        {hasFeature(rid, 'functionalAddButton') &&
                            <Button size="sm" onClick={openModal}>+ Добавить</Button>
                        }
                    </div>

                    {instructions.filter(i => i.is_active).map(item => (
                        <div key={item.id}
                             className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Image src="/achievements/1779966059793.png" alt={item.title} width={800}
                                           height={600}/>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{item.title}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasFeature(rid, 'functionalEditButton') &&
                                    <Button
                                        onClick={() => openEditModal(item)}
                                        variant={"secondary"}
                                    >
                                        <Pencil size={20}/>
                                    </Button>
                                }
                                <Button variant="primary" onClick={() => router.push(`/functional/${item.id}`)}>
                                    Читать
                                </Button>
                            </div>
                        </div>
                    ))}

                    {instructions.length === 0 && (
                        <p className="text-gray-400 text-sm text-center py-10">Инструкции не добавлены</p>
                    )}
                </main>
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
                   title={editingId ? 'Редактировать инструкцию' : 'Новая инструкция'}>
                <div className="flex flex-col gap-5">
                    <Input label="Название *" name="title" value={title} onChange={e => setTitle(e.target.value)}/>
                    <CKEditorField label="Содержимое" value={content} onChange={setContent} minHeight={260}/>
                    <Checkbox label="Активна" name="is_active" checked={isActive}
                              onChange={e => setIsActive(e.target.checked)} variant="switch"/>
                    {saveError && <p className="text-red-500 text-sm">{saveError}</p>}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={() => setModalOpen(false)}
                                disabled={saving}>Отменить</Button>
                        <Button onClick={handleSave} loading={saving}>Сохранить</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}