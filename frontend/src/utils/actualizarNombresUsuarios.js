/**
 * Script de migración para actualizar nombres de usuarios antiguos
 *
 * Este script se puede ejecutar una sola vez para actualizar las cuentas antiguas
 * que tienen nombre: "usuario" o no tienen el campo nombre definido
 *
 * INSTRUCCIONES:
 * 1. Importa este script en cualquier componente (ej: AdminPanel)
 * 2. Ejecuta la función actualizarNombresUsuarios()
 * 3. Ingresa el nombre real de cada usuario cuando se solicite
 */

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function actualizarNombresUsuarios() {
  try {
    console.log('🔄 Iniciando migración de nombres de usuarios...');

    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usuariosSinNombre = [];

    // Encontrar usuarios sin nombre correcto
    usersSnapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const nombre = data.nombre || '';

      // Si no tiene nombre o el nombre es "usuario" o similar
      if (!nombre || nombre.toLowerCase() === 'usuario' || nombre.toLowerCase() === 'user') {
        usuariosSinNombre.push({
          id: docSnap.id,
          email: data.email,
          nombreActual: nombre || '(sin nombre)',
          role: data.role
        });
      }
    });

    console.log(`📋 Encontrados ${usuariosSinNombre.length} usuarios que necesitan actualización:`);
    usuariosSinNombre.forEach(u => {
      console.log(`  - ${u.email} (nombre actual: "${u.nombreActual}")`);
    });

    if (usuariosSinNombre.length === 0) {
      console.log('✅ Todos los usuarios tienen nombres válidos');
      return {
        exito: true,
        mensaje: 'Todos los usuarios ya tienen nombres válidos',
        actualizados: 0
      };
    }

    // Preguntar nombres uno por uno (modo consola para admin)
    console.log('\n⚠️ INSTRUCCIONES PARA ACTUALIZACIÓN MANUAL:');
    console.log('Para actualizar los nombres, ejecuta los siguientes comandos en la consola:\n');

    usuariosSinNombre.forEach(usuario => {
      console.log(`// ${usuario.role.toUpperCase()}: ${usuario.email}`);
      console.log(`await actualizarNombreManual('${usuario.id}', 'NOMBRE_COMPLETO_AQUI');\n`);
    });

    return {
      exito: true,
      mensaje: 'Lista de usuarios sin nombre generada',
      usuarios: usuariosSinNombre
    };

  } catch (error) {
    console.error('❌ Error en migración:', error);
    return {
      exito: false,
      mensaje: error.message
    };
  }
}

/**
 * Actualiza el nombre de un usuario específico
 */
export async function actualizarNombreManual(userId, nuevoNombre) {
  try {
    if (!nuevoNombre || nuevoNombre.trim().length < 2) {
      console.error('❌ El nombre debe tener al menos 2 caracteres');
      return false;
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      nombre: nuevoNombre.trim()
    });

    console.log(`✅ Usuario ${userId} actualizado: nombre="${nuevoNombre}"`);
    return true;

  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    return false;
  }
}

/**
 * Actualiza todos los usuarios automáticamente usando sus emails
 * Extrae el nombre del email (nombre.apellido@inacap.cl -> Nombre Apellido)
 */
export async function actualizarNombresDesdeEmails() {
  try {
    console.log('🔄 Actualizando nombres desde emails...');

    const usersSnapshot = await getDocs(collection(db, 'users'));
    let actualizados = 0;

    for (const docSnap of usersSnapshot.docs) {
      const data = docSnap.data();
      const nombre = data.nombre || '';
      const email = data.email;

      // Si no tiene nombre o el nombre es "usuario"
      if (!nombre || nombre.toLowerCase() === 'usuario' || nombre.toLowerCase() === 'user') {
        // Extraer nombre del email: nombre.apellido@inacap.cl
        if (email && email.includes('@')) {
          const [localPart] = email.split('@');

          // Convertir nombre.apellido -> Nombre Apellido
          const nombreExtraido = localPart
            .split('.')
            .map(parte => {
              // Capitalizar primera letra de cada palabra
              return parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase();
            })
            .join(' ');

          // Actualizar en Firestore
          const userRef = doc(db, 'users', docSnap.id);
          await updateDoc(userRef, {
            nombre: nombreExtraido
          });

          console.log(`✅ ${email} -> "${nombreExtraido}"`);
          actualizados++;
        }
      }
    }

    console.log(`\n🎉 Migración completada: ${actualizados} usuarios actualizados`);

    return {
      exito: true,
      mensaje: `${actualizados} usuarios actualizados exitosamente`,
      actualizados
    };

  } catch (error) {
    console.error('❌ Error en migración automática:', error);
    return {
      exito: false,
      mensaje: error.message
    };
  }
}
