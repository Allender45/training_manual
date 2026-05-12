'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Table, Checkbox, Button, Select } from '@/components';
import { Column } from '@/components/Table/Table';
import { Settings, ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';
import Modal from '../Modal/Modal';
import { useRouter } from 'next/navigation';

export type UserRow = {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    active: boolean;
    photo: string | null;
};

type UsersTableProps = {
    data: UserRow[];
    onEdit?: (row: UserRow) => void;
    onDelete?: (row: UserRow) => void;
};

function getPageNumbers(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function UsersTable({ data, onEdit, onDelete }: UsersTableProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [colVisibility, setColVisibility] = useState({
        email:  true,
        phone:  true,
        role:   true,
        active: true,
    });
    const [showSearch, setShowSearch] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<string[]>([]);
    const [filterActive, setFilterActive] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const router = useRouter();

    const roleOptions = useMemo(
        () => [...new Set(data.map(r => r.role).filter(Boolean))].sort(),
        [data]
    );

    const filteredData = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return data.filter(row => {
            if (q && ![row.name, row.email, row.phone].some(f => f.toLowerCase().includes(q))) return false;
            if (filterRole.length > 0 && !filterRole.includes(row.role)) return false;
            if (filterActive === 'active' && !row.active) return false;
            if (filterActive === 'inactive' && row.active) return false;
            return true;
        });
    }, [data, searchQuery, filterRole, filterActive]);

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const showPagination = totalPages > 1;
    const pageData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const hasActiveFilters = !!(searchQuery || filterRole.length > 0 || filterActive);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredData.length, pageSize]);

    function resetFilters() {
        setSearchQuery('');
        setFilterRole([]);
        setFilterActive('');
    }

    function toggleCol(e: React.ChangeEvent<HTMLInputElement>) {
        setColVisibility(prev => ({ ...prev, [e.target.name]: e.target.checked }));
    }

    const allColumns: Column<UserRow>[] = [
        {
            key: 'name', header: 'Имя',
            render: (row) => (
                <div className="flex items-center gap-2">
                    {row.photo ? (
                        <img src={row.photo} alt={row.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-[#41A141] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {row.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                    )}
                    <span>{row.name}</span>
                </div>
            ),
        },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Телефон' },
        { key: 'role',  header: 'Роль' },
        {
            key: 'active', header: 'Статус',
            render: (row) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    row.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                    {row.active ? 'Активен' : 'Неактивен'}
                </span>
            ),
        },
    ];

    const columns = allColumns.filter(col =>
        col.key === 'name' || colVisibility[col.key as keyof typeof colVisibility]
    );

    const pageNumbers = getPageNumbers(currentPage, totalPages);

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-gray-800">Пользователи</h3>
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 transition-colors"
                    >
                        <Settings size={18} />
                    </button>
                </div>
                <Button size="sm" onClick={() => router.push('/users/new')}>
                    <Plus size={14} className="mr-1" />
                    Добавить пользователя
                </Button>
            </div>

            {showSearch && (
                <div className="relative mb-3">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Поиск по ФИО, телефону, email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}

            {showFilters && (
                <div className="flex items-start gap-3 mb-4 flex-wrap">
                    <Select
                        label="Роль"
                        name="filterRole"
                        value={filterRole}
                        onMultiChange={setFilterRole}
                        options={roleOptions.map(r => ({ value: r, label: r }))}
                        size="sm"
                        multiple={true}
                    />
                    <Select
                        label="Статус"
                        name="filterActive"
                        value={filterActive}
                        onChange={e => setFilterActive(e.target.value)}
                        options={[
                            { value: '', label: 'Все статусы' },
                            { value: 'active', label: 'Активен' },
                            { value: 'inactive', label: 'Неактивен' },
                        ]}
                        size="sm"
                    />
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="self-end mb-1 flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
                        >
                            <X size={14} />
                            Сбросить фильтры
                        </button>
                    )}
                </div>
            )}

            <Table<UserRow>
                columns={columns}
                data={pageData}
                keyField="id"
                emptyText="Пользователи не найдены"
                buttonEdit
                buttonDel
                onEdit={onEdit}
                onDelete={onDelete}
            />

            {showPagination && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-30"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {pageNumbers.map((page, i) => (
                            page === '...'
                                ? <span key={i} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                                : <button
                                    key={i}
                                    onClick={() => setCurrentPage(page as number)}
                                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                                        page === currentPage ? 'bg-[#41A141] text-white' : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                    {page}
                                </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-30"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="flex items-end gap-2 text-sm text-gray-500">
                        <Select
                            label="Страница"
                            name="currentPage"
                            value={String(currentPage)}
                            onChange={e => setCurrentPage(Number(e.target.value))}
                            options={Array.from({ length: totalPages }, (_, i) => ({
                                value: String(i + 1),
                                label: String(i + 1),
                            }))}
                            size="sm"
                        />
                        <span className="mb-2">из {totalPages}</span>
                    </div>
                </div>
            )}

            <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Настройки таблицы">
                <div className="flex flex-col gap-4">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Столбцы</p>
                    <Checkbox label="Email"   name="email"  checked={colVisibility.email}  onChange={toggleCol} variant="switch" />
                    <Checkbox label="Телефон" name="phone"  checked={colVisibility.phone}  onChange={toggleCol} variant="switch" />
                    <Checkbox label="Роль"    name="role"   checked={colVisibility.role}   onChange={toggleCol} variant="switch" />
                    <Checkbox label="Статус"  name="active" checked={colVisibility.active} onChange={toggleCol} variant="switch" />

                    <div className="pt-3 border-t border-gray-100 flex flex-col gap-3">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Показывать</p>
                        <Checkbox label="Строку поиска" name="showSearch"  checked={showSearch}  onChange={e => setShowSearch(e.target.checked)}  variant="switch" />
                        <Checkbox label="Фильтры"       name="showFilters" checked={showFilters} onChange={e => setShowFilters(e.target.checked)} variant="switch" />
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                        <Select
                            label="Записей на странице"
                            name="pageSize"
                            value={String(pageSize)}
                            onChange={e => setPageSize(Number(e.target.value))}
                            options={[
                                { value: '10', label: '10' },
                                { value: '20', label: '20' },
                                { value: '50', label: '50' },
                            ]}
                            size="sm"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}