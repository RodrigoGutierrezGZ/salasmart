/**
 * Funciones de validación para el sistema
 */

import { ROLES, TIEMPO_CONFIG, ERRORES } from "./constants.js";

/**
 * Valida que los datos de una reserva sean correctos
 * @param {Object} data - Datos de la reserva
 * @return {Object} { valido: boolean, error: string }
 */
export function validarDatosReserva(data) {
  // Validar campos obligatorios
  if (!data.salaId) {
    return { valido: false, error: "El ID de la sala es obligatorio" };
  }

  if (!data.usuarioId) {
    return { valido: false, error: "El ID del usuario es obligatorio" };
  }

  if (!data.nombreDocente) {
    return { valido: false, error: "El nombre del docente es obligatorio" };
  }

  if (!data.asignatura) {
    return { valido: false, error: "La asignatura es obligatoria" };
  }

  if (!data.horaInicio) {
    return { valido: false, error: "La hora de inicio es obligatoria" };
  }

  if (!data.horaFin) {
    return { valido: false, error: "La hora de fin es obligatoria" };
  }

  return { valido: true };
}

/**
 * Valida que un rango horario sea válido
 * @param {Date} horaInicio
 * @param {Date} horaFin
 * @return {Object} { valido: boolean, error: string }
 */
export function validarRangoHorario(horaInicio, horaFin) {
  const inicio = new Date(horaInicio);
  const fin = new Date(horaFin);

  // Verificar que las fechas sean válidas
  if (isNaN(inicio.getTime())) {
    return { valido: false, error: "La hora de inicio no es válida" };
  }

  if (isNaN(fin.getTime())) {
    return { valido: false, error: "La hora de fin no es válida" };
  }

  // Verificar que inicio sea antes que fin
  if (inicio >= fin) {
    return {
      valido: false,
      error: "La hora de inicio debe ser anterior a la hora de fin",
    };
  }

  // NOTA: La validación de fecha en el pasado se hace en el frontend
  // No validamos aquí para evitar problemas de sincronización de tiempo

  // Verificar duración mínima (al menos 30 minutos)
  const duracionMinutos = (fin - inicio) / (1000 * 60);
  if (duracionMinutos < 30) {
    return {
      valido: false,
      error: "La reserva debe tener una duración mínima de 30 minutos",
    };
  }

  // Verificar duración máxima (no más de 4 horas)
  if (duracionMinutos > 240) {
    return {
      valido: false,
      error: "La reserva no puede durar más de 4 horas",
    };
  }

  return { valido: true };
}

/**
 * Valida que un usuario tenga el rol de docente
 * @param {Object} userData - Datos del usuario
 * @return {boolean}
 */
export function esDocente(userData) {
  return userData && (userData.role === ROLES.DOCENTE || userData.role === ROLES.ADMIN);
}

/**
 * Valida que un usuario tenga el rol de admin
 * @param {Object} userData - Datos del usuario
 * @return {boolean}
 */
export function esAdmin(userData) {
  return userData && userData.role === ROLES.ADMIN;
}

/**
 * Valida que un bloque horario se ajuste a bloques de 90 minutos (opcional)
 * @param {Date} horaInicio
 * @param {Date} horaFin
 * @return {Object} { valido: boolean, advertencia: string }
 */
export function validarBloqueHorario(horaInicio, horaFin) {
  const duracionMinutos = (horaFin - horaInicio) / (1000 * 60);
  const esMultiplo90 = duracionMinutos % TIEMPO_CONFIG.DURACION_BLOQUE_MIN === 0;

  if (!esMultiplo90) {
    return {
      valido: true, // No es obligatorio, solo advertencia
      advertencia: `La duración recomendada es en bloques de ${TIEMPO_CONFIG.DURACION_BLOQUE_MIN} minutos`,
    };
  }

  return { valido: true };
}

/**
 * Valida que una sala tenga los campos correctos
 * @param {Object} salaData
 * @return {Object} { valido: boolean, error: string }
 */
export function validarDatosSala(salaData) {
  if (!salaData.nombre) {
    return { valido: false, error: "El nombre de la sala es obligatorio" };
  }

  if (typeof salaData.piso !== "number" || salaData.piso < 1) {
    return { valido: false, error: "El piso debe ser un número mayor a 0" };
  }

  if (typeof salaData.capacidad !== "number" || salaData.capacidad < 1) {
    return {
      valido: false,
      error: "La capacidad debe ser un número mayor a 0",
    };
  }

  return { valido: true };
}
