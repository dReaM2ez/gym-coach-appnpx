'use client';

import React, { useState } from 'react';

export default function VideoLibrary() {
  // Estado para manejar la categoría seleccionada en los filtros
  const [filtroActivo, setFiltroActivo] = useState('Todos');

  // Base de datos simulada de los ejercicios
  const [ejercicios, setEjercicios] = useState([
    { id: 1, nombre: 'Press de pecho con mancuernas', grupo: 'Pecho', url: 'https://youtube.com/...', equipo: 'Mancuernas' },
    { id: 2, nombre: 'Sentadilla libre con barra', grupo: 'Piernas', url: 'https://youtube.com/...', equipo: 'Barra' },
    { id: 3, nombre: 'Extensión de tríceps', grupo: 'Brazos', url: 'https://youtube.com/...', equipo: 'Multi-gimnasio' },
    { id: 4, nombre: 'Remo con barra invertido', grupo: 'Espalda', url: 'https://youtube.com/...', equipo: 'Barra' },
    { id: 5, nombre: 'Elevaciones laterales', grupo: 'Hombros', url: 'https://youtube.com/...', equipo: 'Mancuernas' },
    { id: 6, nombre: 'Cruce de cables', grupo: 'Pecho', url: 'https://youtube.com/...', equipo: 'Multi-gimnasio' },
  ]);

  // Lista de categorías para el menú de filtros
  const categorias = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Brazos', 'Hombros'];

  // Función reactiva para filtrar los ejercicios que se muestran
  const ejerciciosFiltrados = filtroActivo === 'Todos' 
    ? ejercicios 
    : ejercicios.filter(ej => ej.grupo === filtroActivo);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex font-sans">
      
      {/* Barra Lateral del Coach (Idéntica para mantener la navegación) */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col">
        <div className="p-6 font-bold text-xl text-white border-b border-slate-700 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-md text-sm">CP</span>
          Coach Control
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <a href="/coach" className="block px-4 py-3 hover:bg-slate-800 rounded-lg text-sm transition">
            👥 Gestión de Clientes
          </a>
          <a href="/coach/libreria" className="block px-4 py-3 bg-blue-600 text-white shadow-sm rounded-lg text-sm font-medium transition">
            📚 Librería de Ejercicios
          </a>
          <a href="#" className="block px-4 py-3 hover:bg-slate-800 rounded-lg text-sm transition">
            💳 Suscripciones
          </a>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full">
        
        {/* Cabecera y Botón de Acción */}
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-slate-800">Librería de Técnica</h1>
            <p className="text-gray-500">Gestiona los videos explicativos que verán tus clientes en sus rutinas.</p>
          </div>
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm text-sm flex items-center gap-2 whitespace-nowrap">
            + Subir Nuevo Video
          </button>
        </header>

        {/* Barra de Filtros */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categorias.map(categoria => (
            <button
              key={categoria}
              onClick={() => setFiltroActivo(categoria)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filtroActivo === categoria 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {categoria}
            </button>
          ))}
        </div>

        {/* Cuadrícula de Videos (Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ejerciciosFiltrados.map((ejercicio) => (
            <div key={ejercicio.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group">
              
              {/* Simulador de la miniatura del video */}
              <div className="aspect-video bg-slate-200 relative flex items-center justify-center group-hover:bg-slate-300 transition cursor-pointer">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 transition">
                  <span className="text-blue-600 ml-1 text-lg">▶</span>
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {ejercicio.equipo}
                </div>
              </div>

              {/* Información del Ejercicio */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {ejercicio.grupo}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">⋮</button>
                </div>
                <h3 className="font-semibold text-gray-800 leading-tight mb-3">
                  {ejercicio.nombre}
                </h3>
                <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-3">
                  <button className="text-sm text-gray-500 hover:text-blue-600 font-medium transition">Editar</button>
                  <button className="text-sm text-red-400 hover:text-red-600 font-medium transition">Eliminar</button>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Mensaje de estado si no hay resultados */}
        {ejerciciosFiltrados.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">No hay ejercicios en la categoría {filtroActivo}.</p>
            <button 
              onClick={() => setFiltroActivo('Todos')}
              className="text-blue-600 font-medium mt-2 hover:underline"
            >
              Ver todos los ejercicios
            </button>
          </div>
        )}

      </main>
    </div>
  );
}