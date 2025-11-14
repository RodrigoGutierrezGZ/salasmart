/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📋 SERVICIO DE LOGS Y AUDITORÍA
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Sistema de auditoría para rastrear todas las acciones importantes
 * en el sistema SalaSmart.
 *
 * Funcionalidades:
 * - Registrar logs de acciones (crear, editar, eliminar, activar, desactivar)
 * - Consultar logs con filtros
 * - Obtener logs por entidad específica
 *
 * Tipos de logs soportados:
 * - SEDES: Gestión de sedes
 * - EDIFICIOS: Gestión de edificios
 * - PISOS: Gestión de pisos (incluye cambiar imagen)
 * - SALAS: Gestión de salas
 * - USUARIOS: Gestión de usuarios
 * - RESERVAS: Gestión de reservas
 *
 * @author Claude Code
 * @date 9 Nov 2025
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📝 REGISTRAR LOG
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Registra una acción en el sistema de logs.
 *
 * @param {string} tipo - Tipo de entidad (SEDES, EDIFICIOS, PISOS, SALAS, USUARIOS, RESERVAS)
 * @param {string} accion - Acción realizada (crear, editar, eliminar, activar, desactivar, cambiar_imagen)
 * @param {string} entidad - Nombre de la entidad afectada
 * @param {string} entidadId - ID de la entidad afectada
 * @param {Object} datos - Datos relevantes de la acción (opcional)
 *
 * @returns {Promise<Object>} { success: true, logId: string } o { success: false, error: string }
 *
 * @example
 * await registrarLog(
 *   'SEDES',
 *   'crear',
 *   'INACAP Renca',
 *   'sede_renca',
 *   { codigo: 'RENCA', direccion: 'Av. Departamental 233' }
 * );
 */
export async function registrarLog(tipo, accion, entidad, entidadId, datos = {}) {
  try {
    // Obtener usuario actual
    const usuario = auth.currentUser;

    if (!usuario) {
      console.warn('⚠️ No hay usuario autenticado para registrar log');
      // No bloqueamos la operación, pero no registramos el log
      return { success: false, error: 'No hay usuario autenticado' };
    }

    // Crear documento de log
    const logData = {
      tipo,
      accion,
      entidad,
      entidadId,
      datos: datos || {},
      usuarioId: usuario.uid,
      usuarioEmail: usuario.email || 'Sin email',
      timestamp: Timestamp.now()
    };

    // Guardar en Firestore
    const logRef = await addDoc(collection(db, 'logs'), logData);

    console.log(`📋 Log registrado: [${tipo}] ${accion} - ${entidad} (ID: ${logRef.id})`);

    return {
      success: true,
      logId: logRef.id
    };

  } catch (error) {
    console.error('❌ Error al registrar log:', error);
    // No lanzamos error para no bloquear la operación principal
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📊 OBTENER LOGS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Obtiene logs del sistema con filtros opcionales.
 *
 * @param {number} limite - Número máximo de logs a obtener (default: 20)
 * @param {Object} filtros - Filtros opcionales { tipo, accion }
 *
 * @returns {Promise<Array>} Array de logs ordenados por fecha descendente
 *
 * @example
 * // Obtener últimos 20 logs
 * const logs = await obtenerLogs();
 *
 * // Obtener últimos 50 logs de tipo SEDES
 * const logsSedesAsync = await obtenerLogs(50, { tipo: 'SEDES' });
 *
 * // Obtener últimos 30 logs de acción 'crear'
 * const logsCrear = await obtenerLogs(30, { accion: 'crear' });
 */
export async function obtenerLogs(limite = 20, filtros = {}) {
  try {
    console.log(`📊 Obteniendo logs (límite: ${limite}, filtros:`, filtros, ')');

    let logsQuery = query(
      collection(db, 'logs'),
      orderBy('timestamp', 'desc'),
      limit(limite)
    );

    // Ejecutar query
    const snapshot = await getDocs(logsQuery);

    let logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Aplicar filtros en cliente (para evitar índices compuestos)
    if (filtros.tipo) {
      logs = logs.filter(log => log.tipo === filtros.tipo);
    }

    if (filtros.accion) {
      logs = logs.filter(log => log.accion === filtros.accion);
    }

    console.log(`✅ ${logs.length} logs obtenidos`);
    return logs;

  } catch (error) {
    console.error('❌ Error al obtener logs:', error);
    throw error;
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔍 OBTENER LOGS POR ENTIDAD
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Obtiene todos los logs relacionados con una entidad específica.
 * Útil para ver el historial completo de cambios de una sede/edificio/piso/sala.
 *
 * @param {string} entidadId - ID de la entidad
 * @param {number} limite - Número máximo de logs (default: 50)
 *
 * @returns {Promise<Array>} Array de logs de la entidad ordenados por fecha descendente
 *
 * @example
 * const historialSede = await obtenerLogsPorEntidad('sede_renca');
 */
export async function obtenerLogsPorEntidad(entidadId, limite = 50) {
  try {
    console.log(`🔍 Obteniendo logs para entidad: ${entidadId}`);

    const logsQuery = query(
      collection(db, 'logs'),
      where('entidadId', '==', entidadId),
      orderBy('timestamp', 'desc'),
      limit(limite)
    );

    const snapshot = await getDocs(logsQuery);

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ ${logs.length} logs encontrados para la entidad`);
    return logs;

  } catch (error) {
    console.error('❌ Error al obtener logs por entidad:', error);
    throw error;
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎨 HELPERS - Formateo y Utilidades
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Traduce claves técnicas al español
 */
export function traducirClave(clave) {
  const traducciones = {
    // Campos generales
    'nombre': 'Nombre',
    'email': 'Email',
    'codigo': 'Código',
    'direccion': 'Dirección',
    'descripcion': 'Descripción',

    // Usuarios
    'rol': 'Rol',
    'rolAnterior': 'Rol Anterior',
    'rolNuevo': 'Rol Nuevo',

    // Reservas
    'sala': 'Sala',
    'asignatura': 'Asignatura',
    'docente': 'Docente',
    'horaInicio': 'Hora Inicio',
    'horaFin': 'Hora Fin',
    'origen': 'Origen',

    // Infraestructura
    'capacidad': 'Capacidad',
    'edificio': 'Edificio',
    'piso': 'Piso',
    'sede': 'Sede'
  };

  return traducciones[clave] || capitalizar(clave);
}

/**
 * Capitaliza la primera letra de una palabra
 */
function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Formatea un valor para mostrarlo de forma legible
 */
export function formatearValor(valor) {
  if (valor === null || valor === undefined) return 'N/A';

  // Si es un objeto, convertir a JSON formateado
  if (typeof valor === 'object') {
    return JSON.stringify(valor, null, 2);
  }

  // Si es booleano
  if (typeof valor === 'boolean') {
    return valor ? 'Sí' : 'No';
  }

  // Si es string, capitalizar si es corto
  if (typeof valor === 'string') {
    // Roles
    if (valor === 'admin') return 'Administrador';
    if (valor === 'docente') return 'Docente';
    if (valor === 'estudiante') return 'Estudiante';

    // Origen de reservas
    if (valor === 'manual') return 'Manual';
    if (valor === 'chatbot') return 'Chatbot (IA)';

    // Si es muy largo, dejarlo tal cual
    if (valor.length > 50) return valor;

    // Capitalizar primera letra
    return capitalizar(valor);
  }

  return String(valor);
}

/**
 * Convierte timestamp de Firestore a formato absoluto legible
 */
export function formatearTimestampAbsoluto(timestamp) {
  if (!timestamp) return 'Fecha desconocida';

  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  return fecha.toLocaleString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Convierte un timestamp de Firestore a texto relativo
 * Ej: "hace 2 horas", "hace 3 días"
 */
export function formatearTiempoRelativo(timestamp) {
  if (!timestamp) return 'Desconocido';

  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const ahora = new Date();
  const diffMs = ahora - fecha;
  const diffSeg = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSeg / 60);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffSeg < 60) {
    return 'Hace unos segundos';
  } else if (diffMin < 60) {
    return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffHoras < 24) {
    return `Hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`;
  } else if (diffDias < 7) {
    return `Hace ${diffDias} ${diffDias === 1 ? 'día' : 'días'}`;
  } else {
    return fecha.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}

/**
 * Obtiene el ícono Material Symbol correspondiente a una acción
 * (Iconos profesionales y sobrios para sistemas empresariales)
 */
export function obtenerIconoAccion(accion) {
  const iconos = {
    'crear': 'add_circle',
    'editar': 'edit',
    'eliminar': 'delete',
    'activar': 'check_circle',
    'desactivar': 'cancel',
    'cambiar_imagen': 'image',
    'reservar': 'event',
    'cancelar': 'block',
    'completar': 'done',
    'cambiar_rol': 'person'
  };

  return iconos[accion] || 'description';
}

/**
 * Obtiene el color correspondiente a una acción (Tailwind classes)
 */
export function obtenerColorAccion(accion) {
  const colores = {
    'crear': 'text-green-600 bg-green-50',
    'editar': 'text-blue-600 bg-blue-50',
    'eliminar': 'text-red-600 bg-red-50',
    'activar': 'text-green-600 bg-green-50',
    'desactivar': 'text-gray-600 bg-gray-50',
    'cambiar_imagen': 'text-purple-600 bg-purple-50',
    'reservar': 'text-blue-600 bg-blue-50',
    'cancelar': 'text-orange-600 bg-orange-50',
    'completar': 'text-green-600 bg-green-50',
    'cambiar_rol': 'text-purple-600 bg-purple-50'
  };

  return colores[accion] || 'text-gray-600 bg-gray-50';
}

/**
 * Obtiene el texto descriptivo de una acción
 */
export function obtenerTextoAccion(accion, tipo, entidad) {
  // Helper para obtener el nombre del tipo en singular
  const getNombreTipo = (tipo) => {
    const nombres = {
      'SEDES': 'Sede',
      'EDIFICIOS': 'Edificio',
      'PISOS': 'Piso',
      'SALAS': 'Sala',
      'USUARIOS': 'Usuario',
      'RESERVAS': 'Reserva'
    };
    return nombres[tipo] || 'Elemento';
  };

  const nombreTipo = getNombreTipo(tipo);

  // Textos específicos por tipo y acción
  if (tipo === 'RESERVAS') {
    if (accion === 'crear' || accion === 'reservar') {
      return `Reserva creada: ${entidad}`;
    } else if (accion === 'cancelar') {
      return `Reserva cancelada: ${entidad}`;
    } else if (accion === 'completar') {
      return `Reserva completada: ${entidad}`;
    }
  }

  if (tipo === 'USUARIOS' && accion === 'cambiar_rol') {
    return `Rol de usuario "${entidad}" actualizado`;
  }

  if (accion === 'cambiar_imagen') {
    return `Imagen del piso "${entidad}" actualizada`;
  }

  // Textos genéricos por acción
  const textos = {
    'crear': `${nombreTipo} "${entidad}" creado`,
    'editar': `${nombreTipo} "${entidad}" editado`,
    'eliminar': `${nombreTipo} "${entidad}" eliminado`,
    'activar': `${nombreTipo} "${entidad}" activado`,
    'desactivar': `${nombreTipo} "${entidad}" desactivado`
  };

  return textos[accion] || `Acción "${accion}" en "${entidad}"`;
}
