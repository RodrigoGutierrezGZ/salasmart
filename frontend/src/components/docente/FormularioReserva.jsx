/**
 * Componente para crear una nueva reserva
 */

import React, { useState } from 'react';
import { crearReserva, validarDisponibilidad } from '../../services/reservasService';
import { useAuth } from '../../hooks/useAuth';
import { detectarJornada, JORNADAS } from '../../utils/constants';
import { notificarReservaCreada, notificarNuevaReserva } from '../../services/notificacionesService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

function FormularioReserva({ sala, onReservaCreada, onCancelar }) {
  const { user, userData } = useAuth(); // AGREGADO: userData
  
  const [asignatura, setAsignatura] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [validando, setValidando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [disponibilidad, setDisponibilidad] = useState(null);

  // Validaciones de negocio
  const validarHorarios = () => {
    if (!fecha || !horaInicio || !horaFin) {
      return { valido: false, error: 'Complete la fecha y horarios primero' };
    }

    // Validar que hora inicio < hora fin
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFn, minFn] = horaFin.split(':').map(Number);
    const minutosInicio = horaIni * 60 + minIni;
    const minutosFin = horaFn * 60 + minFn;

    if (minutosInicio >= minutosFin) {
      return { valido: false, error: 'La hora de inicio debe ser anterior a la hora de fin' };
    }

    // Validar duración mínima (45 minutos)
    const duracionMinutos = minutosFin - minutosInicio;
    if (duracionMinutos < 45) {
      return { valido: false, error: 'La reserva debe tener una duración mínima de 45 minutos' };
    }

    // Validar duración máxima (4 horas = 240 minutos)
    if (duracionMinutos > 240) {
      return { valido: false, error: 'La reserva no puede exceder 4 horas de duración' };
    }

    // Validar horarios laborales (8:00 - 22:00)
    if (horaIni < 8 || horaFn > 22) {
      return { valido: false, error: 'Las reservas solo están permitidas entre 8:00 y 22:00' };
    }

    // Validar que no sea una fecha/hora pasada
    const fechaHoraInicio = new Date(`${fecha}T${horaInicio}:00`);
    const ahora = new Date();
    
    // Agregar margen de 5 minutos para evitar problemas de sincronización
    const margenMs = 5 * 60 * 1000; // 5 minutos
    const ahoraConMargen = new Date(ahora.getTime() - margenMs);

    if (fechaHoraInicio < ahoraConMargen) {
      return { valido: false, error: 'No se pueden hacer reservas en fechas/horas pasadas' };
    }

    return { valido: true };
  };

  // Validar disponibilidad al cambiar horarios
  const handleValidarDisponibilidad = async () => {
    // Primero validar horarios
    const validacion = validarHorarios();
    if (!validacion.valido) {
      setMensaje({ tipo: 'warning', texto: validacion.error });
      return;
    }

    setValidando(true);
    setMensaje({ tipo: '', texto: '' });

    const inicio = `${fecha}T${horaInicio}:00`;
    const fin = `${fecha}T${horaFin}:00`;

    const resultado = await validarDisponibilidad(sala.id, inicio, fin);

    setValidando(false);

    if (resultado.success) {
      setDisponibilidad(resultado);
      if (resultado.disponible) {
        setMensaje({ tipo: 'success', texto: '✅ La sala está disponible en ese horario' });
      } else {
        const conflictos = resultado.conflictos.map(c =>
          `${c.asignatura} (${c.nombreDocente})`
        ).join(', ');
        setMensaje({
          tipo: 'danger',
          texto: `❌ Conflicto de horario con: ${conflictos}`
        });
      }
    } else {
      setMensaje({ tipo: 'danger', texto: resultado.error });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!asignatura || !fecha || !horaInicio || !horaFin) {
      setMensaje({ tipo: 'warning', texto: 'Por favor complete todos los campos' });
      return;
    }

    // Validar asignatura (mínimo 3 caracteres)
    if (asignatura.trim().length < 3) {
      setMensaje({ tipo: 'warning', texto: 'La asignatura debe tener al menos 3 caracteres' });
      return;
    }

    // Validar horarios nuevamente antes de enviar
    const validacion = validarHorarios();
    if (!validacion.valido) {
      setMensaje({ tipo: 'warning', texto: validacion.error });
      return;
    }

    // Verificar que la disponibilidad fue validada
    if (!disponibilidad || !disponibilidad.disponible) {
      setMensaje({ tipo: 'warning', texto: 'Primero valide la disponibilidad de la sala' });
      return;
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    // Detectar automáticamente la jornada según la hora de inicio
    const jornada = detectarJornada(horaInicio);

    // Obtener nombre del docente (prioridad: nombre en userData > displayName > email)
    const nombreDocente = userData?.nombre || user?.displayName || user?.email?.split('@')[0] || 'Docente';

    // Crear fechas manteniendo la zona horaria local
    // Formato: "2025-10-31T16:20:00-03:00" (con offset de Chile)
    const offsetMinutos = new Date().getTimezoneOffset();
    const offsetHoras = -offsetMinutos / 60;
    const offsetString = offsetHoras >= 0 
      ? `+${String(Math.floor(offsetHoras)).padStart(2, '0')}:00`
      : `-${String(Math.floor(Math.abs(offsetHoras))).padStart(2, '0')}:00`;

    const datosReserva = {
      salaId: sala.id,
      salaNombre: sala.nombre || sala.id, // Si no tiene nombre, usar el ID
      nombreDocente: nombreDocente,
      asignatura,
      horaInicio: `${fecha}T${horaInicio}:00${offsetString}`,
      horaFin: `${fecha}T${horaFin}:00${offsetString}`,
      jornada,
    };

    const resultado = await crearReserva(datosReserva);

    setLoading(false);

    if (resultado.success) {
      setMensaje({ tipo: 'success', texto: '¡Reserva creada exitosamente!' });

      // Enviar notificación al usuario (docente)
      try {
        await notificarReservaCreada(
          user.uid,
          sala.nombre || sala.id,
          fecha,
          horaInicio,
          horaFin,
          resultado.data.id
        );
      } catch (error) {
        console.error('Error al enviar notificación al docente:', error);
      }

      // Enviar notificación a todos los admins
      try {
        const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
        const adminsSnapshot = await getDocs(adminsQuery);
        const adminIds = adminsSnapshot.docs.map(doc => doc.id);

        if (adminIds.length > 0) {
          await notificarNuevaReserva(
            adminIds,
            nombreDocente,
            sala.nombre || sala.id,
            fecha,
            horaInicio,
            horaFin
          );
        }
      } catch (error) {
        console.error('Error al enviar notificación a admins:', error);
      }

      // Limpiar formulario
      setAsignatura('');
      setFecha('');
      setHoraInicio('');
      setHoraFin('');
      setDisponibilidad(null);

      // Notificar al componente padre
      if (onReservaCreada) {
        setTimeout(() => onReservaCreada(resultado.data), 1500);
      }
    } else {
      setMensaje({ tipo: 'danger', texto: resultado.error });
    }
  };

  // Generar fecha mínima (hoy)
  const hoy = new Date().toISOString().split('T')[0];

  // Si no hay sala seleccionada, mostrar mensaje
  if (!sala) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">meeting_room</span>
        <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Por favor, selecciona una sala primero.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información de la sala */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/40 border-2 border-blue-200 dark:border-blue-500 p-6">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-blue-600 dark:text-blue-300">meeting_room</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{sala.nombre}</h3>
            <div className="flex items-center gap-4 mt-1 text-sm font-medium text-gray-700 dark:text-white">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">chair</span>
                {sala.capacidad} personas
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">layers</span>
                Piso {sala.piso}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asignatura */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-dark dark:text-gray-100">
            Asignatura *
          </label>
          <input
            type="text"
            placeholder="Ej: Programación Web"
            value={asignatura}
            onChange={(e) => setAsignatura(e.target.value.toUpperCase())}
            required
            className="w-full rounded-lg border border-neutral-light dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 py-3 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        {/* Fecha */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-dark dark:text-gray-100">
            Fecha *
          </label>
          <input
            type="date"
            min={hoy}
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setDisponibilidad(null);
            }}
            required
            className="w-full rounded-lg border border-neutral-light dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        {/* Horarios - Grid de 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hora de Inicio */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-dark dark:text-gray-100">
              Hora de Inicio *
            </label>
            <input
              type="time"
              min="08:00"
              max="22:00"
              value={horaInicio}
              onChange={(e) => {
                setHoraInicio(e.target.value);
                setDisponibilidad(null);
              }}
              required
              className="w-full rounded-lg border border-neutral-light dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">Horario: 8:00 - 22:00</p>
          </div>

          {/* Hora de Fin */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-dark dark:text-gray-100">
              Hora de Fin *
            </label>
            <input
              type="time"
              min="08:00"
              max="22:00"
              value={horaFin}
              onChange={(e) => {
                setHoraFin(e.target.value);
                setDisponibilidad(null);
              }}
              required
              className="w-full rounded-lg border border-neutral-light dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">Duración: 45 min - 4 horas</p>
          </div>
        </div>

        {/* Mensajes de estado */}
        {mensaje.texto && (
          <div
            className={`rounded-lg border px-4 py-3 ${
              mensaje.tipo === 'success'
                ? 'border-success/30 bg-success/10 text-success'
                : mensaje.tipo === 'danger'
                ? 'border-danger/30 bg-danger/10 text-danger'
                : 'border-warning/30 bg-warning/10 text-warning'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-xl">
                {mensaje.tipo === 'success' ? 'check_circle' : 'info'}
              </span>
              <p className="flex-1 text-sm font-medium">{mensaje.texto}</p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col gap-3 pt-4 border-t border-neutral-light">
          {/* Verificar Disponibilidad */}
          <button
            type="button"
            onClick={handleValidarDisponibilidad}
            disabled={validando || !fecha || !horaInicio || !horaFin}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-primary bg-white px-6 py-3 font-semibold text-primary transition-all hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-primary"
          >
            {validando ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">search</span>
                Verificar Disponibilidad
              </>
            )}
          </button>

          {/* Confirmar Reserva */}
          <button
            type="submit"
            disabled={loading || !disponibilidad || !disponibilidad.disponible}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary disabled:hover:shadow-lg"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando reserva...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">event_available</span>
                Confirmar Reserva
              </>
            )}
          </button>

          {/* Cancelar */}
          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <span className="material-symbols-outlined">close</span>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default FormularioReserva;
