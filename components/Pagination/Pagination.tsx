'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Select from '../Select/Select';
import { getPageNumbers } from '@/lib/pagination';

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onChange: (page: number) => void;
};

export default function Pagination({ currentPage, totalPages, onChange }: PaginationProps) {
    const pageNumbers = getPageNumbers(currentPage, totalPages);

    return (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-30"
                >
                    <ChevronLeft size={16}/>
                </button>
                {pageNumbers.map((page, i) => (
                    page === '...'
                        ? <span key={i}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                        : <button
                            key={i}
                            onClick={() => onChange(page as number)}
                            className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                                page === currentPage ? 'bg-[#41A141] text-white' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {page}
                        </button>
                ))}
                <button
                    onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-30"
                >
                    <ChevronRight size={16}/>
                </button>
            </div>
            <div className="flex items-end gap-2 text-sm text-gray-500">
                <Select
                    label="Страница"
                    name="currentPage"
                    value={String(currentPage)}
                    onChange={e => onChange(Number(e.target.value))}
                    options={Array.from({length: totalPages}, (_, i) => ({
                        value: String(i + 1),
                        label: String(i + 1),
                    }))}
                    size="sm"
                />
                <span className="mb-2">из {totalPages}</span>
            </div>
        </div>
    );
}
