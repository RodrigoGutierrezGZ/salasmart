// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import MobileHeader from '../components/layout/MobileHeader';
import MobileSidebar from '../components/layout/MobileSidebar';
import FormularioReserva from '../components/docente/FormularioReserva';
import PlanoSalasDinamico from '../components/planos/PlanoSalasDinamico';
import ChatBot from '../components/chatbot/ChatBot';
import CuentaPendiente from '../components/shared/CuentaPendiente';
import { useSalas } from '../hooks/useSalas';
import { useAuth } from '../hooks/useAuth';
import { ESTADOS_SALA } from '../utils/constants';

function TeacherDashboard() {
  const { salas, loading, error } = useSalas();
  const { user, role, userData } = useAuth();
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);
  const [showFormulario, setShowFormulario] = useState(false);
  const [showListaSalas, setShowListaSalas] = useState(false);
  const [vistaActual, setVistaActual] = useState('disponibles'); // 'disponibles' o 'todas'
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
    if (edificiosUnicos.length === 1 && filtroEdificio === 'todos') {
      setFiltroEdificio(edificiosUnicos[0].id);
    }
  }, [edificiosUnicos]);

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

  // Reset filtros en cascada
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

  const handleReservar = (sala) => {
    setSalaSeleccionada(sala);
    setShowFormulario(true);
  };

  const handleCloseFormulario = () => {
    setSalaSeleccionada(null);
    setShowFormulario(false);
  };

  const handleReservaCreada = () => {
    handleCloseFormulario();
    // TODO: Mostrar notificación de éxito
  };

  // Filtrar salas según filtros (mostrar TODAS con sus colores)
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

    // Filtro por capacidad
    if (filtroCapacidad !== 'todos') {
      const capacidad = sala.capacidad || 0;
      switch(filtroCapacidad) {
        case 'pequena':
          return capacidad <= 15;
        case 'mediana':
          return capacidad > 15 && capacidad <= 30;
        case 'grande':
          return capacidad > 30;
        default:
          return true;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar user={user} role={role} />
        <main className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando...</p>
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
    <div className="flex h-screen bg-background-light dark:bg-gray-900">
      {/* Sidebar Desktop */}
      <Sidebar user={user} role={role} />
      
      {/* Mobile Header */}
      <MobileHeader 
        user={user} 
        role={role} 
        userData={userData}
        onMenuClick={() => setMobileSidebarOpen(true)}
      />
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        user={user} 
        role={role} 
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      
      {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 p-4 lg:p-8 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">
          
          {/* Page Heading */}
          <header className="flex flex-col lg:flex-row lg:flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="flex items-center gap-2 lg:gap-3 text-2xl lg:text-3xl font-bold tracking-tight text-neutral-dark dark:text-white">
                <span className="material-symbols-outlined text-3xl lg:text-4xl text-primary">school</span>
                <span>Panel del Docente</span>
              </h1>
              <p className="text-sm lg:text-base font-normal leading-normal text-gray-500 dark:text-gray-400">
                Gestiona tus reservas de salas y consulta disponibilidad en tiempo real.
              </p>
            </div>
            <button 
              onClick={() => setShowListaSalas(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 lg:px-6 py-2 lg:py-3 text-white font-semibold shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl text-sm lg:text-base w-full lg:w-auto justify-center lg:justify-start"
            >
              <span className="material-symbols-outlined text-lg lg:text-xl">add_circle</span>
              <span className="lg:inline">Nueva Reserva</span>
            </button>
          </header>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 dark:bg-red-900/20 dark:border-red-500/30 p-4">
              <span className="material-symbols-outlined text-danger dark:text-red-400">error</span>
              <p className="text-sm text-danger dark:text-red-400">{error}</p>
            </div>
          )}

          {/* View Toggle and Filters */}
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              {/* Tipo de Vista: Cards vs Plano */}
              <div className="flex rounded-lg bg-neutral-light dark:bg-gray-800 p-1">
                <button 
                  onClick={() => setTipoVista('cards')}
                  className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm font-semibold transition-all ${
                    tipoVista === 'cards' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">grid_view</span>
                  Cards
                </button>
                <button 
                  onClick={() => setTipoVista('plano')}
                  className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm transition-all ${
                    tipoVista === 'plano' ? 'bg-white dark:bg-gray-700 text-primary font-semibold shadow-sm' : 'text-gray-600 dark:text-gray-300 font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">map</span>
                  Plano
                </button>
              </div>

              {/* View Toggle: Disponibles vs Todas */}
              <div className="flex rounded-lg bg-neutral-light dark:bg-gray-800 p-1">
                <button 
                  onClick={() => setVistaActual('disponibles')}
                  className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm font-semibold transition-all ${
                    vistaActual === 'disponibles' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  Solo Disponibles
                </button>
                <button 
                  onClick={() => setVistaActual('todas')}
                  className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm transition-all ${
                    vistaActual === 'todas' ? 'bg-white dark:bg-gray-700 text-primary font-semibold shadow-sm' : 'text-gray-600 dark:text-gray-300 font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">list</span>
                  Todas las Salas
                </button>
              </div>

              {/* Chips de filtro */}
              <div className="flex flex-wrap gap-3">
                {/* Filtro de Sede */}
                {sedesUnicas.length > 1 && (
                  <div className="relative">
                    <select
                      value={filtroSede}
                      onChange={(e) => setFiltroSede(e.target.value)}
                      className="h-10 appearance-none rounded-lg border border-neutral-light dark:border-gray-600 bg-white dark:bg-gray-800 pl-4 pr-10 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-soft transition-all hover:bg-neutral-light dark:hover:bg-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                    >
                      <option value="todos">Todas las Sedes</option>
                      {sedesUnicas.map(sede => (
                        <option key={sede.id} value={sede.id}>
                          {sede.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">
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
                      className="h-10 appearance-none rounded-lg border border-neutral-light dark:border-gray-600 bg-white dark:bg-gray-800 pl-4 pr-10 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-soft transition-all hover:bg-neutral-light dark:hover:bg-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                    >
                      <option value="todos">Todos los Edificios</option>
                      {edificiosUnicos.map(edificio => (
                        <option key={edificio.id} value={edificio.id}>
                          {edificio.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">
                      expand_more
                    </span>
                  </div>
                )}

                {/* Filtro de Piso */}
                <div className="relative">
                  <select
                    value={filtroPiso}
                    onChange={(e) => setFiltroPiso(e.target.value)}
                    className="h-10 appearance-none rounded-lg border border-neutral-light dark:border-gray-600 bg-white dark:bg-gray-800 pl-4 pr-10 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-soft transition-all hover:bg-neutral-light dark:hover:bg-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="todos">Todos los Pisos</option>
                    {pisosUnicos.map(piso => (
                      <option key={piso} value={piso}>
                        Piso {piso}
                      </option>
                    ))}
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
                    className="h-10 appearance-none rounded-lg border border-neutral-light dark:border-gray-600 bg-white dark:bg-gray-800 pl-4 pr-10 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-soft transition-all hover:bg-neutral-light dark:hover:bg-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
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
                
                {/* Botón para limpiar filtros - Solo si hay filtros aplicados manualmente */}
                {(() => {
                  // Si solo hay 1 sede, no contar filtroSede (se auto-selecciona)
                  const sedeModificada = sedesUnicas.length > 1 && filtroSede !== 'todos';
                  const hayFiltrosAplicados = sedeModificada || filtroEdificio !== 'todos' || filtroPiso !== 'todos' || filtroCapacidad !== 'todos';

                  return hayFiltrosAplicados && (
                    <button
                      onClick={() => {
                        // Solo resetear sede si hay múltiples sedes
                        if (sedesUnicas.length > 1) {
                          setFiltroSede('todos');
                        }
                        setFiltroEdificio('todos');
                        setFiltroPiso('todos');
                        setFiltroCapacidad('todos');
                      }}
                      className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 text-sm font-semibold text-danger transition-all hover:bg-danger/20"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                      Limpiar
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Renderizado condicional: Plano o Cards */}
            {tipoVista === 'plano' ? (
              /* Vista de Plano Dinámico */
              <div className="rounded-lg border border-neutral-light dark:border-gray-600 bg-white dark:bg-gray-800 p-6 shadow-soft">
                <PlanoSalasDinamico
                  pisoInicial={filtroPiso === 'todos' ? 1 : parseInt(filtroPiso)}
                  filtroSede={filtroSede}
                  filtroEdificio={filtroEdificio}
                  onSalaClick={handleReservar}
                />
              </div>
            ) : (
              /* Vista de Cards (Grid) */
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {salasMostrar.map((sala) => {
                const isDisponible = sala.estado === ESTADOS_SALA.DISPONIBLE;
                const isOcupado = sala.estado === ESTADOS_SALA.OCUPADO;
                const isProximamente = sala.estado === ESTADOS_SALA.PROXIMAMENTE;

                return (
                  <div
                    key={sala.id}
                    className={`group relative flex flex-col gap-4 rounded-lg border-2 p-6 shadow-soft transition-all hover:shadow-md bg-white dark:bg-gray-800 ${
                      isDisponible
                        ? 'border-success/30 bg-success/5 hover:border-success/50'
                        : isOcupado
                          ? 'border-danger/30 bg-danger/5 hover:border-danger/50'
                          : 'border-warning/30 bg-warning/5 hover:border-warning/50'
                    }`}
                  >
                    {/* Badge de estado más grande y visible */}
                    <div className="absolute right-4 top-4">
                      <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${
                        isDisponible
                          ? 'bg-success text-white'
                          : isOcupado
                            ? 'bg-danger text-white'
                            : 'bg-warning text-neutral-dark'
                      }`}>
                        <span className="material-symbols-outlined text-sm">
                          {isDisponible ? 'check_circle' : isOcupado ? 'cancel' : 'schedule'}
                        </span>
                        {sala.texto}
                      </span>
                    </div>

                    {/* Icono y nombre con colores dinámicos */}
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        isDisponible
                          ? 'bg-success/20'
                          : isOcupado
                            ? 'bg-danger/20'
                            : 'bg-warning/20'
                      }`}>
                        <span className={`material-symbols-outlined text-2xl ${
                          isDisponible
                            ? 'text-success'
                            : isOcupado
                              ? 'text-danger'
                              : 'text-warning'
                        }`}>meeting_room</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-neutral-dark dark:text-white">{sala.nombre}</h3>
                        <p className="text-sm text-gray-500">Piso {sala.piso}</p>
                      </div>
                    </div>

                    {/* Detalles */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">chair</span>
                        <span>{sala.capacidad} personas</span>
                      </div>
                      {sala.equipamiento && sala.equipamiento.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">devices</span>
                          <span>{sala.equipamiento.length} equipos</span>
                        </div>
                      )}
                    </div>

                    {/* Info adicional si está ocupada */}
                    {!isDisponible && sala.textoSecundario && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{sala.textoSecundario}</p>
                    )}

                    {/* Botón de reservar */}
                    <button
                      onClick={() => handleReservar(sala)}
                      disabled={!isDisponible}
                      className={`mt-2 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                        isDisponible
                          ? 'bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isDisponible ? 'event_available' : 'event_busy'}
                      </span>
                      {isDisponible ? 'Reservar Ahora' : 'No Disponible'}
                    </button>
                  </div>
                );
              })}
              </div>
            )}

            {/* Empty state */}
            {salasMostrar.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-light dark:border-gray-600 bg-white dark:bg-gray-800 p-12">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">search_off</span>
                <p className="mt-4 text-lg font-semibold text-gray-600 dark:text-gray-300">No hay salas disponibles</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Intenta cambiar los filtros o vuelve más tarde</p>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* Modal Lista de Salas */}
      {showListaSalas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-primary/80 px-8 py-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
                  <span className="material-symbols-outlined text-4xl">meeting_room</span>
                  Selecciona una Sala
                </h2>
                <button
                  onClick={() => setShowListaSalas(false)}
                  className="rounded-full p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white"
                >
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
            </div>

            {/* Grid de salas */}
            <div className="overflow-y-auto p-8" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {salasMostrar.map((sala) => {
                  const isDisponible = sala.estado === ESTADOS_SALA.DISPONIBLE;
                  const isOcupado = sala.estado === ESTADOS_SALA.OCUPADO;
                  const isProximamente = sala.estado === ESTADOS_SALA.PROXIMAMENTE;

                  return (
                    <div
                      key={sala.id}
                      onClick={() => {
                        setSalaSeleccionada(sala);
                        setShowListaSalas(false);
                        setShowFormulario(true);
                      }}
                      className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 p-6 shadow-md transition-all hover:shadow-xl bg-white dark:bg-gray-800 ${
                        isDisponible
                          ? 'border-success/30 bg-success/5 hover:border-success'
                          : isOcupado
                            ? 'border-danger/30 bg-danger/5 hover:border-danger'
                            : 'border-warning/30 bg-warning/5 hover:border-warning'
                      }`}
                    >
                      {/* Badge de estado mejorado */}
                      <div className="absolute right-4 top-4">
                        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${
                          isDisponible
                            ? 'bg-success text-white'
                            : isOcupado
                              ? 'bg-danger text-white'
                              : 'bg-warning text-neutral-dark'
                        }`}>
                          <span className="material-symbols-outlined text-sm">
                            {isDisponible ? 'check_circle' : isOcupado ? 'cancel' : 'schedule'}
                          </span>
                          {sala.texto}
                        </span>
                      </div>

                      {/* Contenido */}
                      <div className="mt-8">
                        <h3 className="mb-4 text-xl font-bold text-neutral-dark dark:text-white group-hover:text-primary transition-colors">
                          {sala.nombre}
                        </h3>
                        
                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
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

                        {/* Botón de acción */}
                        <div className="mt-6 pt-4 border-t border-neutral-light dark:border-gray-600">
                          <span className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                            Seleccionar sala
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {salasMostrar.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">search_off</span>
                  <p className="text-lg text-gray-500 dark:text-gray-400">No hay salas disponibles con los filtros seleccionados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulario Reserva - MEJORADO */}
      {showFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp">
            {/* Header con gradiente */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-primary/80 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
                    <span className="material-symbols-outlined text-4xl">event_available</span>
                    Nueva Reserva
                  </h2>
                  {salaSeleccionada && (
                    <p className="mt-2 flex items-center gap-2 text-white/90">
                      <span className="material-symbols-outlined text-lg">meeting_room</span>
                      {salaSeleccionada.nombre}
                      <span className="mx-2">•</span>
                      <span className="material-symbols-outlined text-lg">chair</span>
                      {salaSeleccionada.capacidad} personas
                      <span className="mx-2">•</span>
                      <span className="material-symbols-outlined text-lg">layers</span>
                      Piso {salaSeleccionada.piso}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCloseFormulario}
                  className="rounded-full p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white"
                >
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
            </div>

            {/* Contenido del formulario */}
            <div className="overflow-y-auto p-8" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <FormularioReserva
                sala={salaSeleccionada}
                onReservaCreada={handleReservaCreada}
                onCancelar={handleCloseFormulario}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chatbot flotante */}
      <ChatBot />
    </div>
  );
}
export default TeacherDashboard;