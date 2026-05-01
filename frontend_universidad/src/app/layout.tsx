'use client';

import { useState } from 'react'; // Añadido para el menú móvil
import '@/styles/globals.css';
import { ProvidersWrapper } from '@/components/ProvidersWrapper';
import { Toaster } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserDropdown } from "@/components/auth/UserDropdown/UserDropdown";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from 'lucide-react'; // Iconos para el menú

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isAttendancePage = pathname.startsWith('/asistencia');
  const hideMainSidebar = isAuthPage || isDashboardPage || isAttendancePage || !isAuthenticated || isLoading;

  if (hideMainSidebar) return <div className="min-h-screen dark:bg-gray-900">{children}</div>;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      
      {/* SIDEBAR ESCRITORIO */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 p-6">
        <LogoSection />
        <Navigation pathname={pathname} />
        <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-center">
          <UserDropdown direction="up" />
        </div>
      </aside>

      {/* MENÚ MÓVIL (OVERLAY) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 p-6 shadow-xl animate-in slide-in-from-left">
            <div className="flex justify-end mb-4">
              <button onClick={() => setIsMobileMenuOpen(false)} className="dark:text-white"><X /></button>
            </div>
            <LogoSection />
            <Navigation pathname={pathname} closeMenu={() => setIsMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <main className="flex-1 lg:ml-64 min-h-screen bg-dashboard-universidad bg-fixed bg-cover">
        {/* HEADER MÓVIL */}
        <header className="lg:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md h-16 flex items-center justify-between px-4 sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 dark:text-white">
            <Menu size={24} />
          </button>
          <Image src="/assets/images/logo_circular.png" alt="Logo" width={40} height={40} />
          <UserDropdown direction="down" />
        </header>

        <div className="w-full p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// Sub-componentes para limpiar el código
const LogoSection = () => (
  <Link href="/" className="flex flex-col items-center gap-3 mb-10 group">
    <div className="relative w-16 h-16 md:w-20 md:h-20 shadow-md rounded-full overflow-hidden border-2 border-gray-50 dark:border-gray-800">
      <Image src="/assets/images/logo_circular.png" alt="Logo" fill className="object-contain" />
    </div>
    <div className="text-center">
      <h1 className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Universidad</h1>
      <span className="text-lg font-black text-blue-700 dark:text-blue-400 tracking-tighter uppercase">PuroPollo</span>
    </div>
  </Link>
);

const Navigation = ({ pathname, closeMenu }: any) => (
  <nav className="flex-1 space-y-2">
    {[
      { name: 'INICIO', href: '/' },
      { name: 'BLOG / NOTICIAS', href: '/?tab=blog' },
    ].map((item) => (
      <Link
        key={item.name}
        href={item.href}
        onClick={closeMenu}
        className={`flex items-center px-4 py-3 rounded-xl text-xs font-black tracking-widest transition-all ${
          pathname === item.href ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        {item.name}
      </Link>
    ))}
  </nav>
);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased text-gray-900 dark:text-gray-100">
        <ProvidersWrapper>
          <LayoutContent>{children}</LayoutContent>
        </ProvidersWrapper>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
