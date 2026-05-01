'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserProfile } from "@/lib/types/user.types";
import { Avatar } from "@/components/ui/Avatar/Avatar";

export default function StudentView({ user }: { user: UserProfile }) {
  const [completions, setCompletions] = useState<any[]>([]);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/user-completions/${user.id}`);
        if(res.data) setCompletions(res.data);
      } catch (error) {
        console.error("Error al cargar cursos completados", error);
      }
    };
    if (user?.id) fetchCursos();
  }, [user.id]);

  const handleDownloadDiploma = (courseId: number) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/courses/diploma/${user.id}/${courseId}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header Responsivo */}
      <div className="bg-white rounded-3xl p-6 shadow-soft flex flex-col md:flex-row items-center gap-6 mb-8">
        <Avatar src={user.avatar} alt={user.name} size="lg" className="w-24 h-24 md:w-32 md:h-32" />
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">{user.name}</h1>
          <p className="text-primary-600 font-medium capitalize">{user.role}</p>
          <p className="text-secondary-400 text-sm">{user.email}</p>
        </div>
        {/* Nivel y Puntos Rápidos */}
        <div className="bg-yellow-50 p-4 rounded-2xl text-center border border-yellow-200">
          <p className="text-xs text-yellow-800 font-black uppercase">Nivel {Math.floor((user.puntos || 0) / 500) + 1}</p>
          <p className="text-2xl font-black text-yellow-600">{user.puntos || 0} PTS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-100">
            <h3 className="font-bold text-secondary-800 mb-4 text-lg">Información</h3>
            <div className="space-y-3 text-sm">
              <p><span className="text-secondary-400">Departamento:</span> {user.department || 'No asignado'}</p>
              <p><span className="text-secondary-400">Ingreso:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
              <p><span className="text-secondary-400">Créditos Acumulados:</span> {user.creditosTotales || 0}</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-100 min-h-[300px]">
            <h3 className="font-bold text-secondary-800 mb-4 text-lg">Cursos Completados y Diplomas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {completions.length === 0 ? (
                 <p className="text-sm text-gray-400">Aún no has completado cursos.</p>
              ) : (
                completions.map((comp, idx) => (
                  <div key={idx} className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex flex-col justify-between">
                    <div>
                      <p className="font-bold text-primary-700">{comp.course?.nombre || `Curso ID: ${comp.courseId}`}</p>
                      <p className="text-xs text-primary-500 mb-4">Calificación: <span className="font-bold">{comp.score}%</span></p>
                    </div>
                    <button 
                      onClick={() => handleDownloadDiploma(comp.courseId)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all"
                    >
                      Descargar Reconocimiento
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
