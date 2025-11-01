/**
 * API de Reservas - Cloud Functions HTTP
 * Endpoints que puede llamar el frontend
 */

import { https } from "firebase-functions/v2";
import { getAuth } from "firebase-admin/auth";
import * as reservasService from "../services/reservasService.js";
import { ERRORES, ROLES } from "../utils/constants.js";
import { esDocente, esAdmin } from "../utils/validators.js";
import { getFirestore } from "firebase-admin/firestore";

// Lazy initialization para evitar problemas con emulators
let db;
function getDb() {
  if (!db) {
    db = getFirestore();
  }
  return db;
}

/**
 * Crea una nueva reserva
 * Requiere autenticación y rol de docente
 *
 * POST /crearReserva
 * Body: {
 *   salaId: string,
 *   nombreDocente: string,
 *   asignatura: string,
 *   horaInicio: string (ISO 8601),
 *   horaFin: string (ISO 8601)
 * }
 */
export const crearReserva = https.onCall(async (request) => {
  // 1. Verificar autenticación
  if (!request.auth) {
    throw new https.HttpsError("unauthenticated", ERRORES.NO_AUTENTICADO);
  }

  const userId = request.auth.uid;

  // 2. Obtener datos del usuario para verificar rol
  const userDoc = await getDb().collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new https.HttpsError("not-found", "Usuario no encontrado");
  }

  const userData = userDoc.data();

  // 3. Verificar que sea docente o admin
  if (!esDocente(userData)) {
    throw new https.HttpsError(
        "permission-denied",
        "Solo los docentes pueden crear reservas",
    );
  }

  try {
    // 4. Crear la reserva
    const reservaData = {
      ...request.data,
      usuarioId: userId,
      nombreDocente: request.data.nombreDocente || userData.nombreCompleto,
    };

    const reserva = await reservasService.crearReserva(reservaData);

    return {
      success: true,
      data: reserva,
      message: "Reserva creada exitosamente",
    };
  } catch (error) {
    console.error("Error al crear reserva:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Obtiene las reservas de una sala en una fecha
 *
 * GET /obtenerReservasSala
 * Params: {
 *   salaId: string,
 *   fecha?: string (ISO 8601, opcional)
 * }
 */
export const obtenerReservasSala = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError("unauthenticated", ERRORES.NO_AUTENTICADO);
  }

  const { salaId, fecha } = request.data;

  if (!salaId) {
    throw new https.HttpsError("invalid-argument", "El salaId es obligatorio");
  }

  try {
    const fechaConsulta = fecha ? new Date(fecha) : new Date();
    const reservas = await reservasService.obtenerReservasPorSala(
        salaId,
        fechaConsulta,
    );

    return {
      success: true,
      data: reservas,
    };
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Obtiene las reservas del usuario actual
 *
 * GET /obtenerMisReservas
 * Params: {
 *   soloActivas?: boolean
 * }
 */
export const obtenerMisReservas = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError("unauthenticated", ERRORES.NO_AUTENTICADO);
  }

  const userId = request.auth.uid;
  const { soloActivas = true } = request.data;

  try {
    const reservas = await reservasService.obtenerReservasPorDocente(
        userId,
        soloActivas,
    );

    return {
      success: true,
      data: reservas,
    };
  } catch (error) {
    console.error("Error al obtener mis reservas:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Cancela una reserva
 *
 * POST /cancelarReserva
 * Body: {
 *   reservaId: string
 * }
 */
export const cancelarReserva = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError("unauthenticated", ERRORES.NO_AUTENTICADO);
  }

  const userId = request.auth.uid;
  const { reservaId } = request.data;

  if (!reservaId) {
    throw new https.HttpsError(
        "invalid-argument",
        "El reservaId es obligatorio",
    );
  }

  try {
    // Verificar si es admin
    const userDoc = await getDb().collection("users").doc(userId).get();
    const esAdminUser = esAdmin(userDoc.data());

    await reservasService.cancelarReserva(reservaId, userId, esAdminUser);

    return {
      success: true,
      message: "Reserva cancelada exitosamente",
    };
  } catch (error) {
    console.error("Error al cancelar reserva:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Elimina una reserva completada o cancelada
 *
 * POST /eliminarReserva
 * Body: {
 *   reservaId: string
 * }
 */
export const eliminarReserva = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError("unauthenticated", ERRORES.NO_AUTENTICADO);
  }

  const userId = request.auth.uid;
  const { reservaId } = request.data;

  if (!reservaId) {
    throw new https.HttpsError(
        "invalid-argument",
        "El reservaId es obligatorio",
    );
  }

  try {
    // Verificar si es admin
    const userDoc = await getDb().collection("users").doc(userId).get();
    const esAdminUser = esAdmin(userDoc.data());

    await reservasService.eliminarReserva(reservaId, userId, esAdminUser);

    return {
      success: true,
      message: "Reserva eliminada exitosamente",
    };
  } catch (error) {
    console.error("Error al eliminar reserva:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Actualiza una reserva existente
 *
 * POST /actualizarReserva
 * Body: {
 *   reservaId: string,
 *   cambios: {
 *     horaInicio?: string,
 *     horaFin?: string,
 *     asignatura?: string,
 *     nombreDocente?: string
 *   }
 * }
 */
export const actualizarReserva = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError("unauthenticated", ERRORES.NO_AUTENTICADO);
  }

  const userId = request.auth.uid;
  const { reservaId, cambios } = request.data;

  if (!reservaId || !cambios) {
    throw new https.HttpsError(
        "invalid-argument",
        "reservaId y cambios son obligatorios",
    );
  }

  try {
    const userDoc = await getDb().collection("users").doc(userId).get();
    const esAdminUser = esAdmin(userDoc.data());

    const reservaActualizada = await reservasService.actualizarReserva(
        reservaId,
        cambios,
        userId,
        esAdminUser,
    );

    return {
      success: true,
      data: reservaActualizada,
      message: "Reserva actualizada exitosamente",
    };
  } catch (error) {
    console.error("Error al actualizar reserva:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Valida la disponibilidad de una sala en un horario
 *
 * POST /validarDisponibilidad
 * Body: {
 *   salaId: string,
 *   horaInicio: string (ISO 8601),
 *   horaFin: string (ISO 8601)
 * }
 */
export const validarDisponibilidad = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError("unauthenticated", ERRORES.NO_AUTENTICADO);
  }

  const { salaId, horaInicio, horaFin } = request.data;

  if (!salaId || !horaInicio || !horaFin) {
    throw new https.HttpsError(
        "invalid-argument",
        "salaId, horaInicio y horaFin son obligatorios",
    );
  }

  try {
    const resultado = await reservasService.validarDisponibilidad(
        salaId,
        new Date(horaInicio),
        new Date(horaFin),
    );

    return {
      success: true,
      data: resultado,
    };
  } catch (error) {
    console.error("Error al validar disponibilidad:", error);
    throw new https.HttpsError("internal", error.message);
  }
});
