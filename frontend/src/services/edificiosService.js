// src/services/edificiosService.js

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
import { obtenerSedePorId } from './sedesService';
import { registrarLog } from './logsService';

/**
 * Crear un nuevo edificio
 * @param {Object} datos - Datos del edificio
 * @param {string} datos.nombre - Nombre del edificio (ej: "Edificio A")
 * @param {string} datos.codigo - Código del edificio (ej: "A")
 * @param {string} datos.sedeId - ID de la sede a la que pertenece
 * @param {string} [datos.descripcion] - Descripción opcional
 * @returns {Promise<string>} ID del edificio creado
 */
export async function crearEdificio(datos) {
  try {
    console.log('📝 [edificiosService] Creando nuevo edificio...', datos);

    // Validaciones
    if (!datos.nombre || datos.nombre.trim().length < 2) {
      throw new Error('El nombre del edificio debe tener al menos 2 caracteres');
    }

    if (!datos.codigo || datos.codigo.trim().length < 1) {
      throw new Error('El código del edificio es obligatorio');
    }

    if (!datos.sedeId) {
      throw new Error('Debe seleccionar una sede');
    }

    // Verificar que la sede existe
    const sede = await obtenerSedePorId(datos.sedeId);
    if (!sede) {
      throw new Error('La sede seleccionada no existe');
    }

    const codigoUppercase = datos.codigo.trim().toUpperCase();

    // Verificar que el código sea único dentro de la sede
    const codigoExiste = await verificarCodigoUnicoEnSede(codigoUppercase, datos.sedeId);
    if (codigoExiste) {
      throw new Error(
        `Ya existe un edificio con el código "${codigoUppercase}" en la sede "${sede.nombre}"`
      );
    }

    const edificioData = {
      nombre: datos.nombre.trim(),
      codigo: codigoUppercase,
      sedeId: datos.sedeId,
      sedeCodigo: sede.codigo,
      sedeNombre: sede.nombre,
      descripcion: datos.descripcion?.trim() || '',
      activo: true,
      fechaCreacion: Timestamp.now(),
      fechaActualizacion: Timestamp.now()
    };

    const edificioRef = await addDoc(collection(db, 'edificios'), edificioData);
    console.log('✅ [edificiosService] Edificio creado con ID:', edificioRef.id);

    // Registrar log
    await registrarLog(
      'EDIFICIOS',
      'crear',
      edificioData.nombre,
      edificioRef.id,
      { codigo: edificioData.codigo, sede: edificioData.sedeNombre }
    );

    return edificioRef.id;
  } catch (error) {
    console.error('❌ [edificiosService] Error al crear edificio:', error);
    throw error;
  }
}

/**
 * Verificar si un código de edificio ya existe en una sede
 * @param {string} codigo - Código a verificar
 * @param {string} sedeId - ID de la sede
 * @returns {Promise<boolean>} true si existe, false si no
 */
async function verificarCodigoUnicoEnSede(codigo, sedeId) {
  const edificiosQuery = query(
    collection(db, 'edificios'),
    where('codigo', '==', codigo),
    where('sedeId', '==', sedeId)
  );
  const snapshot = await getDocs(edificiosQuery);
  return !snapshot.empty;
}

/**
 * Obtener todos los edificios
 * @param {boolean} [soloActivos=true] - Si true, solo devuelve edificios activos
 * @returns {Promise<Array>} Array de edificios
 */
export async function obtenerEdificios(soloActivos = true) {
  try {
    console.log('📝 [edificiosService] Obteniendo edificios...');

    // Query simple sin índice compuesto - ordenar solo por nombre
    const edificiosQuery = query(
      collection(db, 'edificios'),
      orderBy('nombre', 'asc')
    );

    const snapshot = await getDocs(edificiosQuery);
    let edificios = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar en el cliente si se requiere solo activos
    if (soloActivos) {
      edificios = edificios.filter(edificio => edificio.activo === true);
    }

    // Ordenar por sede y luego por nombre en el cliente
    edificios.sort((a, b) => {
      const sedeCompare = (a.sedeNombre || '').localeCompare(b.sedeNombre || '');
      if (sedeCompare !== 0) return sedeCompare;
      return (a.nombre || '').localeCompare(b.nombre || '');
    });

    console.log(`✅ [edificiosService] ${edificios.length} edificios obtenidos`);
    return edificios;
  } catch (error) {
    console.error('❌ [edificiosService] Error al obtener edificios:', error);
    throw error;
  }
}

/**
 * Obtener edificios de una sede específica
 * @param {string} sedeId - ID de la sede
 * @param {boolean} [soloActivos=true] - Si true, solo devuelve edificios activos
 * @returns {Promise<Array>} Array de edificios
 */
export async function obtenerEdificiosPorSede(sedeId, soloActivos = true) {
  try {
    console.log('📝 [edificiosService] Obteniendo edificios de sede:', sedeId);

    // Query simple con solo un where
    const edificiosQuery = query(
      collection(db, 'edificios'),
      where('sedeId', '==', sedeId)
    );

    const snapshot = await getDocs(edificiosQuery);
    let edificios = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar en el cliente si se requiere solo activos
    if (soloActivos) {
      edificios = edificios.filter(edificio => edificio.activo === true);
    }

    // Ordenar por nombre en el cliente
    edificios.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

    console.log(`✅ [edificiosService] ${edificios.length} edificios obtenidos`);
    return edificios;
  } catch (error) {
    console.error('❌ [edificiosService] Error al obtener edificios por sede:', error);
    throw error;
  }
}

/**
 * Obtener un edificio por ID
 * @param {string} edificioId - ID del edificio
 * @returns {Promise<Object|null>} Datos del edificio o null si no existe
 */
export async function obtenerEdificioPorId(edificioId) {
  try {
    console.log('📝 [edificiosService] Obteniendo edificio:', edificioId);

    const edificioDoc = await getDoc(doc(db, 'edificios', edificioId));

    if (!edificioDoc.exists()) {
      console.warn('⚠️ [edificiosService] Edificio no encontrado:', edificioId);
      return null;
    }

    const edificioData = {
      id: edificioDoc.id,
      ...edificioDoc.data()
    };

    console.log('✅ [edificiosService] Edificio obtenido:', edificioData.nombre);
    return edificioData;
  } catch (error) {
    console.error('❌ [edificiosService] Error al obtener edificio:', error);
    throw error;
  }
}

/**
 * Actualizar un edificio
 * @param {string} edificioId - ID del edificio
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<void>}
 */
export async function actualizarEdificio(edificioId, datos) {
  try {
    console.log('📝 [edificiosService] Actualizando edificio:', edificioId, datos);

    // Validaciones
    if (datos.nombre && datos.nombre.trim().length < 2) {
      throw new Error('El nombre del edificio debe tener al menos 2 caracteres');
    }

    if (datos.codigo && datos.codigo.trim().length < 1) {
      throw new Error('El código del edificio es obligatorio');
    }

    const updateData = {
      ...datos,
      fechaActualizacion: Timestamp.now()
    };

    // Si se actualiza el código, verificar que sea único en la sede
    if (datos.codigo) {
      const codigoUppercase = datos.codigo.trim().toUpperCase();
      const edificioActual = await obtenerEdificioPorId(edificioId);

      if (edificioActual && edificioActual.codigo !== codigoUppercase) {
        const codigoExiste = await verificarCodigoUnicoEnSede(
          codigoUppercase,
          edificioActual.sedeId
        );
        if (codigoExiste) {
          throw new Error(
            `Ya existe un edificio con el código "${codigoUppercase}" en esta sede`
          );
        }
      }

      updateData.codigo = codigoUppercase;
    }

    const edificioActualData = await obtenerEdificioPorId(edificioId);

    await updateDoc(doc(db, 'edificios', edificioId), updateData);
    console.log('✅ [edificiosService] Edificio actualizado exitosamente');

    // Registrar log
    await registrarLog(
      'EDIFICIOS',
      'editar',
      edificioActualData?.nombre || 'Edificio',
      edificioId,
      updateData
    );

    // Si se actualiza el nombre o código, actualizar en cascada
    if (datos.nombre || datos.codigo) {
      await actualizarEdificioEnCascada(edificioId, updateData);
    }
  } catch (error) {
    console.error('❌ [edificiosService] Error al actualizar edificio:', error);
    throw error;
  }
}

/**
 * Actualizar datos de edificio en pisos y salas relacionados (denormalización)
 * @param {string} edificioId - ID del edificio
 * @param {Object} datos - Datos actualizados
 */
async function actualizarEdificioEnCascada(edificioId, datos) {
  try {
    console.log('🔄 [edificiosService] Actualizando edificio en cascada...');

    const updatePromises = [];

    // Actualizar pisos (incluyendo nombreCompleto si cambió el nombre)
    const pisosQuery = query(
      collection(db, 'pisos'),
      where('edificioId', '==', edificioId)
    );
    const pisosSnap = await getDocs(pisosQuery);

    pisosSnap.docs.forEach(docSnap => {
      const piso = docSnap.data();
      const updateData = {};

      if (datos.codigo) updateData.edificioCodigo = datos.codigo;
      if (datos.nombre) updateData.edificioNombre = datos.nombre;

      // Si cambió el nombre del edificio, actualizar nombreCompleto del piso
      if (datos.nombre && piso.nombreCompleto) {
        // Formato actual: "Piso X - Edificio Y - Sede Z"
        const partes = piso.nombreCompleto.split(' - ');
        if (partes.length >= 3) {
          partes[1] = datos.nombre; // Reemplazar nombre del edificio (posición 1)
          updateData.nombreCompleto = partes.join(' - ');
        }
      }

      updatePromises.push(
        updateDoc(doc(db, 'pisos', docSnap.id), updateData)
      );
    });

    // Esperar a que se actualicen los pisos primero
    await Promise.all(updatePromises);

    // Ahora actualizar salas (después de que los pisos estén actualizados)
    if (datos.nombre || datos.codigo) {
      const salasQuery = query(
        collection(db, 'salas'),
        where('edificioId', '==', edificioId)
      );
      const salasSnap = await getDocs(salasQuery);

      const salasPromises = [];

      for (const docSnap of salasSnap.docs) {
        const sala = docSnap.data();
        const updateData = {};

        if (datos.codigo) updateData.edificioCodigo = datos.codigo;

        // Si cambió el nombre, reconstruir nombreCompleto
        if (datos.nombre && sala.pisoId) {
          try {
            // Obtener datos del piso ACTUALIZADO
            const pisoDoc = await getDoc(doc(db, 'pisos', sala.pisoId));
            if (pisoDoc.exists()) {
              const piso = pisoDoc.data();
              // Reconstruir nombreCompleto de la sala
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
    console.log('✅ [edificiosService] Actualización en cascada completada');
  } catch (error) {
    console.error('❌ [edificiosService] Error en actualización en cascada:', error);
    // No lanzamos el error para no interrumpir la operación principal
  }
}

/**
 * Eliminar un edificio (con validación de dependencias)
 * @param {string} edificioId - ID del edificio
 * @returns {Promise<void>}
 */
export async function eliminarEdificio(edificioId) {
  try {
    console.log('📝 [edificiosService] Eliminando edificio:', edificioId);

    // Obtener datos del edificio antes de eliminar
    const edificioData = await obtenerEdificioPorId(edificioId);

    // Verificar que no tenga pisos asociados
    const pisosQuery = query(
      collection(db, 'pisos'),
      where('edificioId', '==', edificioId)
    );
    const pisosSnap = await getDocs(pisosQuery);

    if (!pisosSnap.empty) {
      throw new Error(
        'No se puede eliminar: el edificio tiene pisos asociados. ' +
        'Elimina primero todos los pisos de este edificio.'
      );
    }

    await deleteDoc(doc(db, 'edificios', edificioId));
    console.log('✅ [edificiosService] Edificio eliminado exitosamente');

    // Registrar log
    await registrarLog(
      'EDIFICIOS',
      'eliminar',
      edificioData?.nombre || 'Edificio',
      edificioId,
      { codigo: edificioData?.codigo, sede: edificioData?.sedeNombre }
    );
  } catch (error) {
    console.error('❌ [edificiosService] Error al eliminar edificio:', error);
    throw error;
  }
}

/**
 * Obtener edificio con sus pisos
 * @param {string} edificioId - ID del edificio
 * @returns {Promise<Object>} Edificio con array de pisos
 */
export async function obtenerEdificioConPisos(edificioId) {
  try {
    console.log('📝 [edificiosService] Obteniendo edificio con pisos:', edificioId);

    const edificio = await obtenerEdificioPorId(edificioId);
    if (!edificio) {
      throw new Error('Edificio no encontrado');
    }

    // Query simple - solo un where (evita necesidad de índice compuesto)
    const pisosQuery = query(
      collection(db, 'pisos'),
      where('edificioId', '==', edificioId)
    );
    const pisosSnap = await getDocs(pisosQuery);

    // Filtrar y ordenar en el cliente
    let pisos = pisosSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar solo activos
    pisos = pisos.filter(piso => piso.activo === true);

    // Ordenar por número en el cliente
    pisos.sort((a, b) => (a.numero || 0) - (b.numero || 0));

    console.log(`✅ [edificiosService] Edificio con ${pisos.length} pisos obtenido`);

    return {
      ...edificio,
      pisos
    };
  } catch (error) {
    console.error('❌ [edificiosService] Error al obtener edificio con pisos:', error);
    throw error;
  }
}

/**
 * Desactivar/Activar un edificio (soft delete)
 * @param {string} edificioId - ID del edificio
 * @param {boolean} activo - true para activar, false para desactivar
 * @returns {Promise<void>}
 */
export async function toggleEstadoEdificio(edificioId, activo) {
  try {
    console.log(
      `📝 [edificiosService] ${activo ? 'Activando' : 'Desactivando'} edificio:`,
      edificioId
    );

    // Obtener datos del edificio
    const edificioData = await obtenerEdificioPorId(edificioId);

    await updateDoc(doc(db, 'edificios', edificioId), {
      activo,
      fechaActualizacion: Timestamp.now()
    });

    console.log('✅ [edificiosService] Estado de edificio actualizado');

    // Registrar log
    await registrarLog(
      'EDIFICIOS',
      activo ? 'activar' : 'desactivar',
      edificioData?.nombre || 'Edificio',
      edificioId,
      { codigo: edificioData?.codigo, estado: activo ? 'activo' : 'inactivo' }
    );
  } catch (error) {
    console.error('❌ [edificiosService] Error al cambiar estado de edificio:', error);
    throw error;
  }
}
