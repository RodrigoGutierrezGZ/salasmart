// Script para corregir datos incorrectos de sedes y edificios en Firestore
// PROBLEMA: Algunos edificios tienen sedeId incorrecto

import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

/**
 * Corrige los sedeId de edificios basándose en su sedeCodigo
 *
 * PASOS:
 * 1. Obtener todas las sedes para crear un mapa: sedeCodigo → sedeId
 * 2. Obtener todos los edificios
 * 3. Para cada edificio, verificar si su sedeId coincide con su sedeCodigo
 * 4. Si no coincide, corregirlo
 */
export async function corregirSedeIdDeEdificios() {
  console.log('🔧 INICIANDO CORRECCIÓN DE DATOS...\n');

  try {
    // 1. Obtener todas las sedes y crear un mapa
    const sedesSnap = await getDocs(collection(db, 'sedes'));
    const sedes = sedesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('📍 Sedes encontradas:', sedes.length);
    console.table(sedes.map(s => ({ id: s.id, codigo: s.codigo, nombre: s.nombre })));

    // Crear mapa: sedeCodigo → sedeId
    const sedeCodigoToId = {};
    sedes.forEach(sede => {
      sedeCodigoToId[sede.codigo] = sede.id;
    });

    console.log('\n📊 Mapa de códigos a IDs:');
    console.table(sedeCodigoToId);

    // 2. Obtener todos los edificios
    const edificiosSnap = await getDocs(collection(db, 'edificios'));
    const edificios = edificiosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('\n🏗️ Edificios encontrados:', edificios.length);

    // 3. Verificar cuáles edificios necesitan corrección
    const edificiosParaCorregir = [];

    edificios.forEach(edificio => {
      const sedeIdCorrecto = sedeCodigoToId[edificio.sedeCodigo];

      if (!sedeIdCorrecto) {
        console.warn(`⚠️ EDIFICIO "${edificio.nombre}" tiene sedeCodigo "${edificio.sedeCodigo}" que NO existe en sedes`);
        return;
      }

      if (edificio.sedeId !== sedeIdCorrecto) {
        edificiosParaCorregir.push({
          id: edificio.id,
          nombre: edificio.nombre,
          sedeCodigo: edificio.sedeCodigo,
          sedeIdActual: edificio.sedeId,
          sedeIdCorrecto: sedeIdCorrecto
        });
      }
    });

    if (edificiosParaCorregir.length === 0) {
      console.log('\n✅ ¡Todos los edificios tienen el sedeId correcto!');
      return { corregidos: 0, edificios: [] };
    }

    console.log('\n⚠️ EDIFICIOS CON sedeId INCORRECTO:', edificiosParaCorregir.length);
    console.table(edificiosParaCorregir);

    // 4. Preguntar confirmación
    const confirmar = window.confirm(
      `Se encontraron ${edificiosParaCorregir.length} edificios con sedeId incorrecto.\n\n` +
      `¿Deseas corregirlos ahora?\n\n` +
      `Los edificios que se corregirán son:\n` +
      edificiosParaCorregir.map(e => `- ${e.nombre} (${e.sedeCodigo})`).join('\n')
    );

    if (!confirmar) {
      console.log('❌ Corrección cancelada por el usuario');
      return { corregidos: 0, cancelado: true };
    }

    // 5. Corregir edificios usando batch
    const batch = writeBatch(db);

    edificiosParaCorregir.forEach(edificio => {
      const edificioRef = doc(db, 'edificios', edificio.id);
      batch.update(edificioRef, {
        sedeId: edificio.sedeIdCorrecto
      });
    });

    await batch.commit();

    console.log('\n✅ CORRECCIÓN COMPLETADA EXITOSAMENTE!');
    console.log(`   Edificios corregidos: ${edificiosParaCorregir.length}`);

    // 6. Ahora debemos corregir también las salas que pertenecen a esos edificios
    console.log('\n🔧 Corrigiendo salas asociadas a estos edificios...');
    await corregirSalasDeEdificiosCorregidos(edificiosParaCorregir);

    return {
      corregidos: edificiosParaCorregir.length,
      edificios: edificiosParaCorregir
    };

  } catch (error) {
    console.error('❌ ERROR EN CORRECCIÓN:', error);
    throw error;
  }
}

/**
 * Corrige el sedeId de las salas que pertenecen a edificios corregidos
 */
async function corregirSalasDeEdificiosCorregidos(edificiosCorregidos) {
  try {
    // Obtener todas las salas
    const salasSnap = await getDocs(collection(db, 'salas'));
    const salas = salasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Crear mapa: edificioId → sedeId correcto
    const edificioIdToSedeId = {};
    edificiosCorregidos.forEach(edificio => {
      edificioIdToSedeId[edificio.id] = edificio.sedeIdCorrecto;
    });

    // Encontrar salas que necesitan corrección
    const salasParaCorregir = [];

    salas.forEach(sala => {
      const sedeIdCorrecto = edificioIdToSedeId[sala.edificioId];

      if (sedeIdCorrecto && sala.sedeId !== sedeIdCorrecto) {
        salasParaCorregir.push({
          id: sala.id,
          nombre: sala.nombre,
          edificioId: sala.edificioId,
          sedeIdActual: sala.sedeId,
          sedeIdCorrecto: sedeIdCorrecto
        });
      }
    });

    if (salasParaCorregir.length === 0) {
      console.log('✅ No hay salas que corregir');
      return { corregidos: 0 };
    }

    console.log('\n⚠️ SALAS CON sedeId INCORRECTO:', salasParaCorregir.length);
    console.table(salasParaCorregir);

    // Corregir salas usando batch
    const batch = writeBatch(db);

    salasParaCorregir.forEach(sala => {
      const salaRef = doc(db, 'salas', sala.id);
      batch.update(salaRef, {
        sedeId: sala.sedeIdCorrecto
      });
    });

    await batch.commit();

    console.log('\n✅ SALAS CORREGIDAS:', salasParaCorregir.length);

    return {
      corregidos: salasParaCorregir.length,
      salas: salasParaCorregir
    };

  } catch (error) {
    console.error('❌ ERROR AL CORREGIR SALAS:', error);
    throw error;
  }
}

/**
 * Función para ejecutar desde un botón en el AdminPanel
 */
export async function ejecutarCorreccion() {
  try {
    const resultado = await corregirSedeIdDeEdificios();

    if (resultado.cancelado) {
      alert('Corrección cancelada');
      return;
    }

    alert(
      `✅ Corrección completada exitosamente!\n\n` +
      `Edificios corregidos: ${resultado.corregidos}\n\n` +
      `Por favor, recarga la página para ver los cambios.`
    );

    // Recargar página
    window.location.reload();

  } catch (error) {
    console.error('Error en corrección:', error);
    alert('❌ Error al corregir datos. Revisa la consola para más detalles.');
  }
}
