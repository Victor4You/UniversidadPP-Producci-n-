'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation'; // 1. Importamos el hook para detectar la ruta
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({
  children,
  title = 'Dashboard',
  description = 'Gestiona tu plataforma educativa',
}: DashboardLayoutProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 2. Detectamos la ruta actual
  const pathname = usePathname();
  
  // 3. Definimos si estamos en la raíz del dashboard
  // Si tu ruta de inicio es exactamente "/dashboard", usamos esa condición
  const isDashboardHome = pathname === '/dashboard';

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex bg-transparent">
      {/* Overlay para móviles */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar
          openMenu={openMenu}
          onMenuToggle={setOpenMenu}
        />
      </aside>

      {/* Área de contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header móvil */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          {/* Título móvil condicional */}
          {isDashboardHome && (
            <h1 className="text-lg font-bold text-gray-800 dark:text-white truncate px-2">{title}</h1>
          )}
          <div className="w-10"></div>
        </header>
        
        {/* Contenido con scroll independiente */} 
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 scrollbar-thin"> 
          
          {/* 4. Título Desktop CONDICIONAL: Solo se muestra si es el inicio */}
          {isDashboardHome && (
            <div className="hidden lg:block mb-8 animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {title}
              </h1>
              {description && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 max-w-3xl">{description}</p>
              )}
            </div>
          )}

          {/* Contenedor de las páginas hijas */} 
          <div className="container-wide animate-slide-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
