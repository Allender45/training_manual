import React from 'react';

type AvatarProps = {
    src?: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    fallback?: string; // текст для заглушки (например, инициалы)
};

const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
};

export default function Avatar({
                                   src,
                                   alt = 'Avatar',
                                   size = 'md',
                                   className = '',
                                   fallback
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

    // Заглушка с иконкой пользователя или инициалами
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
            {fallback ? (
                <span className="text-sm font-medium">
          {fallback.slice(0, 2).toUpperCase()}
        </span>
            ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                </svg>
            )}
        </div>
    );
}