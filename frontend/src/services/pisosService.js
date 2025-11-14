// src/services/pisosService.js

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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { obtenerEdificioPorId } from './edificiosService';
import { registrarLog } from './logsService';

// Constantes para validación de imágenes
const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5MB

/**
 * Crear un nuevo piso
 * @param {Object} datos - Datos del piso
 * @param {number} datos.numero - Número del piso (1, 2, 3, etc.)
 * @param {string} datos.edificioId - ID del edificio al que pertenece
 * @param {File} imagenFile - Archivo de imagen del plano
 * @returns {Promise<string>} ID del piso creado
 */
export async function crearPiso(datos, imagenFile) {
  try {
    console.log('📝 [pisosService] Creando nuevo piso...', datos);

    // Validaciones
    if (!datos.numero || datos.numero < 1) {
      throw new Error('El número de piso debe ser mayor a 0');
    }

    if (!datos.edificioId) {
      throw new Error('Debe seleccionar un edificio');
    }

    if (!imagenFile) {
      throw new Error('Debe seleccionar una imagen del plano');
    }

    // Validar archivo de imagen
    validarArchivo(imagenFile);

    // Verificar que el edificio existe y obtener datos
    console.log('🔍 [pisosService] Buscando edificio con ID:', datos.edificioId);
    const edificio = await obtenerEdificioPorId(datos.edificioId);
    if (!edificio) {
      throw new Error('El edificio seleccionado no existe');
    }
    console.log('✅ [pisosService] Edificio encontrado:', { id: edificio.id, nombre: edificio.nombre });

    // Verificar que el número de piso sea único en el edificio
    console.log('🔍 [pisosService] Verificando duplicados para piso', datos.numero, 'en edificio', edificio.nombre);
    const numeroExiste = await verificarNumeroUnicoEnEdificio(
      datos.numero,
      datos.edificioId
    );
    if (numeroExiste) {
      console.error('❌ [pisosService] Ya existe piso', datos.numero, 'en edificio', edificio.nombre);
      throw new Error(
        `Ya existe el Piso ${datos.numero} en el edificio "${edificio.nombre}"`
      );
    }
    console.log('✅ [pisosService] Piso', datos.numero, 'es único en', edificio.nombre);

    // 1. Crear el documento del piso primero (para obtener el ID)
    const pisoRef = await addDoc(collection(db, 'pisos'), {
      numero: Number(datos.numero),
      edificioId: datos.edificioId,
      edificioCodigo: edificio.codigo,
      edificioNombre: edificio.nombre,
      sedeId: edificio.sedeId,
      sedeCodigo: edificio.sedeCodigo,
      nombreCompleto: generarNombreCompleto(datos.numero, edificio),
      imagenURL: '', // Se actualizará después del upload
      imagenPath: '', // Se actualizará después del upload
      imagenMetadata: {},
      activo: true,
      fechaCreacion: Timestamp.now(),
      fechaActualizacion: Timestamp.now()
    });

    const pisoId = pisoRef.id;
    console.log('✅ [pisosService] Piso creado con ID:', pisoId);

    try {
      // 2. Usar imagen local en lugar de Firebase Storage (sin CORS)
      const { imagenURL, imagenPath, imagenMetadata } = await usarImagenLocal(
        imagenFile,
        datos.numero
      );

      // 3. Actualizar documento con URLs de la imagen
      await updateDoc(doc(db, 'pisos', pisoId), {
        imagenURL,
        imagenPath,
        imagenMetadata
      });

      console.log('✅ [pisosService] Imagen configurada y piso actualizado');

      // Registrar log
      await registrarLog(
        'PISOS',
        'crear',
        `Piso ${datos.numero}`,
        pisoId,
        { numero: datos.numero, edificio: edificio.nombre, sede: edificio.sedeNombre }
      );

      return pisoId;
    } catch (uploadError) {
      // Si falla el upload, eliminar el documento creado
      console.error('❌ Error al subir imagen, limpiando piso creado...');
      await deleteDoc(doc(db, 'pisos', pisoId));
      throw uploadError;
    }
  } catch (error) {
    console.error('❌ [pisosService] Error al crear piso:', error);
    throw error;
  }
}

/**
 * Usar imagen local del directorio public/planos
 * @param {File} imagenFile - Archivo de imagen (para obtener metadata)
 * @param {number} numeroPiso - Número del piso
 * @returns {Promise<Object>} URLs y metadata de la imagen
 */
async function usarImagenLocal(imagenFile, numeroPiso) {
  try {
    console.log('📁 [pisosService] Usando imagen local del directorio public/planos/');

    // Generar URL local: /planos/piso{numero}.jpg
    // Las imágenes deben estar en frontend/public/planos/piso1.jpg, piso2.jpg, etc.
    const imagenPath = `/planos/piso${numeroPiso}.jpg`;
    const imagenURL = imagenPath; // En Vite, las rutas de public/ son accesibles directamente

    const imagenMetadata = {
      nombre: `piso${numeroPiso}.jpg`,
      tamaño: imagenFile ? imagenFile.size : 0,
      tipo: imagenFile ? imagenFile.type : 'image/jpeg',
      fechaSubida: Timestamp.now(),
      local: true // Indicador de que es imagen local
    };

    console.log('✅ [pisosService] Imagen local configurada:', imagenURL);

    return {
      imagenURL,
      imagenPath,
      imagenMetadata
    };
  } catch (error) {
    console.error('❌ [pisosService] Error al configurar imagen local:', error);
    throw new Error('Error al configurar la imagen del plano');
  }
}

/* ============================================
   CÓDIGO COMENTADO: Firebase Storage Upload
   Descomentar cuando se configure CORS
   ============================================

async function subirImagenPiso(imagenFile, sedeId, edificioId, pisoId) {
  try {
    console.log('📤 [pisosService] Subiendo imagen a Storage...');

    // Generar path único: planos/{sedeId}/{edificioId}/{pisoId}.{ext}
    const extension = imagenFile.name.split('.').pop();
    const imagenPath = `planos/${sedeId}/${edificioId}/${pisoId}.${extension}`;
    const storageRef = ref(storage, imagenPath);

    // Subir archivo con metadata
    const metadata = {
      contentType: imagenFile.type,
      customMetadata: {
        sedeId,
        edificioId,
        pisoId,
        fechaSubida: new Date().toISOString()
      }
    };

    const uploadResult = await uploadBytes(storageRef, imagenFile, metadata);
    console.log('✅ [pisosService] Imagen subida a Storage');

    // Obtener URL pública
    const imagenURL = await getDownloadURL(uploadResult.ref);

    const imagenMetadata = {
      nombre: imagenFile.name,
      tamaño: imagenFile.size,
      tipo: imagenFile.type,
      fechaSubida: Timestamp.now()
    };

    return {
      imagenURL,
      imagenPath,
      imagenMetadata
    };
  } catch (error) {
    console.error('❌ [pisosService] Error al subir imagen:', error);
    throw new Error('Error al subir la imagen del plano');
  }
}

============================================ */

/**
 * Validar archivo de imagen
 * @param {File} file - Archivo a validar
 */
function validarArchivo(file) {
  if (!file) {
    throw new Error('No se ha seleccionado ningún archivo');
  }

  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    throw new Error(
      'Formato de imagen no permitido. Use PNG, JPG, JPEG o WEBP'
    );
  }

  if (file.size > TAMANO_MAXIMO) {
    throw new Error(
      `La imagen es muy grande (${(file.size / 1024 / 1024).toFixed(2)} MB). Máximo: 5 MB`
    );
  }
}

/**
 * Generar nombre completo del piso
 * @param {number} numero - Número del piso
 * @param {Object} edificio - Datos del edificio
 * @returns {string} Nombre completo
 */
function generarNombreCompleto(numero, edificio) {
  return `Piso ${numero} - ${edificio.nombre} - ${edificio.sedeNombre}`;
}

/**
 * Verificar si un número de piso ya existe en un edificio
 * @param {number} numero - Número a verificar
 * @param {string} edificioId - ID del edificio
 * @returns {Promise<boolean>} true si existe, false si no
 */
async function verificarNumeroUnicoEnEdificio(numero, edificioId) {
  const pisosQuery = query(
    collection(db, 'pisos'),
    where('numero', '==', Number(numero)),
    where('edificioId', '==', edificioId)
  );
  const snapshot = await getDocs(pisosQuery);
  return !snapshot.empty;
}

/**
 * Obtener todos los pisos
 * @param {boolean} [soloActivos=true] - Si true, solo devuelve pisos activos
 * @returns {Promise<Array>} Array de pisos
 */
export async function obtenerPisos(soloActivos = true) {
  try {
    console.log('📝 [pisosService] Obteniendo pisos...');

    // Query simple sin índice compuesto - solo obtener todos
    const pisosQuery = query(
      collection(db, 'pisos')
    );

    const snapshot = await getDocs(pisosQuery);
    let pisos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar en el cliente si se requiere solo activos
    if (soloActivos) {
      pisos = pisos.filter(piso => piso.activo === true);
    }

    // Ordenar en el cliente
    pisos.sort((a, b) => {
      const sedeCompare = (a.sedeCodigo || '').localeCompare(b.sedeCodigo || '');
      if (sedeCompare !== 0) return sedeCompare;
      const edificioCompare = (a.edificioCodigo || '').localeCompare(b.edificioCodigo || '');
      if (edificioCompare !== 0) return edificioCompare;
      return (a.numero || 0) - (b.numero || 0);
    });

    console.log(`✅ [pisosService] ${pisos.length} pisos obtenidos`);
    return pisos;
  } catch (error) {
    console.error('❌ [pisosService] Error al obtener pisos:', error);
    throw error;
  }
}

/**
 * Obtener pisos de un edificio específico
 * @param {string} edificioId - ID del edificio
 * @param {boolean} [soloActivos=true] - Si true, solo devuelve pisos activos
 * @returns {Promise<Array>} Array de pisos
 */
export async function obtenerPisosPorEdificio(edificioId, soloActivos = true) {
  try {
    console.log('📝 [pisosService] Obteniendo pisos de edificio:', edificioId);

    // Query simple con solo un where
    const pisosQuery = query(
      collection(db, 'pisos'),
      where('edificioId', '==', edificioId)
    );

    const snapshot = await getDocs(pisosQuery);
    let pisos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar en el cliente si se requiere solo activos
    if (soloActivos) {
      pisos = pisos.filter(piso => piso.activo === true);
    }

    // Ordenar por número en el cliente
    pisos.sort((a, b) => (a.numero || 0) - (b.numero || 0));

    console.log(`✅ [pisosService] ${pisos.length} pisos obtenidos`);
    return pisos;
  } catch (error) {
    console.error('❌ [pisosService] Error al obtener pisos por edificio:', error);
    throw error;
  }
}

/**
 * Obtener un piso por ID
 * @param {string} pisoId - ID del piso
 * @returns {Promise<Object|null>} Datos del piso o null si no existe
 */
export async function obtenerPisoPorId(pisoId) {
  try {
    console.log('📝 [pisosService] Obteniendo piso:', pisoId);

    const pisoDoc = await getDoc(doc(db, 'pisos', pisoId));

    if (!pisoDoc.exists()) {
      console.warn('⚠️ [pisosService] Piso no encontrado:', pisoId);
      return null;
    }

    const pisoData = {
      id: pisoDoc.id,
      ...pisoDoc.data()
    };

    console.log('✅ [pisosService] Piso obtenido:', pisoData.nombreCompleto);
    return pisoData;
  } catch (error) {
    console.error('❌ [pisosService] Error al obtener piso:', error);
    throw error;
  }
}

/**
 * Actualizar un piso (sin cambiar imagen)
 * @param {string} pisoId - ID del piso
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<void>}
 */
export async function actualizarPiso(pisoId, datos) {
  try {
    console.log('📝 [pisosService] Actualizando piso:', pisoId, datos);

    // Validaciones
    if (datos.numero && datos.numero < 1) {
      throw new Error('El número de piso debe ser mayor a 0');
    }

    const updateData = {
      ...datos,
      fechaActualizacion: Timestamp.now()
    };

    // Si se actualiza el número, verificar que sea único en el edificio
    if (datos.numero) {
      const pisoActual = await obtenerPisoPorId(pisoId);

      if (pisoActual && pisoActual.numero !== Number(datos.numero)) {
        const numeroExiste = await verificarNumeroUnicoEnEdificio(
          datos.numero,
          pisoActual.edificioId
        );
        if (numeroExiste) {
          throw new Error(
            `Ya existe el Piso ${datos.numero} en este edificio`
          );
        }

        // Regenerar nombre completo
        const edificio = await obtenerEdificioPorId(pisoActual.edificioId);
        updateData.nombreCompleto = generarNombreCompleto(datos.numero, edificio);
      }

      updateData.numero = Number(datos.numero);
    }

    const pisoActualData = await obtenerPisoPorId(pisoId);

    await updateDoc(doc(db, 'pisos', pisoId), updateData);
    console.log('✅ [pisosService] Piso actualizado exitosamente');

    // Registrar log
    await registrarLog(
      'PISOS',
      'editar',
      pisoActualData?.nombreCompleto || `Piso ${pisoActualData?.numero}`,
      pisoId,
      updateData
    );
  } catch (error) {
    console.error('❌ [pisosService] Error al actualizar piso:', error);
    throw error;
  }
}

/**
 * Actualizar imagen del plano de un piso (versión local)
 * @param {string} pisoId - ID del piso
 * @param {File} imagenFile - Nueva imagen
 * @returns {Promise<void>}
 */
export async function actualizarImagenPiso(pisoId, imagenFile) {
  try {
    console.log('📝 [pisosService] Actualizando referencia de imagen del piso:', pisoId);

    // Validar archivo
    validarArchivo(imagenFile);

    // Obtener datos actuales del piso
    const pisoActual = await obtenerPisoPorId(pisoId);
    if (!pisoActual) {
      throw new Error('Piso no encontrado');
    }

    // Usar imagen local (no se sube, solo se actualiza la referencia)
    const { imagenURL, imagenPath, imagenMetadata } = await usarImagenLocal(
      imagenFile,
      pisoActual.numero
    );

    // Actualizar documento
    await updateDoc(doc(db, 'pisos', pisoId), {
      imagenURL,
      imagenPath,
      imagenMetadata,
      fechaActualizacion: Timestamp.now()
    });

    console.log('✅ [pisosService] Referencia de imagen actualizada. Asegúrate de que la imagen esté en public/planos/piso' + pisoActual.numero + '.jpg');

    // Registrar log
    await registrarLog(
      'PISOS',
      'cambiar_imagen',
      pisoActual?.nombreCompleto || `Piso ${pisoActual?.numero}`,
      pisoId,
      { imagen: imagenFile.name, tamano: imagenMetadata.tamaño }
    );
  } catch (error) {
    console.error('❌ [pisosService] Error al actualizar imagen:', error);
    throw error;
  }
}

/* ============================================
   CÓDIGO COMENTADO: Firebase Storage Update
   Descomentar cuando se configure CORS
   ============================================

export async function actualizarImagenPiso_Storage(pisoId, imagenFile) {
  try {
    console.log('📝 [pisosService] Actualizando imagen del piso:', pisoId);

    validarArchivo(imagenFile);

    const pisoActual = await obtenerPisoPorId(pisoId);
    if (!pisoActual) {
      throw new Error('Piso no encontrado');
    }

    // Eliminar imagen anterior si existe
    if (pisoActual.imagenPath) {
      try {
        const oldImageRef = ref(storage, pisoActual.imagenPath);
        await deleteObject(oldImageRef);
        console.log('✅ [pisosService] Imagen anterior eliminada');
      } catch (error) {
        console.warn('⚠️ [pisosService] No se pudo eliminar imagen anterior:', error);
      }
    }

    // Subir nueva imagen
    const { imagenURL, imagenPath, imagenMetadata } = await subirImagenPiso(
      imagenFile,
      pisoActual.sedeId,
      pisoActual.edificioId,
      pisoId
    );

    await updateDoc(doc(db, 'pisos', pisoId), {
      imagenURL,
      imagenPath,
      imagenMetadata,
      fechaActualizacion: Timestamp.now()
    });

    console.log('✅ [pisosService] Imagen del piso actualizada exitosamente');

    await registrarLog(
      'PISOS',
      'cambiar_imagen',
      pisoActual?.nombreCompleto || `Piso ${pisoActual?.numero}`,
      pisoId,
      { imagen: imagenFile.name, tamano: imagenMetadata.tamaño }
    );
  } catch (error) {
    console.error('❌ [pisosService] Error al actualizar imagen:', error);
    throw error;
  }
}

============================================ */

/**
 * Eliminar un piso (con validación de dependencias y eliminación de imagen)
 * @param {string} pisoId - ID del piso
 * @returns {Promise<void>}
 */
export async function eliminarPiso(pisoId) {
  try {
    console.log('📝 [pisosService] Eliminando piso:', pisoId);

    // Obtener datos del piso
    const piso = await obtenerPisoPorId(pisoId);
    if (!piso) {
      throw new Error('Piso no encontrado');
    }

    // Verificar que no tenga salas asociadas
    const salasQuery = query(
      collection(db, 'salas'),
      where('pisoId', '==', pisoId)
    );
    const salasSnap = await getDocs(salasQuery);

    if (!salasSnap.empty) {
      throw new Error(
        'No se puede eliminar: el piso tiene salas asociadas. ' +
        'Elimina primero todas las salas de este piso.'
      );
    }

    // Nota: Las imágenes locales no se eliminan, solo la referencia en Firestore
    console.log('ℹ️ [pisosService] Imagen local no se elimina (solo referencia en Firestore)');

    // Eliminar documento
    await deleteDoc(doc(db, 'pisos', pisoId));
    console.log('✅ [pisosService] Piso eliminado exitosamente');

    // Registrar log
    await registrarLog(
      'PISOS',
      'eliminar',
      piso?.nombreCompleto || `Piso ${piso?.numero}`,
      pisoId,
      { numero: piso?.numero, edificio: piso?.edificioNombre }
    );
  } catch (error) {
    console.error('❌ [pisosService] Error al eliminar piso:', error);
    throw error;
  }
}

/**
 * Obtener piso con sus salas
 * @param {string} pisoId - ID del piso
 * @returns {Promise<Object>} Piso con array de salas
 */
export async function obtenerPisoConSalas(pisoId) {
  try {
    console.log('📝 [pisosService] Obteniendo piso con salas:', pisoId);

    const piso = await obtenerPisoPorId(pisoId);
    if (!piso) {
      throw new Error('Piso no encontrado');
    }

    // Query simple - solo un where (evita necesidad de índice compuesto)
    const salasQuery = query(
      collection(db, 'salas'),
      where('pisoId', '==', pisoId)
    );
    const salasSnap = await getDocs(salasQuery);

    // Filtrar salas activas y ordenar en el cliente
    let salas = salasSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar solo activas
    salas = salas.filter(sala => sala.activa === true);

    // Ordenar por nombre en el cliente
    salas.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

    console.log(`✅ [pisosService] Piso con ${salas.length} salas obtenido`);

    return {
      ...piso,
      salas
    };
  } catch (error) {
    console.error('❌ [pisosService] Error al obtener piso con salas:', error);
    throw error;
  }
}

/**
 * Desactivar/Activar un piso (soft delete)
 * @param {string} pisoId - ID del piso
 * @param {boolean} activo - true para activar, false para desactivar
 * @returns {Promise<void>}
 */
export async function toggleEstadoPiso(pisoId, activo) {
  try {
    console.log(
      `📝 [pisosService] ${activo ? 'Activando' : 'Desactivando'} piso:`,
      pisoId
    );

    // Obtener datos del piso
    const pisoData = await obtenerPisoPorId(pisoId);

    await updateDoc(doc(db, 'pisos', pisoId), {
      activo,
      fechaActualizacion: Timestamp.now()
    });

    console.log('✅ [pisosService] Estado de piso actualizado');

    // Registrar log
    await registrarLog(
      'PISOS',
      activo ? 'activar' : 'desactivar',
      pisoData?.nombreCompleto || `Piso ${pisoData?.numero}`,
      pisoId,
      { numero: pisoData?.numero, estado: activo ? 'activo' : 'inactivo' }
    );
  } catch (error) {
    console.error('❌ [pisosService] Error al cambiar estado de piso:', error);
    throw error;
  }
}
