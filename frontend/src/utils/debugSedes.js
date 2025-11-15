// Script para depurar problemas con sedes, edificios y salas
// Ejecutar este script en la consola del navegador para ver qué datos tenemos

import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export async function debugSedesEdificiosSalas() {
  console.log('🔍 INICIANDO DEBUG DE SEDES, EDIFICIOS Y SALAS...\n');

  try {
    // 1. Obtener todas las sedes
    const sedesSnap = await getDocs(collection(db, 'sedes'));
    const sedes = sedesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('📍 SEDES ENCONTRADAS:', sedes.length);
    console.table(sedes);
    console.log('\n');

    // 2. Obtener todos los edificios
    const edificiosSnap = await getDocs(collection(db, 'edificios'));
    const edificios = edificiosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('🏗️ EDIFICIOS ENCONTRADOS:', edificios.length);
    console.table(edificios);
    console.log('\n');

    // 3. Obtener todas las salas
    const salasSnap = await getDocs(collection(db, 'salas'));
    const salas = salasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('🚪 SALAS ENCONTRADAS:', salas.length);
    console.log('\n');

    // 4. Agrupar salas por sede
    const salasPorSede = {};
    salas.forEach(sala => {
      const sedeId = sala.sedeId || 'SIN_SEDE';
      const sedeCodigo = sala.sedeCodigo || 'SIN_CODIGO';

      if (!salasPorSede[sedeId]) {
        salasPorSede[sedeId] = {
          sedeId,
          sedeCodigo,
          salas: []
        };
      }
      salasPorSede[sedeId].salas.push({
        id: sala.id,
        nombre: sala.nombre,
        edificioId: sala.edificioId || 'SIN_EDIFICIO',
        edificioCodigo: sala.edificioCodigo || 'SIN_CODIGO'
      });
    });

    console.log('📊 SALAS AGRUPADAS POR SEDE:');
    Object.values(salasPorSede).forEach(grupo => {
      console.log(`\n🏢 SEDE: ${grupo.sedeCodigo} (${grupo.sedeId})`);
      console.log(`   Total salas: ${grupo.salas.length}`);
      console.table(grupo.salas);
    });

    // 5. Agrupar salas por edificio
    const salasPorEdificio = {};
    salas.forEach(sala => {
      const edificioId = sala.edificioId || 'SIN_EDIFICIO';
      const edificioCodigo = sala.edificioCodigo || 'SIN_CODIGO';

      if (!salasPorEdificio[edificioId]) {
        salasPorEdificio[edificioId] = {
          edificioId,
          edificioCodigo,
          sedeCodigo: sala.sedeCodigo || 'SIN_SEDE',
          salas: []
        };
      }
      salasPorEdificio[edificioId].salas.push({
        id: sala.id,
        nombre: sala.nombre,
        piso: sala.pisoNumero || sala.piso || 'SIN_PISO'
      });
    });

    console.log('\n📊 SALAS AGRUPADAS POR EDIFICIO:');
    Object.values(salasPorEdificio).forEach(grupo => {
      console.log(`\n🏗️ EDIFICIO: ${grupo.edificioCodigo} (${grupo.edificioId})`);
      console.log(`   Sede: ${grupo.sedeCodigo}`);
      console.log(`   Total salas: ${grupo.salas.length}`);
      console.table(grupo.salas);
    });

    // 6. Verificar edificios sin sede
    const edificiosSinSede = edificios.filter(e => !e.sedeId);
    if (edificiosSinSede.length > 0) {
      console.warn('\n⚠️ EDIFICIOS SIN SEDE ASIGNADA:');
      console.table(edificiosSinSede);
    }

    // 7. Verificar salas sin sede
    const salasSinSede = salas.filter(s => !s.sedeId);
    if (salasSinSede.length > 0) {
      console.warn('\n⚠️ SALAS SIN SEDE ASIGNADA:');
      console.table(salasSinSede.map(s => ({
        id: s.id,
        nombre: s.nombre,
        edificioId: s.edificioId,
        edificioCodigo: s.edificioCodigo
      })));
    }

    // 8. Verificar salas sin edificio
    const salasSinEdificio = salas.filter(s => !s.edificioId);
    if (salasSinEdificio.length > 0) {
      console.warn('\n⚠️ SALAS SIN EDIFICIO ASIGNADO:');
      console.table(salasSinEdificio.map(s => ({
        id: s.id,
        nombre: s.nombre,
        sedeId: s.sedeId,
        sedeCodigo: s.sedeCodigo
      })));
    }

    console.log('\n✅ DEBUG COMPLETADO\n');

    return {
      sedes,
      edificios,
      salas,
      salasPorSede,
      salasPorEdificio,
      problemas: {
        edificiosSinSede,
        salasSinSede,
        salasSinEdificio
      }
    };

  } catch (error) {
    console.error('❌ ERROR EN DEBUG:', error);
    throw error;
  }
}

// Para ejecutar desde la consola del navegador:
// import { debugSedesEdificiosSalas } from './utils/debugSedes';
// await debugSedesEdificiosSalas();
