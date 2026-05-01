// src/app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api/axios";
import { Loader } from "@/components/ui/Loader/Loader";
import { Save, Plus, Trash2, Image as ImageIcon, ArrowLeft, Upload, Link as LinkIcon, Newspaper } from "lucide-react";
import Link from "next/link";

interface CarouselItem {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
}

interface HomeConfig {
  mainTitle: string;
  carouselImages: CarouselItem[];      
  blogCarouselImages: CarouselItem[];  
  staticBannerUrl: string;
}

export default function SettingsPage() {
  const { isRole, isLoading: loadingPermission } = usePermission();
  const { isAuthenticated } = useAuth();
  const BASE_UPLOADS = "https://api-universidad.ppollo.org/uploads/";

  const [config, setConfig] = useState<HomeConfig>({
    mainTitle: "Feed Universitario",
    carouselImages: [],
    blogCarouselImages: [],
    staticBannerUrl: ""
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/settings/home_config");
        if (res.data) {
          setConfig({
            mainTitle: res.data.mainTitle || "Feed Universitario",
            carouselImages: res.data.carouselImages || [],
            blogCarouselImages: res.data.blogCarouselImages || [],
            staticBannerUrl: res.data.staticBannerUrl || ""
          });
        }
      } catch (error) {
        console.error("Error cargando configuración:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (isAuthenticated) fetchConfig();
  }, [isAuthenticated]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId?: string, type: 'home' | 'blog' | 'static' = 'static') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setMessage({ type: "info", text: "Subiendo imagen..." });
      const res = await api.post('/courses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const rawPath = res.data.url || res.data;
      const cleanFileName = typeof rawPath === "string" ? rawPath.replace(/^.*uploads\//, '') : rawPath;
      const finalUrl = `${BASE_UPLOADS}${cleanFileName}`;

      if (type === 'static') {
        setConfig(prev => ({ ...prev, staticBannerUrl: finalUrl }));
      } else {
        const field = type === 'home' ? 'carouselImages' : 'blogCarouselImages';
        setConfig(prev => ({
          ...prev,
          [field]: prev[field].map((item: any) => item.id === itemId ? { ...item, src: finalUrl } : item)
        }));
      }
      setMessage({ type: "success", text: "Imagen lista. ¡Recuerda GUARDAR CAMBIOS!" });
    } catch (error) {
      setMessage({ type: "error", text: "Error al subir archivo." });
    }
  };

  const handleAddItem = (type: 'home' | 'blog') => {
    const newItem: CarouselItem = {
      id: Date.now().toString(),
      src: "",
      alt: "Nueva imagen",
      title: "",
      description: ""
    };
    const field = type === 'home' ? 'carouselImages' : 'blogCarouselImages';
    setConfig({ ...config, [field]: [...config[field], newItem] });
  };

  const handleRemoveItem = (id: string, type: 'home' | 'blog') => {
    const field = type === 'home' ? 'carouselImages' : 'blogCarouselImages';
    setConfig({ ...config, [field]: config[field].filter((item: any) => item.id !== id) });
  };

  const handleUpdateItem = (id: string, field: keyof CarouselItem, value: string, type: 'home' | 'blog') => {
    const targetField = type === 'home' ? 'carouselImages' : 'blogCarouselImages';
    const newImages = config[targetField].map((item: any) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setConfig({ ...config, [targetField]: newImages });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post("/settings", { key: "home_config", value: config });
      setMessage({ type: "success", text: "¡Configuración aplicada!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Error al guardar." });
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingPermission || isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  if (!isRole("admin")) return <div className="text-center p-10"><h1>Acceso Denegado</h1></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 pb-20">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"><ArrowLeft size={24} /></Link>
          <div><h1 className="text-3xl font-black text-gray-900 uppercase">Ajustes de Layout</h1><p className="text-gray-500">Gestión de Inicio y Blog</p></div>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
          {isSaving ? <Loader size="sm" color="white" /> : <Save size={20} />} {isSaving ? "Guardando..." : "GUARDAR CAMBIOS"}
        </button>
      </div>

      {message.text && <div className={`p-4 rounded-xl mb-6 text-center font-bold ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{message.text}</div>}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Título Principal</h2>
            <input type="text" value={config.mainTitle} onChange={(e) => setConfig({ ...config, mainTitle: e.target.value })} className="w-full p-3 bg-gray-50 border rounded-xl outline-none" />
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Imagen Lateral Sticky</h2>
            <div className="aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed relative group">
              {config.staticBannerUrl ? <img src={config.staticBannerUrl} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center"><ImageIcon className="text-gray-300" size={40} /></div>}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <Upload className="text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, undefined, 'static')} />
              </label>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* SECCIÓN CARRUSEL VERTICAL (Antes "Carrusel Inicio") */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={16} /> Carrusel Slider Vertical</h2>
              <button onClick={() => handleAddItem('home')} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-xs">+ NUEVO SLIDE VERTICAL</button>
            </div>
            <div className="grid gap-4">
              {config.carouselImages.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-xl border relative">
                  <button onClick={() => handleRemoveItem(item.id, 'home')} className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"><Trash2 size={16} /></button>
                  <div className="flex gap-4">
                    <div className="w-32 h-24 bg-white rounded-lg border relative group flex-shrink-0">
                      {item.src && <img src={item.src} className="w-full h-full object-cover rounded-lg" />}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer rounded-lg"><Upload size={16} className="text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, item.id, 'home')} />
                      </label>
                    </div>
                    <div className="flex-1 space-y-2">
                      <input type="text" value={item.title} placeholder="Título" onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value, 'home')} className="w-full p-2 text-xs border rounded outline-none" />
                      <input type="text" value={item.src} placeholder="URL de imagen" onChange={(e) => handleUpdateItem(item.id, 'src', e.target.value, 'home')} className="w-full p-2 text-xs border rounded outline-none bg-gray-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECCIÓN CARRUSEL PRINCIPAL INICIO (Antes "Carrusel Blog / Noticias") */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Newspaper size={16} /> Carrusel Inicio (Slider Grande)</h2>
              <button onClick={() => handleAddItem('blog')} className="bg-green-50 text-green-600 px-4 py-2 rounded-lg font-bold text-xs">+ NUEVO SLIDE INICIO</button>
            </div>
            <div className="grid gap-4">
              {config.blogCarouselImages.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-xl border relative">
                  <button onClick={() => handleRemoveItem(item.id, 'blog')} className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"><Trash2 size={16} /></button>
                  <div className="flex gap-4">
                    <div className="w-32 h-24 bg-white rounded-lg border relative group flex-shrink-0">
                      {item.src && <img src={item.src} className="w-full h-full object-cover rounded-lg" />}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer rounded-lg"><Upload size={16} className="text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, item.id, 'blog')} />
                      </label>
                    </div>
                    <div className="flex-1 space-y-2">
                      <input type="text" value={item.title} placeholder="Título de Noticia" onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value, 'blog')} className="w-full p-2 text-xs border rounded outline-none" />
                      <input type="text" value={item.src} placeholder="URL de imagen blog" onChange={(e) => handleUpdateItem(item.id, 'src', e.target.value, 'blog')} className="w-full p-2 text-xs border rounded outline-none bg-gray-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
