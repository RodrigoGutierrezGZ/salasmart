// ============================================================================
// SERVICIO DE NOTIFICACIONES - SalaSmart
// ============================================================================
// Gestiona notificaciones en tiempo real para usuarios del sistema
// Tipos: reserva_creada, reserva_cancelada, cuenta_aprobada, etc.
// ============================================================================

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ============================================================================
// TIPOS DE NOTIFICACIONES
// ============================================================================

export const TIPOS_NOTIFICACION = {
  // Notificaciones para DOCENTES
  RESERVA_CREADA: 'reserva_creada',
  RESERVA_CANCELADA: 'reserva_cancelada',
  CUENTA_APROBADA: 'cuenta_aprobada',
  SEDE_ASIGNADA: 'sede_asignada',
  ROL_CAMBIADO: 'rol_cambiado',

  // Notificaciones para ADMINISTRADORES
  NUEVA_CUENTA_PENDIENTE: 'nueva_cuenta_pendiente',
  RESERVA_CANCELADA_POR_USUARIO: 'reserva_cancelada_por_usuario',
};

// ============================================================================
// ICONOS POR TIPO DE NOTIFICACIÓN
// ============================================================================

export const getIconoNotificacion = (tipo) => {
  const iconos = {
    [TIPOS_NOTIFICACION.RESERVA_CREADA]: 'check_circle',
    [TIPOS_NOTIFICACION.RESERVA_CANCELADA]: 'cancel',
    [TIPOS_NOTIFICACION.CUENTA_APROBADA]: 'verified_user',
    [TIPOS_NOTIFICACION.SEDE_ASIGNADA]: 'location_on',
    [TIPOS_NOTIFICACION.ROL_CAMBIADO]: 'person',
    [TIPOS_NOTIFICACION.NUEVA_CUENTA_PENDIENTE]: 'person_add',
    [TIPOS_NOTIFICACION.RESERVA_CANCELADA_POR_USUARIO]: 'event_busy',
  };
  return iconos[tipo] || 'notifications';
};

// ============================================================================
// COLOR POR TIPO DE NOTIFICACIÓN
// ============================================================================

export const getColorNotificacion = (tipo) => {
  const colores = {
    [TIPOS_NOTIFICACION.RESERVA_CREADA]: 'green',
    [TIPOS_NOTIFICACION.RESERVA_CANCELADA]: 'red',
    [TIPOS_NOTIFICACION.CUENTA_APROBADA]: 'blue',
    [TIPOS_NOTIFICACION.SEDE_ASIGNADA]: 'purple',
    [TIPOS_NOTIFICACION.ROL_CAMBIADO]: 'orange',
    [TIPOS_NOTIFICACION.NUEVA_CUENTA_PENDIENTE]: 'blue',
    [TIPOS_NOTIFICACION.RESERVA_CANCELADA_POR_USUARIO]: 'yellow',
  };
  return colores[tipo] || 'gray';
};

// ============================================================================
// CREAR NOTIFICACIÓN
// ============================================================================

/**
 * Crea una nueva notificación en Firestore
 * @param {string} usuarioId - ID del usuario que recibirá la notificación
 * @param {string} tipo - Tipo de notificación (ver TIPOS_NOTIFICACION)
 * @param {string} titulo - Título de la notificación
 * @param {string} mensaje - Mensaje descriptivo
 * @param {object} datos - Datos adicionales (ej: reservaId, salaId, etc)
 */
export const crearNotificacion = async (usuarioId, tipo, titulo, mensaje, datos = {}) => {
  try {
    const notificacion = {
      usuarioId,
      tipo,
      titulo,
      mensaje,
      datos,
      leida: false,
      timestamp: Timestamp.now(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'notificaciones'), notificacion);

    console.log('✅ Notificación creada:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error al crear notificación:', error);
    throw error;
  }
};

// ============================================================================
// OBTENER NOTIFICACIONES DE UN USUARIO
// ============================================================================

/**
 * Obtiene todas las notificaciones de un usuario
 * @param {string} usuarioId - ID del usuario
 * @param {number} limite - Número máximo de notificaciones (default: 50)
 * @returns {Promise<Array>} Array de notificaciones
 */
export const obtenerNotificaciones = async (usuarioId, limite = 50) => {
  try {
    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      orderBy('timestamp', 'desc'),
      limit(limite)
    );

    const snapshot = await getDocs(q);
    const notificaciones = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return notificaciones;
  } catch (error) {
    console.error('❌ Error al obtener notificaciones:', error);
    throw error;
  }
};

// ============================================================================
// LISTENER EN TIEMPO REAL
// ============================================================================

/**
 * Suscribe a notificaciones en tiempo real de un usuario
 * @param {string} usuarioId - ID del usuario
 * @param {Function} callback - Función que se ejecuta cuando hay cambios
 * @returns {Function} Función para cancelar la suscripción
 */
export const escucharNotificaciones = (usuarioId, callback) => {
  try {
    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificaciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notificaciones);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error al escuchar notificaciones:', error);
    throw error;
  }
};

// ============================================================================
// MARCAR COMO LEÍDA
// ============================================================================

/**
 * Marca una notificación como leída
 * @param {string} notificacionId - ID de la notificación
 */
export const marcarComoLeida = async (notificacionId) => {
  try {
    const notificacionRef = doc(db, 'notificaciones', notificacionId);
    await updateDoc(notificacionRef, {
      leida: true,
      leidaEn: Timestamp.now()
    });
    console.log('✅ Notificación marcada como leída');
  } catch (error) {
    console.error('❌ Error al marcar notificación como leída:', error);
    throw error;
  }
};

// ============================================================================
// MARCAR TODAS COMO LEÍDAS
// ============================================================================

/**
 * Marca todas las notificaciones de un usuario como leídas
 * @param {string} usuarioId - ID del usuario
 */
export const marcarTodasComoLeidas = async (usuarioId) => {
  try {
    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      where('leida', '==', false)
    );

    const snapshot = await getDocs(q);
    const promesas = snapshot.docs.map(docSnapshot =>
      updateDoc(doc(db, 'notificaciones', docSnapshot.id), {
        leida: true,
        leidaEn: Timestamp.now()
      })
    );

    await Promise.all(promesas);
    console.log(`✅ ${promesas.length} notificaciones marcadas como leídas`);
  } catch (error) {
    console.error('❌ Error al marcar todas como leídas:', error);
    throw error;
  }
};

// ============================================================================
// ELIMINAR NOTIFICACIÓN
// ============================================================================

/**
 * Elimina una notificación
 * @param {string} notificacionId - ID de la notificación
 */
export const eliminarNotificacion = async (notificacionId) => {
  try {
    await deleteDoc(doc(db, 'notificaciones', notificacionId));
    console.log('✅ Notificación eliminada');
  } catch (error) {
    console.error('❌ Error al eliminar notificación:', error);
    throw error;
  }
};

// ============================================================================
// CONTAR NOTIFICACIONES NO LEÍDAS
// ============================================================================

/**
 * Cuenta las notificaciones no leídas de un usuario
 * @param {Array} notificaciones - Array de notificaciones
 * @returns {number} Cantidad de notificaciones no leídas
 */
export const contarNoLeidas = (notificaciones) => {
  return notificaciones.filter(n => !n.leida).length;
};

// ============================================================================
// HELPERS PARA CREAR NOTIFICACIONES ESPECÍFICAS
// ============================================================================

/**
 * Crea notificación de reserva creada
 */
export const notificarReservaCreada = async (usuarioId, nombreSala, fecha, horaInicio, horaFin, reservaId) => {
  return await crearNotificacion(
    usuarioId,
    TIPOS_NOTIFICACION.RESERVA_CREADA,
    'Reserva confirmada',
    `Tu reserva para ${nombreSala} el ${fecha} de ${horaInicio} a ${horaFin} fue confirmada`,
    { reservaId, nombreSala, fecha, horaInicio, horaFin }
  );
};

/**
 * Crea notificación de reserva cancelada
 */
export const notificarReservaCancelada = async (usuarioId, nombreSala, fecha, horaInicio, horaFin, reservaId) => {
  return await crearNotificacion(
    usuarioId,
    TIPOS_NOTIFICACION.RESERVA_CANCELADA,
    'Reserva cancelada',
    `Tu reserva para ${nombreSala} el ${fecha} de ${horaInicio} a ${horaFin} fue cancelada`,
    { reservaId, nombreSala, fecha, horaInicio, horaFin }
  );
};

/**
 * Crea notificación de cuenta aprobada
 */
export const notificarCuentaAprobada = async (usuarioId, nombreUsuario) => {
  return await crearNotificacion(
    usuarioId,
    TIPOS_NOTIFICACION.CUENTA_APROBADA,
    '¡Cuenta activada!',
    `Hola ${nombreUsuario}, tu cuenta ha sido aprobada. Ya puedes reservar salas`,
    {}
  );
};

/**
 * Crea notificación de sede asignada
 */
export const notificarSedeAsignada = async (usuarioId, nombresSedes) => {
  return await crearNotificacion(
    usuarioId,
    TIPOS_NOTIFICACION.SEDE_ASIGNADA,
    'Sedes asignadas',
    `Se te asignó acceso a: ${nombresSedes}`,
    { sedes: nombresSedes }
  );
};

/**
 * Notifica a admins de nueva cuenta pendiente
 */
export const notificarNuevaCuentaPendiente = async (adminIds, nombreUsuario, rolSolicitado, emailUsuario) => {
  const promesas = adminIds.map(adminId =>
    crearNotificacion(
      adminId,
      TIPOS_NOTIFICACION.NUEVA_CUENTA_PENDIENTE,
      'Nueva cuenta pendiente',
      `${nombreUsuario} (${rolSolicitado}) solicita acceso al sistema`,
      { nombreUsuario, rolSolicitado, emailUsuario }
    )
  );

  return await Promise.all(promesas);
};

/**
 * Notifica a admin cuando un usuario cancela su reserva
 */
export const notificarReservaCanceladaPorUsuario = async (adminIds, nombreUsuario, nombreSala, fecha, horaInicio) => {
  const promesas = adminIds.map(adminId =>
    crearNotificacion(
      adminId,
      TIPOS_NOTIFICACION.RESERVA_CANCELADA_POR_USUARIO,
      'Reserva cancelada por usuario',
      `${nombreUsuario} canceló su reserva de ${nombreSala} (${fecha} - ${horaInicio})`,
      { nombreUsuario, nombreSala, fecha, horaInicio }
    )
  );

  return await Promise.all(promesas);
};

/**
 * Notifica a admins cuando un docente crea una nueva reserva
 */
export const notificarNuevaReserva = async (adminIds, nombreDocente, nombreSala, fecha, horaInicio, horaFin) => {
  const promesas = adminIds.map(adminId =>
    crearNotificacion(
      adminId,
      TIPOS_NOTIFICACION.RESERVA_CREADA,
      'Nueva reserva creada',
      `${nombreDocente} reservó ${nombreSala} el ${fecha} de ${horaInicio} a ${horaFin}`,
      { nombreDocente, nombreSala, fecha, horaInicio, horaFin }
    )
  );

  return await Promise.all(promesas);
};
