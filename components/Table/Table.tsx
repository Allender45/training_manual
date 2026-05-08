import React from 'react';

import {Pencil, Trash2} from 'lucide-react';

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
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
};

export default function Table<T extends Record<string, any>>({
                                                                 columns, data, keyField, emptyText = 'Нет данных',
                                                                 buttonEdit, buttonDel, onEdit, onDelete,
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
                    {(buttonEdit || buttonDel) && <th className="px-4 py-3"/>}
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
                                {(buttonEdit || buttonDel) && (
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