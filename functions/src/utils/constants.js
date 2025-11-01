/**
 * Constantes globales del sistema SalaSmart
 */

// Estados de las salas
export const ESTADOS_SALA = {
  DISPONIBLE: "disponible",
  PROXIMAMENTE: "proximamente",
  OCUPADO: "ocupado",
};

// Colores para la visualización del plano
export const COLORES_SALA = {
  VERDE: "#4CAF50",    // Disponible
  AMARILLO: "#FFC107", // Próximamente ocupado
  ROJO: "#F44336",     // Ocupado
};

// Estados de reservas
export const ESTADOS_RESERVA = {
  ACTIVA: "activa",
  CANCELADA: "cancelada",
  COMPLETADA: "completada",
};

// Roles de usuarios
export const ROLES = {
  ESTUDIANTE: "estudiante",
  DOCENTE: "docente",
  ADMIN: "admin",
};

// Configuración de tiempos
export const TIEMPO_CONFIG = {
  MINUTOS_PREAVISO: 15, // Mostrar amarillo 15 min antes de la reserva
  DURACION_BLOQUE_MIN: 90, // Bloques de 90 minutos (modelo INACAP)
};

// Mensajes de error
export const ERRORES = {
  NO_AUTENTICADO: "Usuario no autenticado",
  SIN_PERMISOS: "No tienes permisos para realizar esta acción",
  SALA_NO_ENCONTRADA: "Sala no encontrada",
  RESERVA_NO_ENCONTRADA: "Reserva no encontrada",
  SALA_NO_DISPONIBLE: "La sala no está disponible en ese horario",
  DATOS_INVALIDOS: "Datos de reserva inválidos",
  HORARIO_INVALIDO: "El horario especificado no es válido",
};

// Colecciones de Firestore
export const COLECCIONES = {
  SALAS: "salas",
  RESERVAS: "reservas",
  USUARIOS: "users",
  NOTIFICACIONES: "notificaciones",
};
