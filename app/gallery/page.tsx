'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, FolderPlus, Folder, Images, X } from 'lucide-react';
import { GalleryCard } from '@/components/';
import { GalleryModal, Header, Sidebar } from '@/containers/';

type Photo = { id: number; title: string | null; public_url: string; created_at: string; author: string; album_id: number | null };
type Album = { id: number; name: string; photo_count: number };

export default function GalleryPage() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [activeAlbumId, setActiveAlbumId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [autoplay, setAutoplay] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState('');
    const [creatingAlbum, setCreatingAlbum] = useState(false);
    const [showAlbumInput, setShowAlbumInput] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [moveToAlbumId, setMoveToAlbumId] = useState<string>('');
    const selectionMode = selectedIds.size > 0;

    function handleSelect(id: number) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function clearSelection() {
        setSelectedIds(new Set());
        setMoveToAlbumId('');
    }

    async function handleBulkDelete() {
        if (!confirm(`Удалить ${selectedIds.size} фото?`)) return;
        await Promise.all([...selectedIds].map(id => fetch(`/api/gallery/${id}`, { method: 'DELETE' })));
        setPhotos(p => p.filter(ph => !selectedIds.has(ph.id)));
        clearSelection();
        await fetchAlbums();
    }

    async function handleBulkMove() {
        if (!moveToAlbumId) return;
        const albumId = moveToAlbumId === 'null' ? null : Number(moveToAlbumId);
        await Promise.all([...selectedIds].map(id =>
            fetch(`/api/gallery/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ albumId }),
            })
        ));
        clearSelection();
        await fetchAlbums();
        fetchPhotos(activeAlbumId);
    }

    const fetchPhotos = useCallback((albumId: number | null) => {
        setLoading(true);
        const url = albumId ? `/api/gallery?albumId=${albumId}` : '/api/gallery';
        fetch(url)
            .then(r => r.json())
            .then(d => setPhotos(d.photos ?? []))
            .finally(() => setLoading(false));
    }, []);

    const fetchAlbums = () =>
        fetch('/api/gallery/albums').then(r => r.json()).then(d => setAlbums(d.albums ?? []));

    useEffect(() => {
        fetchAlbums();
        fetchPhotos(null);
    }, [fetchPhotos]);

    const prev = useCallback(() => {
        setActiveIndex(i => i === null ? null : (i - 1 + photos.length) % photos.length);
    }, [photos.length]);

    const next = useCallback(() => {
        setActiveIndex(i => i === null ? null : (i + 1) % photos.length);
    }, [photos.length]);

    const closeModal = () => { setActiveIndex(null); setAutoplay(false); };

    function handleAlbumSelect(albumId: number | null) {
        setActiveAlbumId(albumId);
        setActiveIndex(null);
        fetchPhotos(albumId);
    }

    async function handleCreateAlbum() {
        if (!newAlbumName.trim()) return;
        setCreatingAlbum(true);
        await fetch('/api/gallery/albums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newAlbumName.trim() }),
        });
        await fetchAlbums();
        setNewAlbumName('');
        setShowAlbumInput(false);
        setCreatingAlbum(false);
    }

    async function handleDeleteAlbum(id: number) {
        if (!confirm('Удалить папку? Фото останутся без папки.')) return;
        await fetch(`/api/gallery/albums/${id}`, { method: 'DELETE' });
        await fetchAlbums();
        if (activeAlbumId === id) handleAlbumSelect(null);
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files?.length) return;
        setUploading(true);
        for (const file of Array.from(files)) {
            const fd = new FormData();
            fd.append('file', file);
            if (activeAlbumId) fd.append('albumId', String(activeAlbumId));
            await fetch('/api/gallery', { method: 'POST', body: fd });
        }
        await fetchAlbums();
        fetchPhotos(activeAlbumId);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function handleDelete(id: number) {
        if (!confirm('Удалить фото?')) return;
        await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
        setPhotos(p => p.filter(ph => ph.id !== id));
        if (activeIndex !== null && photos[activeIndex]?.id === id) closeModal();
        await fetchAlbums();
    }

    const activeAlbumName = albums.find(a => a.id === activeAlbumId)?.name;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

                <main className="flex-1 flex gap-0">
                    {/* Левая панель — альбомы */}
                    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 p-4 flex flex-col gap-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Папки</span>
                            <button
                                onClick={() => setShowAlbumInput(v => !v)}
                                className="text-gray-400 hover:text-blue-600 transition"
                                title="Создать папку"
                            >
                                <FolderPlus size={16} />
                            </button>
                        </div>

                        {showAlbumInput && (
                            <div className="flex gap-1 mb-2">
                                <input
                                    autoFocus
                                    value={newAlbumName}
                                    onChange={e => setNewAlbumName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleCreateAlbum(); if (e.key === 'Escape') setShowAlbumInput(false); }}
                                    placeholder="Название"
                                    className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleCreateAlbum}
                                    disabled={creatingAlbum}
                                    className="px-2 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    OK
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => handleAlbumSelect(null)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition w-full text-left ${
                                activeAlbumId === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <Images size={15} />
                            <span className="flex-1">Все фото</span>
                            <span className="text-xs text-gray-400">{photos.length || ''}</span>
                        </button>

                        {albums.map(album => (
                            <div key={album.id} className="group flex items-center gap-1">
                                <button
                                    onClick={() => handleAlbumSelect(album.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition flex-1 text-left ${
                                        activeAlbumId === album.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <Folder size={15} />
                                    <span className="flex-1 truncate">{album.name}</span>
                                    <span className="text-xs text-gray-400">{album.photo_count || ''}</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteAlbum(album.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition p-1"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </aside>

                    {/* Основной контент */}
                    <div className="flex-1 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">
                                {activeAlbumName ?? 'Все фото'}
                            </h1>
                            {selectionMode ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-gray-600">Выбрано: {selectedIds.size}</span>

                                    <select
                                        value={moveToAlbumId}
                                        onChange={e => setMoveToAlbumId(e.target.value)}
                                        className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">— Переместить в —</option>
                                        <option value="null">Без папки</option>
                                        {albums.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={handleBulkMove}
                                        disabled={!moveToAlbumId}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40"
                                    >
                                        Переместить
                                    </button>

                                    <button
                                        onClick={handleBulkDelete}
                                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
                                    >
                                        Удалить
                                    </button>

                                    <button
                                        onClick={clearSelection}
                                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    <Upload size={16} />
                                    {uploading ? 'Загрузка...' : activeAlbumId ? 'Добавить в папку' : 'Добавить фото'}
                                </button>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
                        </div>

                        {loading ? (
                            <div className="text-center text-gray-400 py-20">Загрузка...</div>
                        ) : photos.length === 0 ? (
                            <div className="text-center text-gray-400 py-20">Нет фотографий</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {photos.map((photo, index) => (
                                    <GalleryCard
                                        key={photo.id}
                                        id={photo.id}
                                        title={photo.title}
                                        index={index}
                                        canDelete
                                        selected={selectedIds.has(photo.id)}
                                        selectionMode={selectionMode}
                                        onClick={setActiveIndex}
                                        onDelete={handleDelete}
                                        onSelect={handleSelect}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {activeIndex !== null && (
                <GalleryModal
                    photos={photos}
                    activeIndex={activeIndex}
                    autoplay={autoplay}
                    onClose={closeModal}
                    onPrev={prev}
                    onNext={next}
                    onToggleAutoplay={() => setAutoplay(v => !v)}
                />
            )}
        </div>
    );
}