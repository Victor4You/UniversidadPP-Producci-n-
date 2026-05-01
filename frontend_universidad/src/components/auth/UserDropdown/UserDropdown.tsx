// src/components/auth/UserDropdown/UserDropdown.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Loader } from '@/components/ui/Loader/Loader';

// Añadimos direction para controlar hacia dónde se abre
interface UserDropdownProps {
  direction?: 'up' | 'down';
}

export function UserDropdown({ direction = 'down' }: UserDropdownProps) {
  const { user, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [settingsSubmenuOpen, setSettingsSubmenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSettingsSubmenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) return <div className="p-2"><Loader size="sm" color="white" /></div>;
  if (!user) return null;

  const memberDate = user.createdAt && !isNaN(Date.parse(user.createdAt))
    ? new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : "Reciente";

  const handleProfileClick = () => {
    const profileId = user.usuario || user.username || user.id;
    if (profileId && profileId !== 'undefined') {
      setIsOpen(false);
      router.push(`/profile/${profileId}`);
    }
  };

  // Clases dinámicas según la dirección
  const dropdownClasses = direction === 'up'
    ? "absolute bottom-[calc(100%+10px)] left-0 origin-bottom-left" // Dashboard (Sube)
    : "absolute top-[calc(100%+10px)] right-0 origin-top-right";   // Inicio (Baja)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100/10 transition-all border border-transparent"
      >
        <Avatar
          src={user.avatar}
          alt={user.nombre || "Usuario"}
          size="sm"
          className="w-8 h-8"
          fallbackLetter={(user.nombre || 'U').charAt(0)}
          bordered
        />
        <div className="hidden sm:block text-left px-1">
          <p className="text-xs font-bold text-gray-800 leading-none dark:text-white">
            {(user.nombre || 'Usuario').split(' ')[0]}
          </p>
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">
            {user.role}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className={`${dropdownClasses} w-64 bg-[#1a1c23] border border-gray-700 rounded-2xl shadow-2xl z-[999] overflow-hidden animate-fadeIn`}>
          <div className="p-5 border-b border-gray-700 bg-[#242731]">
            <div className="flex items-center space-x-4">
              <Avatar
                src={user.avatar}
                size="md"
                className="w-12 h-12 border-2 border-blue-500"
                fallbackLetter={(user.nombre || 'U').charAt(0)}
              />
              <div className="min-w-0">
                <h3 className="font-bold text-white truncate text-sm uppercase">{user.nombre}</h3>
                <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="py-2">
            <button
              onClick={handleProfileClick}
              className={`w-full flex items-center px-5 py-3 text-sm transition-colors ${
                !(user.usuario || user.username || user.id) || (user.usuario === 'undefined')
                ? 'text-gray-600 cursor-not-allowed opacity-50'
                : 'text-gray-300 hover:bg-gray-700'
              }`}
              disabled={!(user.usuario || user.username || user.id) || (user.usuario === 'undefined')}
            >
              <span className="mr-3">👤</span> Mi Perfil
            </button>

            <button
              onClick={() => { router.push('/dashboard'); setIsOpen(false); }}
              className="w-full flex items-center px-5 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <span className="mr-3">📊</span> Dashboard
            </button>

            <div>
              <button
                onClick={(e) => { e.stopPropagation(); setSettingsSubmenuOpen(!settingsSubmenuOpen); }}
                className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-300 hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <span className="mr-3">⚙️</span> Configuración
                </div>
                <span className={`text-[10px] transform transition-transform ${settingsSubmenuOpen ? 'rotate-90' : ''}`}>▶</span>
              </button>

              {settingsSubmenuOpen && (
                <div className="bg-[#111217] py-1 border-l-2 border-blue-500 ml-2">
                  <button onClick={() => { router.push('/settings'); setIsOpen(false); }} className="w-full text-left pl-10 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800">General</button>
                  <button onClick={() => { router.push('/changepass'); setIsOpen(false); }} className="w-full text-left pl-10 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800">Contraseña</button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 my-2"></div>

            <button onClick={logout} className="w-full flex items-center px-5 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-colors font-bold">
              <span className="mr-3">🚪</span> Cerrar Sesión
            </button>
          </div>

          <div className="px-5 py-3 bg-[#111217] border-t border-gray-700">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Miembro desde {memberDate}</p>
          </div>
        </div>
      )}
    </div>
  );
}
