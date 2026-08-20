'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

type PdfSliderProps = {
    src: string;
};

export default function PdfSliderClient({ src }: PdfSliderProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [loadError, setLoadError] = useState(false);
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
    const [aspectRatio, setAspectRatio] = useState<number | null>(null); // width / height рамки
    const [pageDims, setPageDims] = useState<{ width: number; height: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const swipeStartX = useRef<number | null>(null);
    const SWIPE_THRESHOLD = 50;
    const [direction, setDirection] = useState<1 | -1>(1);

    function goTo(delta: 1 | -1) {
        if (!numPages) return;
        const next = Math.min(numPages, Math.max(1, page + delta));
        if (next === page) return;
        setDirection(delta);
        setPage(next);
    }

    function handlePointerDown(e: React.PointerEvent) {
        swipeStartX.current = e.clientX;
    }

    function handlePointerUp(e: React.PointerEvent) {
        if (swipeStartX.current === null) return;
        const delta = e.clientX - swipeStartX.current;
        swipeStartX.current = null;
        if (Math.abs(delta) < SWIPE_THRESHOLD) return;
        goTo(delta < 0 ? 1 : -1);
    }

    function handlePointerCancel() {
        swipeStartX.current = null;
    }

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setContainerSize({ width, height });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    function handlePageLoad(pdfPage: any) {
        // Оригинальные размеры текущей страницы в пунктах PDF
        const viewport = pdfPage.getViewport({ scale: 1 });
        const dims = { width: viewport.width, height: viewport.height };
        setPageDims(dims);
        // Пропорции рамки фиксируем по первой загруженной странице
        setAspectRatio(prev => prev ?? dims.width / dims.height);
    }

    if (loadError) {
        return <p className="text-sm text-red-500">Не удалось загрузить презентацию</p>;
    }

    // object-fit: contain — ограничение по стороне, ближайшей к границе рамки
    const pageProps =
        containerSize && pageDims && aspectRatio && containerSize.height > 0
            ? { scale: Math.min(containerSize.width / pageDims.width, containerSize.height / pageDims.height) }
            : containerSize
                ? { width: containerSize.width } // первичная отрисовка, пока неизвестны пропорции
                : {};

    return (
        <div className="flex flex-col items-center gap-3">
            <div
                ref={containerRef}
                className="w-full flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden select-none"
                style={{
                    aspectRatio: aspectRatio ? String(aspectRatio) : undefined,
                    maxHeight: '80vh',
                    touchAction: 'pan-y',
                }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onPointerLeave={handlePointerCancel}
            >
                <Document
                    file={src}
                    onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPage(1); }}
                    onLoadError={() => setLoadError(true)}
                    loading={<div className="py-16 text-sm text-gray-400">Загрузка презентации...</div>}
                >
                    {containerSize && (
                        <div key={page} className={direction === 1 ? 'pdf-slide-next' : 'pdf-slide-prev'}>
                            <Page
                                pageNumber={page}
                                onLoadSuccess={handlePageLoad}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                {...pageProps}
                            />
                        </div>
                    )}
                </Document>
            </div>

            {numPages && numPages > 1 && (
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => goTo(-1)} disabled={page <= 1}
                        className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Предыдущий слайд"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-gray-500 tabular-nums">
                        Слайд {page} из {numPages}
                    </span>
                    <button
                        onClick={() => goTo(1)} disabled={page >= numPages}
                        className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Следующий слайд"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}