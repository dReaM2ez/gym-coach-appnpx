'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function CoachDashboard() {
  const router = useRouter();
  const [coachUser, setCoachUser] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [estadoGuardado, setEstadoGuardado] = useState('');
  const [cargandoCliente, setCargandoCliente] = useState(false);
  const [registrosCliente, setRegistrosCliente] = useState({});

  const coachFotoUrl = "/coach.jpg";

  // ESTRUCTURA MULTI-DÍA POR DEFECTO (AHORA CON VIDEO URL)
  const diasPorDefecto = [
    {
      id: 'dia1',
      nombre: 'Día 1: Tren Superior',
      ejercicios: [
        { id: 101, nombre: 'Press de pecho con mancuernas', series: 4, reps: '8-10', videoUrl: '' },
        { id: 102, nombre: 'Remo invertido con barra', series: 3, reps: '10-12', videoUrl: '' },
        { id: 103, nombre: 'Cruce en poleas (Multi-gym)', series: 3, reps: '12-15', videoUrl: '' }
      ]
    },
    {
      id: 'dia2',
      nombre: 'Día 2: Tren Inferior',
      ejercicios: [
        { id: 201, nombre: 'Sentadilla con barra', series: 4, reps: '8-10', videoUrl: '' },
        { id: 202, nombre: 'Peso muerto rumano', series: 3, reps: '10-12', videoUrl: '' },
        { id: 203, nombre: 'Zancadas con mancuernas', series: 3, reps: '12 por pierna', videoUrl: '' }
      ]
    }
  ];

  const [dias, setDias] = useState(diasPorDefecto);
  const [diaActivoIndex, setDiaActivoIndex] = useState(0);

  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else if (user.email !== 'coach@coachpro.com') {
        router.push('/dashboard');
      } else {
        setCoachUser(user);
      }
    });

    return () => desuscribir();
  }, [router]);

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const q = query(collection(db, 'usuarios'), where('rol', '==', 'client'));
        const querySnapshot = await getDocs(q);
        const lista = [];
        querySnapshot.forEach((docSnap) => {
          lista.push({
            id: docSnap.id,
            email: docSnap.data().email,
            nombre: docSnap.data().nombre || docSnap.data().email?.split('@')[0] || 'Atleta'
          });
        });

        setClientes(lista);
        if (lista.length > 0) {
          setClienteSeleccionado(lista[0]);
        }
      } catch (error) {
        console.error("Error al cargar clientes:", error);
      }
    };

    cargarClientes();
  }, []);

  useEffect(() => {
    if (!clienteSeleccionado) return;

    setCargandoCliente(true);
    setEstadoGuardado('');

    const refDoc = doc(db, 'rutinas', clienteSeleccionado.id);
    
    const desuscribirSnap = onSnapshot(refDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.dias && Array.isArray(data.dias) && data.dias.length > 0) {
          setDias(data.dias);
        } else if (data.ejerciciosDía1) {
          // Migración/Compatibilidad si solo existía ejerciciosDía1
          setDias([
            {
              id: 'dia1',
              nombre: 'Día 1: Tren Superior',
              ejercicios: data.ejerciciosDía1
            }
          ]);
        } else {
          setDias(diasPorDefecto);
        }
        setRegistrosCliente(data.registros || {});
      } else {
        setDias(diasPorDefecto);
        setRegistrosCliente({});
      }
      setCargandoCliente(false);
    }, (error) => {
      console.error("Error escuchando rutina:", error);
      setCargandoCliente(false);
    });

    return () => desuscribirSnap();
  }, [clienteSeleccionado]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // FUNCIONES DE DÍAS DE ENTRENAMIENTO
  const agregarDia = () => {
    const nuevoNum = dias.length + 1;
    const nuevoDia = {
      id: `dia_${Date.now()}`,
      nombre: `Día ${nuevoNum}: Nuevo Día`,
      ejercicios: [
        { id: Date.now(), nombre: 'Ejercicio 1', series: 3, reps: '10', videoUrl: '' }
      ]
    };
    setDias([...dias, nuevoDia]);
    setDiaActivoIndex(dias.length);
  };

  const eliminarDia = (indexEliminar) => {
    if (dias.length <= 1) {
      alert("La rutina debe tener al menos un día.");
      return;
    }
    const nuevosDias = dias.filter((_, idx) => idx !== indexEliminar);
    setDias(nuevosDias);
    setDiaActivoIndex(0);
  };

  const actualizarNombreDia = (index, nuevoNombre) => {
    const nuevosDias = [...dias];
    nuevosDias[index].nombre = nuevoNombre;
    setDias(nuevosDias);
  };

  // FUNCIONES DE EJERCICIOS DEL DÍA ACTIVO
  const actualizarEjercicio = (ejercicioIndex, campo, valor) => {
    const nuevosDias = [...dias];
    nuevosDias[diaActivoIndex].ejercicios[ejercicioIndex][campo] = valor;
    setDias(nuevosDias);
  };

  const agregarEjercicio = () => {
    const nuevosDias = [...dias];
    const ejerciciosActuales = nuevosDias[diaActivoIndex].ejercicios || [];
    const nuevoId = Date.now();
    
    nuevosDias[diaActivoIndex].ejercicios = [
      ...ejerciciosActuales,
      { id: nuevoId, nombre: 'Nuevo Ejercicio', series: 3, reps: '10-12', videoUrl: '' }
    ];
    setDias(nuevosDias);
  };

  const eliminarEjercicio = (idParaEliminar) => {
    const nuevosDias = [...dias];
    nuevosDias[diaActivoIndex].ejercicios = nuevosDias[diaActivoIndex].ejercicios.filter(
      e => e.id !== idParaEliminar
    );
    setDias(nuevosDias);
  };

  const guardarRutina = async () => {
    if (!clienteSeleccionado) return;
    setEstadoGuardado('Guardando en Firestore...');
    try {
      await setDoc(doc(db, 'rutinas', clienteSeleccionado.id), {
        nombreCliente: clienteSeleccionado.nombre,
        nivelFuerza: "Intermedio",
        dias: dias,
        // Guardamos también ejerciciosDía1 por compatibilidad
        ejerciciosDía1: dias[0]?.ejercicios || [],
        actualizadoEn: new Date()
      }, { merge: true });

      setEstadoGuardado('¡Rutina Multi-Día guardada con éxito!');
      setTimeout(() => setEstadoGuardado(''), 4000);
    } catch (error) {
      console.error("Error al guardar:", error);
      setEstadoGuardado('Error al guardar la rutina.');
    }
  };

  const diaActual = dias[diaActivoIndex] || dias[0];

  return (
    <div className="min-h-screen bg-slate-100 font-sans p-4 sm:p-6 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 rounded-3xl shadow-xl border border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <img 
                src={coachFotoUrl} 
                alt="Coach Profile" 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-lg shadow-blue-500/20"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" title="En línea"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">CoachPro Panel</h1>
                <span className="bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full">
                  Head Coach
                </span>
              </div>
              <p className="text-slate-300 text-sm font-medium mt-0.5">Santiago Alexandro Espinosa</p>
              <p className="text-slate-400 text-xs mt-1">{coachUser?.email}</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold px-4 py-2 rounded-2xl text-xs transition"
          >
            Cerrar Sesión
          </button>
        </header>

        {/* SELECTOR DE CLIENTE */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Atleta / Cliente:</label>
          {clientes.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No hay atletas registrados aún.</p>
          ) : (
            <select 
              value={clienteSeleccionado?.id || ''}
              onChange={(e) => {
                const cliente = clientes.find(c => c.id === e.target.value);
                setClienteSeleccionado(cliente);
              }}
              className="w-full md:w-1/2 p-3.5 border border-slate-300 rounded-2xl bg-slate-50 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  👤 {c.nombre} ({c.email})
                </option>
              ))}
            </select>
          )}
        </section>

        {/* EDITOR DE RUTINA MULTI-DÍA */}
        {clienteSeleccionado && (
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Plan Semanal de {clienteSeleccionado.nombre}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {cargandoCliente ? 'Cargando rutina...' : 'Estructura los días de entrenamiento y guarda los cambios'}
                </p>
              </div>
              <button 
                onClick={guardarRutina}
                disabled={cargandoCliente}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-2xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50 text-sm"
              >
                💾 Guardar Plan Completo
              </button>
            </div>

            {estadoGuardado && (
              <div className={`p-3 rounded-2xl text-xs font-bold text-center ${
                estadoGuardado.includes('éxito') ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {estadoGuardado}
              </div>
            )}

            {/* PESTAÑAS DE DÍAS (MULTI-DÍA) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                <div className="flex gap-2">
                  {dias.map((d, idx) => (
                    <button
                      key={d.id || idx}
                      onClick={() => setDiaActivoIndex(idx)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 ${
                        diaActivoIndex === idx 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.nombre}
                    </button>
                  ))}
                </div>

                <button
                  onClick={agregarDia}
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-3 py-2 rounded-2xl text-xs shrink-0 transition"
                >
                  + Agregar Día
                </button>
              </div>

              {/* EDITOR DEL NOMBRE DEL DÍA SELECCIONADO */}
              {diaActual && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                    <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Nombre del Día:</span>
                    <input 
                      type="text" 
                      value={diaActual.nombre}
                      onChange={(e) => actualizarNombreDia(diaActivoIndex, e.target.value)}
                      className="w-full bg-white p-2 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none text-sm focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  {dias.length > 1 && (
                    <button
                      onClick={() => eliminarDia(diaActivoIndex)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-xl text-xs font-bold transition shrink-0"
                    >
                      🗑️ Eliminar este día
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* LISTA DE EJERCICIOS DEL DÍA ACTIVO */}
            {diaActual && (
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-slate-700">Ejercicios de {diaActual.nombre}:</h3>

                {diaActual.ejercicios?.map((ej, index) => {
                  const reg = registrosCliente[ej.id] || {};

                  return (
                    <div key={ej.id || index} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3 hover:border-slate-300 transition">
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input 
                          type="text" 
                          value={ej.nombre}
                          onChange={(e) => actualizarEjercicio(index, 'nombre', e.target.value)}
                          className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800 outline-none w-full focus:ring-2 focus:ring-blue-500/20 text-sm"
                          placeholder="Nombre del ejercicio"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">Series:</span>
                          <input 
                            type="number" 
                            value={ej.series}
                            onChange={(e) => actualizarEjercicio(index, 'series', parseInt(e.target.value) || 0)}
                            className="w-16 p-2.5 border border-slate-200 rounded-xl bg-white font-bold text-center text-slate-800 outline-none text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">Reps:</span>
                          <input 
                            type="text" 
                            value={ej.reps}
                            onChange={(e) => actualizarEjercicio(index, 'reps', e.target.value)}
                            className="w-20 p-2.5 border border-slate-200 rounded-xl bg-white font-bold text-center text-slate-800 outline-none text-sm"
                          />
                        </div>
                        <button 
                          onClick={() => eliminarEjercicio(ej.id)}
                          className="text-slate-400 hover:text-red-500 font-bold p-2 text-sm transition self-end sm:self-auto"
                        >
                          ✕
                        </button>
                      </div>

                      {/* RESTAURADO: VISUALIZACIÓN DEL PESO Y NOTA DEL ATLETA */}
                      <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100/80 flex flex-col sm:flex-row gap-4 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-blue-900">
                          <span>🏋️ Peso usado:</span>
                          <span className={`px-2 py-0.5 rounded-lg font-mono ${reg.peso ? 'bg-blue-200/80 text-blue-950' : 'text-slate-400 italic'}`}>
                            {reg.peso || 'Sin registro'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 font-medium text-blue-800 flex-1">
                          <span className="font-bold text-blue-900">📝 Nota del atleta:</span>
                          <span className={reg.nota ? 'text-slate-700 font-normal' : 'text-slate-400 italic font-normal'}>
                            {reg.nota ? `"${reg.nota}"` : 'Sin notas'}
                          </span>
                        </div>
                      </div>

                      {/* NUEVO: CAMPO PARA AGREGAR EL ENLACE DEL VIDEO */}
                      <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-200/50">
                        <span className="text-xs font-bold text-slate-500 shrink-0">🎬 Link de Técnica:</span>
                        <input 
                          type="text" 
                          value={ej.videoUrl || ''}
                          onChange={(e) => actualizarEjercicio(index, 'videoUrl', e.target.value)}
                          className="flex-1 p-2 border border-slate-300 rounded-xl bg-white text-xs text-blue-600 outline-none w-full focus:border-blue-400"
                          placeholder="Pega aquí el enlace de YouTube (opcional)"
                        />
                      </div>
                      
                    </div>
                  );
                })}

                <button 
                  onClick={agregarEjercicio}
                  className="w-full py-3.5 border-2 border-dashed border-slate-300 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition text-sm"
                >
                  + Agregar Nuevo Ejercicio a {diaActual.nombre}
                </button>
              </div>
            )}

          </section>
        )}

      </div>
    </div>
  );
}