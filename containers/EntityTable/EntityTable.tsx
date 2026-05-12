'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Table, Checkbox, Button, Select } from '@/components';
import { Column } from '@/components/Table/Table';
import { Settings, ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';
import Modal from '../Modal/Modal';
import { useRouter } from 'next/navigation';

export type CourseRow = {
    id: number; title: string; icon: string; description: string;
    study_time_minutes: number | null; achievement: string | null;
    is_active: boolean; created_at: string;
};
export type ManualRow = {
    id: number; title: string; description: string | null;
    is_active: boolean; created_at: string;
};
export type TrainingRow = {
    id: number; title: string; description: string | null;
    is_active: boolean; created_at: string;
};
export type TestRow = {
    id: number; title: string; description: string | null;
    pass_score: number | null; is_active: boolean; created_at: string;
};

export type EntityRow = CourseRow | ManualRow | TrainingRow | TestRow;
export type EntityType = 'courses' | 'manuals' | 'trainings' | 'tests';

type ColVisibility = Record<string, boolean>;

type EntityConfig = {
    title: string;
    addHref: string;
    emptyText: string;
    columns: Column<any>[];
    colVisibilityDefaults: ColVisibility;
    colLabels: Record<string, string>;
    searchFields: (row: any) => (string | null | undefined)[];
};

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
            {active ? 'Активен' : 'Неактивен'}
        </span>
    );
}

const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
    courses: {
        title: 'Курсы',
        addHref: '/courses/new',
        emptyText: 'Курсы не найдены',
        searchFields: (row: CourseRow) => [row.title, row.description],
        colVisibilityDefaults: { description: false, study_time_minutes: true, achievement: true, is_active: true },
        colLabels: { description: 'Описание', study_time_minutes: 'Время', achievement: 'Достижение', is_active: 'Статус' },
        columns: [
            {
                key: 'title', header: 'Курс',
                render: (row: CourseRow) => (
                    <div className="flex items-center gap-3">
                        <img src={row.icon} alt={row.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <span className="font-medium text-gray-800">{row.title}</span>
                    </div>
                ),
            },
            { key: 'description', header: 'Описание' },
            {
                key: 'study_time_minutes', header: 'Время',
                render: (row: CourseRow) => row.study_time_minutes
                    ? <span className="text-sm text-gray-600">{row.study_time_minutes} мин</span>
                    : <span className="text-gray-400 text-sm">—</span>,
            },
            {
                key: 'achievement', header: 'Достижение',
                render: (row: CourseRow) => row.achievement
                    ? <span className="text-sm text-gray-700">🏆 {row.achievement}</span>
                    : <span className="text-gray-400 text-sm">—</span>,
            },
            {
                key: 'is_active', header: 'Статус',
                render: (row: CourseRow) => <StatusBadge active={row.is_active} />,
            },
        ],
    },
    manuals: {
        title: 'Материалы',
        addHref: '/manuals/new',
        emptyText: 'Материалы не найдены',
        searchFields: (row: ManualRow) => [row.title, row.description],
        colVisibilityDefaults: { description: true, is_active: true },
        colLabels: { description: 'Описание', is_active: 'Статус' },
        columns: [
            {
                key: 'title', header: 'Материал',
                render: (row: ManualRow) => <span className="font-medium text-gray-800">{row.title}</span>,
            },
            {
                key: 'description', header: 'Описание',
                render: (row: ManualRow) => row.description
                    ? <span className="text-sm text-gray-600 line-clamp-2">{row.description}</span>
                    : <span className="text-gray-400 text-sm">—</span>,
            },
            {
                key: 'is_active', header: 'Статус',
                render: (row: ManualRow) => <StatusBadge active={row.is_active} />,
            },
        ],
    },
    trainings: {
        title: 'Тренинги',
        addHref: '/trainings/new',
        emptyText: 'Тренинги не найдены',
        searchFields: (row: TrainingRow) => [row.title, row.description],
        colVisibilityDefaults: { description: true, is_active: true },
        colLabels: { description: 'Описание', is_active: 'Статус' },
        columns: [
            {
                key: 'title', header: 'Тренинг',
                render: (row: TrainingRow) => <span className="font-medium text-gray-800">{row.title}</span>,
            },
            {
                key: 'description', header: 'Описание',
                render: (row: TrainingRow) => row.description
                    ? <span className="text-sm text-gray-600 line-clamp-2">{row.description}</span>
                    : <span className="text-gray-400 text-sm">—</span>,
            },
            {
                key: 'is_active', header: 'Статус',
                render: (row: TrainingRow) => <StatusBadge active={row.is_active} />,
            },
        ],
    },
    tests: {
        title: 'Тесты',
        addHref: '/tests/new',
        emptyText: 'Тесты не найдены',
        searchFields: (row: TestRow) => [row.title, row.description],
        colVisibilityDefaults: { description: true, pass_score: true, is_active: true },
        colLabels: { description: 'Описание', pass_score: 'Проходной балл', is_active: 'Статус' },
        columns: [
            {
                key: 'title', header: 'Тест',
                render: (row: TestRow) => <span className="font-medium text-gray-800">{row.title}</span>,
            },
            {
                key: 'description', header: 'Описание',
                render: (row: TestRow) => row.description
                    ? <span className="text-sm text-gray-600 line-clamp-2">{row.description}</span>
                    : <span className="text-gray-400 text-sm">—</span>,
            },
            {
                key: 'pass_score', header: 'Проходной балл',
                render: (row: TestRow) => row.pass_score != null
                    ? <span className="text-sm text-gray-600">{row.pass_score}%</span>
                    : <span className="text-gray-400 text-sm">—</span>,
            },
            {
                key: 'is_active', header: 'Статус',
                render: (row: TestRow) => <StatusBadge active={row.is_active} />,
            },
        ],
    },
};

function getPageNumbers(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
}

type EntityTableProps = {
    entityType: EntityType;
    data: EntityRow[];
    onEdit?: (row: EntityRow) => void;
    onDelete?: (row: EntityRow) => void;
};

export default function EntityTable({ entityType, data, onEdit, onDelete }: EntityTableProps) {
    const config = ENTITY_CONFIGS[entityType];

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [colVisibility, setColVisibility] = useState<ColVisibility>(config.colVisibilityDefaults);
    const [showSearch, setShowSearch] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterActive, setFilterActive] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const router = useRouter();

    useEffect(() => {
        setColVisibility(config.colVisibilityDefaults);
        setSearchQuery('');
        setFilterActive('');
        setCurrentPage(1);
    }, [entityType]);

    const filteredData = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return data.filter(row => {
            if (q && !config.searchFields(row).some(f => f?.toLowerCase().includes(q))) return false;
            if (filterActive === 'active' && !row.is_active) return false;
            if (filterActive === 'inactive' && row.is_active) return false;
            return true;
        });
    }, [data, searchQuery, filterActive, config]);

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const showPagination = totalPages > 1;
    const pageData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const hasActiveFilters = !!(searchQuery || filterActive);

    useEffect(() => { setCurrentPage(1); }, [filteredData.length, pageSize]);

    function resetFilters() { setSearchQuery(''); setFilterActive(''); }
    function toggleCol(e: React.ChangeEvent<HTMLInputElement>) {
        setColVisibility(prev => ({ ...prev, [e.target.name]: e.target.checked }));
    }

    const columns = config.columns.filter(col => col.key === 'title' || colVisibility[col.key]);
    const pageNumbers = getPageNumbers(currentPage, totalPages);

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-gray-800">{config.title}</h3>
                    <button onClick={() => setSettingsOpen(true)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 transition-colors">
                        <Settings size={18} />
                    </button>
                </div>
                <Button size="sm" onClick={() => router.push(config.addHref)}>
                    <Plus size={14} className="mr-1" />
                    Добавить
                </Button>
            </div>

            {showSearch && (
                <div className="relative mb-3">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}

            {showFilters && (
                <div className="flex items-start gap-3 mb-4 flex-wrap">
                    <Select
                        label="Статус" name="filterActive" value={filterActive}
                        onChange={e => setFilterActive(e.target.value)}
                        options={[
                            { value: '', label: 'Все статусы' },
                            { value: 'active', label: 'Активен' },
                            { value: 'inactive', label: 'Неактивен' },
                        ]}
                        size="sm"
                    />
                    {hasActiveFilters && (
                        <button onClick={resetFilters} className="self-end mb-1 flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors">
                            <X size={14} /> Сбросить фильтры
                        </button>
                    )}
                </div>
            )}

            <Table<any>
                columns={columns} data={pageData} keyField="id"
                emptyText={config.emptyText} buttonEdit buttonDel
                onEdit={onEdit} onDelete={onDelete}
            />

            {showPagination && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-30">
                            <ChevronLeft size={16} />
                        </button>
                        {pageNumbers.map((page, i) => (
                            page === '...'
                                ? <span key={i} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                                : <button key={i} onClick={() => setCurrentPage(page as number)}
                                          className={`w-8 h-8 rounded-lg text-sm transition-colors ${page === currentPage ? 'bg-[#41A141] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    {page}
                                </button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-30">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="flex items-end gap-2 text-sm text-gray-500">
                        <Select
                            label="Страница" name="currentPage" value={String(currentPage)}
                            onChange={e => setCurrentPage(Number(e.target.value))}
                            options={Array.from({ length: totalPages }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                            size="sm"
                        />
                        <span className="mb-2">из {totalPages}</span>
                    </div>
                </div>
            )}

            <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Настройки таблицы">
                <div className="flex flex-col gap-4">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Столбцы</p>
                    {Object.entries(config.colLabels).map(([key, label]) => (
                        <Checkbox key={key} label={label} name={key} checked={!!colVisibility[key]} onChange={toggleCol} variant="switch" />
                    ))}
                    <div className="pt-3 border-t border-gray-100 flex flex-col gap-3">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Показывать</p>
                        <Checkbox label="Строку поиска" name="showSearch"  checked={showSearch}  onChange={e => setShowSearch(e.target.checked)}  variant="switch" />
                        <Checkbox label="Фильтры"       name="showFilters" checked={showFilters} onChange={e => setShowFilters(e.target.checked)} variant="switch" />
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                        <Select
                            label="Записей на странице" name="pageSize" value={String(pageSize)}
                            onChange={e => setPageSize(Number(e.target.value))}
                            options={[{ value: '10', label: '10' }, { value: '20', label: '20' }, { value: '50', label: '50' }]}
                            size="sm"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}