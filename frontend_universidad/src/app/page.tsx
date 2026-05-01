// src/app/page.tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { Loader } from "@/components/ui/Loader/Loader";
import { Carousel } from "@/components/ui/Carousel/Carousel";
import { ChevronLeft, ChevronRight, BookOpen, Lock as LockIcon } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import LoginView from "@/components/auth/LoginView";
import api from "@/lib/api/axios";
import { useRouter } from "next/navigation";

const FeedSocial = dynamic(() => import("@/components/Feed"), {
  loading: () => <Loader text="Cargando blog..." />,
  ssr: false,
});

// Respaldo para evitar Uncaught ReferenceError
const DEFAULT_HOME_CAROUSEL = [
  { id: '1', src: '/assets/images/baner_inicio.png', alt: 'Banner Home' }
];

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { userRole } = usePermission();

  const [activeTab, setActiveTab] = useState<'home' | 'blog'>('home');
  const [cursos, setCursos] = useState<any[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<{
    mainTitle: string;
    carouselImages: any[];      // Ahora se usará para el Slider Vertical
    blogCarouselImages: any[];  // Ahora se usará para el Slider Grande de Inicio
    staticBannerUrl: string;
  } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/settings/home_config");
        if (res.data) setConfig(res.data);
      } catch (error) {
        console.error("Error cargando configuración:", error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    setActiveTab(tab === 'blog' ? 'blog' : 'home');
  }, [searchParams]);

  const loadCursos = async () => {
    if (!user?.id) return;
    try {
      const endpoint = userRole === "student" ? `/courses/enrolled/${user.id}` : `/courses`;
      const res = await api.get(endpoint);
      const todosLosCursos = Array.isArray(res.data) ? res.data : res.data.courses || [];
      const progressRes = await api.get(`/courses/user-progress?userId=${user.id}`);
      const completadosIds = (Array.isArray(progressRes.data) ? progressRes.data : []).map((id: any) => String(id));

      setCursos(todosLosCursos.map((c: any) => ({
        ...c,
        nombre: c.nombre || c.title || "Curso sin nombre",
        completado: completadosIds.includes(String(c.id)),
      })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (isAuthenticated) loadCursos(); }, [isAuthenticated, user?.id]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader size="lg" /></div>;

  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen w-full flex items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <Image src="/assets/images/banner_inicio_nuevo.png" alt="Fondo" fill priority className="object-cover" />
        </div>
        <LoginView />
      </main>
    );
  }

  return (
<main className="max-w-7xl mx-auto py-4 md:py-8 px-4">
      {activeTab === 'home' ? (
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* SECCIÓN PRINCIPAL: CARRUSEL Y CURSOS */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Carrusel Responsivo */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border-2 md:border-4 border-white dark:border-gray-800 aspect-video md:aspect-auto">
              <Carousel images={config?.blogCarouselImages?.length ? config.blogCarouselImages : DEFAULT_HOME_CAROUSEL} />
            </div>

            {/* Grid de Cursos: 1 col en móvil, 2 en tablet, 3 en desktop pequeño */}
            <section className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 md:p-8 rounded-3xl border border-white/50 dark:border-gray-800 shadow-sm">
              <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-6">
                {config?.mainTitle || "Mis Cursos Activos"}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {cursos.map((curso, index) => {
                  const habilitado = (userRole !== "student") || (index === 0 || !!cursos[index - 1].completado);
                  return (
                    <div 
                      key={curso.id} 
                      className={`group relative bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-5 shadow-sm transition-all hover:shadow-xl ${!habilitado ? "opacity-60 grayscale cursor-not-allowed" : "border-l-4 border-l-blue-600 hover:-translate-y-1"}`}
                    >
                      <h3 className="text-sm md:text-xs font-black text-gray-900 dark:text-white mb-4 h-12 line-clamp-2 uppercase leading-tight">
                        {curso.nombre}
                      </h3>
                      <button 
                        onClick={() => habilitado && router.push("/dashboard/gestion-cursos")} 
                        className={`flex items-center gap-2 font-bold text-xs ${habilitado ? "text-blue-600 dark:text-blue-400 group-hover:underline" : "text-gray-400"}`}
                      >
                        {habilitado ? <BookOpen size={18} /> : <LockIcon size={18} />}
                        {habilitado ? "ENTRAR AHORA" : "CURSO BLOQUEADO"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

        </div>
      ) : (
        /* VISTA DEL BLOG */
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl border border-white/40 dark:border-gray-800">
            <FeedSocial />
          </div>
        </div>
      )}
    </main>
  );
}
export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader size="lg" /></div>}>
      <HomePageContent />
    </Suspense>
  );
}
