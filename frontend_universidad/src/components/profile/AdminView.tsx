'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserProfile } from "@/lib/types/user.types";

export default function AdminView({ user }: { user: UserProfile }) {
  // Estado para la configuración de premios
  const [premios, setPremios] = useState<{nivel: number, premio: string}[]>([
    { nivel: 2, premio: "Termo Puro Pollo" },
    { nivel: 3, premio: "Playera Oficial" }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Cargar configuración existente al montar
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings/niveles_premios`)
      .then(res => {
        if (res.data && res.data.value && res.data.value.length > 0) {
          setPremios(res.data.value);
        }
      })
      .catch(err => console.log("No hay configuración previa o error"));
  }, []);

  const handlePremioChange = (index: number, val: string) => {
    const newPremios = [...premios];
    newPremios[index].premio = val;
    setPremios(newPremios);
  };

  const handleAddNivel = () => {
    const nextNivel = premios.length > 0 ? premios[premios.length - 1].nivel + 1 : 2;
    setPremios([...premios, { nivel: nextNivel, premio: "" }]);
  };

  const handleSavePremios = async () => {
    setIsSaving(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
        key: 'niveles_premios',
        value: premios
      });
      alert('Premios actualizados exitosamente');
    } catch (error) {
      alert('Error al guardar configuración');
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Panel de Control</h1>
          <p className="text-secondary-500 text-sm">Administrador: {user.name}</p>
        </div>
        <button className="w-full md:w-auto bg-primary-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-primary-700 transition-all">
          Editar Sistema
        </button>
      </div>

      {/* Stats Responsivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Usuarios Totales', value: '1,250', color: 'blue' },
          { label: 'Cursos Activos', value: '45', color: 'emerald' },
          { label: 'Alertas', value: '12', color: 'rose' },
          { label: 'Departamentos', value: '8', color: 'gold' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-secondary-100 shadow-sm">
            <p className="text-secondary-400 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-secondary-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LOGS ORIGINALES */}
        <div className="bg-white rounded-2xl border border-secondary-100 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-secondary-50">
            <h3 className="font-bold text-secondary-800">Logs de Actividad Reciente</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary-50 text-secondary-500">
                <tr>
                  <th className="p-4 font-medium">Acción</th>
                  <th className="p-4 font-medium">Usuario</th>
                  <th className="p-4 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-50">
                <tr>
                  <td className="p-4 font-medium">Cambio de rol</td>
                  <td className="p-4 text-secondary-600">Admin_Victor</td>
                  <td className="p-4 text-secondary-400">Hace 2 mins</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* NUEVO: CONFIGURACIÓN DE PREMIOS */}
        <div className="bg-white rounded-2xl border border-secondary-100 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-secondary-50 flex justify-between items-center">
            <h3 className="font-bold text-secondary-800">Configurar Recompensas</h3>
            <button onClick={handleAddNivel} className="text-xs bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-lg hover:bg-gray-200">+ Añadir Nivel</button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-xs text-gray-500 mb-4">Define los premios que se desbloquearán cada 500 puntos.</p>
            {premios.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-xl font-black text-sm whitespace-nowrap border border-yellow-200">
                  Nivel {item.nivel}
                </div>
                <input 
                  type="text" 
                  value={item.premio}
                  onChange={(e) => handlePremioChange(idx, e.target.value)}
                  placeholder="Ej. Termo, Playera, Termo..."
                  className="flex-1 p-3 border-2 border-gray-100 rounded-xl text-sm focus:border-blue-500 outline-none"
                />
              </div>
            ))}
            <button 
              onClick={handleSavePremios}
              disabled={isSaving}
              className="w-full mt-4 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all uppercase text-xs"
            >
               {isSaving ? 'Guardando...' : 'Guardar Premios'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
