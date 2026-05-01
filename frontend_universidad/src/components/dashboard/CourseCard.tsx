// src/components/dashboard/CourseCard.tsx
import { Card } from "@/components/ui/card";
import Image from "next/image";
import {
  Lock,
  BookOpen,
  CheckCircle2,
  Users,
  AlertCircle,
  Award,
  MapPin,
  Monitor
} from "lucide-react";

interface CourseCardProps {
  title: string;
  instructor: string;
  image: string;
  estudiantes?: number;
  creditos?: number;
  estaHabilitado?: boolean;
  bloqueado?: boolean;
  completado?: boolean;
  tipo?: string;
  asistenciaMarcada?: boolean;
  fechaLimite?: string | Date;
  onClick?: () => void;
  intentos?: number;
}

export const CourseCard = ({
  title,
  instructor,
  image,
  estudiantes = 0,
  creditos = 0,
  estaHabilitado = true,
  bloqueado = false,
  completado = false,
  tipo = 'general',
  intentos = 0,
  asistenciaMarcada = false,
  fechaLimite,
  onClick
}: CourseCardProps) => {

  const fechaExpiracion = fechaLimite ? new Date(fechaLimite) : null;
  const estaExpirado = fechaExpiracion ? fechaExpiracion < new Date() : false;

  const tieneIntentosAgotados = intentos >= 2 && !completado;
  // La condición para habilitar es: (Habilitado AND NO bloqueado AND NO expirado AND NO completado AND NO tiene intentos agotados)
  const puedeAcceder = estaHabilitado && !bloqueado && !estaExpirado && !completado && !tieneIntentosAgotados;

const handleClick = (e: React.MouseEvent) => {
  // Evitamos que el clic se propague si no puede acceder
  if (!puedeAcceder) {
    e.preventDefault();
    e.stopPropagation();
    
    if (completado) alert("Ya has completado y aprobado este curso.");
    else if (estaExpirado) alert("La fecha límite para este curso ya ha pasado.");
    else if (tieneIntentosAgotados) alert("Has agotado tus 2 intentos.");
    return;
  }
  
  if (onClick) onClick();
};

  return (

    <Card
    onClick={handleClick} // Ahora el Card también usa la lógica filtrada
    className={`overflow-hidden transition-all duration-300 relative ${
      puedeAcceder
        ? "hover:shadow-lg cursor-pointer border-gray-200"
        : "opacity-70 grayscale-[0.3] cursor-not-allowed border-gray-100 pointer-events-none" // Agregamos pointer-events-none
    }`}
  >
      <div className="relative h-40 w-full">
        <Image
          src={image}
          alt={title}
          fill
          className={`object-cover ${!puedeAcceder ? "opacity-40" : ""}`}
        />

        <div className={`absolute top-2 right-12 px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-md text-white ${tipo === 'in-person' ? 'bg-purple-600/80' : 'bg-blue-600/80'}`}>
          {tipo === 'in-person' ? <MapPin size={10} /> : <Monitor size={10} />}
          <span className="text-[9px] font-black uppercase">
            {tipo === 'in-person' ? 'Presencial' : 'Virtual'}
          </span>
        </div>

        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white px-2 py-1 rounded-lg flex items-center gap-1 z-20">
          <Award size={12} className="text-yellow-400" />
          <span className="text-[10px] font-black">{creditos} pts</span>
        </div>

        {estaExpirado && !completado && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] z-10">
             <span className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg font-black text-[10px] uppercase">
               EXPIRADO
             </span>
           </div>
        )}
        
        {tieneIntentosAgotados && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] z-10">
           <span className="bg-orange-600 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase">
             INTENTOS AGOTADOS (2/2)
           </span>
         </div>
        )}

        {completado && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/30 backdrop-blur-[1px] z-10">
             <span className="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg font-black text-[10px] uppercase flex items-center gap-2">
               <CheckCircle2 size={14} /> CURSO FINALIZADO
             </span>
           </div>
        )}

        {!puedeAcceder && !estaExpirado && !completado && !tieneIntentosAgotados && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[1px]">
            {bloqueado ? (
              <div className="bg-red-600 text-white p-2 rounded-full shadow-lg animate-pulse">
                <AlertCircle size={24} />
              </div>
            ) : (
              <div className="bg-white/90 p-2 rounded-full shadow-sm">
                <Lock size={20} className="text-gray-600" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-sm line-clamp-2 mb-1 text-gray-900 uppercase tracking-tight">
          {title}
        </h3>

        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500 flex items-center font-medium">
            {instructor}
          </p>
          <div className="flex items-center text-[10px] font-bold text-gray-400">
            <Users size={12} className="mr-1" />
            {estudiantes}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              bloqueado ? "text-red-600" : completado ? "text-green-600" : estaExpirado ? "text-red-600" : estaHabilitado ? "text-purple-600" : "text-gray-400"
            }`}>
              {bloqueado
                ? "PENALIZADO (-1)"
                : completado
                  ? "COMPLETADO"
                  : estaExpirado
                    ? "CERRADO"
                    : tipo === 'in-person' && !asistenciaMarcada
                      ? "ASISTENCIA PENDIENTE"
                      : "DISPONIBLE"}
            </span>
          </div>

          <div className="flex items-center gap-2">

            <button
      disabled={!puedeAcceder} // Esto ya lo tenías, pero la clase pointer-events-none en el Card es el refuerzo
      className={`p-2 rounded-md ${
        puedeAcceder
           ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
           : "bg-gray-100 text-gray-400 cursor-not-allowed"
      }`}
      onClick={handleClick}
    >
                <BookOpen size={16} />
             </button>
             {bloqueado || estaExpirado ? (
               <AlertCircle size={16} className="text-red-500" />
             ) : completado ? (
               <CheckCircle2 size={16} className="text-green-500" />
             ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
};
