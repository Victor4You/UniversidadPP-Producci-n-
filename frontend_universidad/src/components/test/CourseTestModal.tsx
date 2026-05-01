// src/components/test/CourseTestModal.tsx
"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import api from "@/lib/api/axios";
import { useAuth } from "@/hooks/useAuth";
import {
  XMarkIcon,
  PlayIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

const PollitoRating = ({ starValue, currentRating, onSelect }: { starValue: number, currentRating: number, onSelect: () => void }) => {
  const labels: Record<number, string> = {
    1: "MUY MALO",
    2: "REGULAR",
    3: "BUENO",
    4: "EXCELENTE"
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onSelect}
        className="transform transition-all duration-200 active:scale-125 hover:scale-110"
      >
        <img
          src={`/assets/images/POLLO-${starValue}.png`}
          alt={labels[starValue]}
          className={`w-10 h-10 object-contain ${currentRating >= starValue ? "grayscale-0 brightness-110" : "grayscale opacity-30"}`}
        />
      </button>
      <span className="text-[7px] font-black text-gray-400 uppercase leading-none">{labels[starValue]}</span>
    </div>
  );
};

const BACKEND_URL = "https://api-universidad.ppollo.org";

interface CourseTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
  enrollmentStatus: any;
  intentos: number;
  onExamSuccess?: (data: any) => void;
  asistenciaMarcada: boolean;
}

export default function CourseTestModal({
  isOpen,
  onClose,
  course,
  enrollmentStatus,
  intentos,
  onExamSuccess,
  asistenciaMarcada
}: CourseTestModalProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const preguntasEncuesta = course?.newencuestaconfig || course?.newEncuestaConfig || [];

  const [showExam, setShowExam] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [currentPDF, setCurrentPDF] = useState<any>(null);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  const [readPDFs, setReadPDFs] = useState<string[]>([]);
  const [canTakeExam, setCanTakeExam] = useState(false);
  const [pdfScrollReached, setPdfScrollReached] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyData, setSurveyData] = useState<any>({ generalComment: "" });
  const [examResult, setExamResult] = useState<any>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  const fechaExpiracion = course?.fechaLimite ? new Date(course.fechaLimite) : null;
  const estaExpirado = fechaExpiracion ? fechaExpiracion < new Date() : false;
  const estaCompletado = enrollmentStatus === true || enrollmentStatus === 'true';
  const tieneIntentosAgotados = intentos >= 2 && !estaCompletado;

  useEffect(() => {
    if (isOpen && course && canTakeExam && !showExam) {
      if (course.tipo === 'in-person' || course.tipo === 'presencial') {
        startExam();
      }
    }
  }, [isOpen, canTakeExam, course?.tipo, showExam]);

  useEffect(() => {
    if (isOpen && course) {
      setShowExam(false);
      setShowSurvey(false);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setWatchedVideos([]);
      setReadPDFs([]);
      setSurveyData({ generalComment: "" });
      setShowSuccessScreen(false);
    }
  }, [isOpen, course]);

  useEffect(() => {
    if (!course || estaCompletado || estaExpirado || tieneIntentosAgotados) {
      setCanTakeExam(false);
      return;
    }

    if (course.tipo === 'in-person' || course.tipo === 'presencial') {
      setCanTakeExam(!!asistenciaMarcada);
      return;
    }

    const hasVideos = course.videos && course.videos.length > 0;
    const hasPDFs = course.pdfs && course.pdfs.length > 0;

    const allVideosWatched = hasVideos
      ? course.videos.every((v: any) => watchedVideos.includes(v.id))
      : true;

    const allPDFsRead = hasPDFs
      ? course.pdfs.every((p: any) => readPDFs.includes(p.id))
      : true;

    setCanTakeExam(allVideosWatched && allPDFsRead);
  }, [watchedVideos, readPDFs, course, estaCompletado, estaExpirado, tieneIntentosAgotados, asistenciaMarcada]);

  useEffect(() => {
    let timer: any;
    if (showExam && !showSurvey && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (showExam && !showSurvey && timeLeft === 0) {
      setShowSurvey(true);
    }
    return () => clearInterval(timer);
  }, [showExam, showSurvey, timeLeft]);

  const getFileUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url}`;
  };

  const handleDownloadDiploma = async () => {
    try {
      const response = await api.get(`/courses/diploma/${user?.id}/${course.id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reconocimiento_${course.nombre}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error descargando diploma", error);
      alert("No se pudo generar el reconocimiento.");
    }
  };

  const startExam = () => {
    if (!course.questions || course.questions.length === 0) {
      alert("Este curso no tiene preguntas configuradas.");
      return;
    }
    const duration = parseInt(course.duracionExamen) || 30;
    setTimeLeft(duration * 60);
    setShowExam(true);
  };

  const handleSubmitFinal = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const finalPayload = {
        userId: user?.id,
        courseId: course.id,
        respuestas: answers,
        survey: {
          respuestasEncuesta: surveyData,
          comentarioGeneral: surveyData.generalComment
        }
      };

      const response = await api.post('/courses/register-completion', finalPayload);

      if (response.data.status === 'FAILED') {
        alert(response.data.message || `No aprobaste. Calificación: ${response.data.score}%`);
        onClose();
      } else {
        setExamResult(response.data);
        setShowSurvey(false);
        setShowSuccessScreen(true);
        if (onExamSuccess) onExamSuccess(response.data);

         handleDownloadDiploma();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Hubo un problema al calificar tu examen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="relative w-full max-w-4xl bg-[#f8fafc] rounded-[40px] shadow-2xl overflow-hidden border border-white">

                {estaCompletado || estaExpirado || tieneIntentosAgotados ? (
                  <div className="p-12 text-center h-[60vh] flex flex-col justify-center items-center bg-white">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${estaCompletado ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {estaCompletado && <AcademicCapIcon className="w-12 h-12" />}
                      {estaExpirado && <ClockIcon className="w-12 h-12" />}
                      {tieneIntentosAgotados && <ExclamationTriangleIcon className="w-12 h-12" />}
                    </div>
                    <h2 className="text-3xl font-black uppercase italic text-slate-900">
                      {estaCompletado ? '¡Curso Completado!' : estaExpirado ? 'Curso Expirado' : 'Intentos Agotados'}
                    </h2>
                    <p className="text-slate-500 font-bold uppercase text-sm mt-4 max-w-md">
                      {estaCompletado && "Ya has aprobado este curso exitosamente."}
                      {estaExpirado && "La fecha límite para realizar este curso ha finalizado."}
                      {tieneIntentosAgotados && "Has agotado los intentos permitidos para este curso."}
                    </p>
                    <button onClick={onClose} className="mt-10 px-10 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase">
                      Cerrar
                    </button>
                  </div>
                ) : showSuccessScreen ? (
                  <div className="p-12 text-center h-[70vh] flex flex-col justify-center items-center bg-[#0a0a0a] text-white">
                    <div className="mb-6 relative">
                      <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 animate-pulse"></div>
                      <AcademicCapIcon className="w-24 h-24 text-yellow-400 relative z-10" />
                    </div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter">¡FELICIDADES!</h2>
                    <p className="text-gray-400 font-bold uppercase text-xs mt-2 tracking-[0.2em]">HAS COMPLETADO EL CURSO EXITOSAMENTE</p>
                    <div className="mt-10 flex flex-col gap-4 w-full max-w-sm">
                      <button
                        onClick={handleDownloadDiploma}
                        className="group relative flex items-center justify-center gap-3 bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-yellow-300 transition-all shadow-[0_0_30px_rgba(250,204,21,0.3)] hover:scale-105 active:scale-95"
                      >
                        <DocumentTextIcon className="w-5 h-5" />
                        GENERAR RECONOCIMIENTO
                      </button>
                      <button onClick={onClose} className="text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">
                        VOLVER AL MENÚ
                      </button>
                    </div>
                  </div>
                ) : showSurvey ? (
                  <div className="space-y-6 py-6 max-w-2xl mx-auto overflow-y-auto max-h-[70vh] px-4">
                    <div className="text-center mb-10">
                      <h3 className="font-black uppercase text-3xl text-black tracking-tighter">Finalizar Evaluación</h3>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">Tu opinión nos ayuda a mejorar</p>
                    </div>

                    <div className="space-y-6">
                      {preguntasEncuesta.map((item: any, idx: number) => {
                        const qText = item.pregunta || item.question || `Pregunta ${idx + 1}`;
                        const qKey = item.id || `q-${idx}`;
                        const qRawType = String(item.tipo || item.type || '').toLowerCase();
                        const optionsList = item.opciones || item.options || [];

                        const isMultipleChoice = qRawType.includes('cerrada') || qRawType.includes('multiple');
                        const isTextQuestion = qRawType.includes('abierta') || qRawType.includes('text');
                        const isPollito = qRawType.includes('rating') || (!isMultipleChoice && !isTextQuestion);

return (
  <div key={qKey} className="p-6 bg-gray-50 rounded-[2rem] border-2 border-transparent hover:border-black/5 transition-all">
    <p className="font-black uppercase text-[11px] text-gray-800 mb-4 tracking-tight leading-relaxed">{qText}</p>
    
    {/* 1. TIPO POLLITO/RATING */}
    {isPollito && (
      <div className="flex justify-around items-end pt-2">
        {[1, 2, 3, 4].map((v) => (
          <PollitoRating
            key={v}
            starValue={v}
            currentRating={surveyData[qKey] === v ? v : 0}
            onSelect={() => setSurveyData({ ...surveyData, [qKey]: v })}
          />
        ))}
      </div>
    )}

    {/* 2. TIPO OPCIÓN MÚLTIPLE */}
    {isMultipleChoice && (
      <div className="grid grid-cols-1 gap-2">
        {optionsList.map((opt: string, oIdx: number) => (
          <button
            key={oIdx}
            onClick={() => setSurveyData({ ...surveyData, [qKey]: opt })}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
              surveyData[qKey] === opt ? "border-blue-600 bg-blue-50" : "border-white bg-white hover:border-gray-200"
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${surveyData[qKey] === opt ? "border-blue-600" : "border-gray-300"}`}>
              {surveyData[qKey] === opt && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
            </div>
            <span className="text-[10px] font-bold uppercase">{opt}</span>
          </button>
        ))}
      </div>
    )}

    {/* 3. TIPO PREGUNTA ABIERTA (ESTE ES EL QUE FALTABA) */}
    {isTextQuestion && (
      <textarea
        className="w-full p-4 rounded-2xl border-2 border-white bg-white text-[11px] font-bold uppercase placeholder:text-gray-300 focus:border-black outline-none transition-all"
        rows={2}
        placeholder="ESCRIBE TU RESPUESTA AQUÍ..."
        value={surveyData[qKey] || ""}
        onChange={(e) => setSurveyData({ ...surveyData, [qKey]: e.target.value })}
      />
    )}
  </div>
);

                      })}
                      <div className="p-6 bg-blue-50/50 rounded-[2rem] border-2 border-blue-100">
                        <p className="font-black uppercase text-[11px] text-blue-900 mb-4">¿TIENES ALGÚN COMENTARIO ADICIONAL?</p>
                        <textarea
                          className="w-full p-5 rounded-2xl border-2 border-blue-100 bg-white text-[11px] font-bold uppercase placeholder:text-gray-300 focus:border-blue-500 outline-none transition-all"
                          rows={3}
                          placeholder="ESCRIBE AQUÍ TUS COMENTARIOS..."
                          value={surveyData.generalComment || ""}
                          onChange={(e) => setSurveyData({ ...surveyData, generalComment: e.target.value })}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSubmitFinal}
                      disabled={isSubmitting}
                      className="w-full mt-8 py-6 bg-black text-white rounded-[2rem] font-black text-xl hover:bg-gray-900 transition-all uppercase tracking-widest shadow-xl disabled:opacity-50"
                    >
                      {isSubmitting ? "GUARDANDO..." : "FINALIZAR Y ENVIAR"}
                    </button>
                  </div>
                ) : showExam ? (
                  <div className="flex flex-col h-[85vh] bg-white">
                    <div className="p-8 border-b flex justify-between items-center">
                      <h2 className="text-2xl font-black uppercase italic">Evaluación Final</h2>
                      <div className={`px-6 py-2 rounded-2xl border-2 ${timeLeft < 60 ? 'border-red-500 text-red-500 animate-pulse' : 'border-slate-100'}`}>
                        <p className="text-[8px] font-black uppercase text-center">Tiempo</p>
                        <p className="text-xl font-black tabular-nums">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-12">
                      {course.questions?.[currentQuestionIndex] && (
                        <div className="max-w-2xl mx-auto">
                          <span className="text-blue-600 font-black text-xs uppercase tracking-widest">Pregunta {currentQuestionIndex + 1} de {course.questions.length}</span>
                          <h3 className="text-2xl font-black text-slate-900 mt-2 mb-8 uppercase leading-tight">{course.questions[currentQuestionIndex].question}</h3>
                          <div className="grid gap-3">
                            {course.questions[currentQuestionIndex].options?.map((opcion: string, i: number) => (
                              <button key={i} onClick={() => setAnswers({ ...answers, [currentQuestionIndex]: opcion })} className={`w-full p-6 rounded-3xl text-left font-bold uppercase text-[11px] border-2 transition-all ${answers[currentQuestionIndex] === opcion ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 bg-white hover:border-slate-300"}`}>
                                <div className="flex items-center gap-4">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[currentQuestionIndex] === opcion ? 'border-blue-600' : 'border-slate-300'}`}>
                                    {answers[currentQuestionIndex] === opcion && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                  </div>
                                  {opcion}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-8 border-t flex justify-between items-center bg-slate-50">
                      <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)} className="text-xs font-black uppercase text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-colors">Anterior</button>
                      <button
                        onClick={() => currentQuestionIndex === course.questions.length - 1 ? setShowSurvey(true) : setCurrentQuestionIndex(prev => prev + 1)}
                        disabled={!answers[currentQuestionIndex]}
                        className="px-10 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase shadow-xl disabled:bg-slate-200 transition-all active:scale-95"
                      >
                        {currentQuestionIndex === course.questions.length - 1 ? 'Finalizar Evaluación' : 'Siguiente Pregunta'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-8 flex justify-between items-start bg-white border-b">
                      <div>
                        <Dialog.Title className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{course.nombre}</Dialog.Title>
                        <div className="flex gap-4 mt-1">
                          <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">{course.categoria || 'General'}</p>
                          <p className="text-slate-400 text-[10px] font-black uppercase">Intentos: {intentos} / 2</p>
                        </div>
                      </div>
                      <button onClick={onClose} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"><XMarkIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="p-8 bg-[#f8fafc]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {course.videos?.map((v: any) => (
                          <button key={v.id} onClick={() => { setCurrentVideo(v); setVideoFinished(false); }} className={`group flex items-center gap-4 p-5 rounded-[28px] border-2 transition-all ${watchedVideos.includes(v.id) ? "bg-green-50 border-green-200" : "bg-white border-white hover:border-blue-100 hover:shadow-xl"}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${watchedVideos.includes(v.id) ? "bg-green-500" : "bg-blue-600 group-hover:bg-blue-700"} text-white`}><PlayIcon className="w-6 h-6" /></div>
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase text-slate-900 leading-tight">{v.title}</p>
                              <p className={`text-[8px] font-bold uppercase mt-1 ${watchedVideos.includes(v.id) ? 'text-green-600' : 'text-slate-400'}`}>{watchedVideos.includes(v.id) ? 'Completado' : 'Video'}</p>
                            </div>
                          </button>
                        ))}
                        {course.pdfs?.map((p: any) => (
                          <button key={p.id} onClick={() => { setCurrentPDF(p); setPdfScrollReached(false); }} className={`group flex items-center gap-4 p-5 rounded-[28px] border-2 transition-all ${readPDFs.includes(p.id) ? "bg-green-50 border-green-200" : "bg-white border-white hover:border-orange-100 hover:shadow-xl"}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${readPDFs.includes(p.id) ? "bg-green-500" : "bg-orange-500 group-hover:bg-orange-600"} text-white`}><DocumentTextIcon className="w-6 h-6" /></div>
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase text-slate-900 leading-tight">{p.title}</p>
                              <p className={`text-[8px] font-bold uppercase mt-1 ${readPDFs.includes(p.id) ? 'text-green-600' : 'text-slate-400'}`}>{readPDFs.includes(p.id) ? 'Leído' : 'Documento PDF'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-12 pt-8 border-t border-slate-200">
                        <button
                          onClick={startExam}
                          disabled={!canTakeExam}
                          className={`w-full py-6 rounded-[32px] font-black text-xs uppercase transition-all shadow-2xl ${canTakeExam ? "bg-black text-white hover:scale-[1.02] active:scale-95" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                        >
                          {canTakeExam ? "Comenzar Evaluación Final" : "Contenido Pendiente para Evaluar"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* OVERLAYS DE MEDIA */}
                {currentVideo && (
                  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
                    <div className="w-full max-w-5xl">
                      <video ref={videoRef} src={getFileUrl(currentVideo.fileUrl)} controls onEnded={() => setVideoFinished(true)} className="w-full aspect-video rounded-3xl shadow-2xl border border-white/10" />
                      <div className="mt-8 flex justify-between items-center px-4">
                        <button onClick={() => setCurrentVideo(null)} className="text-white/50 hover:text-white font-black uppercase text-[10px] tracking-widest">Cerrar Video</button>
                        <button
                          disabled={!videoFinished && !watchedVideos.includes(currentVideo.id)}
                          onClick={() => {
                            if (!watchedVideos.includes(currentVideo.id)) setWatchedVideos(prev => [...prev, currentVideo.id]);
                            setCurrentVideo(null);
                          }}
                          className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${videoFinished || watchedVideos.includes(currentVideo.id) ? "bg-green-500 text-white shadow-xl shadow-green-500/20" : "bg-white/10 text-white/30"}`}
                        >
                          Marcar como Completado
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {currentPDF && (
                  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-sm">
                    <div className="w-full max-w-5xl h-full flex flex-col">
                      <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-white font-black text-[10px] uppercase tracking-widest">{currentPDF.title}</h3>
                        <button onClick={() => setCurrentPDF(null)} className="text-white/50 hover:text-white font-black text-[10px] uppercase">Cerrar Documento</button>
                      </div>
                      <div className="flex-1 bg-white rounded-[32px] overflow-hidden relative shadow-2xl">
                        <iframe src={`${getFileUrl(currentPDF.fileUrl)}#toolbar=0`} className="w-full h-full border-none" />
                        <div onMouseEnter={() => setPdfScrollReached(true)} className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-auto" />
                      </div>
                      <button
                        disabled={!pdfScrollReached && !readPDFs.includes(currentPDF.id)}
                        onClick={() => {
                          if(!readPDFs.includes(currentPDF.id)) setReadPDFs(prev => [...prev, currentPDF.id]);
                          setCurrentPDF(null);
                        }}
                        className={`mt-6 w-full py-5 rounded-2xl font-black uppercase text-[10px] transition-all ${pdfScrollReached || readPDFs.includes(currentPDF.id) ? "bg-green-600 text-white shadow-xl shadow-green-600/20" : "bg-white/10 text-white/20"}`}
                      >
                        {pdfScrollReached || readPDFs.includes(currentPDF.id) ? "Confirmar Lectura del Documento" : "Desliza para leer hasta el final"}
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
