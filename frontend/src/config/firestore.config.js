/**
 * Configuración de Firestore
 * Centraliza nombres de colecciones, campos y estados
 */

// ===================================
// NOMBRES DE COLECCIONES
// ===================================

export const COLLECTIONS = {
  USERS: 'users',
  SALAS: 'salas',
  RESERVAS: 'reservas'
};

// ===================================
// ESTADOS DE DOCUMENTOS
// ===================================

export const ESTADOS_RESERVA = {
  ACTIVA: 'activa',
  CANCELADA: 'cancelada',
  COMPLETADA: 'completada'
};

export const ROLES_USUARIO = {
  ESTUDIANTE: 'estudiante',
  DOCENTE: 'docente',
  ADMIN: 'admin'
};

// ===================================
// CAMPOS COMUNES
// ===================================

export const CAMPOS_COMUNES = {
  FECHA_CREACION: 'fechaCreacion',
  FECHA_ACTUALIZACION: 'fechaActualizacion',
  ACTIVO: 'activo',
  ESTADO: 'estado'
};

// ===================================
// HELPER FUNCTIONS
// ===================================

/**
 * Verifica si un estado de reserva es válido
 */
export function esEstadoReservaValido(estado) {
  return Object.values(ESTADOS_RESERVA).includes(estado);
}

/**
 * Verifica si un rol es válido
 */
export function esRolValido(rol) {
  return Object.values(ROLES_USUARIO).includes(rol);
}

/**
 * Verifica si un usuario es docente
 */
export function esDocente(userData) {
  return userData?.role === ROLES_USUARIO.DOCENTE;
}

/**
 * Verifica si un usuario es admin
 */
export function esAdmin(userData) {
  return userData?.role === ROLES_USUARIO.ADMIN;
}

/**
 * Verifica si un usuario es estudiante
 */
export function esEstudiante(userData) {
  return userData?.role === ROLES_USUARIO.ESTUDIANTE;
}

/**
 * Verifica si un usuario puede crear reservas
 */
export function puedeCrearReservas(userData) {
  return esDocente(userData) || esAdmin(userData);
}
