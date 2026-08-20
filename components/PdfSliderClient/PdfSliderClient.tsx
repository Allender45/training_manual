'use client';

import { useState } from 'react';
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

    if (loadError) {
        return <p className="text-sm text-red-500">Не удалось загрузить презентацию</p>;
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="w-full flex justify-center bg-gray-50 rounded-xl overflow-hidden">
                <Document
                    file={src}
                    onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPage(1); }}
                    onLoadError={() => setLoadError(true)}
                    loading={<div className="py-16 text-sm text-gray-400">Загрузка презентации...</div>}
                >
                    <Page
                        pageNumber={page}
                        width={720}
                        className="max-w-full [&_canvas]:max-w-full [&_canvas]:h-auto"
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </Document>
            </div>

            {numPages && numPages > 1 && (
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Предыдущий слайд"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-gray-500 tabular-nums">
                        Слайд {page} из {numPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(numPages, p + 1))}
                        disabled={page >= numPages}
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