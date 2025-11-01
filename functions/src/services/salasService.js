/**
 * Servicio de gestión de salas
 * Maneja toda la lógica de negocio relacionada con salas
 */

import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { COLECCIONES, ERRORES } from "../utils/constants.js";
import { validarDatosSala } from "../utils/validators.js";

// Lazy initialization para evitar problemas con emulators
let db;
function getDb() {
  if (!db) {
    db = getFirestore();
  }
  return db;
}

/**
 * Crea una nueva sala en Firestore
 * @param {Object} salaData - Datos de la sala
 * @return {Promise<Object>} Sala creada con su ID
 */
export async function crearSala(salaData) {
  const validacion = validarDatosSala(salaData);
  if (!validacion.valido) {
    throw new Error(validacion.error);
  }

  const nuevaSala = {
    nombre: salaData.nombre,
    piso: salaData.piso,
    capacidad: salaData.capacidad,
    equipamiento: salaData.equipamiento || [],
    posicion: salaData.posicion || { x: 0, y: 0 },
    activo: true,
    creadoEn: Timestamp.now(),
  };

  const docRef = await getDb().collection(COLECCIONES.SALAS).add(nuevaSala);

  return {
    id: docRef.id,
    ...nuevaSala,
  };
}

/**
 * Obtiene una sala por su ID
 * @param {string} salaId - ID de la sala
 * @return {Promise<Object|null>} Datos de la sala o null
 */
export async function obtenerSalaPorId(salaId) {
  const doc = await getDb().collection(COLECCIONES.SALAS).doc(salaId).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  };
}

/**
 * Obtiene todas las salas activas
 * @param {number} piso - Filtrar por piso (opcional)
 * @return {Promise<Array>} Array de salas
 */
export async function obtenerTodasLasSalas(piso = null) {
  let query = getDb().collection(COLECCIONES.SALAS).where("activo", "==", true);

  if (piso !== null) {
    query = query.where("piso", "==", piso);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Actualiza los datos de una sala
 * @param {string} salaId - ID de la sala
 * @param {Object} cambios - Campos a actualizar
 * @return {Promise<Object>} Sala actualizada
 */
export async function actualizarSala(salaId, cambios) {
  const salaRef = getDb().collection(COLECCIONES.SALAS).doc(salaId);
  const doc = await salaRef.get();

  if (!doc.exists) {
    throw new Error(ERRORES.SALA_NO_ENCONTRADA);
  }

  delete cambios.id;
  delete cambios.creadoEn;

  const datosActualizados = {
    ...cambios,
    actualizadoEn: Timestamp.now(),
  };

  await salaRef.update(datosActualizados);

  return {
    id: salaId,
    ...doc.data(),
    ...datosActualizados,
  };
}

/**
 * Elimina una sala (soft delete)
 * @param {string} salaId - ID de la sala
 * @return {Promise<void>}
 */
export async function eliminarSala(salaId) {
  const salaRef = getDb().collection(COLECCIONES.SALAS).doc(salaId);
  const doc = await salaRef.get();

  if (!doc.exists) {
    throw new Error(ERRORES.SALA_NO_ENCONTRADA);
  }

  await salaRef.update({
    activo: false,
    eliminadoEn: Timestamp.now(),
  });
}

/**
 * Busca salas por capacidad mínima
 * @param {number} capacidadMinima - Capacidad mínima requerida
 * @return {Promise<Array>} Salas que cumplen el criterio
 */
export async function buscarSalasPorCapacidad(capacidadMinima) {
  const snapshot = await getDb()
      .collection(COLECCIONES.SALAS)
      .where("activo", "==", true)
      .where("capacidad", ">=", capacidadMinima)
      .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Busca salas por equipamiento específico
 * @param {string} equipamiento - Equipamiento requerido
 * @return {Promise<Array>} Salas que tienen ese equipamiento
 */
export async function buscarSalasPorEquipamiento(equipamiento) {
  const snapshot = await getDb()
      .collection(COLECCIONES.SALAS)
      .where("activo", "==", true)
      .where("equipamiento", "array-contains", equipamiento)
      .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
