//src/components/CourseStudentsModal.tsx

"use client";

import { Fragment, useState, useEffect } from "react";

import { Dialog, Transition } from "@headlessui/react";

import { useRouter } from "next/navigation";

import api from "@/lib/api/axios";



// ... (Iconos se mantienen igual)

const XMarkIcon = () => (

  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

  </svg>

);

const UserIcon = () => (

  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />

  </svg>

);



export default function CourseStudentsModal({ isOpen, onClose, courseData, onUpdateCourse }: any) {

  const router = useRouter();



  // Estados para catálogos

  const [sucursales, setSucursales] = useState<any[]>([]);

  const [grupos, setGrupos] = useState<any[]>([]);

  const [puestos, setPuestos] = useState<any[]>([]);



  // Estados de filtros (Ajustados para coincidir con lo que espera el Backend)

  const [tipoUbicacion, setTipoUbicacion] = useState("TODOS");

  const [sucursalId, setSucursalId] = useState("");

  const [grupoId, setGrupoId] = useState(""); // Cambiado de tipoUsuario -> grupoId

  const [puesto, setPuesto] = useState("");   // Cambiado de departamento -> puesto



  const [displayedUsers, setDisplayedUsers] = useState<any[]>([]);

  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);

  const [isFetchingUsers, setIsFetchingUsers] = useState(false);



  // --- FUNCIONES DE EXTRACCIÓN (IMPORTANTE PARA LLENAR LOS SELECTS) ---

  const getGrupoText = (g: any) => {

    if (typeof g === 'string') return g;

    return g?.tipoUsuario?.tipo || g?.tipo || g?.nombre || "";

  };



  const getPuestoText = (p: any) => {

    if (typeof p === 'string') return p;

    return p?.departamento?.nombre || p?.nombre || "";

  };



  // 1. Cargar filtros iniciales

  useEffect(() => {

    const fetchFilters = async () => {

      try {

        const [resSuc, resGru, resPue] = await Promise.all([

          api.get("/courses/branches/list"),

          api.get("/courses/groups/list"),

          api.get("/courses/positions/list")

        ]);

        setSucursales(resSuc.data || []);

        setGrupos(resGru.data || []);

        setPuestos(resPue.data || []);

      } catch (err) {

        console.error("Error cargando filtros:", err);

      }

    };

    if (isOpen) fetchFilters();

  }, [isOpen]);



  // 2. Cargar alumnos ya asignados

  useEffect(() => {

    const cargarAsignados = async () => {

      if (isOpen && courseData?.id) {

        try {

          const res = await api.get(`/courses/${courseData.id}/students`);

          setSelectedUserIds(res.data.map((u: any) => Number(u.id)));

        } catch (error) {

          console.error("Error cargando asignados:", error);

        }

      }

    };

    cargarAsignados();

  }, [isOpen, courseData?.id]);



  // 3. Búsqueda con filtros (Corregido para el Backend)

  useEffect(() => {

    const fetchUsers = async () => {

      setIsFetchingUsers(true);

      try {

        const params = new URLSearchParams();



        // Lógica de sucursal

        const oficina = sucursales.find(s => s.nombre.toUpperCase().includes("OFICINA"));

        if (tipoUbicacion === "OFICINA" && oficina) {

          params.append("sucursalId", oficina.id.toString());

        } else if (tipoUbicacion === "SUCURSALES" && sucursalId) {

          params.append("sucursalId", sucursalId);

        }



        // --- CORRECCIÓN DE PARÁMETROS ---

        if (grupoId) params.append("grupoId", grupoId); // Backend espera grupoId

        if (puesto) params.append("puesto", puesto);   // Backend espera puesto



        const res = await api.get(`/courses/users/search?${params.toString()}`);

        setDisplayedUsers(res.data || []);

      } catch (error) {

        setDisplayedUsers([]);

      } finally {

        setIsFetchingUsers(false);

      }

    };



    if (isOpen && sucursales.length > 0) {

      const timer = setTimeout(fetchUsers, 300);

      return () => clearTimeout(timer);

    }

  }, [tipoUbicacion, sucursalId, grupoId, puesto, isOpen, sucursales]);



  const handleToggle = (userId: number) => {

    setSelectedUserIds(prev =>

      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]

    );

  };



  const handleSave = async () => {

    try {

      setLoading(true);

      await api.post(`/courses/${courseData.id}/students`, { userIds: selectedUserIds });

      if (onUpdateCourse) await onUpdateCourse();

      onClose();

      alert("✅ Alumnos actualizados.");

    } catch (error) {

      alert("Error al guardar");

    } finally {

      setLoading(false);

    }

  };



  return (

    <Transition.Root show={isOpen} as={Fragment}>

      <Dialog as="div" className="relative z-50" onClose={onClose}>

        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

        <div className="fixed inset-0 z-10 overflow-y-auto">

          <div className="flex min-h-full items-center justify-center p-4 text-center">

            <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-[2.5rem] bg-white p-8 text-left align-middle shadow-2xl transition-all">



              <div className="flex justify-between items-center mb-6">

                <div>

                  <h3 className="text-xl font-black text-gray-900 uppercase">Gestión de Alumnos</h3>

                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{courseData?.nombre}</p>

                </div>

                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon /></button>

              </div>



              {/* BARRA DE FILTROS */}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 pb-6 border-b border-gray-100">

                <select

                  className="bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-3 px-4 text-[10px] font-black uppercase outline-none"

                  value={tipoUbicacion}

                  onChange={(e) => { setTipoUbicacion(e.target.value); setSucursalId(""); }}

                >

                  <option value="TODOS">TODAS LAS UBICACIONES</option>

                  <option value="SUCURSALES">SUCURSALES</option>

                  <option value="OFICINA">OFICINA ADMINISTRATIVA</option>

                </select>



                {tipoUbicacion === "SUCURSALES" && (

                  <select

                    className="bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-3 px-4 text-[10px] font-black uppercase outline-none"

                    value={sucursalId}

                    onChange={(e) => setSucursalId(e.target.value)}

                  >

                    <option value="">SELECCIONAR SUCURSAL</option>

                    {sucursales.filter(s => !s.nombre.toUpperCase().includes("OFICINA")).map(suc => (

                      <option key={suc.id} value={suc.id}>{suc.nombre}</option>

                    ))}

                  </select>

                )}



                {/* SELECT DE GRUPOS (TIPO USUARIO) */}

                <select

                  className="bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-3 px-4 text-[10px] font-black uppercase outline-none"

                  value={grupoId}

                  onChange={(e) => setGrupoId(e.target.value)}

                >

                  <option value="">TODOS LOS GRUPOS</option>

                  {grupos.map((g, i) => {

                    const text = getGrupoText(g);

                    return <option key={i} value={text}>{text}</option>;

                  })}

                </select>



                {/* SELECT DE PUESTOS (DEPARTAMENTO) */}

                <select

                  className="bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-3 px-4 text-[10px] font-black uppercase outline-none"

                  value={puesto}

                  onChange={(e) => setPuesto(e.target.value)}

                >

                  <option value="">TODOS LOS PUESTOS</option>

                  {puestos.map((p, i) => {

                    const text = getPuestoText(p);

                    return <option key={i} value={text}>{text}</option>;

                  })}

                </select>

              </div>



              {/* LISTA DE RESULTADOS */}

              <div className="space-y-4">

                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase">

                  <span>Resultados ({displayedUsers.length})</span>

                  <span className="text-green-500">Seleccionados: {selectedUserIds.length}</span>

                </div>



                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">

                  {displayedUsers.map((user) => (

                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-[1.5rem]">

                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">

                          <UserIcon />

                        </div>

                        <div>

                          <p className="font-bold text-gray-900 text-sm uppercase">{user.name || user.nombre}</p>

                          <p className="text-[10px] text-gray-500 uppercase font-black">

                            @{user.usuario || user.username} • {getPuestoText(user)}

                          </p>

                        </div>

                      </div>

                      <button

                        onClick={() => handleToggle(Number(user.id))}

                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${

                          selectedUserIds.includes(Number(user.id)) ? "bg-green-500" : "bg-gray-300"

                        }`}

                      >

                        <span className={`h-5 w-5 transform rounded-full bg-white transition ${

                          selectedUserIds.includes(Number(user.id)) ? "translate-x-6" : "translate-x-1"

                        }`} />

                      </button>

                    </div>

                  ))}

                </div>

              </div>



              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">

                <button onClick={onClose} className="px-6 py-2 text-gray-400 font-black uppercase text-[10px]">Descartar</button>

                <button

                  onClick={handleSave}

                  disabled={loading}

                  className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 uppercase text-[10px] disabled:opacity-50"

                >

                  {loading ? "Guardando..." : "Guardar Cambios"}

                </button>

              </div>

            </Dialog.Panel>

          </div>

        </div>

      </Dialog>

    </Transition.Root>

  );

}
