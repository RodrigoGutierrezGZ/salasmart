// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import MobileHeader from '../components/layout/MobileHeader';
import MobileSidebar from '../components/layout/MobileSidebar';
import PlanoSalasDinamico from '../components/planos/PlanoSalasDinamico';
import ChatBot from '../components/chatbot/ChatBot';
import CuentaPendiente from '../components/shared/CuentaPendiente';
import { useAuth } from '../hooks/useAuth';
import { useSalas } from '../hooks/useSalas';
import { ESTADOS_SALA } from '../utils/constants';

function StudentDashboard() {
  const { user, role, userData } = useAuth();
  const { salas, loading, error } = useSalas();
  const [vistaActual, setVistaActual] = useState('mapa'); // 'mapa' o 'lista'
  const [tipoVista, setTipoVista] = useState('cards'); // 'cards' o 'plano'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Obtener sedes únicas disponibles para el usuario (filtradas por sedes afiliadas)
  const sedesUnicas = React.useMemo(() => {
    let salasDisponibles = salas;

    // Filtrar por sedes afiliadas (solo para no-admin)
    if (userData?.role !== 'admin' && userData?.sedesAfiliadas && userData.sedesAfiliadas.length > 0) {
      salasDisponibles = salas.filter(sala => userData.sedesAfiliadas.includes(sala.sedeId));
    }

    return [...new Set(salasDisponibles.map(s => ({ id: s.sedeId, nombre: s.sedeCodigo || s.sedeId })).map(JSON.stringify))].map(JSON.parse);
  }, [salas, userData]);

  // Auto-seleccionar sede si solo hay una disponible (inicialización inteligente)
  const sedeInicial = React.useMemo(() => {
    return sedesUnicas.length === 1 ? sedesUnicas[0].id : 'todos';
  }, [sedesUnicas]);

  const [filtroSede, setFiltroSede] = useState(sedeInicial);
  const [filtroEdificio, setFiltroEdificio] = useState('todos');
  const [filtroPiso, setFiltroPiso] = useState('todos');
  const [filtroCapacidad, setFiltroCapacidad] = useState('todos');

  // Actualizar filtroSede cuando cambian las sedes disponibles
  useEffect(() => {
    if (sedesUnicas.length === 1 && filtroSede === 'todos') {
      setFiltroSede(sedesUnicas[0].id);
    }
  }, [sedesUnicas]);

  // Filtrar edificios según sedes afiliadas del usuario
  const edificiosUnicos = React.useMemo(() => {
    let salasParaEdificios = salas;

    // Filtrar por sedes afiliadas (solo para no-admin)
    if (userData?.role !== 'admin' && userData?.sedesAfiliadas && userData.sedesAfiliadas.length > 0) {
      salasParaEdificios = salasParaEdificios.filter(sala => userData.sedesAfiliadas.includes(sala.sedeId));
    }

    // Filtrar por sede seleccionada
    if (filtroSede !== 'todos') {
      salasParaEdificios = salasParaEdificios.filter(s => s.sedeId === filtroSede);
    }

    return [...new Set(salasParaEdificios.map(s => ({ id: s.edificioId, nombre: s.edificioCodigo || s.edificioId })).map(JSON.stringify))].map(JSON.parse);
  }, [salas, userData, filtroSede]);

  // Auto-seleccionar edificio si solo hay uno disponible
  useEffect(() => {
    if (edificiosUnicos.length === 1) {
      // Siempre establecer el único edificio disponible
      setFiltroEdificio(edificiosUnicos[0].id);
    } else if (edificiosUnicos.length > 1 && filtroEdificio !== 'todos') {
      // Si hay múltiples edificios, verificar que el actual siga siendo válido
      const edificioValido = edificiosUnicos.find(e => e.id === filtroEdificio);
      if (!edificioValido) {
        // Si el edificio seleccionado ya no existe, resetear
        setFiltroEdificio('todos');
      }
    }
  }, [edificiosUnicos, filtroEdificio]);

  // Pisos únicos (dinámicos según filtros de sede y edificio)
  let salasParaPisos = salas;

  // PRIMERO filtrar por sedes afiliadas (solo para no-admin)
  if (userData?.role !== 'admin' && userData?.sedesAfiliadas && userData.sedesAfiliadas.length > 0) {
    salasParaPisos = salasParaPisos.filter(s => userData.sedesAfiliadas.includes(s.sedeId));
  }

  // Luego aplicar filtros de sede y edificio seleccionados
  if (filtroSede !== 'todos') {
    salasParaPisos = salasParaPisos.filter(s => s.sedeId === filtroSede);
  }
  if (filtroEdificio !== 'todos') {
    salasParaPisos = salasParaPisos.filter(s => s.edificioId === filtroEdificio);
  }
  const pisosUnicos = [...new Set(salasParaPisos.map(s => s.pisoNumero || s.piso).filter(p => p !== undefined))].sort((a, b) => a - b);

  // Resetear filtros en cascada
  useEffect(() => {
    if (filtroSede === 'todos') {
      setFiltroEdificio('todos');
      setFiltroPiso('todos');
    }
  }, [filtroSede]);

  useEffect(() => {
    if (filtroEdificio === 'todos') {
      setFiltroPiso('todos');
    }
  }, [filtroEdificio]);

  // Filtrar salas según filtros (TODAS las salas, sin filtrar por disponibilidad)
  const salasMostrar = salas.filter(sala => {
    // Filtro por sedes afiliadas (solo para no-admin)
    if (userData?.role !== 'admin' && userData?.sedesAfiliadas && userData.sedesAfiliadas.length > 0) {
      if (!userData.sedesAfiliadas.includes(sala.sedeId)) {
        return false;
      }
    }

    // Filtro por sede
    if (filtroSede !== 'todos' && sala.sedeId !== filtroSede) {
      return false;
    }

    // Filtro por edificio
    if (filtroEdificio !== 'todos' && sala.edificioId !== filtroEdificio) {
      return false;
    }

    // Filtro por piso (compatibilidad con ambos campos)
    if (filtroPiso !== 'todos') {
      const pisoSala = sala.pisoNumero || sala.piso;
      if (pisoSala !== parseInt(filtroPiso)) {
        return false;
      }
    }

    // Filtro de capacidad
    if (filtroCapacidad !== 'todos') {
      const cap = sala.capacidad;
      if (filtroCapacidad === 'pequena' && cap > 15) {
        return false;
      }
      if (filtroCapacidad === 'mediana' && (cap <= 15 || cap > 30)) {
        return false;
      }
      if (filtroCapacidad === 'grande' && cap <= 30) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex h-screen bg-background-light dark:bg-background-dark">
        <Sidebar user={user} role={role} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-text-dark-secondary">Cargando...</p>
          </div>
        </main>
      </div>
    );
  }

  // Verificar si el usuario está INACTIVO, ELIMINADO o no tiene sedes asignadas
  if (userData?.role !== 'admin') {
    // PRIMERO: Verificar si la cuenta fue eliminada
    if (userData?.eliminado === true) {
      return <CuentaPendiente user={user} role={role} userData={userData} />;
    }

    // SEGUNDO: Verificar si la cuenta está aprobada (activo = true)
    if (userData?.activo === false) {
      return <CuentaPendiente user={user} role={role} userData={userData} />;
    }

    // TERCERO: Si está activo pero no tiene sedes asignadas
    if (!userData?.sedesAfiliadas || userData.sedesAfiliadas.length === 0) {
      return <CuentaPendiente user={user} role={role} userData={userData} />;
    }
  }

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark">
      <Sidebar user={user} role={role} />
      <MobileSidebar 
        user={user} 
        role={role} 
        isOpen={mobileSidebarOpen} 
        onClose={() => setMobileSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col">
        <MobileHeader 
          user={user} 
          role={role} 
          userData={userData}
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 lg:p-8 pb-8">
          <div className="mx-auto max-w-7xl space-y-2 sm:space-y-3 lg:space-y-8">
          
          {/* Page Heading */}
          <header className="flex flex-col gap-2 lg:gap-3">
            <h1 className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 text-base sm:text-lg lg:text-3xl font-bold tracking-tight text-neutral-dark dark:text-text-dark-primary truncate">
              <span className="material-symbols-outlined text-lg sm:text-2xl lg:text-4xl text-secondary flex-shrink-0">domain</span>
              <span className="hidden sm:inline">Consulta de Salas</span>
              <span className="sm:hidden">Salas</span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-base font-normal leading-tight text-gray-600 dark:text-text-dark-primary">
              Visualiza la disponibilidad en tiempo real
            </p>
          </header>

          {/* Filters and View Toggle */}
          <section className="space-y-2 sm:space-y-3 lg:space-y-6">
            <div className="flex flex-col gap-2 sm:gap-3">
              
              {/* Chips de filtro - Grid responsivo */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 lg:gap-3">
                {/* Filtro de Sede */}
                {sedesUnicas.length > 1 && (
                  <div className="relative">
                    <select
                      value={filtroSede}
                      onChange={(e) => setFiltroSede(e.target.value)}
                      className="h-8 lg:h-10 w-full appearance-none rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark pl-2 lg:pl-4 pr-6 lg:pr-10 text-xs lg:text-sm font-medium text-gray-700 dark:text-text-dark-primary shadow-soft transition-all hover:bg-neutral-light dark:hover:bg-card-bg-dark-hover focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                    >
                      <option value="todos">Sedes</option>
                      {sedesUnicas.map(sede => (
                        <option key={sede.id} value={sede.id}>
                          {sede.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-text-dark-secondary text-lg">
                      expand_more
                    </span>
                  </div>
                )}

                {/* Filtro de Edificio */}
                {edificiosUnicos.length > 1 && (
                  <div className="relative">
                    <select
                      value={filtroEdificio}
                      onChange={(e) => setFiltroEdificio(e.target.value)}
                      className="h-8 lg:h-10 w-full appearance-none rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark pl-2 lg:pl-4 pr-6 lg:pr-10 text-xs lg:text-sm font-medium text-gray-700 dark:text-text-dark-primary shadow-soft transition-all hover:bg-neutral-light dark:hover:bg-card-bg-dark-hover focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                    >
                      <option value="todos">Edificios</option>
                      {edificiosUnicos.map(edificio => (
                        <option key={edificio.id} value={edificio.id}>
                          {edificio.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-text-dark-secondary text-lg">
                      expand_more
                    </span>
                  </div>
                )}

                {/* Filtro de Piso */}
                <div className="relative">
                  <select
                    value={filtroPiso}
                    onChange={(e) => setFiltroPiso(e.target.value)}
                    className="h-8 lg:h-10 w-full appearance-none rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark pl-2 lg:pl-4 pr-6 lg:pr-10 text-xs lg:text-sm font-medium text-gray-700 dark:text-text-dark-primary shadow-soft transition-all hover:bg-neutral-light dark:hover:bg-card-bg-dark-hover focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="todos">Pisos</option>
                    {pisosUnicos.map(piso => (
                      <option key={piso} value={piso}>
                        P{piso}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-text-dark-secondary text-lg">
                    expand_more
                  </span>
                </div>

                {/* Filtro de Capacidad */}
                <div className="relative">
                  <select
                    value={filtroCapacidad}
                    onChange={(e) => setFiltroCapacidad(e.target.value)}
                    className="h-8 lg:h-10 w-full appearance-none rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark pl-2 lg:pl-4 pr-6 lg:pr-10 text-xs lg:text-sm font-medium text-gray-700 dark:text-text-dark-primary shadow-soft transition-all hover:bg-neutral-light dark:hover:bg-card-bg-dark-hover focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="todos">Capacidades</option>
                    <option value="pequena">Pequeña</option>
                    <option value="mediana">Mediana</option>
                    <option value="grande">Grande</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-text-dark-secondary text-lg">
                    expand_more
                  </span>
                </div>

                {/* Botón para limpiar filtros */}
                {(() => {
                  const sedeModificada = sedesUnicas.length > 1 && filtroSede !== 'todos';
                  const edificioModificado = edificiosUnicos.length > 1 && filtroEdificio !== 'todos';
                  const hayFiltrosAplicados = sedeModificada || edificioModificado || filtroPiso !== 'todos' || filtroCapacidad !== 'todos';

                  return hayFiltrosAplicados && (
                    <button
                      onClick={() => {
                        if (sedesUnicas.length > 1) {
                          setFiltroSede('todos');
                        }
                        setFiltroEdificio('todos');
                        setFiltroPiso('todos');
                        setFiltroCapacidad('todos');
                      }}
                      className="flex h-8 lg:h-10 items-center justify-center gap-1 lg:gap-2 rounded-lg border border-danger/30 dark:border-danger/50 bg-danger/10 dark:bg-danger/20 px-2 lg:px-4 text-xs lg:text-sm font-medium text-danger dark:text-danger shadow-soft transition-all hover:bg-danger/20 dark:hover:bg-danger/30"
                    >
                      <span className="material-symbols-outlined text-base lg:text-lg flex-shrink-0">close</span>
                      <span className="hidden sm:inline">Limpiar</span>
                    </button>
                  );
                })()}
              </div>

              {/* View Toggle */}
              <div className="flex flex-wrap gap-2">
                {/* Toggle Cards/Plano para vista mapa */}
                {vistaActual === 'mapa' && (
                  <div className="flex rounded-lg bg-neutral-light dark:bg-neutral-dark p-1">
                    <button
                      onClick={() => setTipoVista('cards')}
                      className={`flex items-center gap-1 rounded px-2 lg:px-4 py-1.5 text-xs lg:text-sm transition-all ${
                        tipoVista === 'cards' ? 'bg-white dark:bg-card-bg-dark-hover text-primary font-semibold shadow-sm' : 'text-gray-600 dark:text-text-dark-primary font-medium'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg flex-shrink-0">grid_view</span>
                      <span className="hidden sm:inline">Cards</span>
                    </button>
                    <button 
                      onClick={() => setTipoVista('plano')}
                      className={`flex items-center gap-1 rounded px-2 lg:px-4 py-1.5 text-xs lg:text-sm transition-all ${
                        tipoVista === 'plano' ? 'bg-white dark:bg-primary/20 text-primary font-semibold shadow-sm' : 'text-gray-600 dark:text-text-dark-primary font-medium'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg flex-shrink-0">map</span>
                      <span className="hidden sm:inline">Plano</span>
                    </button>
                  </div>
                )}

                {/* Toggle Mapa/Lista */}
                <div className="flex rounded-lg bg-neutral-light dark:bg-neutral-dark p-1">
                  <button 
                    onClick={() => setVistaActual('mapa')}
                    className={`flex items-center gap-1 rounded px-2 lg:px-4 py-1.5 text-xs lg:text-sm font-semibold transition-all ${
                      vistaActual === 'mapa' ? 'bg-white dark:bg-card-bg-dark-hover text-primary shadow-sm' : 'text-gray-600 dark:text-text-dark-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg flex-shrink-0">check_circle</span>
                    <span className="hidden sm:inline">Solo Disponibles</span>
                    <span className="sm:hidden">Disponibles</span>
                  </button>
                  <button 
                    onClick={() => setVistaActual('lista')}
                    className={`flex items-center gap-1 rounded px-2 lg:px-4 py-1.5 text-xs lg:text-sm transition-all ${
                      vistaActual === 'lista' ? 'bg-white dark:bg-card-bg-dark-hover text-primary font-semibold shadow-sm' : 'text-gray-600 dark:text-text-dark-primary font-medium'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg lg:text-xl">list</span>
                    <span className="hidden sm:inline">Todas las Salas</span>
                    <span className="sm:hidden">Todas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Floor Plan View / Lista */}
            <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark p-3 lg:p-6 shadow-soft">
              {vistaActual === 'mapa' ? (
                tipoVista === 'plano' ? (
                  /* Vista de Plano Dinámico */
                  <PlanoSalasDinamico
                    pisoInicial={filtroPiso === 'todos' ? 1 : parseInt(filtroPiso)}
                    filtroSede={filtroSede}
                    filtroEdificio={filtroEdificio}
                  />
                ) : (
                  /* Vista de Cards (Grid) - Solo lectura */
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {salasMostrar.map((sala) => {
                      const isDisponible = sala.estado === ESTADOS_SALA.DISPONIBLE;
                      
                      return (
                        <div
                          key={sala.id}
                          className="group relative overflow-hidden rounded-xl border-2 bg-white dark:bg-card-bg-dark p-4 sm:p-6 shadow-md border-neutral-light dark:border-border-dark"
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
                          <div className="mt-6 sm:mt-8">
                            <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-neutral-dark dark:text-text-dark-primary">
                              {sala.nombre}
                            </h3>
                            
                            <div className="space-y-2 sm:space-y-3 text-sm text-gray-700 dark:text-text-dark-primary">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg text-primary">chair</span>
                                <span className="font-medium">{sala.capacidad} personas</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg text-primary">layers</span>
                                <span>Piso {sala.pisoNumero || sala.piso}</span>
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
                      className={`flex items-center justify-between rounded-lg border border-neutral-light p-3 sm:p-4 ${
                        sala.estado !== ESTADOS_SALA.DISPONIBLE && 'opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          sala.estado === ESTADOS_SALA.DISPONIBLE ? 'bg-success/10' : 'bg-danger/10'
                        }`}>
                          <span className={`material-symbols-outlined text-lg sm:text-xl ${
                            sala.estado === ESTADOS_SALA.DISPONIBLE ? 'text-success' : 'text-danger'
                          }`}>meeting_room</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-neutral-dark text-sm sm:text-base truncate">{sala.nombre}</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-text-dark-primary truncate">Piso {sala.pisoNumero || sala.piso} • Capacidad: {sala.capacidad}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 sm:px-3 py-1 text-xs font-medium flex-shrink-0 ${
                        sala.estado === ESTADOS_SALA.DISPONIBLE 
                          ? 'bg-success/10 text-success' 
                          : sala.estado === ESTADOS_SALA.PROXIMAMENTE
                          ? 'bg-warning/10 text-warning'
                          : 'bg-danger/10 text-danger'
                      }`}>
                        <span className="hidden sm:inline">
                          {sala.textoSecundario || (sala.estado === ESTADOS_SALA.DISPONIBLE ? 'Disponible' : 'Ocupada')}
                        </span>
                        <span className="sm:hidden">
                          {sala.estado === ESTADOS_SALA.DISPONIBLE ? 'Disp.' : 'Ocup.'}
                        </span>
                      </span>
                    </div>
                  ))}

                  {salasMostrar.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">search_off</span>
                      <p className="text-lg text-gray-500 dark:text-text-dark-secondary">No hay salas que coincidan con los filtros seleccionados</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
      </div>

      {/* Chatbot flotante */}
      <ChatBot />
    </div>
  );
}

export default StudentDashboard;