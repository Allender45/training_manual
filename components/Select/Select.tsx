import React, { useState, useRef, useEffect } from 'react';

export type SelectOption = {
    value: string;
    label: string;
};

type SelectProps = {
    label: string;
    name: string;
    value?: string | string[];
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onMultiChange?: (values: string[]) => void;
    options: SelectOption[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    size?: 'sm' | 'md' | 'lg';
    multiple?: boolean;
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
};

export default function Select({
                                   label, name, value, onChange, onMultiChange, options, placeholder,
                                   required, disabled, error, size = 'md', multiple = false,
                               }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!multiple) return;
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [multiple]);

    if (multiple) {
        const selectedValues = Array.isArray(value) ? value : [];

        function handleToggle(val: string) {
            const next = selectedValues.includes(val)
                ? selectedValues.filter(v => v !== val)
                : [...selectedValues, val];
            onMultiChange?.(next);
        }

        function handleDeselect(val: string) {
            onMultiChange?.(selectedValues.filter(v => v !== val));
        }

        return (
            <div className="relative" ref={containerRef}>
                <label htmlFor={name} className="block text-gray-500 text-sm mb-2">
                    {label}
                </label>
                <div className="relative">
                    <button
                        type="button"
                        id={name}
                        onClick={() => !disabled && setIsOpen(o => !o)}
                        disabled={disabled}
                        className={`w-full border rounded-lg bg-white text-left flex items-start flex-wrap gap-1 pr-8 focus:outline-none focus:ring-2 transition-colors min-h-[36px]
                            ${sizes[size]}
                            ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
                            ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                    >
                        {selectedValues.length === 0 ? (
                            <span className="text-gray-400">{placeholder ?? 'Выберите...'}</span>
                        ) : selectedValues.map(v => {
                            const opt = options.find(o => o.value === v);
                            return (
                                <span key={v} className="inline-flex items-center gap-1 bg-gray-100 rounded px-1.5 py-0.5 text-xs text-gray-700">
                                    {opt?.label ?? v}
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); handleDeselect(v); }}
                                        className="text-gray-400 hover:text-red-500 leading-none"
                                    >
                                        ×
                                    </button>
                                </span>
                            );
                        })}
                    </button>
                    <div className="pointer-events-none absolute right-3 top-3 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {options.map(opt => (
                            <label
                                key={opt.value}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedValues.includes(opt.value)}
                                    onChange={() => handleToggle(opt.value)}
                                    className="w-4 h-4 rounded accent-[#41A141]"
                                />
                                <span className="text-sm text-gray-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                )}
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
        );
    }

    return (
        <div className="relative">
            <label htmlFor={name} className="block text-gray-500 text-sm mb-2">
                {label}
            </label>
            <div className="relative">
                <select
                    id={name}
                    name={name}
                    value={value as string}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    className={`w-full border rounded-lg appearance-none bg-white pr-8 focus:outline-none focus:ring-2 transition-colors
                        disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
                        ${sizes[size]}
                        ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                >
                    {placeholder && (
                        <option value="" disabled>{placeholder}</option>
                    )}
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}