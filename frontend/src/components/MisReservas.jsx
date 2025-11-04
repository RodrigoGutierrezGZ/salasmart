/**
 * Componente para mostrar y gestionar las reservas del usuario actual
 */

import React, { useState, useEffect } from 'react';
import { obtenerMisReservas, cancelarReserva, eliminarReserva } from '../services/reservasService';
import { useAuth } from '../hooks/useAuth';
import { JORNADAS, detectarJornada } from '../utils/constants';

function MisReservas() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [soloActivas, setSoloActivas] = useState(true);
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const [reservaAEliminar, setReservaAEliminar] = useState(null);

  // Obtener estado real de la reserva (considerando si ya terminó)
  const obtenerEstadoReal = (reserva) => {
    // Si ya está cancelada o completada, mantener ese estado
    if (reserva.estado === 'cancelada' || reserva.estado === 'completada') {
      return reserva.estado;
    }

    // Si está activa, verificar si ya terminó
    if (reserva.estado === 'activa') {
      let horaFin;
      
      if (reserva.horaFin.toDate) {
        horaFin = reserva.horaFin.toDate();
      } else if (reserva.horaFin.seconds) {
        horaFin = new Date(reserva.horaFin.seconds * 1000);
      } else if (reserva.horaFin._seconds) {
        horaFin = new Date(reserva.horaFin._seconds * 1000);
      } else if (typeof reserva.horaFin === 'string') {
        horaFin = new Date(reserva.horaFin);
      } else {
        horaFin = reserva.horaFin;
      }

      // Si ya pasó la hora de fin, está completada
      if (horaFin < new Date()) {
        return 'completada';
      }
    }

    return reserva.estado;
  };

  // Cargar reservas
  const cargarReservas = async () => {
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    const resultado = await obtenerMisReservas(false); // Siempre traer todas

    setLoading(false);

    if (resultado.success) {
      console.log('Reservas cargadas:', resultado.data);
      let reservasFiltradas = resultado.data;
      
      // Si solo queremos activas, filtrar las que realmente están activas
      if (soloActivas) {
        reservasFiltradas = resultado.data.filter(reserva => {
          const estadoReal = obtenerEstadoReal(reserva);
          return estadoReal === 'activa';
        });
      }
      
      setReservas(reservasFiltradas);
    } else {
      setMensaje({ tipo: 'danger', texto: resultado.error });
    }
  };

  // Cargar al montar y cuando cambia el filtro
  useEffect(() => {
    cargarReservas();
  }, [soloActivas]);

  // Confirmar cancelación
  const handleCancelarClick = (reserva) => {
    setReservaACancelar(reserva);
  };

  // Ejecutar cancelación
  const handleConfirmarCancelacion = async () => {
    if (!reservaACancelar) return;

    setMensaje({ tipo: '', texto: '' });

    const resultado = await cancelarReserva(reservaACancelar.id);

    if (resultado.success) {
      setMensaje({ tipo: 'success', texto: 'Reserva cancelada exitosamente' });
      setReservaACancelar(null);
      // Recargar lista
      cargarReservas();
    } else {
      setMensaje({ tipo: 'danger', texto: resultado.error });
      setReservaACancelar(null);
    }
  };

  // Confirmar eliminación
  const handleEliminarClick = (reserva) => {
    setReservaAEliminar(reserva);
  };

  // Ejecutar eliminación
  const handleConfirmarEliminacion = async () => {
    if (!reservaAEliminar) return;

    setMensaje({ tipo: '', texto: '' });

    const resultado = await eliminarReserva(reservaAEliminar.id);

    if (resultado.success) {
      setMensaje({ tipo: 'success', texto: '✅ Reserva eliminada exitosamente' });
      setReservaAEliminar(null);
      // Recargar lista
      cargarReservas();
    } else {
      // Si la reserva no existe, simplemente cerrar el modal y recargar
      if (resultado.error.includes('no encontrada') || resultado.error.includes('not found')) {
        setMensaje({ 
          tipo: 'info', 
          texto: 'La reserva ya fue eliminada. Actualizando lista...' 
        });
        setReservaAEliminar(null);
        cargarReservas();
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
      } else {
        setMensaje({ tipo: 'danger', texto: resultado.error });
        setReservaAEliminar(null);
      }
    }
  };

  // Formatear fecha/hora
  const formatearFechaHora = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let fecha;
    
    // Manejar diferentes formatos de timestamp
    if (timestamp.toDate) {
      // Firestore Timestamp
      fecha = timestamp.toDate();
    } else if (timestamp.seconds) {
      // Timestamp object con seconds
      fecha = new Date(timestamp.seconds * 1000);
    } else if (timestamp._seconds) {
      // Timestamp serializado con _seconds
      fecha = new Date(timestamp._seconds * 1000);
    } else if (typeof timestamp === 'string') {
      // String ISO
      fecha = new Date(timestamp);
    } else {
      // Ya es un objeto Date
      fecha = timestamp;
    }
    
    // Verificar que la fecha sea válida
    if (isNaN(fecha.getTime())) {
      return 'Invalid Date';
    }
    
    return fecha.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Verificar si la reserva puede cancelarse
  const puedeCancelar = (reserva) => {
    if (reserva.estado !== 'activa') return false;

    let horaInicio;
    
    // Manejar diferentes formatos de timestamp
    if (reserva.horaInicio?.toDate) {
      horaInicio = reserva.horaInicio.toDate();
    } else if (reserva.horaInicio?.seconds) {
      horaInicio = new Date(reserva.horaInicio.seconds * 1000);
    } else if (reserva.horaInicio?._seconds) {
      horaInicio = new Date(reserva.horaInicio._seconds * 1000);
    } else if (typeof reserva.horaInicio === 'string') {
      horaInicio = new Date(reserva.horaInicio);
    } else {
      horaInicio = reserva.horaInicio;
    }

    // Verificar que la fecha sea válida
    if (!horaInicio || isNaN(horaInicio.getTime())) {
      console.warn('Hora inicio inválida:', reserva.horaInicio);
      return false;
    }

    const ahora = new Date();
    const puedeCancel = horaInicio > ahora;
    
    console.log('Puede cancelar?', {
      reservaId: reserva.id,
      horaInicio: horaInicio.toLocaleString('es-CL'),
      ahora: ahora.toLocaleString('es-CL'),
      puedeCancel
    });

    // No permitir cancelar si la clase ya comenzó
    return puedeCancel;
  };

  // Obtener jornada de la reserva (o detectarla si no existe)
  const obtenerJornada = (reserva) => {
    // Si ya tiene jornada guardada, usarla
    if (reserva.jornada) {
      return reserva.jornada;
    }

    // Si no, detectarla automáticamente desde horaInicio
    let horaInicio;
    
    if (reserva.horaInicio?.toDate) {
      horaInicio = reserva.horaInicio.toDate();
    } else if (reserva.horaInicio?.seconds) {
      horaInicio = new Date(reserva.horaInicio.seconds * 1000);
    } else if (reserva.horaInicio?._seconds) {
      horaInicio = new Date(reserva.horaInicio._seconds * 1000);
    } else if (typeof reserva.horaInicio === 'string') {
      horaInicio = new Date(reserva.horaInicio);
    } else {
      horaInicio = reserva.horaInicio;
    }

    if (!horaInicio || isNaN(horaInicio.getTime())) {
      return null;
    }

    // Detectar jornada según la hora
    const hora = horaInicio.getHours();
    const minuto = horaInicio.getMinutes();
    const horaString = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    
    return detectarJornada(horaString);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-neutral-dark">Mis Reservas</h2>
        
        {/* Toggle: Solo Activas vs Todas */}
        <div className="flex rounded-lg bg-neutral-light p-1">
          <button
            onClick={() => setSoloActivas(true)}
            className={`px-4 py-2 text-sm font-semibold rounded transition-all ${
              soloActivas
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Solo Activas
          </button>
          <button
            onClick={() => setSoloActivas(false)}
            className={`px-4 py-2 text-sm font-semibold rounded transition-all ${
              !soloActivas
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje.texto && (
        <div
          className={`rounded-lg border px-4 py-3 ${
            mensaje.tipo === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : mensaje.tipo === 'danger'
              ? 'border-danger/30 bg-danger/10 text-danger'
              : 'border-primary/30 bg-primary/10 text-primary'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-xl">
                {mensaje.tipo === 'success' ? 'check_circle' : 'info'}
              </span>
              <p className="flex-1 text-sm font-medium">{mensaje.texto}</p>
            </div>
            <button
              onClick={() => setMensaje({ tipo: '', texto: '' })}
              className="text-current hover:opacity-70"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600 font-medium">Cargando reservas...</p>
        </div>
      ) : reservas.length === 0 ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 text-primary px-6 py-8 text-center">
          <span className="material-symbols-outlined text-6xl mb-4 block">event_busy</span>
          <p className="text-lg font-medium">
            No tienes reservas {soloActivas ? 'activas' : ''} en este momento.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-light bg-white shadow-soft">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-primary to-primary/80 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Sala</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Asignatura</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Fecha y Hora</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Jornada</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light">
              {reservas.map((reserva) => {
                const estadoReal = obtenerEstadoReal(reserva);
                const jornada = obtenerJornada(reserva);
                
                return (
                  <tr key={reserva.id} className="hover:bg-neutral-light/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">meeting_room</span>
                        <strong className="text-neutral-dark">{reserva.salaNombre || reserva.salaId}</strong>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{reserva.asignatura}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-medium">Inicio:</span>
                          <span className="text-gray-700">{formatearFechaHora(reserva.horaInicio)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-medium">Fin:</span>
                          <span className="text-gray-700">{formatearFechaHora(reserva.horaFin)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {jornada ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            jornada === JORNADAS.DIURNO
                              ? 'bg-primary/10 text-primary'
                              : 'bg-info/10 text-info'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {jornada === JORNADAS.DIURNO ? 'light_mode' : 'nights_stay'}
                          </span>
                          {jornada === JORNADAS.DIURNO ? 'DIURNO' : 'VESPERTINO'}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          estadoReal === 'activa'
                            ? 'bg-success/10 text-success'
                            : estadoReal === 'cancelada'
                            ? 'bg-danger/10 text-danger'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {estadoReal === 'activa' ? 'check_circle' : estadoReal === 'cancelada' ? 'cancel' : 'done_all'}
                        </span>
                        {estadoReal.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {puedeCancelar(reserva) ? (
                          <button
                            onClick={() => handleCancelarClick(reserva)}
                            className="flex items-center gap-1 rounded-lg bg-danger px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-danger/90"
                          >
                            <span className="material-symbols-outlined text-base">cancel</span>
                            Cancelar
                          </button>
                        ) : estadoReal === 'completada' || estadoReal === 'cancelada' ? (
                          <button
                            onClick={() => handleEliminarClick(reserva)}
                            className="flex items-center gap-1 rounded-lg border border-danger bg-white px-3 py-1.5 text-sm font-semibold text-danger transition-all hover:bg-danger hover:text-white"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                            Eliminar
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm italic">No cancelable</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmación de cancelación */}
      {reservaACancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-light px-6 py-4">
              <h3 className="text-xl font-bold text-neutral-dark">Confirmar Cancelación</h3>
              <button
                onClick={() => setReservaACancelar(null)}
                className="rounded-full p-1 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700">¿Estás seguro que deseas cancelar esta reserva?</p>
              
              <div className="rounded-lg bg-neutral-light border border-neutral-light p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary">meeting_room</span>
                  <div>
                    <span className="text-gray-600 text-sm">Sala:</span>
                    <p className="font-semibold text-neutral-dark">{reservaACancelar.salaNombre || reservaACancelar.salaId}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary">book</span>
                  <div>
                    <span className="text-gray-600 text-sm">Asignatura:</span>
                    <p className="font-semibold text-neutral-dark">{reservaACancelar.asignatura}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  <div>
                    <span className="text-gray-600 text-sm">Inicio:</span>
                    <p className="font-semibold text-neutral-dark">{formatearFechaHora(reservaACancelar.horaInicio)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-warning/30 bg-warning/10 text-warning px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-lg">warning</span>
                  <p className="text-sm font-medium">Esta acción no se puede deshacer.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-neutral-light px-6 py-4">
              <button
                onClick={() => setReservaACancelar(null)}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-semibold text-gray-700 transition-all hover:bg-gray-200"
              >
                No, Mantener
              </button>
              <button
                onClick={handleConfirmarCancelacion}
                className="flex-1 rounded-lg bg-danger px-4 py-2.5 font-semibold text-white transition-all hover:bg-danger/90"
              >
                Sí, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {reservaAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-light px-6 py-4">
              <h3 className="text-xl font-bold text-neutral-dark">Confirmar Eliminación</h3>
              <button
                onClick={() => setReservaAEliminar(null)}
                className="rounded-full p-1 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700">¿Estás seguro que deseas eliminar esta reserva del historial?</p>
              
              <div className="rounded-lg bg-neutral-light border border-neutral-light p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary">meeting_room</span>
                  <div>
                    <span className="text-gray-600 text-sm">Sala:</span>
                    <p className="font-semibold text-neutral-dark">{reservaAEliminar.salaNombre || reservaAEliminar.salaId}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary">book</span>
                  <div>
                    <span className="text-gray-600 text-sm">Asignatura:</span>
                    <p className="font-semibold text-neutral-dark">{reservaAEliminar.asignatura}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-danger/30 bg-danger/10 text-danger px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-lg">warning</span>
                  <p className="text-sm font-medium">Esta acción eliminará permanentemente el registro.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-neutral-light px-6 py-4">
              <button
                onClick={() => setReservaAEliminar(null)}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-semibold text-gray-700 transition-all hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEliminacion}
                className="flex-1 rounded-lg bg-danger px-4 py-2.5 font-semibold text-white transition-all hover:bg-danger/90"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MisReservas;
