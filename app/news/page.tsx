'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import { Header, Sidebar, Modal, EntityTable, NewsRow } from '@/containers';
import { Button, Input, Checkbox } from '@/components';
import { ImageOff } from 'lucide-react';

const emptyForm = {
    title: '',
    body: '',
    imageUrl: '',
    published: true,
    sendNotification: true,
};

function NewsImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/news/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? 'Ошибка загрузки'); return; }
            onChange(data.imageUrl);
        } catch {
            setError('Ошибка соединения с сервером');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    return (
        <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Изображение</p>
            <div className="flex items-center gap-3">
                <div className="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {value ? (
                        <img src={`/api/news/image?url=${encodeURIComponent(value)}`} alt="Превью" className="w-full h-full object-cover" />
                    ) : (
                        <ImageOff size={22} className="text-gray-300" />
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} loading={uploading}>
                        {value ? 'Изменить картинку' : 'Загрузить картинку'}
                    </Button>
                    {value && (
                        <button type="button" onClick={() => onChange('')} className="text-xs text-gray-400 hover:text-red-500 text-left">
                            Удалить
                        </button>
                    )}
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                </div>
            </div>
        </div>
    );
}

export default function NewsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [news, setNews] = useState<NewsRow[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [adding, setAdding] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [detail, setDetail] = useState<NewsRow | null>(null);
    const [published, setPublished] = useState(true);
    const [saving, setSaving] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const router = useRouter();
    const { fetchUser } = useUserStore();

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetchNews();
    }, []);

    async function fetchNews() {
        const res = await fetch('/api/news');
        if (res.ok) {
            const data = await res.json();
            setNews(data.news);
        }
    }

    function resetForm() {
        setForm(emptyForm);
        setFormError(null);
    }

    async function handleAdd() {
        if (!form.title.trim()) { setFormError('Заголовок обязателен'); return; }
        if (!form.body.trim()) { setFormError('Текст новости обязателен'); return; }

        setAdding(true);
        setFormError(null);
        try {
            const res = await fetch('/api/news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setFormError(data.error ?? 'Ошибка'); return; }
            setNews(prev => [data.news, ...prev]);
            setModalOpen(false);
            resetForm();
        } catch {
            setFormError('Ошибка соединения с сервером');
        } finally {
            setAdding(false);
        }
    }

    function openDetail(row: NewsRow) {
        setDetail(row);
        setPublished(row.published);
        setDetailError(null);
    }

    function closeDetail() {
        setDetail(null);
        setDetailError(null);
    }

    async function handleSaveDetail() {
        if (!detail) return;
        setSaving(true);
        setDetailError(null);
        try {
            const res = await fetch(`/api/news/${detail.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ published }),
            });
            const data = await res.json();
            if (!res.ok) { setDetailError(data.error ?? 'Ошибка'); return; }
            setNews(prev => prev.map(n => n.id === data.news.id ? { ...n, published: data.news.published } : n));
            closeDetail();
        } catch {
            setDetailError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(row: NewsRow) {
        if (!confirm(`Удалить новость «${row.title}»?`)) return;
        const res = await fetch(`/api/news/${row.id}`, { method: 'DELETE' });
        if (res.ok) setNews(prev => prev.filter(n => n.id !== row.id));
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    <EntityTable
                        entityType="news"
                        data={news}
                        onAdd={() => setModalOpen(true)}
                        onRowClick={row => openDetail(row as NewsRow)}
                        onDelete={row => handleDelete(row as NewsRow)}
                        buttonDel
                    />
                </main>
            </div>

            {/* Модалка создания */}
            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title="Добавление новости" className="max-w-xl">
                <div className="flex flex-col gap-4">
                    <Input label="Заголовок" name="title" value={form.title}
                           onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setFormError(null); }} />
                    <Input label="Текст новости" name="body" type="textarea" rows={4} value={form.body} maxLength={4096} showCharCount
                           onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
                    <NewsImageField value={form.imageUrl} onChange={url => setForm(p => ({ ...p, imageUrl: url }))} />

                    <Checkbox
                        label="Показывать в боте" name="published"
                        checked={form.published}
                        onChange={e => setForm(p => ({ ...p, published: e.target.checked }))}
                        variant="switch"
                    />
                    <Checkbox
                        label="Разослать push-уведомление подписчикам" name="sendNotification"
                        checked={form.sendNotification}
                        onChange={e => setForm(p => ({ ...p, sendNotification: e.target.checked }))}
                        variant="switch"
                    />

                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Отменить</Button>
                        <Button onClick={handleAdd} loading={adding}>Добавить</Button>
                    </div>
                </div>
            </Modal>

            {/* Модалка деталей */}
            <Modal isOpen={!!detail} onClose={closeDetail} title="Новость" className="max-w-xl">
                {detail && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">{detail.title}</p>
                            <p className="text-sm text-gray-500 whitespace-pre-wrap">{detail.body}</p>
                        </div>
                        {detail.image_url && (
                            <img src={`/api/news/image?url=${encodeURIComponent(detail.image_url)}`} alt={detail.title} className="rounded-lg max-h-64 object-contain" />
                        )}
                        <Checkbox
                            label="Показывать в боте" name="published"
                            checked={published}
                            onChange={e => setPublished(e.target.checked)}
                            variant="switch"
                        />
                        {detailError && <p className="text-red-500 text-sm">{detailError}</p>}
                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" onClick={closeDetail}>Закрыть</Button>
                            <Button onClick={handleSaveDetail} loading={saving}>Сохранить</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}