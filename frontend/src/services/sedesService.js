// src/services/sedesService.js

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { registrarLog } from './logsService';

/**
 * Crear una nueva sede
 * @param {Object} datos - Datos de la sede
 * @param {string} datos.nombre - Nombre completo de la sede (ej: "INACAP Renca")
 * @param {string} datos.codigo - Código único de la sede (ej: "RENCA")
 * @param {string} [datos.direccion] - Dirección opcional
 * @returns {Promise<string>} ID de la sede creada
 */
export async function crearSede(datos) {
  try {
    console.log('📝 [sedesService] Creando nueva sede...', datos);

    // Validaciones
    if (!datos.nombre || datos.nombre.trim().length < 5) {
      throw new Error('El nombre de la sede debe tener al menos 5 caracteres');
    }

    if (!datos.codigo || datos.codigo.trim().length < 2) {
      throw new Error('El código de la sede debe tener al menos 2 caracteres');
    }

    const codigoUppercase = datos.codigo.trim().toUpperCase();

    // Verificar que el código sea único
    const codigoExiste = await verificarCodigoUnico(codigoUppercase);
    if (codigoExiste) {
      throw new Error(`Ya existe una sede con el código "${codigoUppercase}"`);
    }

    const sedeData = {
      nombre: datos.nombre.trim(),
      codigo: codigoUppercase,
      direccion: datos.direccion?.trim() || '',
      activa: true,
      fechaCreacion: Timestamp.now(),
      fechaActualizacion: Timestamp.now()
    };

    const sedeRef = await addDoc(collection(db, 'sedes'), sedeData);
    console.log('✅ [sedesService] Sede creada con ID:', sedeRef.id);

    // Registrar log
    await registrarLog(
      'SEDES',
      'crear',
      sedeData.nombre,
      sedeRef.id,
      { codigo: sedeData.codigo, direccion: sedeData.direccion }
    );

    return sedeRef.id;
  } catch (error) {
    console.error('❌ [sedesService] Error al crear sede:', error);
    throw error;
  }
}

/**
 * Verificar si un código de sede ya existe
 * @param {string} codigo - Código a verificar
 * @returns {Promise<boolean>} true si existe, false si no
 */
async function verificarCodigoUnico(codigo) {
  const sedesQuery = query(
    collection(db, 'sedes'),
    where('codigo', '==', codigo)
  );
  const snapshot = await getDocs(sedesQuery);
  return !snapshot.empty;
}

/**
 * Obtener todas las sedes
 * @param {boolean} [soloActivas=true] - Si true, solo devuelve sedes activas
 * @returns {Promise<Array>} Array de sedes
 */
export async function obtenerSedes(soloActivas = true) {
  try {
    console.log('📝 [sedesService] Obteniendo sedes...');

    // Query simple sin índice compuesto - solo ordenar por nombre
    const sedesQuery = query(
      collection(db, 'sedes'),
      orderBy('nombre', 'asc')
    );

    const snapshot = await getDocs(sedesQuery);
    let sedes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar en el cliente si se requiere solo activas (evita necesidad de índice compuesto)
    if (soloActivas) {
      sedes = sedes.filter(sede => sede.activa === true);
    }

    console.log(`✅ [sedesService] ${sedes.length} sedes obtenidas`);
    return sedes;
  } catch (error) {
    console.error('❌ [sedesService] Error al obtener sedes:', error);
    throw error;
  }
}

/**
 * Obtener una sede por ID
 * @param {string} sedeId - ID de la sede
 * @returns {Promise<Object|null>} Datos de la sede o null si no existe
 */
export async function obtenerSedePorId(sedeId) {
  try {
    console.log('📝 [sedesService] Obteniendo sede:', sedeId);

    const sedeDoc = await getDoc(doc(db, 'sedes', sedeId));

    if (!sedeDoc.exists()) {
      console.warn('⚠️ [sedesService] Sede no encontrada:', sedeId);
      return null;
    }

    const sedeData = {
      id: sedeDoc.id,
      ...sedeDoc.data()
    };

    console.log('✅ [sedesService] Sede obtenida:', sedeData.nombre);
    return sedeData;
  } catch (error) {
    console.error('❌ [sedesService] Error al obtener sede:', error);
    throw error;
  }
}

/**
 * Actualizar una sede
 * @param {string} sedeId - ID de la sede
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<void>}
 */
export async function actualizarSede(sedeId, datos) {
  try {
    console.log('📝 [sedesService] Actualizando sede:', sedeId, datos);

    // Validaciones
    if (datos.nombre && datos.nombre.trim().length < 5) {
      throw new Error('El nombre de la sede debe tener al menos 5 caracteres');
    }

    if (datos.codigo && datos.codigo.trim().length < 2) {
      throw new Error('El código de la sede debe tener al menos 2 caracteres');
    }

    const updateData = {
      ...datos,
      fechaActualizacion: Timestamp.now()
    };

    // Si se actualiza el código, verificar que sea único
    if (datos.codigo) {
      const codigoUppercase = datos.codigo.trim().toUpperCase();
      const sedeActual = await obtenerSedePorId(sedeId);

      // Solo verificar si el código cambió
      if (sedeActual && sedeActual.codigo !== codigoUppercase) {
        const codigoExiste = await verificarCodigoUnico(codigoUppercase);
        if (codigoExiste) {
          throw new Error(`Ya existe una sede con el código "${codigoUppercase}"`);
        }
      }

      updateData.codigo = codigoUppercase;
    }

    const sedeActualData = await obtenerSedePorId(sedeId);

    await updateDoc(doc(db, 'sedes', sedeId), updateData);
    console.log('✅ [sedesService] Sede actualizada exitosamente');

    // Registrar log
    await registrarLog(
      'SEDES',
      'editar',
      sedeActualData?.nombre || 'Sede',
      sedeId,
      updateData
    );

    // Si se actualiza el nombre o código, actualizar en cascada
    if (datos.nombre || datos.codigo) {
      await actualizarSedeEnCascada(sedeId, updateData);
    }
  } catch (error) {
    console.error('❌ [sedesService] Error al actualizar sede:', error);
    throw error;
  }
}

/**
 * Actualizar datos de sede en edificios y salas relacionados (denormalización)
 * @param {string} sedeId - ID de la sede
 * @param {Object} datos - Datos actualizados
 */
async function actualizarSedeEnCascada(sedeId, datos) {
  try {
    console.log('🔄 [sedesService] Actualizando sede en cascada...');

    // Actualizar edificios
    const edificiosQuery = query(
      collection(db, 'edificios'),
      where('sedeId', '==', sedeId)
    );
    const edificiosSnap = await getDocs(edificiosQuery);

    const updatePromises = [];

    edificiosSnap.docs.forEach(docSnap => {
      const updateData = {};
      if (datos.codigo) updateData.sedeCodigo = datos.codigo;
      if (datos.nombre) updateData.sedeNombre = datos.nombre;

      updatePromises.push(
        updateDoc(doc(db, 'edificios', docSnap.id), updateData)
      );
    });

    // Actualizar pisos (incluyendo nombreCompleto si cambió el nombre de la sede)
    const pisosQuery = query(
      collection(db, 'pisos'),
      where('sedeId', '==', sedeId)
    );
    const pisosSnap = await getDocs(pisosQuery);

    pisosSnap.docs.forEach(docSnap => {
      const piso = docSnap.data();
      const updateData = {};

      if (datos.codigo) updateData.sedeCodigo = datos.codigo;

      // Si cambió el nombre de la sede, actualizar nombreCompleto del piso
      if (datos.nombre && piso.nombreCompleto) {
        // Formato actual: "Piso X - Edificio Y - Sede Z"
        const partes = piso.nombreCompleto.split(' - ');
        if (partes.length >= 3) {
          partes[partes.length - 1] = datos.nombre; // Reemplazar nombre de la sede
          updateData.nombreCompleto = partes.join(' - ');
        }
      }

      updatePromises.push(
        updateDoc(doc(db, 'pisos', docSnap.id), updateData)
      );
    });

    // Esperar a que se actualicen edificios y pisos primero
    await Promise.all(updatePromises);

    // Ahora actualizar salas (después de que los pisos estén actualizados)
    if (datos.nombre || datos.codigo) {
      const salasQuery = query(
        collection(db, 'salas'),
        where('sedeId', '==', sedeId)
      );
      const salasSnap = await getDocs(salasQuery);

      const salasPromises = [];

      for (const docSnap of salasSnap.docs) {
        const sala = docSnap.data();
        const updateData = {};

        if (datos.codigo) updateData.sedeCodigo = datos.codigo;

        // Si cambió el nombre, reconstruir nombreCompleto
        if (datos.nombre && sala.pisoId) {
          try {
            // Obtener datos del piso ACTUALIZADO para reconstruir nombreCompleto
            const pisoDoc = await getDoc(doc(db, 'pisos', sala.pisoId));
            if (pisoDoc.exists()) {
              const piso = pisoDoc.data();
              // Reconstruir nombreCompleto de la sala: "Nombre - NombreCompletoPiso"
              updateData.nombreCompleto = `${sala.nombre} - ${piso.nombreCompleto}`;
            }
          } catch (error) {
            console.error('Error al actualizar nombreCompleto de sala:', error);
          }
        }

        salasPromises.push(
          updateDoc(doc(db, 'salas', docSnap.id), updateData)
        );
      }

      await Promise.all(salasPromises);
    }
    console.log('✅ [sedesService] Actualización en cascada completada');
  } catch (error) {
    console.error('❌ [sedesService] Error en actualización en cascada:', error);
    // No lanzamos el error para no interrumpir la operación principal
  }
}

/**
 * Eliminar una sede (con validación de dependencias)
 * @param {string} sedeId - ID de la sede
 * @returns {Promise<void>}
 */
export async function eliminarSede(sedeId) {
  try {
    console.log('📝 [sedesService] Eliminando sede:', sedeId);

    // Obtener datos de la sede antes de eliminar
    const sedeData = await obtenerSedePorId(sedeId);

    // Verificar que no tenga edificios asociados
    const edificiosQuery = query(
      collection(db, 'edificios'),
      where('sedeId', '==', sedeId)
    );
    const edificiosSnap = await getDocs(edificiosQuery);

    if (!edificiosSnap.empty) {
      throw new Error(
        'No se puede eliminar: la sede tiene edificios asociados. ' +
        'Elimina primero todos los edificios de esta sede.'
      );
    }

    await deleteDoc(doc(db, 'sedes', sedeId));
    console.log('✅ [sedesService] Sede eliminada exitosamente');

    // Registrar log
    await registrarLog(
      'SEDES',
      'eliminar',
      sedeData?.nombre || 'Sede',
      sedeId,
      { codigo: sedeData?.codigo }
    );
  } catch (error) {
    console.error('❌ [sedesService] Error al eliminar sede:', error);
    throw error;
  }
}

/**
 * Obtener sede con sus edificios
 * @param {string} sedeId - ID de la sede
 * @returns {Promise<Object>} Sede con array de edificios
 */
export async function obtenerSedeConEdificios(sedeId) {
  try {
    console.log('📝 [sedesService] Obteniendo sede con edificios:', sedeId);

    const sede = await obtenerSedePorId(sedeId);
    if (!sede) {
      throw new Error('Sede no encontrada');
    }

    // Query simple - solo un where (evita necesidad de índice compuesto)
    const edificiosQuery = query(
      collection(db, 'edificios'),
      where('sedeId', '==', sedeId)
    );
    const edificiosSnap = await getDocs(edificiosQuery);

    // Filtrar y ordenar en el cliente
    let edificios = edificiosSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar solo activos
    edificios = edificios.filter(edificio => edificio.activo === true);

    // Ordenar por nombre en el cliente
    edificios.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

    console.log(`✅ [sedesService] Sede con ${edificios.length} edificios obtenida`);

    return {
      ...sede,
      edificios
    };
  } catch (error) {
    console.error('❌ [sedesService] Error al obtener sede con edificios:', error);
    throw error;
  }
}

/**
 * Desactivar/Activar una sede (soft delete)
 * @param {string} sedeId - ID de la sede
 * @param {boolean} activa - true para activar, false para desactivar
 * @returns {Promise<void>}
 */
export async function toggleEstadoSede(sedeId, activa) {
  try {
    console.log(`📝 [sedesService] ${activa ? 'Activando' : 'Desactivando'} sede:`, sedeId);

    // Obtener datos de la sede
    const sedeData = await obtenerSedePorId(sedeId);

    await updateDoc(doc(db, 'sedes', sedeId), {
      activa,
      fechaActualizacion: Timestamp.now()
    });

    console.log('✅ [sedesService] Estado de sede actualizado');

    // Registrar log
    await registrarLog(
      'SEDES',
      activa ? 'activar' : 'desactivar',
      sedeData?.nombre || 'Sede',
      sedeId,
      { codigo: sedeData?.codigo, estado: activa ? 'activa' : 'inactiva' }
    );
  } catch (error) {
    console.error('❌ [sedesService] Error al cambiar estado de sede:', error);
    throw error;
  }
}
