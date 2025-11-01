/**
 * Lógica para calcular el estado visual de una sala
 * Sistema de colores: Verde (disponible), Amarillo (próximamente), Rojo (ocupado)
 */

import { ESTADOS_SALA, COLORES_SALA, TIEMPO_CONFIG } from "./constants.js";
import { timestampToDate, diferenciaEnMinutos, estaEnRango } from "./timeHelpers.js";

/**
 * Calcula el estado visual de una sala basado en sus reservas activas
 *
 * LÓGICA:
 * - VERDE: No hay reserva activa ni próxima
 * - AMARILLO: Hay una reserva que comienza en los próximos 15 minutos
 * - ROJO: La sala está ocupada en este momento
 *
 * @param {Array} reservasActivas - Array de reservas de la sala
 * @param {Date} ahora - Momento actual (opcional, para testing)
 * @return {Object} Estado de la sala con color, texto y datos
 */
export function calcularEstadoSala(reservasActivas, ahora = new Date()) {
  // Si no hay reservas, la sala está disponible
  if (!reservasActivas || reservasActivas.length === 0) {
    return {
      estado: ESTADOS_SALA.DISPONIBLE,
      color: COLORES_SALA.VERDE,
      texto: "Disponible",
      textoSecundario: "Sin reservas",
      reservaActual: null,
      proximaReserva: null,
    };
  }

  const ahoraTimestamp = ahora.getTime();

  // 1. PRIORIDAD ALTA: Verificar si hay una reserva ACTIVA ahora mismo
  const reservaActual = reservasActivas.find((reserva) => {
    const inicio = timestampToDate(reserva.horaInicio).getTime();
    const fin = timestampToDate(reserva.horaFin).getTime();
    return ahoraTimestamp >= inicio && ahoraTimestamp < fin;
  });

  if (reservaActual) {
    const horaFin = timestampToDate(reservaActual.horaFin);
    const minutosRestantes = diferenciaEnMinutos(horaFin, ahora);

    return {
      estado: ESTADOS_SALA.OCUPADO,
      color: COLORES_SALA.ROJO,
      texto: "Ocupado",
      textoSecundario: `Hasta las ${formatearHora(horaFin)} (${minutosRestantes} min)`,
      reservaActual: {
        id: reservaActual.id,
        nombreDocente: reservaActual.nombreDocente,
        asignatura: reservaActual.asignatura,
        horaInicio: reservaActual.horaInicio,
        horaFin: reservaActual.horaFin,
      },
      proximaReserva: null,
    };
  }

  // 2. PRIORIDAD MEDIA: Verificar si hay una reserva PRÓXIMA (en los próximos X minutos)
  const reservasProximas = reservasActivas
      .filter((reserva) => {
        const inicio = timestampToDate(reserva.horaInicio).getTime();
        const diferencia = inicio - ahoraTimestamp;
        const minutosFaltantes = diferencia / (1000 * 60);
        return minutosFaltantes > 0 && minutosFaltantes <= TIEMPO_CONFIG.MINUTOS_PREAVISO;
      })
      .sort((a, b) => {
        // Ordenar por hora de inicio (la más próxima primero)
        return timestampToDate(a.horaInicio).getTime() -
               timestampToDate(b.horaInicio).getTime();
      });

  if (reservasProximas.length > 0) {
    const proximaReserva = reservasProximas[0];
    const horaInicio = timestampToDate(proximaReserva.horaInicio);
    const minutosFaltantes = Math.round(
        (horaInicio.getTime() - ahoraTimestamp) / (1000 * 60),
    );

    return {
      estado: ESTADOS_SALA.PROXIMAMENTE,
      color: COLORES_SALA.AMARILLO,
      texto: "Próximamente ocupado",
      textoSecundario: `Reservado en ${minutosFaltantes} min`,
      reservaActual: null,
      proximaReserva: {
        id: proximaReserva.id,
        nombreDocente: proximaReserva.nombreDocente,
        asignatura: proximaReserva.asignatura,
        horaInicio: proximaReserva.horaInicio,
        horaFin: proximaReserva.horaFin,
        minutosFaltantes,
      },
    };
  }

  // 3. PRIORIDAD BAJA: Si no hay reserva activa ni próxima, está disponible
  // Pero podemos indicar cuándo será la próxima reserva del día
  const proximasReservasDelDia = reservasActivas
      .filter((reserva) => {
        const inicio = timestampToDate(reserva.horaInicio).getTime();
        return inicio > ahoraTimestamp;
      })
      .sort((a, b) => {
        return timestampToDate(a.horaInicio).getTime() -
               timestampToDate(b.horaInicio).getTime();
      });

  if (proximasReservasDelDia.length > 0) {
    const proximaReserva = proximasReservasDelDia[0];
    const horaInicio = timestampToDate(proximaReserva.horaInicio);

    return {
      estado: ESTADOS_SALA.DISPONIBLE,
      color: COLORES_SALA.VERDE,
      texto: "Disponible",
      textoSecundario: `Próxima reserva a las ${formatearHora(horaInicio)}`,
      reservaActual: null,
      proximaReserva: {
        id: proximaReserva.id,
        nombreDocente: proximaReserva.nombreDocente,
        asignatura: proximaReserva.asignatura,
        horaInicio: proximaReserva.horaInicio,
        horaFin: proximaReserva.horaFin,
      },
    };
  }

  // Si hay reservas pero ninguna es hoy o en el futuro cercano
  return {
    estado: ESTADOS_SALA.DISPONIBLE,
    color: COLORES_SALA.VERDE,
    texto: "Disponible",
    textoSecundario: "Resto del día libre",
    reservaActual: null,
    proximaReserva: null,
  };
}

/**
 * Formatea una hora a string legible (HH:MM)
 * @param {Date} fecha
 * @return {string}
 */
function formatearHora(fecha) {
  const date = fecha instanceof Date ? fecha : timestampToDate(fecha);
  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Obtiene el color CSS basado en el estado
 * @param {string} estado
 * @return {string} Código de color hex
 */
export function obtenerColorPorEstado(estado) {
  switch (estado) {
    case ESTADOS_SALA.DISPONIBLE:
      return COLORES_SALA.VERDE;
    case ESTADOS_SALA.PROXIMAMENTE:
      return COLORES_SALA.AMARILLO;
    case ESTADOS_SALA.OCUPADO:
      return COLORES_SALA.ROJO;
    default:
      return COLORES_SALA.VERDE;
  }
}

/**
 * Calcula el estado de múltiples salas de una vez
 * @param {Array} salas - Array de objetos sala
 * @param {Array} todasLasReservas - Array de todas las reservas
 * @param {Date} ahora - Momento actual
 * @return {Array} Salas con su estado calculado
 */
export function calcularEstadoMultiplesSalas(salas, todasLasReservas, ahora = new Date()) {
  return salas.map((sala) => {
    // Filtrar solo las reservas de esta sala que sean futuras
    const reservasDeLaSala = todasLasReservas.filter((reserva) => {
      return reserva.salaId === sala.id &&
             reserva.estado === "activa" &&
             timestampToDate(reserva.horaFin) > ahora;
    });

    const estadoCalculado = calcularEstadoSala(reservasDeLaSala, ahora);

    return {
      ...sala,
      ...estadoCalculado,
    };
  });
}
