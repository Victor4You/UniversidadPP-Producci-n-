// src/components/ui/Avatar/Avatar.tsx
'use client';

import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | string;
  className?: string;
  bordered?: boolean;
  fallbackLetter?: string;
}

const Avatar = ({ src, alt, size = 'md', className = '', bordered }: AvatarProps) => {
  const sizeClasses: Record<string, string> = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const appliedSize = sizeClasses[size] || size;

  // Validar si src es una ruta válida
  const hasImage = src && src.trim() !== "";

  return (
    <div
      className={`
        ${appliedSize}
        rounded-full
        overflow-hidden
        shrink-0
        bg-gray-200
        flex items-center
        justify-center
        ${bordered ? 'border-2 border-blue-500 p-0.5' : ''}
        ${className}
      `}
    >
      {hasImage ? (
        <div className="relative w-full h-full">
          <img
            src={src} 
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Si la imagen falla (ej. ruta mal escrita), mostramos el fallback
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <span className="text-gray-600 text-sm font-black uppercase">
          {alt ? alt.charAt(0) : 'U'}
        </span>
      )}
    </div>
  );
};

export { Avatar };
