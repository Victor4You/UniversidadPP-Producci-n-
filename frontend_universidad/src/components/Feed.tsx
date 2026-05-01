"use client";
import { usePosts } from "@/hooks/usePosts";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import CreatePost from "@/components/posts/CreatePost/CreatePost";
import PostCard from "@/components/posts/PostCard/PostCard";
import { Carousel } from "@/components/ui/Carousel/Carousel";
import api from "@/lib/api/axios";
import { ImageIcon } from "lucide-react";

const DEFAULT_CAROUSEL_IMAGES = [
  {
    id: "1",
    src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    alt: "Campus universitario",
    title: "Bienvenidos",
    description: "Plataforma educativa de excelencia",
  }
];

const DEFAULT_CONFIG = {
  mainTitle: "Feed Universitario",
  carouselImages: DEFAULT_CAROUSEL_IMAGES,
  staticBannerUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
};

export default function Feed() {
  const { user, isAuthenticated } = useAuth();
  const { isRole } = usePermission();
  const { posts, addPost, likePost, commentOnPost, sharePost, voteOnPoll, isLoading, refetch } = usePosts();

  const [isMobile, setIsMobile] = useState(false);
  const [homeConfig, setHomeConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await api.get("/settings/home_config");
        if (res.data) {
          setHomeConfig({
            mainTitle: res.data.mainTitle || DEFAULT_CONFIG.mainTitle,
            carouselImages: res.data.carouselImages?.length ? res.data.carouselImages : DEFAULT_CONFIG.carouselImages,
            staticBannerUrl: res.data.staticBannerUrl || DEFAULT_CONFIG.staticBannerUrl
          });
        }
      } catch (error) {
        console.error("Error cargando configuración:", error);
      }
    };

    if (isAuthenticated) {
      loadConfig();
      refetch();
    }

    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [isAuthenticated, user?.id]);

  return (
    <div className="min-h-screen">
      <div className={`${isMobile ? "p-3" : "mx-auto p-0 lg:p-2"}`}>
        {!isMobile && (
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              {homeConfig.mainTitle}
            </h1>
            <p className="text-gray-500 mt-1">
              Sesión iniciada como <span className="font-semibold text-blue-600">{user?.name}</span>
            </p>
          </div>
        )}

        {/* CONTENEDOR PRINCIPAL DE COLUMNAS (Faltaba esta línea) */}
        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1550px] mx-auto">
          
          {/* 1. BANNER IZQUIERDO */}
          <div className="hidden lg:block lg:w-1/5">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden h-[600px] border border-gray-100">
              <img
                src={homeConfig.staticBannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 2. COLUMNA CENTRAL */}
          <div className="flex-1 lg:w-3/5 min-w-0">
            {isAuthenticated && user && (isRole("admin") || isRole("teacher")) && (
              <CreatePost currentUser={user} onPostCreated={addPost} />
            )}

            <div className="space-y-6 mt-6">
              {isLoading ? (
                <div className="text-center py-10 text-gray-400 animate-pulse">Cargando publicaciones...</div>
              ) : (
                posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onLike={() => likePost(post.id)} 
                    onComment={commentOnPost} 
                    onShare={() => sharePost(post.id)} 
                    onVote={voteOnPoll} 
                  />
                ))
              )}
            </div>
          </div>

          {/* 3. CARRUSEL DERECHO */}
          <div className="lg:w-1/5">
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-500" /> Galería
              </h3>
              <Carousel images={homeConfig.carouselImages} />
            </div>
          </div>

        </div> {/* Cierre del contenedor de columnas */}
      </div> {/* Cierre del padding container */}
    </div> // Cierre principal
  );
}
