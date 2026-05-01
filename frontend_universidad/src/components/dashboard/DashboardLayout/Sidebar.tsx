// src/components/dashboard/DashboardLayout/Sidebar.tsx

// =============================================

// BARRA LATERAL DEL DASHBOARD (ACTUALIZADO RESPONSIVO)

// =============================================



'use client';



import React, { useState, useEffect } from 'react';

import { Avatar } from '@/components/ui/Avatar/Avatar';

import { useAuth } from '@/hooks/useAuth';

import { usePermission } from '@/hooks/usePermission';

import { UserDropdown } from '@/components/auth/UserDropdown/UserDropdown';

import Link from 'next/link';

import { usePathname, useRouter } from 'next/navigation';



/**

 * Props para el componente Sidebar

 */

interface SidebarProps {

  /** Función para cambiar el menú abierto */

  onMenuToggle: (menuName: string | null) => void;

  /** Menú actualmente abierto */

  openMenu: string | null;

}



/**

 * Componente Sidebar para el dashboard

 * Muestra navegación basada en roles y permisos

 *

 * @component

 */

export function Sidebar({ onMenuToggle, openMenu }: SidebarProps) {

  const { user } = useAuth();

  const { canView } = usePermission();

  const pathname = usePathname();

  const router = useRouter();



  // =============================================

  // FUNCIONES AUXILIARES

  // =============================================

  const handleMenuClick = (menuName: string) => {

    onMenuToggle(openMenu === menuName ? null : menuName);

  };



  const isMenuOpen = (menuName: string) => {

    return openMenu === menuName || (openMenu && openMenu.startsWith(`${menuName}.`));

  };



  const isActive = (route: string) => {

    return pathname === route || pathname?.startsWith(route + '/');

  };



  // Cerrar sidebar en móvil al navegar

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {

    // Solo cerrar en móvil

    if (window.innerWidth < 1024) {

      e.preventDefault();

      router.push(href);

      // El sidebar se cerrará por el efecto en DashboardLayout

    }

  };



  // =============================================

  // RENDERIZADO

  // =============================================

  return (

<div className="h-full flex flex-col bg-gray-900 text-white overflow-hidden border-r border-gray-800">
      {/* Encabezado del Sidebar */}
      <div className="flex items-center space-x-3 p-5 border-b border-gray-800">
        <div className="ring-2 ring-blue-500/30 rounded-full p-0.5">
          <Avatar
            src={user?.avatar || null}
            alt={user?.name || 'Usuario'}
            size="md"
            fallbackLetter={user?.name?.charAt(0) || 'U'}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate leading-tight text-white">Universidad</h2>
          <p className="text-xs text-blue-400 font-medium uppercase tracking-wider truncate">
            {user?.role}
          </p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
        {/* Inicio */}
        <Link
          href="/dashboard"
          onClick={(e) => handleNavigation(e, '/dashboard')}
          className={`flex items-center py-2.5 px-4 rounded-xl transition-all duration-200 ${
            isActive('/dashboard') 
              ? 'bg-blue-600 shadow-lg shadow-blue-900/20 text-white' 
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="font-medium">Inicio</span>
        </Link>

        {/* Gestión de cursos */}
        <Link
          href="/dashboard/gestion-cursos"
          onClick={(e) => handleNavigation(e, '/dashboard/gestion-cursos')}
          className={`flex items-center py-2.5 px-4 rounded-xl transition-all duration-200 ${
            isActive('/dashboard/gestion-cursos')
              ? 'bg-blue-600 shadow-lg shadow-blue-900/20 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="font-medium">Gestión de cursos</span>
        </Link>

        {/* Administración - Con submenús */}
        <div className="space-y-1">
          <button
            onClick={() => handleMenuClick('administracion')}
            className={`w-full flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-200 ${
              isMenuOpen('administracion') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Administración</span>
            </div>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen('administracion') ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isMenuOpen('administracion') && (
            <div className="ml-9 space-y-1 border-l-2 border-gray-700 pl-4 animate-fade-in">
              {['instructores', 'grupos', 'convocatorias'].map((item) => (
                <Link
                  key={item}
                  href={`/dashboard/${item}`}
                  onClick={(e) => handleNavigation(e, `/dashboard/${item}`)}
                  className={`block py-2 text-sm capitalize transition-colors ${
                    isActive(`/dashboard/${item}`) ? 'text-blue-400 font-bold' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {item}
                </Link>
              ))}

              {/* Submenú Reportes */}
              {canView(['admin', 'teacher']) && (
                <div className="pt-2">
                  <button
                    onClick={() => handleMenuClick('administracion.reportes')}
                    className="w-full flex items-center justify-between py-2 text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    <span>Reportes</span>
                    <svg 
                      className={`w-3 h-3 transition-transform ${isMenuOpen('administracion.reportes') ? 'rotate-180' : ''}`} 
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isMenuOpen('administracion.reportes') && (
                    <div className="mt-1 space-y-1 border-l border-gray-800 pl-4 animate-fade-in">
                      {[
                        { h: 'generacion-indicadores', t: 'Indicadores' },
                        { h: 'aniversarios', t: 'Aniversarios' },
                        { h: 'exportacion-datos', t: 'Exportar Datos' }
                      ].map((rep) => (
                        <Link
                          key={rep.h}
                          href={`/dashboard/reportes/${rep.h}`}
                          onClick={(e) => handleNavigation(e, `/dashboard/reportes/${rep.h}`)}
                          className={`block py-1.5 text-xs transition-colors ${
                            isActive(`/dashboard/reportes/${rep.h}`) ? 'text-blue-300 font-medium' : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          {rep.t}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-4 bg-gray-950/50 border-t border-gray-800">
        <UserDropdown direction="up" />
        <Link
          href="/"
          className="mt-4 flex items-center justify-center py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition-all group"
        >
          <svg className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          Volver al Feed
        </Link>
      </div>
    </div>
  );
}
