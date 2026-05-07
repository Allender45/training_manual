import React from 'react';

export type SelectOption = {
    value: string;
    label: string;
};

type SelectProps = {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: SelectOption[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    size?: 'sm' | 'md' | 'lg';
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
};

export default function Select({
                                   label, name, value, onChange, options, placeholder,
                                   required, disabled, error, size = 'md',
                               }: SelectProps) {
    return (
        <div className="relative">
            <label htmlFor={name} className="block text-gray-500 text-sm mb-2">
                {label}
            </label>
            <div className="relative">
                <select
                    id={name}
                    name={name}
                    value={value}
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