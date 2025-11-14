/**
 * Script de utilidad para eliminar todas las salas existentes en Firestore
 * Ejecutar desde la consola del navegador en el panel de admin
 *
 * Uso:
 * 1. Abrir DevTools (F12)
 * 2. Ir a Console
 * 3. Copiar y pegar este código
 * 4. Ejecutar: await deleteAllSalas()
 */

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function deleteAllSalas() {
  try {
    console.log('🗑️ Iniciando eliminación de todas las salas...');

    const salasSnapshot = await getDocs(collection(db, 'salas'));
    const totalSalas = salasSnapshot.size;

    console.log(`📊 Total de salas a eliminar: ${totalSalas}`);

    if (totalSalas === 0) {
      console.log('✅ No hay salas para eliminar');
      return;
    }

    const confirmacion = window.confirm(
      `⚠️ ADVERTENCIA: Esta acción eliminará ${totalSalas} salas de la base de datos.\n\n` +
      `Esta acción NO se puede deshacer.\n\n` +
      `¿Está seguro de que desea continuar?`
    );

    if (!confirmacion) {
      console.log('❌ Operación cancelada por el usuario');
      return;
    }

    let eliminadas = 0;
    let errores = 0;

    for (const salaDoc of salasSnapshot.docs) {
      try {
        await deleteDoc(doc(db, 'salas', salaDoc.id));
        eliminadas++;
        console.log(`✅ [${eliminadas}/${totalSalas}] Sala eliminada: ${salaDoc.data().nombre || salaDoc.id}`);
      } catch (error) {
        errores++;
        console.error(`❌ Error al eliminar sala ${salaDoc.id}:`, error);
      }
    }

    console.log(`\n📊 RESUMEN:`);
    console.log(`✅ Salas eliminadas: ${eliminadas}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`\n🎉 Proceso completado. Ahora puedes crear las nuevas salas usando el Editor de Planos.`);

    // Recargar la página para reflejar los cambios
    if (eliminadas > 0) {
      setTimeout(() => {
        console.log('🔄 Recargando página en 3 segundos...');
        setTimeout(() => window.location.reload(), 3000);
      }, 1000);
    }

    return { eliminadas, errores, total: totalSalas };
  } catch (error) {
    console.error('❌ Error fatal al eliminar salas:', error);
    throw error;
  }
}

// También exportar una función más simple para uso directo
export async function deleteAllSalasQuick() {
  const salasSnapshot = await getDocs(collection(db, 'salas'));
  const deletePromises = salasSnapshot.docs.map(salaDoc =>
    deleteDoc(doc(db, 'salas', salaDoc.id))
  );
  await Promise.all(deletePromises);
  console.log(`✅ ${deletePromises.length} salas eliminadas`);
  window.location.reload();
}

// Exportar por defecto la función principal
export default deleteAllSalas;
