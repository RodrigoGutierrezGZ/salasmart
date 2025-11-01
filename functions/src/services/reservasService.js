/**
 * Servicio de gestión de reservas
 * Maneja toda la lógica de negocio relacionada con reservas de salas
 */

import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { COLECCIONES, ESTADOS_RESERVA, ERRORES } from "../utils/constants.js";
import {
  validarDatosReserva,
  validarRangoHorario,
} from "../utils/validators.js";
import {
  dateToTimestamp,
  timestampToDate,
  rangosSeSolapan,
  inicioDia,
  finDia,
} from "../utils/timeHelpers.js";
import { obtenerSalaPorId } from "./salasService.js";

// Lazy initialization para evitar problemas con emulators
let db;
function getDb() {
  if (!db) {
    db = getFirestore();
  }
  return db;
}

/**
 * Valida si una sala está disponible en un horario específico
 * Esta es la función CLAVE para evitar reservas dobles
 *
 * @param {string} salaId - ID de la sala
 * @param {Date} horaInicio - Hora de inicio de la reserva
 * @param {Date} horaFin - Hora de fin de la reserva
 * @param {string} reservaIdExcluir - ID de reserva a excluir (para actualizaciones)
 * @return {Promise<Object>} { disponible: boolean, conflictos: Array }
 */
export async function validarDisponibilidad(
    salaId,
    horaInicio,
    horaFin,
    reservaIdExcluir = null,
) {
  const inicio = new Date(horaInicio);
  const fin = new Date(horaFin);

  // Buscar reservas activas de la sala en ese rango de tiempo
  const reservasRef = getDb().collection(COLECCIONES.RESERVAS);
  const query = reservasRef
      .where("salaId", "==", salaId)
      .where("estado", "==", ESTADOS_RESERVA.ACTIVA)
      .where("horaFin", ">", dateToTimestamp(inicio));

  const snapshot = await query.get();

  const conflictos = [];

  snapshot.forEach((doc) => {
    // Si estamos actualizando una reserva, excluir la reserva actual
    if (reservaIdExcluir && doc.id === reservaIdExcluir) {
      return;
    }

    const reserva = doc.data();
    const reservaInicio = timestampToDate(reserva.horaInicio);
    const reservaFin = timestampToDate(reserva.horaFin);

    // Verificar si los rangos se solapan
    if (rangosSeSolapan(inicio, fin, reservaInicio, reservaFin)) {
      conflictos.push({
        id: doc.id,
        nombreDocente: reserva.nombreDocente,
        asignatura: reserva.asignatura,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
      });
    }
  });

  return {
    disponible: conflictos.length === 0,
    conflictos,
  };
}

/**
 * Crea una nueva reserva
 * Incluye validación completa de disponibilidad
 *
 * @param {Object} reservaData - Datos de la reserva
 * @return {Promise<Object>} Reserva creada con su ID
 */
export async function crearReserva(reservaData) {
  // 1. Validar datos de entrada
  const validacionDatos = validarDatosReserva(reservaData);
  if (!validacionDatos.valido) {
    throw new Error(validacionDatos.error);
  }

  const inicio = new Date(reservaData.horaInicio);
  const fin = new Date(reservaData.horaFin);

  // 2. Validar rango horario
  const validacionHorario = validarRangoHorario(inicio, fin);
  if (!validacionHorario.valido) {
    throw new Error(validacionHorario.error);
  }

  // 3. Verificar que la sala existe y obtener su nombre
  let salaNombre = reservaData.salaNombre; // Usar el nombre si viene del frontend
  
  if (!salaNombre) {
    const sala = await obtenerSalaPorId(reservaData.salaId);
    if (!sala) {
      throw new Error(ERRORES.SALA_NO_ENCONTRADA);
    }
    salaNombre = sala.nombre;
  }

  // 4. VALIDAR DISPONIBILIDAD (lo más importante)
  const { disponible, conflictos } = await validarDisponibilidad(
      reservaData.salaId,
      inicio,
      fin,
  );

  if (!disponible) {
    const detallesConflicto = conflictos
        .map((c) => `${c.asignatura} (${c.nombreDocente})`)
        .join(", ");
    throw new Error(
        `${ERRORES.SALA_NO_DISPONIBLE}. Conflicto con: ${detallesConflicto}`,
    );
  }

  // 5. Crear la reserva
  const nuevaReserva = {
    salaId: reservaData.salaId,
    salaNombre: salaNombre, // Usar el nombre obtenido
    usuarioId: reservaData.usuarioId,
    nombreDocente: reservaData.nombreDocente,
    asignatura: reservaData.asignatura,
    horaInicio: dateToTimestamp(inicio),
    horaFin: dateToTimestamp(fin),
    jornada: reservaData.jornada || null, // Agregar jornada
    estado: ESTADOS_RESERVA.ACTIVA,
    creadoEn: Timestamp.now(),
  };

  const docRef = await getDb().collection(COLECCIONES.RESERVAS).add(nuevaReserva);

  return {
    id: docRef.id,
    ...nuevaReserva,
  };
}

/**
 * Obtiene todas las reservas de una sala en una fecha específica
 * @param {string} salaId - ID de la sala
 * @param {Date} fecha - Fecha a consultar (opcional, por defecto hoy)
 * @return {Promise<Array>} Array de reservas
 */
export async function obtenerReservasPorSala(salaId, fecha = new Date()) {
  const inicio = inicioDia(fecha);
  const fin = finDia(fecha);

  const snapshot = await db
      .collection(COLECCIONES.RESERVAS)
      .where("salaId", "==", salaId)
      .where("estado", "==", ESTADOS_RESERVA.ACTIVA)
      .where("horaInicio", ">=", dateToTimestamp(inicio))
      .where("horaInicio", "<=", dateToTimestamp(fin))
      .orderBy("horaInicio", "asc")
      .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Obtiene todas las reservas de un docente
 * @param {string} userId - ID del usuario
 * @param {boolean} soloActivas - Solo reservas activas (default: true)
 * @return {Promise<Array>} Array de reservas
 */
export async function obtenerReservasPorDocente(userId, soloActivas = true) {
  let query = getDb()
      .collection(COLECCIONES.RESERVAS)
      .where("usuarioId", "==", userId);

  if (soloActivas) {
    query = query.where("estado", "==", ESTADOS_RESERVA.ACTIVA);
  }

  const snapshot = await query
      .orderBy("horaInicio", "desc")
      .limit(50)
      .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Obtiene las reservas activas de todas las salas
 * Útil para calcular estados en el plano
 *
 * @param {Date} desde - Desde qué momento (default: ahora)
 * @return {Promise<Array>} Array de reservas activas futuras
 */
export async function obtenerReservasActivas(desde = new Date()) {
  const snapshot = await db
      .collection(COLECCIONES.RESERVAS)
      .where("estado", "==", ESTADOS_RESERVA.ACTIVA)
      .where("horaFin", ">", dateToTimestamp(desde))
      .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Cancela una reserva
 * Solo el dueño o un admin pueden cancelar
 *
 * @param {string} reservaId - ID de la reserva
 * @param {string} userId - ID del usuario que cancela
 * @param {boolean} esAdmin - Si el usuario es admin
 * @return {Promise<void>}
 */
export async function cancelarReserva(reservaId, userId, esAdmin = false) {
  const reservaRef = getDb().collection(COLECCIONES.RESERVAS).doc(reservaId);
  const doc = await reservaRef.get();

  if (!doc.exists) {
    throw new Error(ERRORES.RESERVA_NO_ENCONTRADA);
  }

  const reserva = doc.data();

  // Verificar permisos: solo el dueño o admin pueden cancelar
  if (!esAdmin && reserva.usuarioId !== userId) {
    throw new Error(ERRORES.SIN_PERMISOS);
  }

  // No permitir cancelar reservas pasadas
  const ahora = new Date();
  const horaFin = timestampToDate(reserva.horaFin);

  if (horaFin < ahora) {
    throw new Error("No se pueden cancelar reservas que ya finalizaron");
  }

  await reservaRef.update({
    estado: ESTADOS_RESERVA.CANCELADA,
    canceladoPor: userId,
    canceladoEn: Timestamp.now(),
  });
}

/**
 * Elimina una reserva completada o cancelada
 * Solo el dueño puede eliminar sus propias reservas
 * Los admins pueden eliminar cualquier reserva
 *
 * @param {string} reservaId - ID de la reserva
 * @param {string} userId - ID del usuario que elimina
 * @param {boolean} esAdmin - Si el usuario es admin (opcional)
 * @return {Promise<void>}
 */
export async function eliminarReserva(reservaId, userId, esAdmin = false) {
  const reservaRef = getDb().collection(COLECCIONES.RESERVAS).doc(reservaId);
  const doc = await reservaRef.get();

  if (!doc.exists) {
    throw new Error(ERRORES.RESERVA_NO_ENCONTRADA);
  }

  const reserva = doc.data();

  // Verificar permisos: solo el dueño o admin pueden eliminar
  if (!esAdmin && reserva.usuarioId !== userId) {
    throw new Error(ERRORES.SIN_PERMISOS);
  }

  // Verificar si la reserva ya terminó (está completada aunque el estado sea "activa")
  const ahora = new Date();
  const horaFin = timestampToDate(reserva.horaFin);
  const estaCompletada = horaFin < ahora;

  // Solo permitir eliminar reservas completadas, canceladas o si es admin
  if (!esAdmin && reserva.estado === ESTADOS_RESERVA.ACTIVA && !estaCompletada) {
    throw new Error("No se pueden eliminar reservas activas. Primero debe cancelarla.");
  }

  // Eliminar el documento
  await reservaRef.delete();
}

/**
 * Actualiza una reserva existente
 * Solo se puede actualizar si no hay conflictos
 *
 * @param {string} reservaId - ID de la reserva
 * @param {Object} cambios - Cambios a aplicar
 * @param {string} userId - ID del usuario que actualiza
 * @param {boolean} esAdmin - Si el usuario es admin
 * @return {Promise<Object>} Reserva actualizada
 */
export async function actualizarReserva(
    reservaId,
    cambios,
    userId,
    esAdmin = false,
) {
  const reservaRef = getDb().collection(COLECCIONES.RESERVAS).doc(reservaId);
  const doc = await reservaRef.get();

  if (!doc.exists) {
    throw new Error(ERRORES.RESERVA_NO_ENCONTRADA);
  }

  const reserva = doc.data();

  // Verificar permisos
  if (!esAdmin && reserva.usuarioId !== userId) {
    throw new Error(ERRORES.SIN_PERMISOS);
  }

  // Si se cambian las horas, validar disponibilidad
  if (cambios.horaInicio || cambios.horaFin) {
    const nuevoInicio = cambios.horaInicio ?
      new Date(cambios.horaInicio) :
      timestampToDate(reserva.horaInicio);
    const nuevoFin = cambios.horaFin ?
      new Date(cambios.horaFin) :
      timestampToDate(reserva.horaFin);

    const validacionHorario = validarRangoHorario(nuevoInicio, nuevoFin);
    if (!validacionHorario.valido) {
      throw new Error(validacionHorario.error);
    }

    const { disponible, conflictos } = await validarDisponibilidad(
        reserva.salaId,
        nuevoInicio,
        nuevoFin,
        reservaId, // Excluir esta reserva de la validación
    );

    if (!disponible) {
      const detallesConflicto = conflictos
          .map((c) => `${c.asignatura} (${c.nombreDocente})`)
          .join(", ");
      throw new Error(
          `${ERRORES.SALA_NO_DISPONIBLE}. Conflicto con: ${detallesConflicto}`,
      );
    }

    // Convertir a Timestamp si se cambian las horas
    if (cambios.horaInicio) {
      cambios.horaInicio = dateToTimestamp(nuevoInicio);
    }
    if (cambios.horaFin) {
      cambios.horaFin = dateToTimestamp(nuevoFin);
    }
  }

  // No permitir cambiar ciertos campos
  delete cambios.id;
  delete cambios.usuarioId;
  delete cambios.salaId;
  delete cambios.creadoEn;
  delete cambios.estado;

  const datosActualizados = {
    ...cambios,
    actualizadoEn: Timestamp.now(),
  };

  await reservaRef.update(datosActualizados);

  return {
    id: reservaId,
    ...reserva,
    ...datosActualizados,
  };
}

/**
 * Marca automáticamente como completadas las reservas que ya finalizaron
 * Esta función se puede ejecutar periódicamente con un Cloud Scheduler
 *
 * @return {Promise<number>} Cantidad de reservas marcadas como completadas
 */
export async function marcarReservasCompletadas() {
  const ahora = Timestamp.now();

  const snapshot = await db
      .collection(COLECCIONES.RESERVAS)
      .where("estado", "==", ESTADOS_RESERVA.ACTIVA)
      .where("horaFin", "<", ahora)
      .get();

  const batch = getDb().batch();
  let contador = 0;

  snapshot.forEach((doc) => {
    batch.update(doc.ref, {
      estado: ESTADOS_RESERVA.COMPLETADA,
      completadoEn: ahora,
    });
    contador++;
  });

  if (contador > 0) {
    await batch.commit();
  }

  return contador;
}
