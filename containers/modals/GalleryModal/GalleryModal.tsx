import { useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

type Photo = { id: number; title: string | null; author: string };

type Props = {
    photos: Photo[];
    activeIndex: number;
    autoplay: boolean;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    onToggleAutoplay: () => void;
};

export default function GalleryModal({ photos, activeIndex, autoplay, onClose, onPrev, onNext, onToggleAutoplay }: Props) {
    const autoplayRef = useRef<NodeJS.Timeout | null>(null);
    const photo = photos[activeIndex];

    useEffect(() => {
        if (autoplay) {
            autoplayRef.current = setInterval(onNext, 15000);
        } else {
            if (autoplayRef.current) clearInterval(autoplayRef.current);
        }
        return () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
    }, [autoplay, onNext]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onPrev, onNext, onClose]);

    if (!photo) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>

            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition">
                <X size={28} />
            </button>

            <button
                onClick={e => { e.stopPropagation(); onToggleAutoplay(); }}
                className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    autoplay ? 'bg-blue-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
                {autoplay ? <Pause size={14} /> : <Play size={14} />}
                Авто
            </button>

            <button
                onClick={e => { e.stopPropagation(); onPrev(); }}
                className="absolute left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
            >
                <ChevronLeft size={36} />
            </button>

            <div className="max-w-5xl max-h-[85vh] mx-16" onClick={e => e.stopPropagation()}>
                <img
                    key={photo.id}
                    src={`/api/gallery/image/${photo.id}`}
                    alt={photo.title ?? ''}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
                <div className="text-center mt-3">
                    {photo.title && <p className="text-white font-medium">{photo.title}</p>}
                    <p className="text-white/50 text-sm mt-1">
                        {activeIndex + 1} / {photos.length} · {photo.author}
                    </p>
                </div>
            </div>

            <button
                onClick={e => { e.stopPropagation(); onNext(); }}
                className="absolute right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
            >
                <ChevronRight size={36} />
            </button>
        </div>
    );
}