"use client";

import React, { useEffect, useState, use } from "react";
import { Avatar } from "@/components/ui/Avatar/Avatar";
import { Loader } from "@/components/ui/Loader/Loader";
import { useAuth } from "@/hooks/useAuth";
import {
  MapPin,
  Briefcase,
  Building2,
  Clock,
  Phone,
  Mail,
  ArrowLeft,
  Camera,
} from "lucide-react";
import { useRouter } from "next/navigation";

const AVAILABLE_AVATARS = [
  "/avatars/avatar1.jpg",
  "/avatars/avatar2.jpg",
  "/avatars/avatar3.jpg",
  "/avatars/avatar4.jpg",
  "/avatars/avatar5.jpg",
  "/avatars/avatar6.jpg",
];

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const username = resolvedParams?.id;

  // CORRECCIÓN: Extraemos updateUser en lugar de setUser
  const { user: authUser, updateUser, token } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
  const backendUrl = isLocal ? "http://localhost:3013" : "https://api-universidad.ppollo.org";

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username || username === "undefined") {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${backendUrl}/v1/users/user/${username}`);
        if (!response.ok) throw new Error("Perfil no encontrado");
        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        console.error("Error al cargar perfil:", err);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username, backendUrl]);

  const handleAvatarChange = async (newAvatar: string) => {
    if (!profileData?.id) return;
    setIsUpdating(true);
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${backendUrl}/v1/users/${profileData.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ avatar: newAvatar })
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      // 1. Actualizamos el estado local de esta página
      setProfileData((prev: any) => ({ ...prev, avatar: newAvatar }));

      // 2. CORRECCIÓN: Sincronización global usando la nueva función del AuthContext
      if (typeof updateUser === 'function') {
        updateUser({ avatar: newAvatar });
      }

      setShowAvatarSelector(false);
      // No es estrictamente necesario router.refresh() si el estado global ya cambió,
      // pero ayuda a mantener la consistencia de los datos del servidor.
      router.refresh();
    } catch (err) {
      console.error("Error al actualizar icono:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader size="lg" color="blue" />
      </div>
    );
  }

  if (!username || username === "undefined" || !profileData) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-10 rounded-[2rem] border-2 border-black shadow-xl text-center">
          <p className="text-xl font-black text-gray-800 uppercase mb-4">Usuario no encontrado</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/assets/images/fondo_general.jpg')] bg-cover bg-center bg-fixed pb-20">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
        <button onClick={() => router.back()} className="flex items-center text-gray-800 hover:text-blue-600 font-black text-xs tracking-[0.2em] bg-white p-3 rounded-2xl border-2 border-black shadow-sm transition-transform active:scale-95">
          <ArrowLeft className="w-5 h-5 mr-2" /> VOLVER
        </button>
  
           <div className="bg-white rounded-[3rem] shadow-xl border-2 border-black overflow-visible relative">
           <div className="h-44 bg-gradient-to-r from-blue-900 to-blue-500 relative rounded-t-[2.8rem] overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('/assets/images/fondo_general.png')] bg-cover bg-center"></div>
          </div>

          <div className="px-10 pb-10">
            <div className="relative flex justify-between items-end -mt-12 mb-8">
              <div className="relative">
                <Avatar
                  src={profileData?.avatar}
                  alt={profileData.nombre}
                  size="lg"
                  className={`w-32 h-32 border-8 border-white shadow-2xl transition-all ${isUpdating ? 'opacity-50' : ''}`}
                  fallbackLetter={profileData?.nombre?.charAt(0) || "U"}
                />

                {authUser?.id === profileData.id && (
                  <button
                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                    className="absolute bottom-1 right-1 p-2.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 border-4 border-white transition-transform active:scale-90"
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader size="xs" color="white" /> : <Camera size={18} />}
                  </button>
                )}

   {showAvatarSelector && (
  <div className="absolute top-full left-0 mt-4 bg-white p-5 rounded-[2rem] shadow-2xl border-2 border-black z-[100] w-[320px] animate-in fade-in zoom-in duration-200">
    <p className="text-[10px] font-black text-gray-800 uppercase mb-4 tracking-widest px-2 text-center">
      Selecciona tu icono
    </p>
    
    {/* Grid de 3 columnas para que salgan 2 filas de 3 */}
    <div className="grid grid-cols-3 gap-3">
      {AVAILABLE_AVATARS.map((url, i) => (
        <button
          key={i}
          onClick={() => handleAvatarChange(url)}
          className={`relative rounded-2xl overflow-hidden border-2 transition-all hover:scale-110 aspect-square ${
            profileData.avatar === url ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-100"
          }`}
        >
          <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  </div>
)}
      

              </div>
              <div className="pb-4">
                 <span className="px-6 py-2 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-black shadow-md">
                  {profileData.role || "USUARIO"}
                </span>
              </div>
            </div>

            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
              {profileData.nombre} {profileData.apellido}
            </h1>
            <p className="text-blue-600 font-bold text-lg">@{profileData.usuario}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] shadow-xl border-2 border-black">
            <h2 className="text-2xl font-black mb-10 flex items-center text-gray-800">
              <span className="w-2.5 h-8 bg-blue-600 rounded-full mr-4"></span>
              Datos de Empleado
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <InfoItem icon={<Building2 />} label="Sucursal" value={profileData.empleado?.sucursalActiva?.nombre || profileData.sucursal || "OFICINA"} />
              <InfoItem icon={<Briefcase />} label="Departamento" value={profileData.empleado?.departamento?.nombre || profileData.departamento || "GENERAL"} />
              <InfoItem icon={<Clock />} label="Antigüedad" value="ACTIVO" />
              <InfoItem icon={<MapPin />} label="Ubicación" value={profileData.municipio || "MAZATLÁN, SIN."} />
            </div>
          </div>

          <div className="bg-gray-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border-2 border-black">
            <h2 className="text-blue-400 font-black uppercase tracking-[0.2em] mb-12 text-center text-xs relative z-10">
              Información Personal
            </h2>
            <div className="space-y-10 relative z-10">
              <ContactItem icon={<Phone />} label="Celular" value={profileData.telefono || profileData.empleado?.celular || "---"} />
              <ContactItem icon={<Mail />} label="Email" value={profileData.email || profileData.empleado?.email || "---"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-componentes sin cambios (manteniendo la estructura original)
function InfoItem({ icon, label, value }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 border-2 border-black">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">{label}</p>
        <p className="text-lg font-black text-gray-800 leading-tight uppercase">{value}</p>
      </div>
    </div>
  );
}

function ContactItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-5">
      <div className="p-4 bg-white/5 rounded-2xl text-blue-400 border-2 border-black">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{label}</p>
        <p className="font-bold text-white text-sm break-all leading-relaxed uppercase">{value}</p>
      </div>
    </div>
  );
}
