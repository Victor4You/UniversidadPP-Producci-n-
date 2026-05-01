// src/app/(dashboard)/dashboard/grupos/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from '@/lib/api/axios';

// 1. Interfaz ajustada exactamente a tu JSON de Postman
interface Estudiante {
  id: string | number;
  nombre: string;
  apellido: string;
  email?: string;
  tipoUsuario: {
    tipo: string;
  };
  sucursal?: {
    nombre: string;
  };
  estado?: 'activo' | 'inactivo';
}

interface Grupo {
  id: string;
  nombre: string;
  categoria: string;
  estudiantesLista: Estudiante[];
  estado: 'activo' | 'inactivo';
}

export default function GruposPage() {
  const { userRole } = usePermission();
  const canEdit = userRole === 'admin';

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [studentPages, setStudentPages] = useState<Record<string, number>>({});
  const studentsPerPage = 6; // Mostramos 6 alumnos por página de grupo
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchAndGroupUsers();
  }, []);
   const fetchAndGroupUsers = async () => {
    try {
      setIsLoading(true);
      
      // 1. Llamamos a TU backend local, al nuevo endpoint que creamos
      // Este endpoint internamente usa el MASTER_TOKEN y va a bridge.ppollo.org
      const response = await axios.get('/users/empleados/todos');

      // 2. Extraemos el array "data" que viene dentro de la respuesta
      // Según el JSON de Postman, la estructura es { "data": [...] }
      const allUsers: Estudiante[] = response.data?.data || [];

      if (!Array.isArray(allUsers) || allUsers.length === 0) {
        console.warn("No se encontraron usuarios en la respuesta:", response.data);
        setGrupos([]);
        return;
      }

      // 3. Definimos las categorías para agrupar
      const categoriasDeseadas = [
        { key: 'COORDINADOR', label: 'Cordinadores' },
        { key: 'SUPERVISOR', label: 'Supervisores' },
        { key: 'ADMINISTRATIVO', label: 'Administrativos' },
        { key: 'CALLCENTER', label: 'Call Center' },
        { key: 'OPERATIVO', label: 'Operativos' }
      ];

      // 4. Procesamos y filtramos
           const gruposProcesados: Grupo[] = categoriasDeseadas.map(cat => {
        const integrantes = allUsers.filter((u: any) => {
           // Revisamos tanto el objeto tipoUsuario como el campo role directo
            const tipo = (u.tipoUsuario?.tipo || u.role || "").toUpperCase();
           return tipo.includes(cat.key);

        });

        return {
          id: cat.key,
          nombre: cat.label,
          categoria: cat.key,
          estudiantesLista: integrantes,
          estado: 'activo'
        };
      }).filter(g => g.estudiantesLista.length > 0);

      setGrupos(gruposProcesados);
    } catch (error) {
      console.error("Error cargando usuarios desde el puente API:", error);
    } finally {
      setIsLoading(false);
    }
  };

   // NUEVA FUNCIÓN PARA EXPORTAR
  const handleExport = async () => {
    if (grupos.length === 0) return alert("No hay datos para exportar");
    
    try {
      setIsExporting(true);
      // Petición POST al nuevo endpoint en tu puerto 3014
        const response = await axios.post('https://api-universidad.ppollo.org/v1/reports/export-groups', { grupos }, {
        responseType: 'blob' // Importante para recibir el archivo
      });
      
      // Crear el link de descarga invisible y forzar el click
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Grupos_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Error al exportar el reporte");
    } finally {
      setIsExporting(false);
    }
  };


  const filteredGrupos = useMemo(() => {
    return grupos.filter(g =>
      g.nombre.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, grupos]);

  const totalPages = Math.ceil(filteredGrupos.length / itemsPerPage);
  const currentGrupos = filteredGrupos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleRow = (grupoId: string) => {
    setExpandedRows(prev => prev.includes(grupoId) ? prev.filter(id => id !== grupoId) : [...prev, grupoId]);
    if (!studentPages[grupoId]) setStudentPages(prev => ({ ...prev, [grupoId]: 1 }));
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse text-blue-600 font-bold">Cargando personal por departamentos...</div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupos por Puesto</h1>
          <p className="text-sm text-gray-600">Visualiza al personal según su rol en la empresa</p>
        </div>
        {/* BOTÓN DE EXPORTACIÓN */}
        <Button 
          onClick={handleExport} 
          disabled={isExporting || isLoading || grupos.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {isExporting ? 'Generando Excel...' : 'Exportar a Excel'}
        </Button>


      </div>

      <div className="relative w-full max-w-md">
        <Input
          className="pl-4 shadow-sm bg-white/80"
          placeholder="Buscar departamento (ej. Cordinadores)..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Departamento / Grupo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Total Integrantes</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentGrupos.map((grupo) => (
                <React.Fragment key={grupo.id}>
                  <tr className="hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => toggleRow(grupo.id)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`mr-3 text-blue-600 transition-transform ${expandedRows.includes(grupo.id) ? 'rotate-180' : ''}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth={3} /></svg>
                        </span>
                        <div className="text-sm font-extrabold text-gray-900">{grupo.nombre}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-700">
                      {grupo.estudiantesLista.length} personas
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-800 border border-green-200 uppercase">
                        Activo
                      </span>
                    </td>
                  </tr>

                  {/* Detalle de integrantes */}
                  {expandedRows.includes(grupo.id) && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={3} className="px-8 py-6">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Lista de {grupo.nombre}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {grupo.estudiantesLista
                            .slice(((studentPages[grupo.id] || 1) - 1) * studentsPerPage, (studentPages[grupo.id] || 1) * studentsPerPage)
                            .map(user => (
                            <div key={user.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {user.nombre?.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                {/* 3. Aquí unimos nombre y apellido */}
                                <div className="text-sm font-bold text-gray-800 truncate" title={`${user.nombre} ${user.apellido}`}>
                                  {user.nombre} {user.apellido}
                                </div>
                                <div className="text-[9px] text-gray-500 truncate" title={user.tipoUsuario?.tipo}>
                                  {user.tipoUsuario?.tipo} • {user.sucursal?.nombre || 'S/S'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Paginación interna de integrantes */}
                        {grupo.estudiantesLista.length > studentsPerPage && (
                          <div className="mt-4 flex justify-center gap-1">
                            {Array.from({ length: Math.ceil(grupo.estudiantesLista.length / studentsPerPage) }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setStudentPages(prev => ({ ...prev, [grupo.id]: i + 1 }))}
                                className={`w-6 h-6 text-[10px] rounded ${studentPages[grupo.id] === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
