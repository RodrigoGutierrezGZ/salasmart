// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import PlanoSalas from '../components/PlanoSalas';
import { useAuth } from '../hooks/useAuth';
import { useSalas } from '../hooks/useSalas';
import { ESTADOS_SALA } from '../utils/constants';

function StudentDashboard() {
  const { user, role } = useAuth();
  const { salas, loading, error } = useSalas();
  const [vistaActual, setVistaActual] = useState('mapa'); // 'mapa' o 'lista'
  const [tipoVista, setTipoVista] = useState('cards'); // 'cards' o 'plano'
  const [filtroPiso, setFiltroPiso] = useState('todos');
  const [filtroCapacidad, setFiltroCapacidad] = useState('todos');

  // Filtrar salas según disponibilidad + filtros
  const salasMostrar = salas.filter(sala => {
    // Filtro base: solo disponibles si está en modo "mapa"
    const disponibilidad = vistaActual === 'mapa' ? sala.estado === ESTADOS_SALA.DISPONIBLE : true;
    
    // Filtro de piso
    const piso = filtroPiso === 'todos' || sala.piso === parseInt(filtroPiso);
    
    // Filtro de capacidad
    let capacidad = true;
    if (filtroCapacidad !== 'todos') {
      const cap = sala.capacidad;
      if (filtroCapacidad === 'pequena') {
        capacidad = cap <= 15;
      } else if (filtroCapacidad === 'mediana') {
        capacidad = cap > 15 && cap <= 30;
      } else if (filtroCapacidad === 'grande') {
        capacidad = cap > 30;
      }
    }
    
    return disponibilidad && piso && capacidad;
  });

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar user={user} role={role} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background-light">
      <Sidebar user={user} role={role} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          
          {/* Page Heading */}
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-neutral-dark">
                <span className="material-symbols-outlined text-4xl text-secondary">domain</span>
                <span>Consulta de Salas</span>
              </h1>
              <p className="text-base font-normal leading-normal text-gray-500">
                Visualiza el estado y disponibilidad de las salas en tiempo real.
              </p>
            </div>
          </header>

          {/* Filters and View Toggle */}
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              {/* Chips de filtro */}
              <div className="flex flex-wrap gap-3">
                {/* Filtro de Piso */}
                <div className="relative">
                  <select
                    value={filtroPiso}
                    onChange={(e) => setFiltroPiso(e.target.value)}
                    className="h-10 appearance-none rounded-lg border border-neutral-light bg-white pl-4 pr-10 text-sm font-medium text-gray-700 shadow-soft transition-all hover:bg-neutral-light focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="todos">Todos los Pisos</option>
                    <option value="1">Piso 1</option>
                    <option value="2">Piso 2</option>
                    <option value="3">Piso 3</option>
                    <option value="4">Piso 4</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">
                    expand_more
                  </span>
                </div>
                
                {/* Filtro de Capacidad */}
                <div className="relative">
                  <select
                    value={filtroCapacidad}
                    onChange={(e) => setFiltroCapacidad(e.target.value)}
                    className="h-10 appearance-none rounded-lg border border-neutral-light bg-white pl-4 pr-10 text-sm font-medium text-gray-700 shadow-soft transition-all hover:bg-neutral-light focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="todos">Todas las Capacidades</option>
                    <option value="pequena">Pequeña (≤15)</option>
                    <option value="mediana">Mediana (16-30)</option>
                    <option value="grande">Grande (&gt;30)</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">
                    expand_more
                  </span>
                </div>

                {/* Botón para limpiar filtros */}
                {(filtroPiso !== 'todos' || filtroCapacidad !== 'todos') && (
                  <button
                    onClick={() => {
                      setFiltroPiso('todos');
                      setFiltroCapacidad('todos');
                    }}
                    className="flex h-10 items-center gap-2 rounded-lg border border-neutral-light bg-white px-4 text-sm font-medium text-gray-700 shadow-soft transition-all hover:bg-gray-100"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* View Toggle: Mapa vs Lista */}
              <div className="flex gap-3">
                {/* Toggle Cards/Plano para vista mapa */}
                {vistaActual === 'mapa' && (
                  <div className="flex rounded-lg bg-neutral-light p-1">
                    <button 
                      onClick={() => setTipoVista('cards')}
                      className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm transition-all ${
                        tipoVista === 'cards' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-gray-600 font-medium'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">grid_view</span>
                      Cards
                    </button>
                    <button 
                      onClick={() => setTipoVista('plano')}
                      className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm transition-all ${
                        tipoVista === 'plano' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-gray-600 font-medium'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">map</span>
                      Plano
                    </button>
                  </div>
                )}

                {/* Toggle Mapa/Lista */}
                <div className="flex rounded-lg bg-neutral-light p-1">
                  <button 
                    onClick={() => setVistaActual('mapa')}
                    className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm font-semibold transition-all ${
                      vistaActual === 'mapa' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    Solo Disponibles
                  </button>
                  <button 
                    onClick={() => setVistaActual('lista')}
                    className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm transition-all ${
                      vistaActual === 'lista' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-gray-600 font-medium'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">list</span>
                    Todas las Salas
                  </button>
                </div>
              </div>
            </div>

            {/* Floor Plan View / Lista */}
            <div className="rounded-lg border border-neutral-light bg-white p-6 shadow-soft">
              {vistaActual === 'mapa' ? (
                tipoVista === 'plano' ? (
                  /* Vista de Plano */
                  <PlanoSalas 
                    salasData={salasMostrar}
                    onSalaClick={() => {}} // Sin funcionalidad de reserva
                    showReservarText={false} // Ocultar texto "Haz clic para reservar"
                  />
                ) : (
                  /* Vista de Cards (Grid) - Solo lectura */
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {salasMostrar.map((sala) => {
                      const isDisponible = sala.estado === ESTADOS_SALA.DISPONIBLE;
                      
                      return (
                        <div
                          key={sala.id}
                          className="group relative overflow-hidden rounded-xl border-2 bg-white p-6 shadow-md border-neutral-light"
                        >
                          {/* Badge de estado */}
                          <div className="absolute right-4 top-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                sala.estado === ESTADOS_SALA.DISPONIBLE
                                  ? 'bg-success/10 text-success'
                                  : sala.estado === ESTADOS_SALA.PROXIMAMENTE
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-danger/10 text-danger'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {sala.estado === ESTADOS_SALA.DISPONIBLE ? 'check_circle' : 'schedule'}
                              </span>
                              {sala.textoSecundario}
                            </span>
                          </div>

                          {/* Contenido */}
                          <div className="mt-8">
                            <h3 className="mb-4 text-xl font-bold text-neutral-dark">
                              {sala.nombre}
                            </h3>
                            
                            <div className="space-y-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg text-primary">chair</span>
                                <span className="font-medium">{sala.capacidad} personas</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg text-primary">layers</span>
                                <span>Piso {sala.piso}</span>
                              </div>
                              {sala.equipamiento && sala.equipamiento.length > 0 && (
                                <div className="flex items-start gap-2">
                                  <span className="material-symbols-outlined text-lg text-primary">devices</span>
                                  <span className="flex-1">{sala.equipamiento.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Vista de Lista - Todas las salas - Solo lectura */
                <div className="space-y-3">
                  {salasMostrar.map((sala) => (
                    <div 
                      key={sala.id}
                      className={`flex items-center justify-between rounded-lg border border-neutral-light p-4 ${
                        sala.estado !== ESTADOS_SALA.DISPONIBLE && 'opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          sala.estado === ESTADOS_SALA.DISPONIBLE ? 'bg-success/10' : 'bg-danger/10'
                        }`}>
                          <span className={`material-symbols-outlined ${
                            sala.estado === ESTADOS_SALA.DISPONIBLE ? 'text-success' : 'text-danger'
                          }`}>meeting_room</span>
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-dark">{sala.nombre}</p>
                          <p className="text-sm text-gray-500">Piso {sala.piso} • Capacidad: {sala.capacidad}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        sala.estado === ESTADOS_SALA.DISPONIBLE 
                          ? 'bg-success/10 text-success' 
                          : sala.estado === ESTADOS_SALA.PROXIMAMENTE
                          ? 'bg-warning/10 text-warning'
                          : 'bg-danger/10 text-danger'
                      }`}>
                        {sala.textoSecundario || (sala.estado === ESTADOS_SALA.DISPONIBLE ? 'Disponible' : 'Ocupada')}
                      </span>
                    </div>
                  ))}

                  {salasMostrar.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
                      <p className="text-lg text-gray-500">No hay salas que coincidan con los filtros seleccionados</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;