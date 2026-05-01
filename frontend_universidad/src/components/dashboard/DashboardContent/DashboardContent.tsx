'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api/axios';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';

export function DashboardContent() {
  const { user } = useAuth();
  const { isRole } = usePermission();
  const [premios, setPremios] = useState<any[]>([]);
  const [cursosCompletados, setCursosCompletados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updateKey, setUpdateKey] = useState(0);

  const fetchPremios = useCallback(async () => {
    try {
      const res = await api.get('/settings/niveles_premios');
      const data = res.data?.value || (Array.isArray(res.data) ? res.data : []);
      setPremios(data);
    } catch (error) {
      console.error("Error al cargar premios:", error);
    }
  }, []);

  const fetchCursosCompletados = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/courses/completed-details/${user.id}`);
      setCursosCompletados(res.data || []);
    } catch (error) {
      console.error("Error al cargar cursos:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPremios();
  }, [fetchPremios, updateKey]);

  useEffect(() => {
    if (user?.id) {
      fetchCursosCompletados();
    }
  }, [user?.id, fetchCursosCompletados, updateKey]);

  const savePremios = async () => {
    setLoading(true);
    try {
      const payload = premios.map(p => ({
        nivel: Number(p.nivel),
        premio: p.premio
      })).sort((a, b) => a.nivel - b.nivel);

      await api.post('/settings', {
        key: 'niveles_premios',
        value: payload
      });
      setUpdateKey(prev => prev + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDiploma = (courseId: string) => {
    if (!user?.id) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3014';
    const url = `${baseUrl}/courses/diploma/${user.id}/${courseId}`;
    window.open(url, '_blank');
  };

  // Cálculos de gamificación
   const userPuntos = cursosCompletados.reduce((acc, curso) => acc + (Number(curso.creditos) || 0), 0);

   const puntosPorNivel = 500;
   const nivelActual = Math.floor(userPuntos / puntosPorNivel) + 1;
   const puntosNivelActual = userPuntos % puntosPorNivel;
   const porcentajeProgreso = Math.min((puntosNivelActual / puntosPorNivel) * 100, 100);

   const nextPremioObj = (premios || []).find(p => Number(p.nivel) === nivelActual + 1);
   const nombrePremioSiguiente = nextPremioObj ? nextPremioObj.premio : '¡Nivel máximo alcanzado!';

  return (
    <div className="space-y-8 pb-10" key={updateKey}>
      {/* SECCIÓN PROGRESO */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-6 md:p-8 border border-black-100 dark:border-gray-800 transition-colors">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl">
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">Mi Progreso</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sigue aprendiendo para ganar premios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 p-8 rounded-3xl border border-black-100 dark:border-gray-800">
          <div className="text-center lg:text-left">
            <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.2em]">Nivel Actual</span>
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className="text-7xl font-black text-gray-900 dark:text-white leading-none">{nivelActual}</span>
              <div className="text-left">
                <p className="text-sm font-bold text-yellow-600">LVL</p>
                <p className="text-xs font-medium text-gray-400">{userPuntos} pts totales</p>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase">Progreso al nivel {nivelActual + 1}</span>
              <span className="text-xs font-black text-gray-900 dark:text-white">{puntosNivelActual} / {puntosPorNivel}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                style={{ width: `${porcentajeProgreso}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-black-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="text-3xl animate-bounce-slow">🎁</div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Próximo Regalo</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{nombrePremioSiguiente}</p>
            </div>
          </div>
        </div>
      </section>

      {/* DIPLOMAS */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-6 md:p-8 border border-black-100 dark:border-gray-800 transition-colors">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
            <span className="text-2xl">🎓</span>
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">Mis Certificados</h3>
        </div>

        {cursosCompletados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cursosCompletados.map((curso) => (
              <div key={curso.id} className="group relative bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="aspect-video mb-4 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                    <span className="text-4xl">📄</span>
                  </div>
                </div>
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-4 line-clamp-2 text-sm h-10">{curso.nombre}</p>
                <button
                  onClick={() => handleDownloadDiploma(curso.id)}
                  className="w-full py-3 bg-gray-900 dark:bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  Descargar PDF
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-black-200 dark:border-gray-800">
            <div className="text-4xl mb-4 grayscale opacity-50">📜</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Aún no tienes diplomas disponibles.</p>
            <p className="text-xs text-gray-400 mt-1">¡Completa tu primer curso para empezar tu colección!</p>
          </div>
        )}
      </section>

      {/* ADMIN CONFIG */}
      {isRole('admin') && (
        <section className="bg-gray-900 rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Configuración de Niveles</h3>
              <p className="text-gray-500 text-sm">Define los premios por cada 500 puntos obtenidos</p>
            </div>
            <button
              onClick={savePremios}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-green-500 text-white rounded-2xl text-xs font-black uppercase hover:bg-green-400 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              {loading ? 'Guardando...' : 'Guardar Recompensas'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {premios.map((p, index) => (
              <div key={index} className="flex flex-col gap-3 p-5 bg-gray-800 rounded-2xl border border-gray-700 relative group animate-fade-in">
                <button
                  onClick={() => setPremios(premios.filter((_, i) => i !== index))}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                >
                  ✕
                </button>
                <div className="flex gap-4">
                  <div className="w-20">
                    <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Nivel</label>
                    <input
                      type="number"
                      value={p.nivel}
                      onChange={(e) => {
                        const newP = [...premios];
                        newP[index].nivel = e.target.value;
                        setPremios(newP);
                      }}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 font-black text-white text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Premio</label>
                    <input
                      type="text"
                      value={p.premio}
                      onChange={(e) => {
                        const newP = [...premios];
                        newP[index].premio = e.target.value;
                        setPremios(newP);
                      }}
                      placeholder="Ej: Playera Oficial"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setPremios([...premios, { nivel: premios.length + 1, premio: '' }])}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-2xl text-gray-500 hover:text-blue-400 hover:border-blue-400 hover:bg-blue-400/5 transition-all group"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">+</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Nuevo Escalón</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
