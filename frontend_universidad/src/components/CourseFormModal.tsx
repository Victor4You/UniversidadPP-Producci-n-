// src/components/CourseFormModal.tsx
// src/components/CourseFormModal.tsx
"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import api from "@/lib/api/axios";

// ICONOS
const XMarkIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
  </svg>
);
const QRIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.875 15.75a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25zM15.75 18.75a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25zM18.75 18.75a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25zM20.25 15.75a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25zM18.75 12.75a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" />
  </svg>
);

export default function CourseFormModal({ isOpen, onClose, courseData, onSave, cursos }: any) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("GENERAL");
  const [baseCategorias, setBaseCategorias] = useState<string[]>(["GENERAL", "OPERATIVO", "ADMINISTRATIVO", "VENTAS", "INDUCCIÓN"]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [profesor, setProfesor] = useState("");
  const [creditos, setCreditos] = useState<number | string>(0);
  const [semestre, setSemestre] = useState("");
  const [estado, setEstado] = useState("activo");
  const [duracion, setDuracion] = useState<number | string>(30);
  const [fechaLimite, setFechaLimite] = useState("");
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split("T")[0]);
  const [newencuestaconfig, setNewencuestaconfig] = useState<any[]>([]);
  const [tipo, setTipo] = useState("general");
  const [secciones, setSecciones] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [categoriasCreadas, setCategoriasCreadas] = useState<string[]>([]);
  const [videosGen, setVideosGen] = useState<any[]>([]);
  const [pdfsGen, setPdfsGen] = useState<any[]>([]);
  const [questionsGen, setQuestionsGen] = useState<any[]>([]);

  const qrUrl = courseData?.id ? `${typeof window !== 'undefined' ? window.location.origin : ''}/asistencia/${courseData.id}/` : "";

  useEffect(() => {
    if (isOpen) {
      api.get('/courses/categories').then(res => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) setBaseCategorias(res.data);
      }).catch(err => console.error("Error categorías:", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const existentes = Array.isArray(cursos) ? cursos.map((c: any) => (c?.categoria || "").trim()) : [];
      const catActualVal = courseData?.categoria || "GENERAL";
      const todas = Array.from(new Set([...baseCategorias, ...existentes, ...categoriasCreadas, catActualVal]))
        .filter(cat => cat && String(cat).trim() !== "");
      setCategorias(todas);

      if (courseData) {
        setNombre(courseData.nombre || "");
        setDescripcion(courseData.descripcion || "");
        setCategoria(catActualVal);
        setProfesor(courseData.profesor || "");
        setCreditos(courseData.creditos !== undefined ? Number(courseData.creditos) : 0);
        setSemestre(courseData.semestre || "");
        setEstado(courseData.estado || "activo");
        setTipo(courseData.tipo || "general");
        setDuracion(courseData.duracionExamen !== undefined ? Number(courseData.duracionExamen) : 30);

        if (courseData.fechaLimite) {
          try { setFechaLimite(new Date(courseData.fechaLimite).toISOString().slice(0, 16)); } catch (e) { setFechaLimite(""); }
        }

        if (courseData.createdAt) {
          try { setCreatedAt(new Date(courseData.createdAt).toISOString().split("T")[0]); } catch (e) {}
        }

        const rawSurvey = Array.isArray(courseData.newencuestaconfig) ? courseData.newencuestaconfig : [];
        setNewencuestaconfig(rawSurvey.length > 0 && typeof rawSurvey[0] === 'string'
          ? rawSurvey.map((s: string, idx: number) => ({ id: Date.now() + idx, tipo: 'rating', pregunta: s, opciones: [] }))
          : rawSurvey
        );

        setVideosGen(Array.isArray(courseData.videos) ? courseData.videos : []);
        setPdfsGen(Array.isArray(courseData.pdfs) ? courseData.pdfs : []);
        setQuestionsGen(Array.isArray(courseData.questions) ? courseData.questions : []);
        setSecciones(Array.isArray(courseData.secciones) ? courseData.secciones : []);
        setActiveTab(0);
      } else {
        setCategoria("GENERAL");
        resetForm();
      }
    }
  }, [isOpen, courseData, cursos, categoriasCreadas, baseCategorias]);

  const resetForm = () => {
    setNombre(""); setDescripcion(""); setCategoria("GENERAL"); setProfesor(""); setCreditos(0);
    setSemestre(""); setEstado("activo"); setDuracion(30); setFechaLimite(""); setTipo("general");
    setSecciones([]); setVideosGen([]); setPdfsGen([]); setQuestionsGen([]);
    setNewencuestaconfig([
      { id: 1, tipo: 'rating', pregunta: 'ENSEÑANZA', opciones: [] },
      { id: 2, tipo: 'rating', pregunta: 'CONTENIDO', opciones: [] }
    ]);
    setActiveTab(0);
    setCreatedAt(new Date().toISOString().split("T")[0]);
  };

  const agregarPreguntaEncuesta = (tipoPregunta: 'rating' | 'cerrada' | 'abierta') => {
    const nueva = { id: Date.now(), tipo: tipoPregunta, pregunta: "", opciones: tipoPregunta === 'cerrada' ? [""] : [] };
    setNewencuestaconfig([...newencuestaconfig, nueva]);
  };

  const updateContent = (key: string, data: any) => {
    if (tipo === "general" || tipo === "in-person") {
      if (key === "videos") setVideosGen(data);
      if (key === "pdfs") setPdfsGen(data);
      if (key === "questions") setQuestionsGen(data);
    } else {
      const newSecciones = [...secciones];
      if (newSecciones[activeTab]) {
        newSecciones[activeTab] = { ...newSecciones[activeTab], [key]: data };
        setSecciones(newSecciones);
      }
    }
  };

  const getContent = (key: string) => {
    if (tipo === "general" || tipo === "in-person") return key === "videos" ? videosGen : key === "pdfs" ? pdfsGen : questionsGen;
    return secciones[activeTab]?.[key] || [];
  };

  const handleFileUpload = async (index: number, type: "video" | "pdf", fileRaw: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileRaw);
    try {
      const res = await api.post(`/courses/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      const list = [...getContent(type === "video" ? "videos" : "pdfs")];
      if (list[index]) {
        list[index].fileUrl = res.data.url;
        updateContent(type === "video" ? "videos" : "pdfs", list);
      }
    } catch (e) { alert("Error al subir el archivo."); } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;

    if (!nombre.trim()) {
      alert("El nombre del curso es obligatorio.");
      return;
    }

    // Seguro de vida para la categoría (nunca irá vacía)
    const categoriaFinal = (categoria && categoria.trim() !== "") ? categoria.toUpperCase().trim() : "GENERAL";

    const safeCreditos = isNaN(Number(creditos)) ? 0 : Number(creditos);
    const safeDuracion = isNaN(Number(duracion)) ? 30 : Number(duracion);

    const coursePayload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoria: categoriaFinal,
      profesor: profesor.trim(),
      creditos: safeCreditos,
      semestre: semestre.trim(),
      estado,
      tipo,
      duracionExamen: safeDuracion,
      fechaLimite: fechaLimite ? new Date(fechaLimite).toISOString() : null,
      newencuestaconfig, // Se manda exactamente como lo definiste
      videos: tipo === "general" ? videosGen : [],
      pdfs: tipo === "general" ? pdfsGen : [],
      questions: (tipo === "general" || tipo === "in-person") ? questionsGen : [],
      secciones: tipo === "specialized" ? secciones : [],
      qrToken: courseData?.qrToken || (tipo === "in-person" ? Math.random().toString(36).substring(2, 15) : null)
    };

    try {
      setUploading(true);
      let response = courseData?.id
        ? await api.patch(`/courses/${courseData.id}`, coursePayload)
        : await api.post(`/courses`, coursePayload);

      if (onSave) await onSave(response.data);
      onClose();
      alert("¡Curso guardado correctamente!");
    } catch (error: any) {
      const errMsg = error.response?.data?.message;
      alert(`Error del servidor: ${Array.isArray(errMsg) ? errMsg.join(", ") : (errMsg || "Inténtalo de nuevo")}`);
      console.error("DETALLE ERROR:", error.response?.data);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">

              {/* HEADER */}
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                <div className="flex items-center gap-4">
                  <Dialog.Title className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
                    {courseData ? "EDITAR CURSO" : "CREAR NUEVO CURSO"}
                  </Dialog.Title>
                  <div className="flex bg-gray-100 p-1 rounded-full scale-90">
                    <button type="button" onClick={() => setTipo("general")} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase transition-all ${tipo === "general" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"}`}>Estándar</button>
                    <button type="button" onClick={() => setTipo("specialized")} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase transition-all ${tipo === "specialized" ? "bg-purple-600 text-white shadow-sm" : "text-gray-400"}`}>Secciones</button>
                    <button type="button" onClick={() => setTipo("in-person")} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase transition-all ${tipo === "in-person" ? "bg-orange-500 text-white shadow-sm" : "text-gray-400"}`}>Presencial</button>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><XMarkIcon /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10 max-h-[75vh] overflow-y-auto pr-4 custom-scrollbar">

                {/* 1. DATOS GENERALES */}
                <div className="bg-gray-50 p-6 rounded-3xl space-y-6 border border-gray-100">
                  <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest">1. DATOS DE LA TARJETA E IDENTIFICACIÓN</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Nombre del curso</label>
                      <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-4 py-2 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-bold bg-white shadow-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Categoría</label>
                      <div className="flex gap-2">
                        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full px-4 py-2 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none bg-white shadow-sm font-bold text-gray-700">
                          {Array.from(new Set(categorias)).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <button type="button" onClick={async () => {
                          const nueva = prompt("Nueva categoría:");
                          if (nueva?.trim()) {
                            setCategoriasCreadas(prev => [...prev, nueva.trim().toUpperCase()]);
                            setCategoria(nueva.trim().toUpperCase());
                          }
                        }} className="bg-blue-600 text-white p-2 rounded-xl flex-shrink-0 shadow-sm"><PlusIcon /></button>
                      </div>
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Descripción</label>
                      <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full px-4 py-2 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-bold bg-white shadow-sm resize-none" rows={2} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Profesor</label>
                      <input value={profesor} onChange={(e) => setProfesor(e.target.value)} className="w-full px-4 py-2 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-bold bg-white shadow-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Créditos</label>
                      <input type="number" value={creditos} onChange={(e) => setCreditos(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white shadow-sm text-center font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Semestre</label>
                      <input value={semestre} onChange={(e) => setSemestre(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white shadow-sm text-center font-bold" placeholder="2024-1" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Estado</label>
                      <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white shadow-sm font-bold">
                        <option value="activo">Activo (Verde)</option>
                        <option value="inactivo">Inactivo (Gris)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Tiempo Examen (Min)</label>
                      <input type="number" value={duracion} onChange={(e) => setDuracion(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white shadow-sm font-bold text-center" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Creación</label>
                      <input type="date" value={createdAt} readOnly className="w-full px-4 py-3 rounded-xl bg-gray-100 font-bold text-gray-500 cursor-not-allowed" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Fecha Límite</label>
                      <input type="datetime-local" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} className="w-full px-4 py-2 border-2 border-blue-500 rounded-xl font-bold bg-white" />
                    </div>
                  </div>
                </div>

                {/* GESTIÓN DE SECCIONES */}
                {tipo === "specialized" && (
                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center border-b-2 border-purple-600 pb-2">
                      <h4 className="font-black text-purple-600 uppercase text-sm tracking-tighter">GESTIÓN DE SECCIONES</h4>
                      <button type="button" onClick={() => {
                        const n = { id: Date.now().toString(), titulo: `Sección ${secciones.length + 1}`, videos: [], pdfs: [], questions: [] };
                        setSecciones([...secciones, n]); setActiveTab(secciones.length);
                      }} className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase">+ AÑADIR SECCIÓN</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {secciones.map((sec, idx) => (
                        <button key={sec.id} type="button" onClick={() => setActiveTab(idx)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all flex-shrink-0 ${activeTab === idx ? "border-purple-600 text-purple-600 bg-purple-50" : "border-gray-200 text-gray-400"}`}>
                          {sec.titulo || `Sección ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* MULTIMEDIA O QR */}
                {tipo !== "in-person" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-4">
                      <h4 className="font-black text-blue-600 text-[11px] uppercase tracking-widest">2. VIDEOS DEL CURSO</h4>
                      {getContent("videos").map((v: any, i: number) => (
                        <div key={v.id} className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 relative space-y-2">
                          <input value={v.title} onChange={(e) => { const l = [...getContent("videos")]; l[i].title = e.target.value; updateContent("videos", l); }} placeholder="Título Video" className="w-full bg-transparent font-bold text-sm outline-none" />
                          <div className="flex gap-2">
                            <input value={v.fileUrl} readOnly className="flex-1 bg-white px-2 py-1 rounded text-[10px] text-blue-500 border border-blue-100" />
                            <input type="file" id={`v-${i}`} className="hidden" accept="video/mp4" onChange={(e) => e.target.files?.[0] && handleFileUpload(i, "video", e.target.files[0])} />
                            <button type="button" onClick={() => document.getElementById(`v-${i}`)?.click()} className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded font-black uppercase">SUBIR</button>
                          </div>
                          <button type="button" onClick={() => updateContent("videos", getContent("videos").filter((x: any) => x.id !== v.id))} className="absolute top-2 right-2 text-red-300"><TrashIcon /></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => updateContent("videos", [...getContent("videos"), { id: Date.now().toString(), title: "", fileUrl: "" }])} className="text-[10px] font-black text-blue-600 uppercase">+ AÑADIR VIDEO</button>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-black text-red-600 text-[11px] uppercase tracking-widest">3. DOCUMENTOS PDF</h4>
                      {getContent("pdfs").map((p: any, i: number) => (
                        <div key={p.id} className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 relative space-y-2">
                          <input value={p.title} onChange={(e) => { const l = [...getContent("pdfs")]; l[i].title = e.target.value; updateContent("pdfs", l); }} placeholder="Título PDF" className="w-full bg-transparent font-bold text-sm outline-none" />
                          <div className="flex gap-2">
                            <input value={p.fileUrl} readOnly className="flex-1 bg-white px-2 py-1 rounded text-[10px] text-blue-500 border border-red-100" />
                            <input type="file" id={`p-${i}`} className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileUpload(i, "pdf", e.target.files[0])} />
                            <button type="button" onClick={() => document.getElementById(`p-${i}`)?.click()} className="text-[10px] bg-red-600 text-white px-3 py-1 rounded font-black uppercase">SUBIR</button>
                          </div>
                          <button type="button" onClick={() => updateContent("pdfs", getContent("pdfs").filter((x: any) => x.id !== p.id))} className="absolute top-2 right-2 text-red-300"><TrashIcon /></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => updateContent("pdfs", [...getContent("pdfs"), { id: Date.now().toString(), title: "", fileUrl: "" }])} className="text-[10px] font-black text-red-600 uppercase">+ AÑADIR PDF</button>
                    </div>
                  </div>
                ) : (
                  /* QR SECCIÓN */
                  <div className="pt-4">
                    <div className="bg-orange-50 p-10 rounded-[2.5rem] border border-orange-100 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="bg-white p-4 rounded-3xl shadow-sm border border-orange-100 w-48 h-48 flex items-center justify-center overflow-hidden">
                        {courseData?.id ? (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}`}
                            alt="QR Asistencia"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-20 h-20 text-orange-200">
                             <QRIcon />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-orange-600 text-lg uppercase tracking-tighter">
                          {courseData?.id ? "Código QR de Asistencia" : "Acceso por Código QR"}
                        </h4>
                        <p className="text-[10px] text-orange-800/60 font-black uppercase max-w-xs mx-auto mt-2">
                          {courseData?.id
                            ? "Muestra este código a los alumnos para que registren su asistencia."
                            : "El código QR se generará automáticamente al publicar este curso."}
                        </p>
                      </div>

                      {courseData?.id && (
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => window.open(qrUrl, '_blank')}
                            className="bg-white border-2 border-orange-200 text-orange-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-orange-100 transition-all"
                          >
                            Abrir Link Directo
                          </button>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="bg-orange-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-orange-200 hover:scale-105 transition-all"
                          >
                            Imprimir QR
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* EXAMEN */}
                <div className="space-y-6 pt-4 border-t">
                  <h4 className="font-black text-gray-800 text-xl tracking-tighter uppercase">4. CONTENIDO DEL EXAMEN</h4>
                  {getContent("questions").map((q: any, i: number) => (
                    <div key={q.id} className="p-6 border rounded-3xl space-y-4 relative bg-gray-50/20">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black px-3 py-1 bg-gray-100 rounded-full text-gray-500">PREGUNTA #{i + 1}</span>
                        <select value={q.type} onChange={(e) => { const l = [...getContent("questions")]; l[i].type = e.target.value; updateContent("questions", l); }} className="text-[10px] font-black bg-transparent text-blue-600 uppercase">
                          <option value="closed">Múltiple</option>
                          <option value="open">Abierta</option>
                        </select>
                      </div>
                      <input value={q.question} onChange={(e) => { const l = [...getContent("questions")]; l[i].question = e.target.value; updateContent("questions", l); }} className="w-full text-lg font-bold bg-transparent outline-none" placeholder="Pregunta..." />
                      {q.type === "closed" && (
                        <div className="space-y-3">
                          {q.options.map((opt: string, oIdx: number) => (
                            <div key={oIdx} className="flex gap-3">
                              <input type="radio" checked={q.answer === opt} onChange={() => { const l = [...getContent("questions")]; l[i].answer = opt; updateContent("questions", l); }} />
                              <input value={opt} onChange={(e) => { const l = [...getContent("questions")]; const opts = [...l[i].options]; opts[oIdx] = e.target.value; l[i].options = opts; updateContent("questions", l); }} className="flex-1 bg-white px-4 py-2 rounded-xl text-sm shadow-sm font-bold" />
                            </div>
                          ))}
                          <button type="button" onClick={() => { const l = [...getContent("questions")]; l[i].options.push(""); updateContent("questions", l); }} className="text-[10px] font-black text-blue-600 underline">+ OPCIÓN</button>
                        </div>
                      )}
                      <button type="button" onClick={() => updateContent("questions", getContent("questions").filter((x: any) => x.id !== q.id))} className="absolute top-4 right-4 text-gray-300"><TrashIcon /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => updateContent("questions", [...getContent("questions"), { id: Date.now().toString(), type: "closed", question: "", options: [""], answer: "" }])} className="bg-black text-white px-6 py-2 rounded-full text-[10px] font-black uppercase">+ PREGUNTA</button>
                </div>

                {/* 5. ENCUESTA DINÁMICA */}
                <div className="space-y-6 pt-4 border-t border-gray-100 bg-gray-50/50 p-6 rounded-[2.5rem]">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h4 className="font-black text-gray-800 text-xl tracking-tighter uppercase">5. ENCUESTA DE SATISFACCIÓN</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Define qué preguntar al finalizar</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => agregarPreguntaEncuesta('rating')} className="bg-yellow-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm">+ POLLITOS</button>
                      <button type="button" onClick={() => agregarPreguntaEncuesta('cerrada')} className="bg-green-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm">+ CERRADA</button>
                      <button type="button" onClick={() => agregarPreguntaEncuesta('abierta')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm">+ ABIERTA</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {newencuestaconfig.map((q, index) => (
                      <div key={q.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative">
                        <div className="flex items-center gap-3 mb-3">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white ${q.tipo === 'rating' ? 'bg-yellow-500' : q.tipo === 'cerrada' ? 'bg-green-600' : 'bg-blue-600'}`}>
                             {q.tipo === 'rating' ? 'SATISFACCIÓN' : q.tipo === 'cerrada' ? 'OPCIÓN MÚLTIPLE' : 'ABIERTA'}
                           </span>
                        </div>
                        <input type="text" value={q.pregunta} onChange={(e) => { const n = [...newencuestaconfig]; n[index].pregunta = e.target.value.toUpperCase(); setNewencuestaconfig(n); }} className="w-full text-sm font-black text-gray-700 outline-none uppercase border-b border-gray-100" placeholder="Escribe la pregunta..." />

                        {q.tipo === 'cerrada' && (
                          <div className="mt-4 pl-4 space-y-2 border-l-2 border-gray-50">
                            {q.opciones.map((opt: string, oIdx: number) => (
                              <input key={oIdx} value={opt} onChange={(e) => { const n = [...newencuestaconfig]; n[index].opciones[oIdx] = e.target.value; setNewencuestaconfig(n); }} className="w-full text-xs py-1 border-b border-transparent focus:border-gray-100" placeholder="Opción..." />
                            ))}
                            <button type="button" onClick={() => { const n = [...newencuestaconfig]; n[index].opciones.push(""); setNewencuestaconfig(n); }} className="text-[9px] font-black text-blue-500 uppercase">+ AÑADIR</button>
                          </div>
                        )}
                        <button type="button" onClick={() => setNewencuestaconfig(newencuestaconfig.filter((_, i) => i !== index))} className="absolute top-4 right-4 text-gray-300"><TrashIcon /></button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-3">
                    <p className="text-[9px] font-bold text-blue-800 uppercase tracking-tight">El sistema incluirá automáticamente una caja de comentarios generales al final.</p>
                  </div>
                </div>

                {/* BOTONES ACCIÓN */}
                <div className="flex justify-end gap-6 pt-10 border-t items-center">
                  <button type="button" onClick={onClose} className="text-sm font-bold text-gray-400 hover:text-gray-600 uppercase">DESCARTAR</button>
                  <button type="submit" disabled={uploading} className={`px-12 py-4 text-white rounded-2xl font-black shadow-xl transition-all ${uploading ? "bg-gray-400" : "bg-blue-600 hover:scale-105"}`}>
                    {courseData ? "GUARDAR CAMBIOS" : "PUBLICAR CURSO"}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
