'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const coachFotoUrl = "/coach.jpg";
  const [planFrecuencia, setPlanFrecuencia] = useState<'mensual' | 'trimestral'>('mensual');
  const [usuarioAutenticado, setUsuarioAutenticado] = useState<any>(null);
  const [verificandoAuth, setVerificandoAuth] = useState(true);

  // DETECTAR SI HAY SESIÓN ACTIVA SIN PARPADEO
  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, (user) => {
      setUsuarioAutenticado(user);
      setVerificandoAuth(false);
    });
    return () => desuscribir();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* NAVBAR CON BOTÓN DINÁMICO */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-blue-600 text-white font-black w-9 h-9 rounded-xl flex items-center justify-center text-base shadow-md shadow-blue-600/30">
              CP
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">CoachPro</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <button onClick={() => scrollToSection('servicios')} className="hover:text-blue-600 transition">Servicios</button>
            <button onClick={() => scrollToSection('equipamiento')} className="hover:text-blue-600 transition">Equipamiento</button>
            <button onClick={() => scrollToSection('planes')} className="hover:text-blue-600 transition">Planes</button>
          </nav>

          {/* ESTADO DINÁMICO DE AUTENTICACIÓN */}
          {verificandoAuth ? (
            <div className="px-5 py-2 text-xs font-bold text-slate-400 animate-pulse">Cargando...</div>
          ) : usuarioAutenticado ? (
            <Link 
              href={usuarioAutenticado.email === 'coach@coachpro.com' ? '/coach' : '/dashboard'} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg shadow-emerald-600/20 text-sm active:scale-95 flex items-center gap-2"
            >
              <span>🏋️‍♂️</span> Mi Dashboard
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg shadow-blue-600/20 text-sm active:scale-95"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/60 px-3.5 py-1.5 rounded-full text-blue-700 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            Asesoría Online Personalizada
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Alcanza tu mejor versión con un plan estructurado
          </h1>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
            Deja de improvisar. Únete a mi programa de entrenamiento con rutinas precisas, registro de cargas en tiempo real y técnica adaptada a tu equipamiento.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            {!verificandoAuth && usuarioAutenticado ? (
              <Link 
                href={usuarioAutenticado.email === 'coach@coachpro.com' ? '/coach' : '/dashboard'} 
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all text-sm active:scale-95 text-center"
              >
                Volver a Mi Entrenamiento 🏋️‍♂️
              </Link>
            ) : (
              <>
                <button 
                  onClick={() => scrollToSection('planes')} 
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all text-sm active:scale-95 cursor-pointer"
                >
                  Ver Planes de Entrenamiento
                </button>
                <button 
                  onClick={() => scrollToSection('servicios')} 
                  className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold px-8 py-3.5 rounded-xl transition-all text-sm cursor-pointer hover:border-slate-400"
                >
                  Conocer más
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-center items-center relative">
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px]">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600/20 to-indigo-500/20 blur-2xl -z-10"></div>
            <div className="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-white bg-slate-200">
              <img 
                src={coachFotoUrl} 
                alt="Coach Entrenando" 
                className="w-full h-full object-cover transform hover:scale-105 transition duration-700 ease-out"
              />
            </div>

            <div className="absolute -bottom-2 -left-2 sm:bottom-4 sm:left-0 bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce-slow">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-lg shrink-0">
                🏋️‍♂️
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Planes a Medida</p>
                <p className="text-[10px] font-semibold text-slate-500">Adaptado a tus objetivos</p>
              </div>
            </div>

            <div className="absolute top-6 -right-2 sm:top-10 sm:right-0 bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center text-lg shrink-0">
                ⚡
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Sync en Vivo</p>
                <p className="text-[10px] font-semibold text-slate-500">Atleta ↔ Coach</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">¿Qué incluye la asesoría?</h2>
          <p className="text-slate-500 text-sm mt-3">Todo lo necesario para progresar semana a semana sin estancamientos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left space-y-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 font-black rounded-2xl flex items-center justify-center text-lg">1</div>
            <h3 className="text-xl font-bold text-slate-800">Rutinas Adaptables</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Rutinas personalizadas según el material que tengas a disposición. Tu coach ajusta las series y reps exactas para ti.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left space-y-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 font-black rounded-2xl flex items-center justify-center text-lg">2</div>
            <h3 className="text-xl font-bold text-slate-800">Carga e Historial</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Registra los kilogramos levantados y tus notas personales en cada sesión. Todo queda guardado automáticamente en la nube.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left space-y-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 font-black rounded-2xl flex items-center justify-center text-lg">3</div>
            <h3 className="text-xl font-bold text-slate-800">Sincronización Directa</h3>
            <p className="text-slate-500 text-sm leading-relaxed">El entrenador evalúa tus notas y rendimiento en tiempo real para hacer ajustes periódicos a tu plan de entrenamiento.</p>
          </div>
        </div>
      </section>

      {/* EQUIPAMIENTO */}
      <section id="equipamiento" className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Entrena con el equipamiento que tengas</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-12">Diseñamos planes optimizados tanto para gimnasios completos como para entrenamiento en casa.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 text-center space-y-2 hover:border-blue-500 transition">
              <div className="text-3xl mb-2">🧹</div>
              <h4 className="font-bold text-base">Mancuernas</h4>
              <p className="text-xs text-slate-400">Trabajo unilateral y precisión</p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 text-center space-y-2 hover:border-blue-500 transition">
              <div className="text-3xl mb-2">🏋️‍♂️</div>
              <h4 className="font-bold text-base">Barra Olímpica</h4>
              <p className="text-xs text-slate-400">Ejercicios multiarticulares básicos</p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 text-center space-y-2 hover:border-blue-500 transition">
              <div className="text-3xl mb-2">⚙️</div>
              <h4 className="font-bold text-base">Multi-Gym / Poleas</h4>
              <p className="text-xs text-slate-400">Tensión constante en cada repetición</p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 text-center space-y-2 hover:border-blue-500 transition">
              <div className="text-3xl mb-2">🧘</div>
              <h4 className="font-bold text-base">Peso Corporal</h4>
              <p className="text-xs text-slate-400">Control de movimiento y calistenia</p>
            </div>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Planes de Asesoría</h2>
          <p className="text-slate-500 text-sm mt-2">Elige la modalidad que mejor se adapte a tu ritmo de vida.</p>

          <div className="inline-flex items-center bg-slate-200/80 p-1 rounded-2xl mt-6">
            <button 
              onClick={() => setPlanFrecuencia('mensual')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                planFrecuencia === 'mensual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pago Mensual
            </button>
            <button 
              onClick={() => setPlanFrecuencia('trimestral')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                planFrecuencia === 'trimestral' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plan Trimestral <span className="text-[10px] bg-emerald-400 text-slate-900 px-1.5 py-0.5 rounded-full ml-1 font-extrabold">Ahorra 15%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition">
            <div>
              <span className="bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1 rounded-full uppercase">Atleta Estándar</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-4">Plan Rutina & Seguimiento</h3>
              <p className="text-slate-500 text-xs mt-2">Ideal para mantener un entrenamiento estructurado.</p>

              <div className="my-6">
                <span className="text-4xl font-black text-slate-900">{planFrecuencia === 'mensual' ? '$29' : '$74'}</span>
                <span className="text-slate-400 text-xs font-bold"> / {planFrecuencia === 'mensual' ? 'mes' : '3 meses'}</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">✓ Rutina adaptada a tu equipamiento</li>
                <li className="flex items-center gap-2">✓ Dashboard para registrar pesos y notas</li>
                <li className="flex items-center gap-2">✓ Guardado de historial de entrenamientos</li>
                <li className="flex items-center gap-2">✓ Soporte vía app CoachPro</li>
              </ul>
            </div>

            <Link 
              href={usuarioAutenticado ? '/dashboard' : '/login'} 
              className="mt-8 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-center text-xs transition active:scale-95"
            >
              {usuarioAutenticado ? 'Ir a Mi Dashboard' : 'Empezar Ahora'}
            </Link>
          </div>

          <div className="bg-gradient-to-b from-blue-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between relative border border-blue-700/50">
            <div className="absolute -top-3 right-6 bg-blue-500 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-md">
              Más Recomendado
            </div>

            <div>
              <span className="bg-blue-500/30 text-blue-300 font-bold text-xs px-3 py-1 rounded-full uppercase border border-blue-400/30">Asesoría VIP 1-a-1</span>
              <h3 className="text-2xl font-bold text-white mt-4">Plan CoachPro Directo</h3>
              <p className="text-blue-200 text-xs mt-2">Para resultados acelerados con supervisión directa del Coach.</p>

              <div className="my-6">
                <span className="text-4xl font-black text-white">{planFrecuencia === 'mensual' ? '$49' : '$125'}</span>
                <span className="text-blue-300 text-xs font-bold"> / {planFrecuencia === 'mensual' ? 'mes' : '3 meses'}</span>
              </div>

              <ul className="space-y-3 text-xs text-blue-100 font-medium">
                <li className="flex items-center gap-2">✓ Todo lo del plan estándar</li>
                <li className="flex items-center gap-2">✓ Revisión semanal de técnica por vídeo</li>
                <li className="flex items-center gap-2">✓ Ajustes ilimitados de ejercicios en vivo</li>
                <li className="flex items-center gap-2">✓ Prioridad en soporte y feedback</li>
              </ul>
            </div>

            <Link 
              href={usuarioAutenticado ? '/dashboard' : '/login'} 
              className="mt-8 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-center text-xs transition shadow-lg shadow-blue-600/40 active:scale-95"
            >
              {usuarioAutenticado ? 'Ir a Mi Dashboard' : 'Unirme a la Asesoría VIP'}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white font-bold w-7 h-7 rounded-lg flex items-center justify-center text-xs">
              CP
            </div>
            <span className="font-bold text-white text-sm">CoachPro</span>
          </div>

          <p className="text-slate-500">© 2026 CoachPro. Santiago Alexandro Espinosa Troncoso. Todos los derechos reservados.</p>

          <div className="flex gap-4">
            <Link href={usuarioAutenticado ? '/dashboard' : '/login'} className="hover:text-white transition">Acceso Atleta</Link>
            <Link href={usuarioAutenticado ? '/coach' : '/login'} className="hover:text-white transition">Acceso Coach</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}