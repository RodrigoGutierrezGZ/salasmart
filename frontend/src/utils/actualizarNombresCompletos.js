/**
 * Script de utilidad para actualizar todos los nombreCompleto del sistema
 * Ejecutar una sola vez después de cambiar nombres de sedes/edificios
 */

import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Actualizar todos los nombreCompleto de pisos y salas del sistema
 */
export async function actualizarTodosLosNombresCompletos() {
  console.log('🔄 Iniciando actualización masiva de nombreCompleto...');

  try {
    // 1. Actualizar todos los pisos
    console.log('📝 Actualizando pisos...');
    const pisosSnap = await getDocs(collection(db, 'pisos'));
    let pisosActualizados = 0;

    for (const pisoDoc of pisosSnap.docs) {
      const piso = pisoDoc.data();

      // Obtener sede actual
      const sedeDoc = await getDoc(doc(db, 'sedes', piso.sedeId));
      if (!sedeDoc.exists()) continue;
      const sede = sedeDoc.data();

      // Obtener edificio actual
      const edificioDoc = await getDoc(doc(db, 'edificios', piso.edificioId));
      if (!edificioDoc.exists()) continue;
      const edificio = edificioDoc.data();

      // Reconstruir nombreCompleto del piso
      const nuevoNombreCompleto = `Piso ${piso.numero} - ${edificio.nombre} - ${sede.nombre}`;

      // Solo actualizar si cambió
      if (piso.nombreCompleto !== nuevoNombreCompleto) {
        await updateDoc(doc(db, 'pisos', pisoDoc.id), {
          nombreCompleto: nuevoNombreCompleto,
          sedeCodigo: sede.codigo,
          edificioCodigo: edificio.codigo,
          edificioNombre: edificio.nombre
        });
        pisosActualizados++;
        console.log(`✅ Piso actualizado: ${nuevoNombreCompleto}`);
      }
    }

    console.log(`✅ ${pisosActualizados} pisos actualizados`);

    // 2. Actualizar todas las salas
    console.log('📝 Actualizando salas...');
    const salasSnap = await getDocs(collection(db, 'salas'));
    let salasActualizadas = 0;

    for (const salaDoc of salasSnap.docs) {
      const sala = salaDoc.data();

      // Verificar que tenga pisoId
      if (!sala.pisoId) {
        console.warn(`⚠️ Sala ${sala.nombre} no tiene pisoId`);
        continue;
      }

      // Obtener piso ACTUALIZADO
      const pisoDoc = await getDoc(doc(db, 'pisos', sala.pisoId));
      if (!pisoDoc.exists()) {
        console.warn(`⚠️ Piso ${sala.pisoId} no encontrado para sala ${sala.nombre}`);
        continue;
      }
      const piso = pisoDoc.data();

      // Obtener sede actual
      const sedeDoc = await getDoc(doc(db, 'sedes', sala.sedeId));
      if (!sedeDoc.exists()) continue;
      const sede = sedeDoc.data();

      // Obtener edificio actual
      const edificioDoc = await getDoc(doc(db, 'edificios', sala.edificioId));
      if (!edificioDoc.exists()) continue;
      const edificio = edificioDoc.data();

      // Reconstruir nombreCompleto de la sala
      const nuevoNombreCompleto = `${sala.nombre} - ${piso.nombreCompleto}`;

      // Solo actualizar si cambió
      if (sala.nombreCompleto !== nuevoNombreCompleto) {
        await updateDoc(doc(db, 'salas', salaDoc.id), {
          nombreCompleto: nuevoNombreCompleto,
          sedeCodigo: sede.codigo,
          edificioCodigo: edificio.codigo
        });
        salasActualizadas++;
        console.log(`✅ Sala actualizada: ${nuevoNombreCompleto}`);
      }
    }

    console.log(`✅ ${salasActualizadas} salas actualizadas`);
    console.log('🎉 Actualización masiva completada');

    return {
      pisosActualizados,
      salasActualizadas
    };
  } catch (error) {
    console.error('❌ Error en actualización masiva:', error);
    throw error;
  }
}
