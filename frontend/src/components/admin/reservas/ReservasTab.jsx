// src/components/admin/ReservasTab.jsx

import React from 'react';

/**
 * Tab de Reservas con filtros y tabla
 */
function ReservasTab({
  // Data
  reservas,
  salas,

  // Filtros state
  filtroEstadoReserva,
  setFiltroEstadoReserva,
  filtroSalaReserva,
  setFiltroSalaReserva,
  buscarReserva,
  setBuscarReserva,

  // Functions
  handleCancelarReserva
}) {
  const ahora = new Date();

  // Filtrar reservas según los criterios
  const reservasFiltradas = reservas.filter(r => {
    // Filtro por estado
    if (filtroEstadoReserva === 'activas') {
      if (r.estado !== 'activa') return false;
      let horaFin;
      if (r.horaFin) {
        if (r.horaFin.toDate) horaFin = r.horaFin.toDate();
        else if (r.horaFin.seconds) horaFin = new Date(r.horaFin.seconds * 1000);
        else horaFin = new Date(r.horaFin);
      }
      if (!horaFin || horaFin <= ahora) return false;
    } else if (filtroEstadoReserva === 'canceladas') {
      if (r.estado !== 'cancelada') return false;
    } else if (filtroEstadoReserva === 'completadas') {
      let horaFin;
      if (r.horaFin) {
        if (r.horaFin.toDate) horaFin = r.horaFin.toDate();
        else if (r.horaFin.seconds) horaFin = new Date(r.horaFin.seconds * 1000);
        else horaFin = new Date(r.horaFin);
      }
      if (!horaFin || horaFin > ahora || r.estado === 'cancelada') return false;
    }

    // Filtro por sala
    if (filtroSalaReserva !== 'todas' && r.salaId !== filtroSalaReserva) return false;

    // Filtro por búsqueda
    if (buscarReserva) {
      const busqueda = buscarReserva.toLowerCase();
      const nombreDocente = (r.nombreDocente || '').toLowerCase();
      const asignatura = (r.asignatura || '').toLowerCase();
      if (!nombreDocente.includes(busqueda) && !asignatura.includes(busqueda)) return false;
    }

    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Resumen */}
      <div className="rounded-lg border border-neutral-light bg-white p-6 shadow-soft">
        <h3 className="text-lg font-bold text-neutral-dark">Gestión de Reservas</h3>
        <p className="mt-2 text-sm text-gray-500">
          Total de reservas: <strong>{reservas.length}</strong> |
          Activas: <strong>{reservas.filter(r => {
            if (r.estado !== 'activa') return false;
            const ahora = new Date();
            let horaFin;
            if (r.horaFin) {
              if (r.horaFin.toDate) {
                horaFin = r.horaFin.toDate();
              } else if (r.horaFin.seconds) {
                horaFin = new Date(r.horaFin.seconds * 1000);
              } else {
                horaFin = new Date(r.horaFin);
              }
            }
            return horaFin && horaFin > ahora;
          }).length}</strong>
        </p>
      </div>

      {/* Filtros de Reservas */}
      <div className="rounded-lg border border-neutral-light bg-white p-6 shadow-soft">
        <h4 className="mb-4 font-semibold text-neutral-dark flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">filter_list</span>
          Filtrar Reservas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <div className="relative">
              <select
                value={filtroEstadoReserva}
                onChange={(e) => setFiltroEstadoReserva(e.target.value)}
                className="w-full appearance-none rounded-lg border border-neutral-light bg-white px-4 py-2.5 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value="activas">Solo Activas</option>
                <option value="todas">Todas</option>
                <option value="canceladas">Canceladas</option>
                <option value="completadas">Completadas</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">
                expand_more
              </span>
            </div>
          </div>

          {/* Filtro por Sala */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sala</label>
            <div className="relative">
              <select
                value={filtroSalaReserva}
                onChange={(e) => setFiltroSalaReserva(e.target.value)}
                className="w-full appearance-none rounded-lg border border-neutral-light bg-white px-4 py-2.5 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value="todas">Todas las Salas</option>
                {salas
                  .filter(sala => sala.nombre)
                  .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
                  .map(sala => (
                    <option key={sala.id} value={sala.id}>{sala.nombre}</option>
                  ))
                }
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">
                expand_more
              </span>
            </div>
          </div>

          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <input
                type="text"
                value={buscarReserva}
                onChange={(e) => setBuscarReserva(e.target.value)}
                placeholder="Docente o asignatura..."
                className="w-full rounded-lg border border-neutral-light bg-white px-4 py-2.5 pl-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">
                search
              </span>
            </div>
          </div>
        </div>

        {/* Botón para limpiar filtros */}
        {(filtroEstadoReserva !== 'activas' || filtroSalaReserva !== 'todas' || buscarReserva) && (
          <button
            onClick={() => {
              setFiltroEstadoReserva('activas');
              setFiltroSalaReserva('todas');
              setBuscarReserva('');
            }}
            className="mt-4 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            <span className="material-symbols-outlined text-lg">filter_alt_off</span>
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Tabla de Reservas */}
      {reservasFiltradas.length > 0 ? (
        <div className="rounded-lg border border-neutral-light bg-white shadow-soft overflow-hidden">
          <div className="border-b border-neutral-light bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
            <h4 className="font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined">event_available</span>
              Reservas ({reservasFiltradas.length})
            </h4>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-white border-b-2 border-neutral-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Sala</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Docente</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Asignatura</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Horario</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-light">
                {reservasFiltradas.map((reserva) => {
                  // Convertir Timestamp de Firebase a Date
                  let inicio, fin;

                  if (reserva.horaInicio) {
                    if (reserva.horaInicio.toDate) {
                      inicio = reserva.horaInicio.toDate();
                    } else if (reserva.horaInicio.seconds) {
                      inicio = new Date(reserva.horaInicio.seconds * 1000);
                    } else {
                      inicio = new Date(reserva.horaInicio);
                    }
                  }

                  if (reserva.horaFin) {
                    if (reserva.horaFin.toDate) {
                      fin = reserva.horaFin.toDate();
                    } else if (reserva.horaFin.seconds) {
                      fin = new Date(reserva.horaFin.seconds * 1000);
                    } else {
                      fin = new Date(reserva.horaFin);
                    }
                  }

                  // Si no tenemos fechas válidas, saltar esta reserva
                  if (!inicio || !fin || isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
                    return null;
                  }

                  // Determinar el estado visual
                  const ahora = new Date();
                  let estadoVisual = reserva.estado || 'activa';
                  let estadoColor = 'success';
                  let estadoTexto = 'Activa';

                  if (reserva.estado === 'cancelada') {
                    estadoColor = 'danger';
                    estadoTexto = 'Cancelada';
                  } else if (fin <= ahora) {
                    estadoColor = 'gray-500';
                    estadoTexto = 'Completada';
                  }

                  return (
                    <tr key={reserva.id} className="hover:bg-neutral-light/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">meeting_room</span>
                          <span className="font-semibold text-neutral-dark">{reserva.salaNombre || reserva.salaId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-neutral-dark">{reserva.nombreDocente || 'Sin nombre'}</p>
                        <p className="text-sm text-gray-500">{reserva.usuarioId || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 text-neutral-dark">{reserva.asignatura || 'No especificada'}</td>
                      <td className="px-6 py-4 text-neutral-dark">
                        {inicio.toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-neutral-dark">
                          <span className="material-symbols-outlined text-base">schedule</span>
                          {inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full bg-${estadoColor}/10 px-3 py-1 text-xs font-bold text-${estadoColor}`}>
                          {estadoTexto}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {reserva.estado === 'activa' && fin > ahora && (
                          <button
                            onClick={() => handleCancelarReserva(reserva.id, reserva.salaNombre, inicio)}
                            className="flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                          >
                            <span className="material-symbols-outlined text-base">cancel</span>
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-light bg-white p-12 text-center shadow-soft">
          <span className="material-symbols-outlined text-6xl text-gray-300">event_busy</span>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">No hay reservas</h3>
          <p className="mt-2 text-sm text-gray-500">
            No se encontraron reservas con los filtros seleccionados.
          </p>
        </div>
      )}
    </div>
  );
}

export default ReservasTab;
