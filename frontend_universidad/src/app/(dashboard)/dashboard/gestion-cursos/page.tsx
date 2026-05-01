// src/app/(dashboard)/dashboard/gestion-cursos/page.tsx
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/axios";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Lock as LockIcon,
} from "lucide-react";
import CourseFormModal from "@/components/CourseFormModal";
import CourseStudentsModal from "@/components/CourseStudentsModal";
import CourseTestModal from "@/components/test/CourseTestModal";
import { Loader } from "@/components/ui/Loader/Loader";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { QrCode } from "lucide-react";

interface Curso {
  id: string;
  codigo: string;
  nombre: string;
  categoria?: string;
  creditos: number;
  semestre: string;
  profesor: string;
  estado: "activo" | "inactivo";
  estudiantes: number;
  estudiantesInscritos?: any[];
  completado?: boolean;
  calificacion?: number;
  videos?: any[];
  pdfs?: any[];
  questions?: any[];
  duracionExamen?: number;
  fechaLimite?: string;
}

const cursosMock: Curso[] = [
  {
    id: "1",
    codigo: "ASC-001",
    nombre: "TALLER ATENCION Y SERVICIO AL CLIENTE",
    creditos: 4,
    semestre: "2024-I",
    profesor: "Carlos Mendoza",
    estado: "activo",
    estudiantes: 45,
    completado: false,
  },
  {
    id: "2",
    codigo: "BPM-002",
    nombre: "INDUCCIÓN A LAS BUENAS PRACTICAS DE MANUFACTURA",
    creditos: 5,
    semestre: "2024-I",
    profesor: "Ana López",
    estado: "activo",
    estudiantes: 38,
    completado: false,
  },
];

export default function GestionCursosPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { isRole } = usePermission();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

 // --- NUEVOS ESTADOS PARA LOS FILTROS ---
  const [categorias, setCategorias] = useState<string[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [user, authLoading]);
  const loadData = async () => {
    if (authLoading || !user?.id) return;
    setLoading(true);
    
    try {
      const isAdminOProfesor = isRole("admin") || isRole("teacher");
      const catRes = await api.get('/courses/categories');
      setCategorias(Array.isArray(catRes.data) ? catRes.data : []);

      const url = `/courses`;
      const res = await api.get(url);
      let cursosBase = Array.isArray(res.data) ? res.data : [];

      if (!isAdminOProfesor) {
        cursosBase = cursosBase.filter((c: any) => c.estado === "activo");
      }

      // Solo intentamos cargar progreso si tenemos un ID de usuario válido
      if (user?.id) {
        try {
          // 1. Obtenemos el progreso (completados) y el estado de inscripción
          const [progRes, enrollRes] = await Promise.all([
            api.get(`/courses/user-progress`, {
              params: { userId: user.id } 
            }),
            api.get(`/courses/enrollments/user/${user.id}`)
          ]);

          const completadosIds = Array.isArray(progRes.data)
            ? progRes.data.map((id: any) => String(id))
            : [];

          const inscripciones = Array.isArray(enrollRes.data) ? enrollRes.data : [];

          cursosBase = cursosBase.map((c: any) => {
            const inscripcion = inscripciones.find((i: any) => String(i.courseId) === String(c.id));

            return {
              ...c,
              id: String(c.id),
              categoria: (c.categoria || c.category || "GENERAL").toUpperCase().trim(),
              completado: completadosIds.includes(String(c.id)),
              bloqueado: inscripcion?.status === 'bloqueado',
              intentos: Number(inscripcion?.intentos || 0),
              registrado: !!inscripcion,
              qrToken: c.qrtoken || c.qrToken,
              asistenciaMarcada: !!inscripcion?.asistenciaMarcada,
              tipo: c.tipo || 'general',
            };
          });
        } catch (e: any) {
          console.error("❌ Error cargando estados extendidos:", e.response?.data || e.message);
        }
      } // <-- AQUÍ SE CIERRA EL IF (Faltaba en tu código)

      setCursos(cursosBase);
      
    } catch (e: any) { // <-- AQUÍ SE CIERRA EL TRY PRINCIPAL (Faltaba en tu código)
      console.error("❌ Error de conexión:", e.message);
      setCursos(typeof cursosMock !== 'undefined' ? cursosMock : []);
    } finally {
      setLoading(false);
    }
  };

     const handleSaveCourse = async (courseFormData: any) => {
    try {
      setLoading(true);
      const payload = {
        ...courseFormData,
        categoria: courseFormData.categoria?.toUpperCase() || "",
        creditos: Number(courseFormData.creditos),
        duracionExamen: Number(courseFormData.duracionExamen)
      };

      if (selectedCurso) {
        await api.patch(`/courses/${selectedCurso.id}`, payload);
      } else {
        await api.post(`/courses`, payload);
      }

      setIsModalOpen(false);
      setSelectedCurso(null);
      await loadData();
      alert("✅ Datos actualizados.");
    } catch (error) {
      alert("Error al guardar: Revisa que la categoría no esté vacía.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (curso: Curso) => {
  const authorizedUsers = ["ZAK", "MARCO", "NTJ"];
  const currentUsername = user?.username?.toUpperCase();

  if (!currentUsername || !authorizedUsers.includes(currentUsername)) {
    alert(`⛔ No tienes permisos para cambiar el estado de los cursos.`);
    return;
  }

  const nuevoEstado = curso.estado === "activo" ? "inactivo" : "activo";
  const accion = nuevoEstado === "activo" ? "reactivar" : "desactivar";

  if (confirm(`¿Estás seguro de que deseas ${accion} este curso?`)) {
    try {
      // Usamos PATCH para actualizar solo el campo 'estado'
      await api.patch(`/courses/${curso.id}`, {
        estado: nuevoEstado
      }, {
        headers: {
          'x-user-username': user?.username,
          'x-user-department': user?.departamento
        }
      });

      await loadData();
      alert(`✅ Curso ${nuevoEstado === "activo" ? 'activado' : 'desactivado'} correctamente.`);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("Error: No se pudo cambiar el estado del curso.");
    }
  }
};

  const esAdminOProfesor = isRole("admin") || isRole("teacher");

  const filteredCursos = (cursos || []).filter((curso) => {
  if (!curso) return false;

  const searchTermLower = searchTerm.toLowerCase();

  // Búsqueda por texto
  const matchesSearch =
    (curso.nombre || "").toLowerCase().includes(searchTermLower) ||
    (curso.codigo || "").toLowerCase().includes(searchTermLower);

  // Filtro de Categoría (Cambiado a 'filtroCategoria' y comparado con 'TODAS')
  const matchesCategory =
    filtroCategoria === "TODAS" ||
    curso.categoria === filtroCategoria;

  // Filtro de Estado (Cambiado a 'filtroEstado' y comparado con 'TODOS')
  const matchesStatus =
    filtroEstado === "TODOS" || 
    curso.estado === filtroEstado;

  return matchesSearch && matchesCategory && matchesStatus;
});

  const currentItems = filteredCursos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredCursos.length / itemsPerPage);

  if (authLoading || loading) return (
    <div className="flex justify-center items-center min-h-[400px]"><Loader /></div>
  );
      return (
    <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Gestión de Cursos</h1>
          <p className="text-gray-500 dark:text-gray-400">Administra y supervisa los cursos de la plataforma</p>
        </div>
        {esAdminOProfesor && (
          <button
            onClick={() => { setSelectedCurso(null); setIsModalOpen(true); }}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 uppercase text-xs tracking-wider"
          >
            <Plus className="w-5 h-5 mr-2" /> Nuevo Curso
          </button>
        )}
      </div>

     {/* FILTROS */}
<div className="flex flex-col md:flex-row gap-4 mb-8 bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-dark-100 dark:border-gray-800">
  
  {/* Buscador de texto */}
  <div className="relative flex-grow">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
    <input
      type="text"
      placeholder="Buscar por nombre o código..."
      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
      value={searchTerm}
      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
    />
  </div>

  {/* Selector de Categoría */}
  <div className="md:w-64">
    <select
      value={filtroCategoria}
      onChange={(e) => { setFiltroCategoria(e.target.value); setCurrentPage(1); }}
      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-700 dark:text-gray-300 font-black text-[11px] uppercase cursor-pointer"
    >
      <option value="TODAS">TODAS LAS CATEGORÍAS</option>
      {categorias.map((cat, index) => (
        <option key={index} value={cat}>{cat}</option>
      ))}
    </select>
  </div>

  {/* Selector de Estado (AQUÍ ESTÁ EL QUE FALTABA) */}
  {esAdminOProfesor && (
    <div className="md:w-48">
      <select
        value={filtroEstado}
        onChange={(e) => { setFiltroEstado(e.target.value); setCurrentPage(1); }}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-700 dark:text-gray-300 font-black text-[11px] uppercase cursor-pointer"
      >
        <option value="TODOS">TODOS LOS ESTADOS</option>
        <option value="activo">SOLO ACTIVOS</option>
        <option value="inactivo">SOLO INACTIVOS</option>
      </select>
    </div>
  )}
</div>


      {/* GRID DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
        {currentItems.map((curso) => {
          const estaExpirado = curso.fechaLimite ? new Date(curso.fechaLimite) < new Date() : false;
          const estaInscrito = (curso as any).registrado === true;
          const estaBloqueadoPorFallos = (curso as any).bloqueado;
          const tieneAsistencia = (curso as any).asistenciaMarcada === true;
          const requiereAsistencia = curso.tipo === 'in-person';

          const estaHabilitado = esAdminOProfesor || (
            estaInscrito && !estaBloqueadoPorFallos && (requiereAsistencia ? tieneAsistencia : true)
          );

          return (
            <div
              key={curso.id}
              className={`group flex flex-col bg-white dark:bg-gray-900 rounded-3xl border border-dark-100 dark:border-gray-800 overflow-hidden transition-all duration-300 relative ${
                !estaHabilitado ? "opacity-75 grayscale-[0.5]" : "hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
              }`}
            >
              {/* Overlay de Bloqueo Mejorado */}
              {!estaHabilitado && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-[2px] transition-opacity">
                  <div className={`p-4 rounded-full ${estaBloqueadoPorFallos ? "bg-red-500" : "bg-gray-700"} text-white mb-3 shadow-xl animate-pulse`}>
                    <LockIcon className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-black bg-white text-gray-900 px-4 py-1.5 rounded-full shadow-2xl uppercase tracking-tighter">
                    {estaBloqueadoPorFallos ? "ACCESO DENEGADO" : !estaInscrito ? "NO INSCRITO" : "PENDIENTE ASISTENCIA"}
                  </span>
                </div>
              )}

              {/* Contenido de la Tarjeta */}
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                    {curso.codigo}
                  </span>
                  <div className="flex gap-2">
                    {esAdminOProfesor && requiereAsistencia && (
                       <button
                       onClick={() => {
                         const qrUrl = `${window.location.origin}/asistencia/${curso.qrToken}`;
                         window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrUrl}`, '_blank');
                       }}
                       className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl hover:scale-110 transition-transform"
                     >
                       <QrCode className="w-4 h-4" />
                     </button>
                    )}
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${curso.estado === "activo" ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30"}`}>
                      {curso.estado}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 transition-colors uppercase">
                  {curso.nombre}
                </h3>
                
                <div className="space-y-2 mb-6">
                  <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center font-medium italic">
                    <Users className="w-4 h-4 mr-2 text-blue-500" /> {curso.profesor}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-[11px] flex items-center font-bold uppercase tracking-tighter">
                    <Users className="w-4 h-4 mr-2" /> {curso.estudiantes || 0} alumnos
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full uppercase">
                    {curso.creditos} CRÉDITOS
                  </div>
                  <div className={`text-[10px] font-black uppercase ${estaExpirado ? "text-red-500" : "text-gray-400"}`}>
                    {estaExpirado ? "EXPIRADO" : `LÍMITE: ${curso.fechaLimite ? new Date(curso.fechaLimite).toLocaleDateString() : "∞"}`}
                  </div>
                </div>
              </div>

              {/* Footer de la Tarjeta */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-dark-100 dark:border-gray-800 flex justify-between items-center z-20">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (curso.completado) { alert("✅ Completado"); return; }
                      if (estaBloqueadoPorFallos) { alert("⛔ Bloqueado"); return; }
                      if (!estaHabilitado) return;
                      setSelectedCurso(curso);
                      setShowTestModal(true);
                    }}
                    className={`p-3 rounded-2xl transition-all ${
                      curso.completado ? "text-green-600 bg-green-50 dark:bg-green-900/20" : 
                      estaHabilitado ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:scale-110" : "text-gray-400"
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                  </button>

                  {esAdminOProfesor && (
                    <>
                      <button onClick={() => { setSelectedCurso(curso); setShowStudentsModal(true); }} className="p-3 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-2xl hover:scale-110 transition-transform"><Users className="w-5 h-5" /></button>
                      <button onClick={() => { setSelectedCurso(curso); setIsModalOpen(true); }} className="p-3 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-2xl hover:scale-110 transition-transform"><Edit2 className="w-5 h-5" /></button>
                      <button
                        onClick={() => handleToggleStatus(curso)}
                        className={`p-3 rounded-2xl transition-all hover:scale-110 ${curso.estado === "activo" ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"}`}
                      >
                        {curso.estado === "activo" ? <LockIcon className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    </>
                  )}
                </div>
                {curso.completado && (
                  <div className="flex items-center gap-1 text-green-500">
                    <span className="text-[10px] font-black uppercase">Finalizado</span>
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación - Diseño Intacto */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mb-10">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-bold text-gray-600">Página {currentPage} de {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>
      )}

      {/* Modales */}
      {isModalOpen && <CourseFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedCurso(null); }} courseData={selectedCurso} onSave={handleSaveCourse} cursos={cursos} />}
      {showStudentsModal && selectedCurso && <CourseStudentsModal isOpen={showStudentsModal} onClose={() => { setShowStudentsModal(false); setSelectedCurso(null); }} courseData={selectedCurso} onUpdateCourse={loadData} />}
       {showTestModal && selectedCurso && (
  <CourseTestModal
    isOpen={showTestModal}
    course={selectedCurso}
    // Usamos las propiedades que procesaste en loadData
    enrollmentStatus={(selectedCurso as any).completado ? 'completed' : 'active'}
    intentos={(selectedCurso as any).intentos || 0}
    // ESTA ES LA CLAVE: Pasar el estado de asistencia
    asistenciaMarcada={(selectedCurso as any).asistenciaMarcada} 
    onClose={() => {
      setShowTestModal(false);
      setSelectedCurso(null);
    }}
    onExamSuccess={loadData}
  />
)}
 </div>
  );
}
