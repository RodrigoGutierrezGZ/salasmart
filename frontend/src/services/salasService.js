// src/services/salasService.js

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { obtenerPisoPorId } from './pisosService';
import { registrarLog } from './logsService';

/**
 * Crear una nueva sala
 * @param {Object} datos - Datos de la sala
 * @param {string} datos.nombre - Nombre de la sala (ej: "401")
 * @param {string} datos.pisoId - ID del piso al que pertenece
 * @param {number} datos.capacidad - Capacidad de personas
 * @param {string} datos.tipo - Tipo de sala
 * @param {Object} datos.equipamiento - Equipamiento de la sala
 * @param {Object} [datos.coordenadas] - Coordenadas en el plano {x, y}
 * @returns {Promise<string>} ID de la sala creada
 */
export async function crearSala(datos) {
  try {
    console.log('📝 [salasService] Creando nueva sala...', datos);

    // Validaciones básicas
    if (!datos.nombre || datos.nombre.trim().length < 1) {
      throw new Error('El nombre de la sala es obligatorio');
    }

    if (!datos.pisoId) {
      throw new Error('Debe seleccionar un piso');
    }

    if (!datos.capacidad || datos.capacidad < 1) {
      throw new Error('La capacidad debe ser mayor a 0');
    }

    const nombreUppercase = datos.nombre.trim().toUpperCase();

    // Obtener datos del piso para denormalización
    const piso = await obtenerPisoPorId(datos.pisoId);
    if (!piso) {
      throw new Error('El piso seleccionado no existe');
    }

    // Verificar que el nombre sea único en el piso
    const nombreExiste = await verificarNombreUnicoEnPiso(nombreUppercase, datos.pisoId);
    if (nombreExiste) {
      throw new Error(
        `Ya existe una sala con el nombre "${nombreUppercase}" en ${piso.nombreCompleto}`
      );
    }

    // Usar nombre como ID para facilitar búsquedas
    const salaId = nombreUppercase;

    const salaData = {
      nombre: nombreUppercase,
      // Nueva jerarquía
      pisoId: datos.pisoId,
      pisoNumero: piso.numero,
      edificioId: piso.edificioId,
      edificioCodigo: piso.edificioCodigo,
      sedeId: piso.sedeId,
      sedeCodigo: piso.sedeCodigo,
      // Datos de la sala
      capacidad: Number(datos.capacidad),
      tipo: datos.tipo || 'aula_teorica',
      equipamiento: datos.equipamiento || {
        proyector: false,
        computadores: 0,
        enchufes: 0,
        pizarra: 'tradicional',
        aire_acondicionado: false,
        parlantes: false,
        microfono: false,
        camara: false,
        otros: []
      },
      coordenadas: datos.coordenadas || { x: 0, y: 0 },
      nombreCompleto: generarNombreCompletoSala(nombreUppercase, piso),
      activa: true,
      fechaCreacion: Timestamp.now(),
      fechaActualizacion: Timestamp.now()
    };

    await setDoc(doc(db, 'salas', salaId), salaData);
    console.log('✅ [salasService] Sala creada con ID:', salaId);

    // Registrar en logs
    await registrarLog('SALAS', 'crear', salaData.nombreCompleto, salaId, {
      nombre: salaData.nombre,
      capacidad: salaData.capacidad,
      tipo: salaData.tipo,
      pisoId: salaData.pisoId
    });

    return salaId;
  } catch (error) {
    console.error('❌ [salasService] Error al crear sala:', error);
    throw error;
  }
}

/**
 * Generar nombre completo de la sala
 * @param {string} nombre - Nombre de la sala
 * @param {Object} piso - Datos del piso
 * @returns {string} Nombre completo
 */
function generarNombreCompletoSala(nombre, piso) {
  return `${nombre} - ${piso.nombreCompleto}`;
}

/**
 * Verificar si un nombre de sala ya existe en un piso
 * @param {string} nombre - Nombre a verificar
 * @param {string} pisoId - ID del piso
 * @returns {Promise<boolean>} true si existe, false si no
 */
async function verificarNombreUnicoEnPiso(nombre, pisoId) {
  const salasQuery = query(
    collection(db, 'salas'),
    where('nombre', '==', nombre),
    where('pisoId', '==', pisoId)
  );
  const snapshot = await getDocs(salasQuery);
  return !snapshot.empty;
}

/**
 * Obtener todas las salas
 * @param {boolean} [soloActivas=true] - Si true, solo devuelve salas activas
 * @returns {Promise<Array>} Array de salas
 */
export async function obtenerSalas(soloActivas = true) {
  try {
    console.log('📝 [salasService] Obteniendo salas...');

    let salasQuery = query(
      collection(db, 'salas'),
      orderBy('sedeCodigo', 'asc'),
      orderBy('edificioCodigo', 'asc'),
      orderBy('pisoNumero', 'asc'),
      orderBy('nombre', 'asc')
    );

    if (soloActivas) {
      salasQuery = query(
        collection(db, 'salas'),
        where('activa', '==', true),
        orderBy('sedeCodigo', 'asc'),
        orderBy('edificioCodigo', 'asc'),
        orderBy('pisoNumero', 'asc'),
        orderBy('nombre', 'asc')
      );
    }

    const snapshot = await getDocs(salasQuery);
    const salas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ [salasService] ${salas.length} salas obtenidas`);
    return salas;
  } catch (error) {
    console.error('❌ [salasService] Error al obtener salas:', error);
    throw error;
  }
}

/**
 * Obtener salas de un piso específico
 * @param {string} pisoId - ID del piso
 * @param {boolean} [soloActivas=true] - Si true, solo devuelve salas activas
 * @returns {Promise<Array>} Array de salas
 */
export async function obtenerSalasPorPiso(pisoId, soloActivas = true) {
  try {
    console.log('📝 [salasService] Obteniendo salas del piso:', pisoId);

    let salasQuery = query(
      collection(db, 'salas'),
      where('pisoId', '==', pisoId),
      orderBy('nombre', 'asc')
    );

    if (soloActivas) {
      salasQuery = query(
        collection(db, 'salas'),
        where('pisoId', '==', pisoId),
        where('activa', '==', true),
        orderBy('nombre', 'asc')
      );
    }

    const snapshot = await getDocs(salasQuery);
    const salas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ [salasService] ${salas.length} salas obtenidas`);
    return salas;
  } catch (error) {
    console.error('❌ [salasService] Error al obtener salas por piso:', error);
    throw error;
  }
}

/**
 * Obtener salas de un edificio específico
 * @param {string} edificioId - ID del edificio
 * @param {boolean} [soloActivas=true] - Si true, solo devuelve salas activas
 * @returns {Promise<Array>} Array de salas
 */
export async function obtenerSalasPorEdificio(edificioId, soloActivas = true) {
  try {
    console.log('📝 [salasService] Obteniendo salas del edificio:', edificioId);

    let salasQuery = query(
      collection(db, 'salas'),
      where('edificioId', '==', edificioId),
      orderBy('pisoNumero', 'asc'),
      orderBy('nombre', 'asc')
    );

    if (soloActivas) {
      salasQuery = query(
        collection(db, 'salas'),
        where('edificioId', '==', edificioId),
        where('activa', '==', true),
        orderBy('pisoNumero', 'asc'),
        orderBy('nombre', 'asc')
      );
    }

    const snapshot = await getDocs(salasQuery);
    const salas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ [salasService] ${salas.length} salas obtenidas`);
    return salas;
  } catch (error) {
    console.error('❌ [salasService] Error al obtener salas por edificio:', error);
    throw error;
  }
}

/**
 * Obtener salas de una sede específica
 * @param {string} sedeId - ID de la sede
 * @param {boolean} [soloActivas=true] - Si true, solo devuelve salas activas
 * @returns {Promise<Array>} Array de salas
 */
export async function obtenerSalasPorSede(sedeId, soloActivas = true) {
  try {
    console.log('📝 [salasService] Obteniendo salas de la sede:', sedeId);

    let salasQuery = query(
      collection(db, 'salas'),
      where('sedeId', '==', sedeId),
      orderBy('edificioCodigo', 'asc'),
      orderBy('pisoNumero', 'asc'),
      orderBy('nombre', 'asc')
    );

    if (soloActivas) {
      salasQuery = query(
        collection(db, 'salas'),
        where('sedeId', '==', sedeId),
        where('activa', '==', true),
        orderBy('edificioCodigo', 'asc'),
        orderBy('pisoNumero', 'asc'),
        orderBy('nombre', 'asc')
      );
    }

    const snapshot = await getDocs(salasQuery);
    const salas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ [salasService] ${salas.length} salas obtenidas`);
    return salas;
  } catch (error) {
    console.error('❌ [salasService] Error al obtener salas por sede:', error);
    throw error;
  }
}

/**
 * Obtener una sala por ID
 * @param {string} salaId - ID de la sala
 * @returns {Promise<Object|null>} Datos de la sala o null si no existe
 */
export async function obtenerSalaPorId(salaId) {
  try {
    console.log('📝 [salasService] Obteniendo sala:', salaId);

    const salaDoc = await getDoc(doc(db, 'salas', salaId));

    if (!salaDoc.exists()) {
      console.warn('⚠️ [salasService] Sala no encontrada:', salaId);
      return null;
    }

    const salaData = {
      id: salaDoc.id,
      ...salaDoc.data()
    };

    console.log('✅ [salasService] Sala obtenida:', salaData.nombre);
    return salaData;
  } catch (error) {
    console.error('❌ [salasService] Error al obtener sala:', error);
    throw error;
  }
}

/**
 * Actualizar una sala
 * @param {string} salaId - ID de la sala
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<void>}
 */
export async function actualizarSala(salaId, datos) {
  try {
    console.log('📝 [salasService] Actualizando sala:', salaId, datos);

    // Validaciones
    if (datos.nombre && datos.nombre.trim().length < 1) {
      throw new Error('El nombre de la sala es obligatorio');
    }

    if (datos.capacidad && datos.capacidad < 1) {
      throw new Error('La capacidad debe ser mayor a 0');
    }

    const updateData = {
      ...datos,
      fechaActualizacion: Timestamp.now()
    };

    // Si se actualiza el nombre, convertir a mayúsculas
    if (datos.nombre) {
      const nombreUppercase = datos.nombre.trim().toUpperCase();
      const salaActual = await obtenerSalaPorId(salaId);

      // Verificar unicidad si cambió el nombre
      if (salaActual && salaActual.nombre !== nombreUppercase) {
        const nombreExiste = await verificarNombreUnicoEnPiso(
          nombreUppercase,
          salaActual.pisoId
        );
        if (nombreExiste) {
          throw new Error(
            `Ya existe una sala con el nombre "${nombreUppercase}" en este piso`
          );
        }
      }

      updateData.nombre = nombreUppercase;
    }

    // Si se actualiza la capacidad, convertir a número
    if (datos.capacidad) {
      updateData.capacidad = Number(datos.capacidad);
    }

    await updateDoc(doc(db, 'salas', salaId), updateData);
    console.log('✅ [salasService] Sala actualizada exitosamente');

    // Registrar en logs
    const salaActualizada = await obtenerSalaPorId(salaId);
    await registrarLog('SALAS', 'editar', salaActualizada?.nombreCompleto || salaId, salaId, updateData);
  } catch (error) {
    console.error('❌ [salasService] Error al actualizar sala:', error);
    throw error;
  }
}

/**
 * Actualizar coordenadas de una sala en el plano
 * @param {string} salaId - ID de la sala
 * @param {number} x - Coordenada X
 * @param {number} y - Coordenada Y
 * @returns {Promise<void>}
 */
export async function actualizarCoordenadasSala(salaId, x, y) {
  try {
    console.log('📝 [salasService] Actualizando coordenadas de sala:', salaId);

    await updateDoc(doc(db, 'salas', salaId), {
      coordenadas: { x, y },
      fechaActualizacion: Timestamp.now()
    });

    console.log('✅ [salasService] Coordenadas actualizadas');

    // Registrar en logs
    const sala = await obtenerSalaPorId(salaId);
    await registrarLog('SALAS', 'cambiar_coordenadas', sala?.nombreCompleto || salaId, salaId, {
      coordenadas: { x, y }
    });
  } catch (error) {
    console.error('❌ [salasService] Error al actualizar coordenadas:', error);
    throw error;
  }
}

/**
 * Eliminar una sala (con validación de reservas)
 * @param {string} salaId - ID de la sala
 * @returns {Promise<void>}
 */
export async function eliminarSala(salaId) {
  try {
    console.log('📝 [salasService] Eliminando sala:', salaId);

    // Obtener datos de la sala antes de eliminar (para el log)
    const sala = await obtenerSalaPorId(salaId);

    // Verificar que no tenga reservas activas
    const reservasQuery = query(
      collection(db, 'reservas'),
      where('salaId', '==', salaId),
      where('estado', '==', 'activa')
    );
    const reservasSnap = await getDocs(reservasQuery);

    if (!reservasSnap.empty) {
      // Verificar si alguna reserva es futura
      const ahora = new Date();
      const reservasFuturas = reservasSnap.docs.filter(doc => {
        const data = doc.data();
        const horaFin = data.horaFin?.toDate();
        return horaFin && horaFin > ahora;
      });

      if (reservasFuturas.length > 0) {
        throw new Error(
          'No se puede eliminar: la sala tiene reservas activas. ' +
          'Cancela primero todas las reservas de esta sala.'
        );
      }
    }

    await deleteDoc(doc(db, 'salas', salaId));
    console.log('✅ [salasService] Sala eliminada exitosamente');

    // Registrar en logs
    await registrarLog('SALAS', 'eliminar', sala?.nombreCompleto || salaId, salaId, {
      nombre: sala?.nombre,
      capacidad: sala?.capacidad,
      tipo: sala?.tipo
    });
  } catch (error) {
    console.error('❌ [salasService] Error al eliminar sala:', error);
    throw error;
  }
}

/**
 * Desactivar/Activar una sala (soft delete)
 * @param {string} salaId - ID de la sala
 * @param {boolean} activa - true para activar, false para desactivar
 * @returns {Promise<void>}
 */
export async function toggleEstadoSala(salaId, activa) {
  try {
    console.log(
      `📝 [salasService] ${activa ? 'Activando' : 'Desactivando'} sala:`,
      salaId
    );

    await updateDoc(doc(db, 'salas', salaId), {
      activa,
      fechaActualizacion: Timestamp.now()
    });

    console.log('✅ [salasService] Estado de sala actualizado');

    // Registrar en logs
    const sala = await obtenerSalaPorId(salaId);
    await registrarLog('SALAS', activa ? 'activar' : 'desactivar', sala?.nombreCompleto || salaId, salaId, {
      estado: activa ? 'activa' : 'inactiva'
    });
  } catch (error) {
    console.error('❌ [salasService] Error al cambiar estado de sala:', error);
    throw error;
  }
}

/**
 * Migrar sala existente a nueva estructura jerárquica
 * @param {string} salaId - ID de la sala
 * @param {string} pisoId - ID del piso al que se migrará
 * @returns {Promise<void>}
 */
export async function migrarSalaAJerarquia(salaId, pisoId) {
  try {
    console.log('📝 [salasService] Migrando sala a jerarquía:', salaId, pisoId);

    // Obtener datos del piso
    const piso = await obtenerPisoPorId(pisoId);
    if (!piso) {
      throw new Error('Piso no encontrado');
    }

    // Obtener datos actuales de la sala
    const sala = await obtenerSalaPorId(salaId);
    if (!sala) {
      throw new Error('Sala no encontrada');
    }

    // Actualizar sala con datos jerárquicos
    await updateDoc(doc(db, 'salas', salaId), {
      pisoId: pisoId,
      pisoNumero: piso.numero,
      edificioId: piso.edificioId,
      edificioCodigo: piso.edificioCodigo,
      sedeId: piso.sedeId,
      sedeCodigo: piso.sedeCodigo,
      nombreCompleto: generarNombreCompletoSala(sala.nombre, piso),
      fechaActualizacion: Timestamp.now()
    });

    console.log('✅ [salasService] Sala migrada exitosamente');
  } catch (error) {
    console.error('❌ [salasService] Error al migrar sala:', error);
    throw error;
  }
}
