/**
 * Script de prueba para debugging de reservas
 * Ejecutar en la consola del navegador
 */

import { auth, db } from '../firebase/config';
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

export async function testCrearReservaDirecta() {
  console.log('🧪 ====== INICIO DE TEST DE RESERVA ======');

  const user = auth.currentUser;
  console.log('👤 Usuario autenticado:', user ? user.uid : 'NO AUTENTICADO');

  if (!user) {
    console.error('❌ No hay usuario autenticado');
    return;
  }

  // Verificar documento de usuario en Firestore
  console.log('\n📝 Verificando documento de usuario en Firestore...');
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      console.error('❌ El documento del usuario NO existe en /users/' + user.uid);
      console.error('❌ Esto causará que las reglas de Firestore rechacen la creación');
      return;
    }

    const userData = userDoc.data();
    console.log('✅ Documento de usuario encontrado:');
    console.log('   - Email:', userData.email);
    console.log('   - Nombre:', userData.nombre);
    console.log('   - Rol:', userData.role);
    console.log('   - Activo:', userData.activo);

    if (userData.role !== 'docente' && userData.role !== 'admin') {
      console.error('❌ El usuario NO es docente ni admin');
      console.error('❌ Rol actual:', userData.role);
      console.error('❌ Las reglas de Firestore rechazarán la creación');
      return;
    }

    console.log('✅ Usuario tiene permisos para crear reservas');

  } catch (error) {
    console.error('❌ Error al obtener documento de usuario:', error);
    return;
  }

  // Crear una reserva de prueba
  console.log('\n🎯 Intentando crear reserva de prueba...');

  const ahora = new Date();
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(10, 0, 0, 0);

  const horaFin = new Date(manana);
  horaFin.setHours(12, 0, 0, 0);

  const reservaPrueba = {
    salaId: 'TEST-SALA',
    salaNombre: 'Sala de Prueba',
    usuarioId: user.uid,
    nombreDocente: user.displayName || user.email,
    asignatura: 'PRUEBA DE SISTEMA',
    horaInicio: Timestamp.fromDate(manana),
    horaFin: Timestamp.fromDate(horaFin),
    jornada: 'diurno',
    estado: 'activa',
    fechaCreacion: Timestamp.now(),
    fechaActualizacion: Timestamp.now(),
  };

  console.log('📋 Datos de la reserva de prueba:', reservaPrueba);

  try {
    console.log('⏳ Llamando a addDoc...');
    const docRef = await addDoc(collection(db, 'reservas'), reservaPrueba);
    console.log('✅✅✅ RESERVA DE PRUEBA CREADA EXITOSAMENTE');
    console.log('✅ ID de la reserva:', docRef.id);
    console.log('✅ El problema NO está en los permisos de Firestore');
  } catch (error) {
    console.error('❌❌❌ ERROR al crear reserva de prueba:', error);
    console.error('❌ Código de error:', error.code);
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Stack:', error.stack);

    if (error.code === 'permission-denied') {
      console.error('\n⚠️  PROBLEMA DE PERMISOS DETECTADO');
      console.error('⚠️  Las reglas de Firestore están rechazando la creación');
      console.error('⚠️  Posibles causas:');
      console.error('    1. El usuario no tiene el rol correcto en Firestore');
      console.error('    2. Las reglas de Firestore no están desplegadas');
      console.error('    3. Algún campo requerido falta o tiene formato incorrecto');
    }
  }

  console.log('\n🧪 ====== FIN DE TEST DE RESERVA ======');
}

// Exportar para usar en consola
window.testCrearReservaDirecta = testCrearReservaDirecta;
console.log('✅ Test cargado. Ejecuta window.testCrearReservaDirecta() en la consola');
