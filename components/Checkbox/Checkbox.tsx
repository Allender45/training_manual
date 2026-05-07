import React from 'react';

type CheckboxProps = {
    label: string;
    name: string;
    id?: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    variant?: 'checkbox' | 'switch';
    className?: string;
};

export default function Checkbox({
                                     label, name, id, checked, onChange, disabled = false,
                                     variant = 'checkbox', className = '',
                                 }: CheckboxProps) {
    const inputId = id ?? name;

    if (variant === 'switch') {
        return (
            <label
                htmlFor={inputId}
                className={`inline-flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            >
                <div className="relative">
                    <input
                        type="checkbox"
                        id={inputId}
                        name={name}
                        checked={checked}
                        onChange={onChange}
                        disabled={disabled}
                        className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full transition-colors peer-checked:bg-blue-600 peer-disabled:opacity-50" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
                <span className="text-sm text-gray-700">{label}</span>
            </label>
        );
    }

    return (
        <label
            htmlFor={inputId}
            className={`inline-flex items-center gap-2 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            <input
                type="checkbox"
                id={inputId}
                name={name}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );
}