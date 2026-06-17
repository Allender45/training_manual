import React from 'react';

import {Pencil, Trash2, Eye, Play, Sparkles, Loader2} from 'lucide-react';

export type Column<T> = {
    key: string;
    header: string;
    render?: (row: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
};

type TableProps<T extends Record<string, any>> = {
    columns: Column<T>[];
    data: T[];
    keyField: keyof T;
    emptyText?: string;
    buttonEdit?: boolean;
    buttonDel?: boolean;
    buttonDetail?: boolean;
    buttonPlay?: boolean;
    buttonAnalyze?: boolean | ((row: T) => boolean);
    buttonViewAnalysis?: boolean;
    onPlay?: (row: T) => void;
    onAnalyze?: (row: T) => void;
    onViewAnalysis?: (row: T) => void;
    isAnalysing?: (row: T) => boolean;
    hasAnalysis?: (row: T) => boolean;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    extraActions?: (row: T) => React.ReactNode;
};

export default function Table<T extends Record<string, any>>({
                                                                 columns, data, keyField, emptyText = 'Нет данных',
                                                                 buttonEdit, buttonDel, buttonDetail, onEdit, onDelete,
                                                                 buttonPlay, buttonAnalyze, buttonViewAnalysis,
                                                                 onPlay, onAnalyze, onViewAnalysis,
                                                                 isAnalysing, hasAnalysis, extraActions,
                                                             }: TableProps<T>) {
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                    {columns.map(col => (
                        <th key={col.key}
                            className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide ${col.headerClassName ?? ''}`}>
                            {col.header}
                        </th>
                    ))}
                    {(buttonEdit || buttonDel || buttonPlay || buttonAnalyze || buttonViewAnalysis || extraActions) && <th className="px-4 py-3"/>}
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">
                            {emptyText}
                        </td>
                    </tr>
                ) : (
                    data.map(row => (
                            <tr key={String(row[keyField])} className="bg-white hover:bg-gray-50 transition-colors">
                                {columns.map(col => (
                                    <td key={col.key} className={`px-4 py-3 text-gray-700 ${col.className ?? ''}`}>
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                                {(buttonEdit || buttonDel || buttonDetail || buttonPlay || buttonAnalyze || buttonViewAnalysis) && (
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            {buttonEdit && (
                                                <button
                                                    className="p-1.5 rounded-lg text-white bg-[#41A141] transition-colors"
                                                    onClick={() => onEdit?.(row)}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            )}
                                            {buttonDel && (
                                                <button
                                                    className="p-1.5 rounded-lg text-white bg-red-600 transition-colors"
                                                    onClick={() => onDelete?.(row)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            {buttonDetail && (
                                                <button
                                                    className="p-1.5 rounded-lg text-white bg-blue-500 transition-colors"
                                                    onClick={() => onEdit?.(row)}
                                                >
                                                    <Eye  size={14} />
                                                </button>
                                            )}
                                            {buttonPlay && (
                                                <button className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                        onClick={() => onPlay?.(row)} title="Воспроизвести">
                                                    <Play size={14} />
                                                </button>
                                            )}
                                            {(typeof buttonAnalyze === 'function' ? buttonAnalyze(row) : buttonAnalyze) && (
                                                <button className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50"
                                                        disabled={isAnalysing?.(row)}
                                                        onClick={() => onAnalyze?.(row)} title="Анализировать">
                                                    {isAnalysing?.(row)
                                                        ? <Loader2 size={14} className="animate-spin" />
                                                        : <Sparkles size={14} />}
                                                </button>
                                            )}
                                            {buttonViewAnalysis && hasAnalysis?.(row) && (
                                                <button className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"
                                                        onClick={() => onViewAnalysis?.(row)} title="Просмотр анализа">
                                                    <Eye size={14} />
                                                </button>
                                            )}
                                            {extraActions && (
                                                <>{extraActions(row)}</>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        )
                    )
                )}
                </tbody>
            </table>
        </div>
    );
}