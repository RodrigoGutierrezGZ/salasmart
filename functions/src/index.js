/**
 * Punto de entrada principal para Firebase Cloud Functions
 * Exporta todas las funciones disponibles
 */

import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2/options";

// Inicializar Firebase Admin
initializeApp();

// Configuración global para todas las funciones
setGlobalOptions({
  region: "us-central1", // Puedes cambiar la región si lo necesitas
  maxInstances: 10,
});

// ============================================
// IMPORTAR Y EXPORTAR TODAS LAS CLOUD FUNCTIONS
// ============================================

// API de Reservas
export {
  crearReserva,
  obtenerReservasSala,
  obtenerMisReservas,
  cancelarReserva,
  eliminarReserva,
  actualizarReserva,
  validarDisponibilidad,
} from "./api/reservasAPI.js";

// TODO: API de Salas (opcional, si quieres endpoints para CRUD de salas)
// export {
//   obtenerSalas,
//   crearSalaAPI,
//   actualizarSalaAPI,
//   eliminarSalaAPI,
// } from "./api/salasAPI.js";

// TODO: Webhook de Dialogflow para el chatbot (Fase 2)
// export { dialogflowWebhook } from "./api/dialogflowWebhook.js";

// TODO: Funciones programadas (Scheduled Functions)
// import { scheduler } from "firebase-functions/v2";
// export const limpiarReservasAntiguas = scheduler.onSchedule(
//   "every 24 hours",
//   async (event) => {
//     // Lógica para marcar como completadas las reservas pasadas
//   }
// );

console.log("✅ Firebase Functions inicializadas correctamente");
