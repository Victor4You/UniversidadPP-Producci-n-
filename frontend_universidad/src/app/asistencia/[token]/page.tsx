"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api/axios";
import { CheckCircle2, Loader2, AlertCircle, MapPin, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext/useAuth";

export default function AsistenciaQRPage() {
  const { updateUser } = useAuth();
  const { token } = useParams();
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setStatus('loading');
    try {
      const res = await api.post('/courses/qr-attendance', {
        qrToken: token,
        username: username.toUpperCase().trim()
      });

      const { user, courseId, accessToken } = res.data;

      // Actualizamos la sesión en las Cookies a través del contexto
      if (user) {
        updateUser({
          ...user,
          token: accessToken || user.token
        });
      }

      setStatus('success');
      setMessage("¡Asistencia registrada correctamente!");

      setTimeout(() => {
        router.push(`/dashboard/gestion-cursos?openCourse=${courseId}`);
      }, 2000);

    } catch (err: any) {
      console.error("Error al registrar:", err);
      setStatus('error');
      setMessage(err.response?.data?.message || "Error al registrar asistencia.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-blue-100/50 p-10 border border-white relative overflow-hidden">
        
        {/* Decoración superior */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600" />

        {status === 'success' ? (
          <div className="text-center space-y-6 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={48} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 leading-none">¡ASISTENCIA RECONOCIDA!</h1>
              <p className="text-gray-500 font-bold uppercase text-[10px] mt-4 tracking-widest px-4">
                {message}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/gestion-cursos')}
              className="w-full py-5 bg-black text-white rounded-2xl font-black text-xs tracking-widest hover:bg-gray-800 transition-all shadow-xl uppercase"
            >
              Ir a realizar examen
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-8">
            <div className="text-center space-y-2">
              <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin size={24} />
              </div>
              <h1 className="text-2xl font-black text-gray-900 leading-none uppercase tracking-tighter">Confirmar Presencia</h1>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Cursos Presenciales Universidad</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <User size={20} />
                </div>
                <input
                  required
                  type="text"
                  placeholder="TU USUARIO (EJ: ZAK123)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-[24px] py-5 pl-14 pr-6 outline-none font-black text-lg transition-all placeholder:text-gray-300 uppercase"
                />
              </div>

              {status === 'error' && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 animate-in shake duration-300">
                  <AlertCircle size={18} />
                  <span className="text-[10px] font-black uppercase leading-tight">{message}</span>
                </div>
              )}
            </div>

            <button
              disabled={status === 'loading'}
              className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 uppercase"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Procesando...</span>
                </>
              ) : "Registrar mi asistencia"}
            </button>

            <p className="text-center text-gray-400 text-[9px] font-medium leading-relaxed">
              Al registrar tu asistencia, se habilitará automáticamente el examen final en tu panel de cursos.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
