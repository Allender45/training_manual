import { Trash2 } from 'lucide-react';

type Props = {
    id: number;
    title: string | null;
    index: number;
    canDelete?: boolean;
    selected?: boolean;
    selectionMode?: boolean;
    onClick: (index: number) => void;
    onDelete: (id: number) => void;
    onSelect?: (id: number) => void;
};

export default function GalleryCard({ id, title, index, canDelete, selected, selectionMode, onClick, onDelete, onSelect }: Props) {
    function handleCardClick() {
        if (selectionMode) {
            onSelect?.(id);
        } else {
            onClick(index);
        }
    }

    return (
        <div
            className={`group relative aspect-square rounded-xl overflow-hidden bg-gray-200 cursor-pointer ring-2 transition ${
                selected ? 'ring-blue-500' : 'ring-transparent'
            }`}
            onClick={handleCardClick}
        >
            <img
                src={`/api/gallery/image/${id}`}
                alt={title ?? ''}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

            {/* Чекбокс */}
            <button
                onClick={e => { e.stopPropagation(); onSelect?.(id); }}
                className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                    selected
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white/80 border-gray-400 opacity-0 group-hover:opacity-100'
                } ${selectionMode ? 'opacity-100' : ''}`}
            >
                {selected && (
                    <svg viewBox="0 0 10 8" fill="none" className="w-3 h-3">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>

            {canDelete && !selectionMode && (
                <button
                    onClick={e => { e.stopPropagation(); onDelete(id); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                    <Trash2 size={12} />
                </button>
            )}

            {title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{title}</p>
                </div>
            )}
        </div>
    );
}