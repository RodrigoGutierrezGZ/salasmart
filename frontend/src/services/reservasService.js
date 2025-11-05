/**
 * Servicio cliente para gestionar reservas directamente con Firestore
 * (SIN Cloud Functions - Compatible con plan gratuito)
 */

import { db, auth } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';


/**
 * Crea una nueva reserva directamente en Firestore
 *
 * @param {Object} datosReserva
 * @param {string} datosReserva.salaId - ID de la sala
 * @param {string} datosReserva.salaNombre - Nombre de la sala
 * @param {string} datosReserva.nombreDocente - Nombre del docente
 * @param {string} datosReserva.asignatura - Nombre de la asignatura
 * @param {Date|string} datosReserva.horaInicio - Hora inicio
 * @param {Date|string} datosReserva.horaFin - Hora fin
 * @return {Promise<Object>} Resultado de la operación
 */
export async function crearReserva(datosReserva) {
  try {
    console.log('📝 [reservasService] Iniciando creación de reserva...');
    console.log('📝 [reservasService] Datos recibidos:', datosReserva);

    const user = auth.currentUser;
    console.log('📝 [reservasService] Usuario actual:', user ? user.uid : 'NO AUTENTICADO');

    if (!user) {
      console.error('❌ [reservasService] Usuario no autenticado');
      return {
        success: false,
        error: 'Debes estar autenticado para crear una reserva',
      };
    }

    // Convertir fechas a Timestamp si son strings
    console.log('📝 [reservasService] Convirtiendo fechas a Timestamp...');
    console.log('   - horaInicio recibida:', datosReserva.horaInicio, 'Tipo:', typeof datosReserva.horaInicio);
    console.log('   - horaFin recibida:', datosReserva.horaFin, 'Tipo:', typeof datosReserva.horaFin);

    const horaInicio = datosReserva.horaInicio instanceof Date
      ? Timestamp.fromDate(datosReserva.horaInicio)
      : Timestamp.fromDate(new Date(datosReserva.horaInicio));

    const horaFin = datosReserva.horaFin instanceof Date
      ? Timestamp.fromDate(datosReserva.horaFin)
      : Timestamp.fromDate(new Date(datosReserva.horaFin));

    console.log('✅ [reservasService] Timestamps creados correctamente');
    console.log('   - horaInicio Timestamp:', horaInicio.toDate());
    console.log('   - horaFin Timestamp:', horaFin.toDate());

    // Validar que todos los campos requeridos estén presentes
    if (!datosReserva.salaId) {
      console.error('❌ [reservasService] Falta salaId');
      return {
        success: false,
        error: 'Falta el ID de la sala (salaId)',
      };
    }

    // Si no tiene salaNombre, usar el salaId como nombre
    const salaNombre = datosReserva.salaNombre || datosReserva.salaId;
    console.log('📝 [reservasService] Sala:', salaNombre, '(ID:', datosReserva.salaId, ')');

    // Validar disponibilidad antes de crear
    console.log('📝 [reservasService] Validando disponibilidad...');
    const disponibilidad = await validarDisponibilidad(
      datosReserva.salaId,
      horaInicio.toDate(),
      horaFin.toDate()
    );

    console.log('📝 [reservasService] Resultado de validación:', disponibilidad);

    if (!disponibilidad.disponible) {
      console.error('❌ [reservasService] Sala NO disponible - Conflictos:', disponibilidad.conflictos);
      return {
        success: false,
        error: 'La sala no está disponible en este horario',
        conflictos: disponibilidad.conflictos,
      };
    }

    console.log('✅ [reservasService] Sala disponible, procediendo a crear...');

    // Crear la reserva
    const nuevaReserva = {
      salaId: datosReserva.salaId,
      salaNombre: salaNombre,
      usuarioId: user.uid,
      nombreDocente: datosReserva.nombreDocente || user.displayName || user.email,
      asignatura: datosReserva.asignatura,
      horaInicio,
      horaFin,
      jornada: datosReserva.jornada || 'diurno',
      estado: 'activa',
      fechaCreacion: Timestamp.now(),
      fechaActualizacion: Timestamp.now(),
    };

    console.log('📝 [reservasService] Objeto de reserva a guardar:', nuevaReserva);
    console.log('📝 [reservasService] Llamando a addDoc...');

    const docRef = await addDoc(collection(db, 'reservas'), nuevaReserva);

    console.log('✅✅✅ [reservasService] RESERVA CREADA EN FIRESTORE - ID:', docRef.id);

    return {
      success: true,
      data: { id: docRef.id, ...nuevaReserva },
      message: 'Reserva creada exitosamente',
    };
  } catch (error) {
    console.error('❌❌❌ [reservasService] ERROR CRÍTICO al crear reserva:', error);
    console.error('❌ [reservasService] Error completo:', JSON.stringify(error, null, 2));
    console.error('❌ [reservasService] Stack trace:', error.stack);
    return {
      success: false,
      error: error.message || 'Error al crear la reserva',
    };
  }
}


/**
 * Obtiene las reservas de una sala específica en una fecha
 *
 * @param {string} salaId - ID de la sala
 * @param {string} fecha - Fecha en formato ISO (opcional)
 * @return {Promise<Object>} Resultado con las reservas
 */
export async function obtenerReservasSala(salaId, fecha = null) {
  try {
    let q = query(collection(db, 'reservas'), where('salaId', '==', salaId));

    if (fecha) {
      const fechaObj = new Date(fecha);
      const inicioDia = new Date(fechaObj.getFullYear(), fechaObj.getMonth(), fechaObj.getDate());
      const finDia = new Date(fechaObj.getFullYear(), fechaObj.getMonth(), fechaObj.getDate(), 23, 59, 59);
      
      // Traer todas y filtrar en el frontend para evitar índices compuestos
      const snapshot = await getDocs(collection(db, 'reservas'));
      const reservas = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => {
          if (r.salaId !== salaId) return false;
          const horaInicio = r.horaInicio?.toDate();
          return horaInicio && horaInicio >= inicioDia && horaInicio <= finDia;
        });

      return {
        success: true,
        data: reservas,
      };
    }

    const snapshot = await getDocs(q);
    const reservas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      success: true,
      data: reservas,
    };
  } catch (error) {
    console.error('Error al obtener reservas de la sala:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener las reservas',
      data: [],
    };
  }
}


/**
 * Obtiene las reservas del usuario actual
 *
 * @param {boolean} soloActivas - Solo reservas activas (default: true)
 * @return {Promise<Object>} Resultado con las reservas del usuario
 */
export async function obtenerMisReservas(soloActivas = true) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: 'Debes estar autenticado',
        data: [],
      };
    }

    // Traer todas las reservas del usuario
    const snapshot = await getDocs(collection(db, 'reservas'));
    let reservas = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(r => r.usuarioId === user.uid);

    // Filtrar por estado si se requiere
    if (soloActivas) {
      reservas = reservas.filter(r => r.estado === 'activa');
    }

    return {
      success: true,
      data: reservas,
    };
  } catch (error) {
    console.error('Error al obtener mis reservas:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener tus reservas',
      data: [],
    };
  }
}


/**
 * Cancela una reserva
 *
 * @param {string} reservaId - ID de la reserva a cancelar
 * @return {Promise<Object>} Resultado de la operación
 */
export async function cancelarReserva(reservaId) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      };
    }

    const reservaRef = doc(db, 'reservas', reservaId);
    await updateDoc(reservaRef, {
      estado: 'cancelada',
      fechaActualizacion: Timestamp.now(),
    });

    return {
      success: true,
      message: 'Reserva cancelada exitosamente',
    };
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    return {
      success: false,
      error: error.message || 'Error al cancelar la reserva',
    };
  }
}


/**
 * Elimina una reserva completada o cancelada
 *
 * @param {string} reservaId - ID de la reserva a eliminar
 * @return {Promise<Object>} Resultado de la operación
 */
export async function eliminarReserva(reservaId) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      };
    }

    const reservaRef = doc(db, 'reservas', reservaId);
    await deleteDoc(reservaRef);

    return {
      success: true,
      message: 'Reserva eliminada exitosamente',
    };
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    return {
      success: false,
      error: error.message || 'Error al eliminar la reserva',
    };
  }
}


/**
 * Actualiza una reserva existente
 *
 * @param {string} reservaId - ID de la reserva
 * @param {Object} cambios - Cambios a aplicar
 * @return {Promise<Object>} Resultado de la operación
 */
export async function actualizarReserva(reservaId, cambios) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      };
    }

    const reservaRef = doc(db, 'reservas', reservaId);
    
    // Convertir fechas si vienen en los cambios
    const cambiosActualizados = { ...cambios };
    if (cambios.horaInicio) {
      cambiosActualizados.horaInicio = cambios.horaInicio instanceof Date
        ? Timestamp.fromDate(cambios.horaInicio)
        : Timestamp.fromDate(new Date(cambios.horaInicio));
    }
    if (cambios.horaFin) {
      cambiosActualizados.horaFin = cambios.horaFin instanceof Date
        ? Timestamp.fromDate(cambios.horaFin)
        : Timestamp.fromDate(new Date(cambios.horaFin));
    }

    cambiosActualizados.fechaActualizacion = Timestamp.now();

    await updateDoc(reservaRef, cambiosActualizados);

    return {
      success: true,
      message: 'Reserva actualizada exitosamente',
    };
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    return {
      success: false,
      error: error.message || 'Error al actualizar la reserva',
    };
  }
}


/**
 * Valida si una sala está disponible en un horario específico
 *
 * @param {string} salaId - ID de la sala
 * @param {Date} horaInicio - Hora inicio
 * @param {Date} horaFin - Hora fin
 * @return {Promise<Object>} Resultado con disponibilidad y conflictos
 */
export async function validarDisponibilidad(salaId, horaInicio, horaFin) {
  try {
    // Traer todas las reservas activas de la sala
    const snapshot = await getDocs(collection(db, 'reservas'));
    const reservasActivas = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(r => r.salaId === salaId && r.estado === 'activa');

    const inicio = horaInicio instanceof Date ? horaInicio : new Date(horaInicio);
    const fin = horaFin instanceof Date ? horaFin : new Date(horaFin);

    // Buscar conflictos
    const conflictos = reservasActivas.filter(reserva => {
      const resInicio = reserva.horaInicio?.toDate();
      const resFin = reserva.horaFin?.toDate();

      if (!resInicio || !resFin) return false;

      // Hay conflicto si los rangos se superponen
      return (
        (inicio >= resInicio && inicio < resFin) ||  // Inicia durante otra reserva
        (fin > resInicio && fin <= resFin) ||        // Termina durante otra reserva
        (inicio <= resInicio && fin >= resFin)       // Cubre completamente otra reserva
      );
    });

    return {
      success: true,
      disponible: conflictos.length === 0,
      conflictos: conflictos.map(c => ({
        id: c.id,
        horaInicio: c.horaInicio?.toDate(),
        horaFin: c.horaFin?.toDate(),
        nombreDocente: c.nombreDocente,
        asignatura: c.asignatura,
      })),
    };
  } catch (error) {
    console.error('Error al validar disponibilidad:', error);
    return {
      success: false,
      disponible: false,
      error: error.message || 'Error al validar disponibilidad',
    };
  }
}
