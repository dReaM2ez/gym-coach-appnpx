'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [esRegistro, setEsRegistro] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const router = useRouter();

  // 🚀 REDIRECCIÓN AUTOMÁTICA SI YA HAY SESIÓN ACTIVA
  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email === 'coach@coachpro.com') {
          router.push('/coach');
        } else {
          router.push('/dashboard');
        }
      } else {
        setCargando(false);
      }
    });

    return () => desuscribir();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      if (esRegistro) {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        await setDoc(doc(db, 'usuarios', user.uid), {
          email: user.email,
          rol: email.trim().toLowerCase() === 'coach@coachpro.com' ? 'coach' : 'client',
          nombre: email.split('@')[0],
          creadoEn: new Date()
        });

        if (email.trim().toLowerCase() === 'coach@coachpro.com') {
          router.push('/coach');
        } else {
          router.push('/dashboard');
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        if (user.email === 'coach@coachpro.com') {
          router.push('/coach');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Credenciales incorrectas o error en el servicio.');
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <p className="animate-pulse text-sm font-semibold">Verificando sesión activa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 hover:opacity-80 transition">
            <div className="bg-blue-600 text-white font-black w-8 h-8 rounded-xl flex items-center justify-center text-sm">CP</div>
            <span className="text-xl font-bold text-white">CoachPro</span>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {esRegistro ? 'Crear Cuenta Atleta' : 'Iniciar Sesión'}
          </h1>
          <p className="text-xs text-slate-400">
            {esRegistro ? 'Ingresa tus datos para registrarte' : 'Accede a tu plan de entrenamiento personalizado'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-lg shadow-blue-600/30 active:scale-95 mt-2"
          >
            {esRegistro ? 'Registrarme e Ingresar' : 'Entrar a Mi Panel'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center space-y-3">
          <button 
            type="button"
            onClick={() => {
              setEsRegistro(!esRegistro);
              setError('');
            }}
            className="text-xs text-blue-400 hover:underline font-semibold"
          >
            {esRegistro ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate aquí'}
          </button>

          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition">
              ← Volver al inicio sin iniciar sesión
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}