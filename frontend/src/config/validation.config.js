/**
 * Configuración de validaciones del sistema
 * Centraliza todos los valores de validación
 */

// ===================================
// CONFIGURACIÓN DE SALAS
// ===================================

export const SALAS_CONFIG = {
  CAPACIDAD_MIN: 1,
  CAPACIDAD_MAX: 200,
  PISO_MIN: 1,
  PISO_MAX: 10,
  NOMBRE_MIN_LENGTH: 2,
  NOMBRE_MAX_LENGTH: 50
};

// Filtros de capacidad
export const CAPACIDAD_FILTROS = {
  PEQUENA: {
    label: 'Pequeña',
    min: 0,
    max: 15
  },
  MEDIANA: {
    label: 'Mediana',
    min: 16,
    max: 30
  },
  GRANDE: {
    label: 'Grande',
    min: 31,
    max: 999
  }
};

// ===================================
// CONFIGURACIÓN DE RESERVAS
// ===================================

export const RESERVAS_CONFIG = {
  // Duraciones en minutos
  DURACION_MIN: 30,
  DURACION_MAX: 240, // 4 horas

  // Horarios laborales
  HORA_INICIO_DIA: 8,
  HORA_FIN_DIA: 22,

  // Asignatura
  ASIGNATURA_MIN_LENGTH: 3,
  ASIGNATURA_MAX_LENGTH: 100
};

// ===================================
// CONFIGURACIÓN DE JORNADAS
// ===================================

export const JORNADAS_CONFIG = {
  DIURNO: {
    INICIO: 8,
    FIN: 18  // Cambiar a 14 si prefieres separación a las 2pm
  },
  VESPERTINO: {
    INICIO: 18,  // Cambiar a 14 si prefieres separación a las 2pm
    FIN: 22
  }
};

// ===================================
// TIMEOUTS Y DELAYS (en milisegundos)
// ===================================

export const TIMEOUTS = {
  MESSAGE_AUTO_HIDE: 3000,
  CHATBOT_TYPING_DELAY: 300,
  FORM_SUCCESS_REDIRECT: 1500,
  NOTIFICATION_DURATION: 2000
};

// ===================================
// CONFIGURACIÓN DE USUARIOS
// ===================================

export const USUARIOS_CONFIG = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NOMBRE_MIN_LENGTH: 3,
  NOMBRE_MAX_LENGTH: 100
};

// ===================================
// HELPER FUNCTIONS
// ===================================

/**
 * Verifica si una capacidad está en cierto rango
 */
export function getCapacidadCategoria(capacidad) {
  if (capacidad <= CAPACIDAD_FILTROS.PEQUENA.max) return 'pequena';
  if (capacidad <= CAPACIDAD_FILTROS.MEDIANA.max) return 'mediana';
  return 'grande';
}

/**
 * Valida si un horario está dentro del rango laboral
 */
export function esHorarioValido(hora) {
  return hora >= RESERVAS_CONFIG.HORA_INICIO_DIA &&
         hora <= RESERVAS_CONFIG.HORA_FIN_DIA;
}

/**
 * Determina la jornada según la hora
 */
export function determinarJornada(hora) {
  if (hora >= JORNADAS_CONFIG.DIURNO.INICIO && hora < JORNADAS_CONFIG.DIURNO.FIN) {
    return 'diurno';
  }
  if (hora >= JORNADAS_CONFIG.VESPERTINO.INICIO && hora <= JORNADAS_CONFIG.VESPERTINO.FIN) {
    return 'vespertino';
  }
  return null;
}
