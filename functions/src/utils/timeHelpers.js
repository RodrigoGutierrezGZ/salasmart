/**
 * Utilidades para manejo de fechas y horarios
 */

import { Timestamp } from "firebase-admin/firestore";

/**
 * Convierte un Date a Timestamp de Firebase
 * @param {Date} fecha
 * @return {Timestamp}
 */
export function dateToTimestamp(fecha) {
  if (fecha instanceof Timestamp) {
    return fecha;
  }
  if (fecha instanceof Date) {
    return Timestamp.fromDate(fecha);
  }
  if (typeof fecha === "string") {
    return Timestamp.fromDate(new Date(fecha));
  }
  throw new Error("Formato de fecha inválido");
}

/**
 * Convierte un Timestamp de Firebase a Date
 * @param {Timestamp} timestamp
 * @return {Date}
 */
export function timestampToDate(timestamp) {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  throw new Error("Formato de timestamp inválido");
}

/**
 * Calcula la diferencia en minutos entre dos fechas
 * @param {Date} fecha1
 * @param {Date} fecha2
 * @return {number} Diferencia en minutos
 */
export function diferenciaEnMinutos(fecha1, fecha2) {
  const diff = Math.abs(fecha1.getTime() - fecha2.getTime());
  return Math.floor(diff / (1000 * 60));
}

/**
 * Verifica si dos rangos de tiempo se solapan
 * @param {Date} inicio1
 * @param {Date} fin1
 * @param {Date} inicio2
 * @param {Date} fin2
 * @return {boolean} true si hay solapamiento
 */
export function rangosSeSolapan(inicio1, fin1, inicio2, fin2) {
  return (
    (inicio1 >= inicio2 && inicio1 < fin2) ||
    (fin1 > inicio2 && fin1 <= fin2) ||
    (inicio1 <= inicio2 && fin1 >= fin2)
  );
}

/**
 * Verifica si una fecha está dentro de un rango
 * @param {Date} fecha
 * @param {Date} inicio
 * @param {Date} fin
 * @return {boolean}
 */
export function estaEnRango(fecha, inicio, fin) {
  return fecha >= inicio && fecha < fin;
}

/**
 * Obtiene el inicio del día para una fecha
 * @param {Date} fecha
 * @return {Date}
 */
export function inicioDia(fecha = new Date()) {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setHours(0, 0, 0, 0);
  return nuevaFecha;
}

/**
 * Obtiene el fin del día para una fecha
 * @param {Date} fecha
 * @return {Date}
 */
export function finDia(fecha = new Date()) {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setHours(23, 59, 59, 999);
  return nuevaFecha;
}

/**
 * Formatea una fecha a string legible
 * @param {Date} fecha
 * @return {string}
 */
export function formatearFecha(fecha) {
  return fecha.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formatea una hora a string legible
 * @param {Date} fecha
 * @return {string}
 */
export function formatearHora(fecha) {
  return fecha.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
