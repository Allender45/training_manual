'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store';
import { Header, Sidebar, Modal, EntityTable, VacancyLeadRow } from '@/containers';
import { Button, Select } from '@/components';

const STATUS_OPTIONS = [
    { value: 'new', label: '🆕 Новый' },
    { value: 'in_progress', label: '⏳ В работе' },
    { value: 'hired', label: '✅ Принят' },
    { value: 'rejected', label: '❌ Отказ' },
];

function VacancyLeadsPageInner() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [leads, setLeads] = useState<VacancyLeadRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [detail, setDetail] = useState<VacancyLeadRow | null>(null);
    const [statusValue, setStatusValue] = useState('new');
    const [commentValue, setCommentValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const vacancyId = searchParams.get('vacancyId');
    const { fetchUser } = useUserStore();

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetchLeads();
    }, [vacancyId]);

    async function fetchLeads() {
        setLoading(true);
        const url = vacancyId ? `/api/vacancies/leads?vacancyId=${vacancyId}` : '/api/vacancies/leads';
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            setLeads(data.leads);
        }
        setLoading(false);
    }

    function openDetail(row: VacancyLeadRow) {
        setDetail(row);
        setStatusValue(row.status);
        setCommentValue(row.comment ?? '');
        setDetailError(null);
    }

    function closeDetail() {
        setDetail(null);
        setDetailError(null);
    }

    async function handleSave() {
        if (!detail) return;
        setSaving(true);
        setDetailError(null);
        try {
            const res = await fetch(`/api/vacancies/leads/${detail.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: statusValue, comment: commentValue }),
            });
            const data = await res.json();
            if (!res.ok) { setDetailError(data.error ?? 'Ошибка'); return; }
            setLeads(prev => prev.map(l => l.id === data.lead.id ? data.lead : l));
            setDetail(data.lead);
        } catch {
            setDetailError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    {vacancyId && (
                        <div className="mb-4 flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
                            <span className="text-sm text-gray-600">
                                Показаны отклики по выбранной вакансии (ID {vacancyId})
                            </span>
                            <Button variant="outline" size="sm" onClick={() => router.push('/vacancies/leads')}>
                                Показать все отклики
                            </Button>
                        </div>
                    )}
                    {!loading && (
                        <EntityTable
                            entityType="vacancyLeads"
                            data={leads}
                            onRowClick={row => openDetail(row as VacancyLeadRow)}
                        />
                    )}
                </main>
            </div>

            <Modal isOpen={!!detail} onClose={closeDetail} title="Отклик на вакансию" className="max-w-lg">
                {detail && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 flex flex-col gap-1">
                            <span><strong>Кандидат:</strong> {detail.full_name}</span>
                            <span><strong>Телефон:</strong> {detail.phone}</span>
                            <span><strong>Вакансия:</strong> {detail.vacancy_title}</span>
                        </div>

                        <Select
                            label="Статус" name="status" value={statusValue}
                            onChange={e => setStatusValue(e.target.value)}
                            options={STATUS_OPTIONS}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Комментарий</label>
                            <textarea
                                value={commentValue}
                                onChange={e => setCommentValue(e.target.value)}
                                rows={4}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {detailError && <p className="text-red-500 text-sm">{detailError}</p>}
                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" onClick={closeDetail}>Закрыть</Button>
                            <Button onClick={handleSave} loading={saving}>Сохранить</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default function VacancyLeadsPage() {
    return (
        <Suspense>
            <VacancyLeadsPageInner />
        </Suspense>
    );
}