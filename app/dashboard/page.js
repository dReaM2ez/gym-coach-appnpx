'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, collection, addDoc, query, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function ClientDashboard() {
  const [rutina, setRutina] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [mensajeHistorial, setMensajeHistorial] = useState('');
  const [guardandoHistorial, setGuardandoHistorial] = useState(false);
  
  // PESTAÑAS PRINCIPALES Y DÍA ACTIVO
  const [vistaActiva, setVistaActiva] = useState('entrenamiento'); // 'entrenamiento' | 'historial'
  const [diaSeleccionadoIndex, setDiaSeleccionadoIndex] = useState(0);

  // HISTORIAL
  const [historialSesiones, setHistorialSesiones] = useState([]);
  const [cargandoHistorialDatos, setCargandoHistorialDatos] = useState(false);

  // TEMPORIZADOR DE DESCANSO
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [timerCorriendo, setTimerCorriendo] = useState(false);
  const [timerFinalizado, setTimerFinalizado] = useState(false);

  // 🎬 ESTADO DEL MODAL DE VIDEO
  const [videoModal, setVideoModal] = useState(null);

  const router = useRouter();

  // FUNCIÓN PARA CONVERTIR LINKS DE YOUTUBE A MODO "EMBED" (Incrustado)
  const obtenerLinkEmbed = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/').split('&')[0];
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
    }
    return url;
  };

  // EFECTO CUENTA REGRESIVA Y AUDIO DE ALERTA
  useEffect(() => {
    let intervalo = null;
    if (timerCorriendo && segundosRestantes > 0) {
      intervalo = setInterval(() => {
        setSegundosRestantes((prev) => prev - 1);
      }, 1000);
    } else if (segundosRestantes === 0 && timerCorriendo) {
      setTimerCorriendo(false);
      setTimerFinalizado(true);
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch (e) {
        console.log("Audio no soportado o bloqueado por navegador", e);
      }
    }
    return () => clearInterval(intervalo);
  }, [timerCorriendo, segundosRestantes]);

  const iniciarTimer = (segundos) => {
    setSegundosRestantes(segundos);
    setTimerCorriendo(true);
    setTimerFinalizado(false);
  };

  const pausarOReanudarTimer = () => {
    if (segundosRestantes > 0) {
      setTimerCorriendo(!timerCorriendo);
    }
  };

  const ajustarTiempo = (delta) => {
    setSegundosRestantes((prev) => Math.max(0, prev + delta));
  };

  const resetearTimer = () => {
    setTimerCorriendo(false);
    setSegundosRestantes(0);
    setTimerFinalizado(false);
  };

  const formatearTiempo = (totalSeg) => {
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let canceladorSuscripcion = null;

    const desuscribirAuth = onAuthStateChanged(auth, async (user) => {
      if (user && user.email?.toLowerCase() === 'coach@coachpro.com') {
        router.push('/coach');
        return;
      }

      if (user) {
        setUsuarioActual(user);
        const uidLimpio = user.uid.trim();
        const refDoc = doc(db, 'rutinas', uidLimpio);

        try {
          const docSnap = await getDoc(refDoc);
          if (!docSnap.exists()) {
            await setDoc(refDoc, {
              nombreCliente: user.email.split('@')[0],
              nivelFuerza: "Por definir",
              dias: [
                {
                  id: "dia1",
                  nombre: "Día 1: Tren Superior",
                  ejercicios: [{ id: 1, nombre: "El coach aún no asigna ejercicios", series: 0, reps: "0" }]
                }
              ],
              completados: [],
              registros: {},
              creadoPorElDashboard: true
            });
          }
        } catch (error) {
          console.error("Error creando documento:", error);
        }

        canceladorSuscripcion = onSnapshot(refDoc, (snapshot) => {
          if (snapshot.exists()) {
            setRutina(snapshot.data());
          } else {
            setRutina(null);
          }
          setCargando(false);
        });

      } else {
        setUsuarioActual(null);
        setRutina(null);
        setCargando(false);
      }
    });

    return () => {
      desuscribirAuth();
      if (canceladorSuscripcion) canceladorSuscripcion();
    };
   }, [router]);

  useEffect(() => {
    if (vistaActiva === 'historial' && usuarioActual) {
      cargarHistorialDatos();
    }
  }, [vistaActiva, usuarioActual]);

  const cargarHistorialDatos = async () => {
    setCargandoHistorialDatos(true);
    try {
      const q = query(collection(db, 'rutinas', usuarioActual.uid.trim(), 'historial'));
      const querySnapshot = await getDocs(q);
      const sesiones = [];
      querySnapshot.forEach((docSnap) => {
        sesiones.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      sesiones.sort((a, b) => b.fecha.seconds - a.fecha.seconds);
      setHistorialSesiones(sesiones);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setCargandoHistorialDatos(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // MANEJO DE DÍAS Y PROGRESO
  const diasDisponibles = rutina?.dias && rutina.dias.length > 0 
    ? rutina.dias 
    : [{ id: 'dia1', nombre: 'Día 1: Tren Superior', ejercicios: rutina?.ejerciciosDía1 || [] }];

  const diaActual = diasDisponibles[diaSeleccionadoIndex] || diasDisponibles[0];
  const ejerciciosDelDia = diaActual?.ejercicios || [];

  const toggleEjercicio = async (ejercicioId) => {
    if (!usuarioActual || !rutina) return;
    
    const uidLimpio = usuarioActual.uid.trim();
    const refDoc = doc(db, 'rutinas', uidLimpio);
    
    const completadosActuales = rutina.completados || [];
    let nuevosCompletados = completadosActuales.includes(ejercicioId)
      ? completadosActuales.filter(id => id !== ejercicioId)
      : [...completadosActuales, ejercicioId];

    try {
      await updateDoc(refDoc, { completados: nuevosCompletados });
    } catch (error) {
      console.error("Error al actualizar progreso:", error);
    }
  };

  const guardarRegistro = async (ejercicioId, campo, valor) => {
    if (!usuarioActual || !rutina) return;

    const uidLimpio = usuarioActual.uid.trim();
    const refDoc = doc(db, 'rutinas', uidLimpio);

    const registrosActuales = rutina.registros || {};
    const registroEjercicio = registrosActuales[ejercicioId] || { peso: '', nota: '' };

    const nuevosRegistros = {
      ...registrosActuales,
      [ejercicioId]: {
        ...registroEjercicio,
        [campo]: valor
      }
    };

    try {
      await updateDoc(refDoc, { registros: nuevosRegistros });
    } catch (error) {
      console.error("Error al guardar registro:", error);
    }
  };

  const finalizarEntrenamiento = async () => {
    if (!usuarioActual || !rutina) return;

    setGuardandoHistorial(true);
    setMensajeHistorial('');

    const uidLimpio = usuarioActual.uid.trim();
    const refDoc = doc(db, 'rutinas', uidLimpio);
    const historialRef = collection(db, 'rutinas', uidLimpio, 'historial');

    const totalEjercicios = ejerciciosDelDia.length;
    const completadosEnEsteDia = ejerciciosDelDia.filter(e => rutina.completados?.includes(e.id)).length;
    const porcentaje = totalEjercicios > 0 ? Math.round((completadosEnEsteDia / totalEjercicios) * 100) : 0;
    const idsDelDia = ejerciciosDelDia.map(e => e.id);
    const idsDelDiaTexto = idsDelDia.map(String); // las claves de un objeto siempre son texto
    const completadosTodos = rutina.completados || [];
    const registrosTodos = rutina.registros || {};

    const completadosDelDia = completadosTodos.filter(id => idsDelDia.includes(id));
    const completadosRestantes = completadosTodos.filter(id => !idsDelDia.includes(id));

    const registrosDelDia = {};
    const registrosRestantes = {};
    Object.entries(registrosTodos).forEach(([id, registro]) => {
      if (idsDelDiaTexto.includes(id)) registrosDelDia[id] = registro;
      else registrosRestantes[id] = registro;
    });

    try {
      await addDoc(historialRef, {
        fecha: new Date(),
        fechaFormateada: new Date().toLocaleDateString('es-ES', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }),
        nombreEntrenamiento: diaActual.nombre,
        ejerciciosTotales: totalEjercicios,
        ejerciciosCompletados: completadosEnEsteDia,
        porcentajeCompletado: porcentaje,
        ejerciciosSnapshot: ejerciciosDelDia,
        registrosAtleta: registrosDelDia,
        completadosIds: completadosDelDia
      });

        await updateDoc(refDoc, { completados: completadosRestantes, registros: registrosRestantes });

      setMensajeHistorial(`🎉 ¡${diaActual.nombre} finalizado y guardado con éxito!`);
      setTimeout(() => setMensajeHistorial(''), 5000);
    } catch (error) {
      console.error("Error al guardar en el historial:", error);
      setMensajeHistorial('❌ Error al guardar la sesión.');
    } finally {
      setGuardandoHistorial(false);
    }
  };

  if (cargando) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500 animate-pulse">Sincronizando con Google Cloud...</div>;
  if (!usuarioActual) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500">Inicia sesión primero.</div>;

  const totalEjercicios = ejerciciosDelDia.length;
  const completados = ejerciciosDelDia.filter(e => rutina?.completados?.includes(e.id)).length;
  const progresoPorcentaje = totalEjercicios > 0 ? Math.round((completados / totalEjercicios) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32">
      
      {/* NAVBAR CON NAVEGACIÓN COMPLETA HACIA LA PORTADA Y SECCIONES */}
      <nav className="bg-slate-900 text-white p-4 shadow-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-xl flex items-center gap-2 hover:opacity-90 transition">
              <span className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-md text-sm font-black">CP</span>
              CoachPro
            </Link>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
              <Link href="/" className="hover:text-blue-400 transition flex items-center gap-1">
                🏠 Inicio
              </Link>
              <Link href="/#servicios" className="hover:text-blue-400 transition hidden sm:inline">
                Servicios
              </Link>
              <Link href="/#equipamiento" className="hover:text-blue-400 transition hidden sm:inline">
                Equipamiento
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{rutina?.nombreCliente || 'Atleta'}</p>
              <p className="text-xs text-slate-400">{usuarioActual?.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold px-3 py-1.5 rounded-xl text-xs transition"
            >
              Cerrar Sesión
            </button>
          </div>

        </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-8 px-4 space-y-6">
        
        {/* SELECTOR DE PESTAÑAS DE VISTA */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl w-full sm:w-fit mx-auto sm:mx-0">
          <button 
            onClick={() => setVistaActiva('entrenamiento')}
            className={`flex-1 sm:px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
              vistaActiva === 'entrenamiento' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🔥 Rutina de Hoy
          </button>
          <button 
            onClick={() => setVistaActiva('historial')}
            className={`flex-1 sm:px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
              vistaActiva === 'historial' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📅 Mi Historial
          </button>
        </div>

        {/* VISTA 1: RUTINA MULTI-DÍA */}
        {vistaActiva === 'entrenamiento' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* SELECTOR DE DÍA DE ENTRENAMIENTO */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {diasDisponibles.map((d, index) => (
                <button
                  key={d.id || index}
                  onClick={() => setDiaSeleccionadoIndex(index)}
                  className={`px-5 py-3 rounded-2xl text-xs font-bold transition shrink-0 ${
                    diaSeleccionadoIndex === index
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d.nombre}
                </button>
              ))}
            </div>

            {/* ENCABEZADO DEL DÍA Y BARRA DE PROGRESO */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-black text-slate-800">{diaActual.nombre}</h1>
                  <p className="text-slate-500 mt-1 text-sm">Nivel asignado: <span className="font-bold text-blue-600">{rutina?.nivelFuerza || 'Intermedio'}</span></p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold text-xs">
                  {progresoPorcentaje === 100 ? '🎉 Completado' : `${completados}/${totalEjercicios} ejercicios`}
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progresoPorcentaje}%` }}
                ></div>
              </div>
              <p className="text-right text-xs font-bold text-slate-400 mb-6">{progresoPorcentaje}% Completado</p>

              {/* BOTÓN FINALIZAR ENTRENAMIENTO */}
              <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500 font-medium">
                  ¿Terminaste tu sesión de hoy? Guarda tu progreso en tu historial.
                </p>
                <button
                  onClick={finalizarEntrenamiento}
                  disabled={guardandoHistorial || completados === 0}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition shadow-md shrink-0 text-xs"
                >
                  {guardandoHistorial ? 'Guardando...' : '🏁 Finalizar este Día'}
                </button>
              </div>

              {mensajeHistorial && (
                <div className="mt-4 p-3 rounded-xl text-xs font-bold text-center bg-emerald-50 text-emerald-600 border border-emerald-100">
                  {mensajeHistorial}
                </div>
              )}
            </div>

            {/* LISTA DE EJERCICIOS */}
            <div className="space-y-4">
              {ejerciciosDelDia.map((ejercicio, index) => {
                const estaCompletado = rutina?.completados?.includes(ejercicio.id);
                const registro = rutina?.registros?.[ejercicio.id] || { peso: '', nota: '' };

                return (
                  <div 
                    key={ejercicio.id || index} 
                    onClick={() => toggleEjercicio(ejercicio.id)}
                    className={`rounded-3xl shadow-sm border p-5 flex flex-col gap-4 cursor-pointer transition-all duration-300 ${
                      estaCompletado 
                        ? 'bg-emerald-50/40 border-emerald-200' 
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`font-bold w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          estaCompletado ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {estaCompletado ? '✓' : index + 1}
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg transition-colors ${estaCompletado ? 'text-emerald-800 line-through opacity-80' : 'text-slate-800'}`}>
                            {ejercicio.nombre}
                          </h3>
                          
                          {/* 🎬 NUEVO BOTÓN PARA VER TÉCNICA (SÓLO SI HAY VIDEO) */}
                          {ejercicio.videoUrl && (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setVideoModal(ejercicio.videoUrl); 
                              }}
                              className={`mt-1.5 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all w-fit ${
                                estaCompletado 
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              }`}
                            >
                              ▶️ Ver Técnica
                            </button>
                          )}
                        </div>
                      </div>

                      <div className={`flex gap-3 sm:gap-6 p-2.5 rounded-2xl border transition-colors ${
                        estaCompletado ? 'bg-emerald-100/50 border-emerald-200' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <div className="text-center px-2">
                          <div className="text-[10px] font-bold uppercase text-slate-400">Series</div>
                          <div className={`font-black text-lg ${estaCompletado ? 'text-emerald-800' : 'text-slate-700'}`}>{ejercicio.series}</div>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div className="text-center px-2">
                          <div className="text-[10px] font-bold uppercase text-slate-400">Reps</div>
                          <div className={`font-black text-lg ${estaCompletado ? 'text-emerald-800' : 'text-slate-700'}`}>{ejercicio.reps}</div>
                        </div>
                      </div>
                    </div>

                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center"
                    >
                      <div className="w-full sm:w-1/3 flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm focus-within:border-blue-400 transition-colors">
                        <span className="text-xs font-bold text-slate-400 shrink-0">🏋️ PESO:</span>
                        <input 
                          type="text" 
                          placeholder="Ej. 14 kg"
                          value={registro.peso || ''}
                          onChange={(e) => guardarRegistro(ejercicio.id, 'peso', e.target.value)}
                          className="w-full bg-transparent text-sm font-bold text-blue-700 outline-none placeholder:text-slate-300 placeholder:font-normal"
                        />
                      </div>

                      <div className="w-full sm:w-2/3 flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm focus-within:border-blue-400 transition-colors">
                        <span className="text-xs font-bold text-slate-400 shrink-0">📝 NOTA:</span>
                        <input 
                          type="text" 
                          placeholder="Sensaciones, dificultad, RPE..."
                          value={registro.nota || ''}
                          onChange={(e) => guardarRegistro(ejercicio.id, 'nota', e.target.value)}
                          className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300 placeholder:font-normal"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* VISTA 2: HISTORIAL */}
        {vistaActiva === 'historial' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-black text-slate-800 px-1">Entrenamientos Guardados</h2>
            
            {cargandoHistorialDatos ? (
              <div className="bg-white p-8 rounded-3xl text-center shadow-sm border border-slate-200">
                <p className="text-slate-500 font-semibold animate-pulse">Consultando historial...</p>
              </div>
            ) : historialSesiones.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-slate-200 flex flex-col items-center gap-3">
                <span className="text-4xl">📭</span>
                <p className="text-slate-600 font-medium">Aún no tienes sesiones finalizadas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {historialSesiones.map((sesion) => (
                  <div key={sesion.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-4 gap-3">
                      <div>
                        <h3 className="font-black text-lg text-slate-800 capitalize">{sesion.fechaFormateada}</h3>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mt-1">{sesion.nombreEntrenamiento}</p>
                      </div>
                      <div className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-xl font-bold text-xs">
                        🎯 {sesion.porcentajeCompletado}% Completado
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-wider">Pesos Levantados:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sesion.ejerciciosSnapshot?.map((ej, idx) => {
                          const reg = sesion.registrosAtleta?.[ej.id] || {};
                          return (
                            <div key={idx} className="flex justify-between items-center text-sm p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                              <span className="font-semibold text-slate-700 truncate mr-3 text-xs">{ej.nombre}</span>
                              <div className="shrink-0">
                                {reg.peso ? (
                                  <span className="font-mono bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
                                    {reg.peso}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs italic bg-slate-200 px-2 py-0.5 rounded-lg">Sin registro</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* COMPONENTE FLOTANTE: TEMPORIZADOR DE DESCANSO */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
        <div className={`p-4 rounded-3xl shadow-2xl border backdrop-blur-lg transition-all duration-300 ${
          timerFinalizado
            ? 'bg-emerald-600 text-white border-emerald-400 animate-bounce'
            : segundosRestantes > 0
            ? 'bg-slate-900/95 text-white border-slate-700'
            : 'bg-white/95 text-slate-800 border-slate-200 shadow-xl'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
                timerFinalizado 
                  ? 'bg-white text-emerald-600' 
                  : segundosRestantes > 0 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                ⏱️
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {timerFinalizado ? '¡Descanso Concluido!' : segundosRestantes > 0 ? 'Descanso' : 'Temporizador'}
                </div>
                <div className="font-black font-mono text-2xl tracking-tight leading-none mt-0.5">
                  {segundosRestantes > 0 ? formatearTiempo(segundosRestantes) : timerFinalizado ? '00:00' : 'Listo'}
                </div>
              </div>
            </div>

            {/* BOTONES RÁPIDOS CUANDO NO HAY CRONÓMETRO ACTIVO */}
            {segundosRestantes === 0 && !timerFinalizado && (
              <div className="flex gap-1.5">
                {[30, 60, 90, 120].map((s) => (
                  <button
                    key={s}
                    onClick={() => iniciarTimer(s)}
                    className="bg-slate-100 hover:bg-blue-600 hover:text-white font-black text-xs px-2.5 py-1.5 rounded-xl transition text-slate-700"
                  >
                    {s}s
                  </button>
                ))}
              </div>
            )}

            {/* CONTROLES AVANZADOS CUANDO EL CRONÓMETRO ESTÁ CORRIENDO */}
            {segundosRestantes > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => ajustarTiempo(-10)}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-2 py-1.5 rounded-xl transition"
                  title="Restar 10s"
                >
                  -10s
                </button>
                <button
                  onClick={() => ajustarTiempo(10)}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-2 py-1.5 rounded-xl transition"
                  title="Sumar 10s"
                >
                  +10s
                </button>
                <button
                  onClick={pausarOReanudarTimer}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-md"
                >
                  {timerCorriendo ? 'Pausa' : 'Ir'}
                </button>
                <button
                  onClick={resetearTimer}
                  className="bg-slate-800 hover:bg-red-500/80 text-slate-300 hover:text-white text-xs font-bold px-2 py-1.5 rounded-xl transition"
                >
                  ✕
                </button>
              </div>
            )}

            {timerFinalizado && (
              <button
                onClick={resetearTimer}
                className="bg-white text-emerald-800 font-black text-xs px-4 py-2 rounded-xl shadow-lg hover:bg-emerald-50 transition"
              >
                ¡A Entrenar!
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🎬 MODAL FLOTANTE DE VIDEO DE TÉCNICA */}
      {videoModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setVideoModal(null)}
        >
          <div 
            className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-2xl relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">🎬 Técnica del Ejercicio</h3>
              <button onClick={() => setVideoModal(null)} className="text-slate-400 hover:text-white font-bold text-sm px-2 transition">✕ Cerrar</button>
            </div>
            {/* Aspect Video para que el iframe de Youtube mantenga las proporciones 16:9 */}
            <div className="aspect-video w-full bg-slate-100">
              <iframe 
                src={obtenerLinkEmbed(videoModal)} 
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}