import React from 'react';

type AvatarProps = {
    src?: string | null;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    fallback?: string; // текст для заглушки (например, инициалы)
    color?: string; // классы фона и текста заглушки с инициалами
};

const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-16 h-16',
    xl: 'w-28 h-28',
};

const fallbackTextSizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-3xl',
};

export default function Avatar({
                                   src,
                                   alt = 'Avatar',
                                   size = 'md',
                                   className = '',
                                   fallback,
                                   color = 'bg-blue-600 text-white'
                               }: AvatarProps) {
    const sizeClass = sizes[size];

    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                className={`${sizeClass} rounded-full object-cover border ${className}`}
            />
        );
    }

    // Заглушка с инициалами
    if (fallback != null) {
        return (
            <div
                className={`${sizeClass} rounded-full ${color} flex items-center justify-center ${fallbackTextSizes[size]} ${className}`}>
                {fallback.slice(0, 2).toUpperCase()}
            </div>
        );
    }

    // Заглушка с иконкой пользователя
    return (
        <div className={`
      ${sizeClass} 
      rounded-full 
      bg-gray-100 
      border 
      flex 
      items-center 
      justify-center 
      text-gray-400
      ${className}
    `}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
            </svg>
        </div>
    );
}
