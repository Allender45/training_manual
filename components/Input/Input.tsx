import React from 'react';

function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 0) return '';
    let d = digits.startsWith('7') ? digits : '7' + digits;
    d = d.slice(0, 11);
    let formatted = '+' + d[0];
    if (d.length > 1) {
        formatted += ' (' + d.slice(1, Math.min(4, d.length));
        if (d.length >= 4) formatted += ')';
        if (d.length > 4) formatted += ' ' + d.slice(4, Math.min(7, d.length));
    }
    if (d.length > 7) formatted += '-' + d.slice(7, Math.min(9, d.length));
    if (d.length > 9) formatted += '-' + d.slice(9, 11);
    return formatted;
}

type InputProps = {
    label: string;
    name: string;
    type?: 'text' | 'email' | 'tel' | 'password';
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    placeholder?: string;
    maxLength?: number;
    minLength?: number;
    icon?: 'user' | 'email' | 'phone' | 'lock';
    error?: string;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

const icons = {
    user: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    email: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    phone: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    ),
    lock: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    ),
};

export default function Input({ label, name, type = 'text', value, onChange, required, placeholder, maxLength, minLength, icon, error, onFocus, onBlur }: InputProps) {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (type === 'tel') {
            const formatted = formatPhone(e.target.value);
            onChange({ target: { name: e.target.name, value: formatted } } as React.ChangeEvent<HTMLInputElement>);
        } else {
            onChange(e);
        }
    }

    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
        if (type === 'tel' && !value) {
            onChange({ target: { name: e.target.name, value: '+7' } } as React.ChangeEvent<HTMLInputElement>);
        }
        onFocus?.(e);
    }

    return (
        <div className="relative">
            <label htmlFor={name} className="block text-gray-500 text-sm mb-2">
                {label}
            </label>
            <div className="relative">
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={onBlur}
                    required={required}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    minLength={minLength}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${
                        error
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                    }`}
                />
                {icon && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {icons[icon]}
                    </div>
                )}
            </div>
            {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
        </div>
    );
}