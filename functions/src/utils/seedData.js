/**
 * Script para poblar la base de datos con datos de ejemplo
 * Ejecutar manualmente cuando necesites datos de prueba
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Para ejecutar este script, necesitas:
// 1. Descargar la Service Account Key desde Firebase Console
// 2. Guardarla como serviceAccountKey.json en la raíz de functions/
// 3. Ejecutar: node src/utils/seedData.js

// Importar la key (si existe)
// import serviceAccount from '../../serviceAccountKey.json' assert { type: 'json' };

// Inicializar (comentar si ya está inicializado)
// initializeApp({
//   credential: cert(serviceAccount)
// });

const db = getFirestore();

/**
 * Datos de ejemplo de salas
 */
const salasEjemplo = [
  {
    nombre: "Sala 101",
    piso: 1,
    capacidad: 30,
    equipamiento: ["Proyector", "Pizarra", "Internet"],
    posicion: { x: 100, y: 200 },
    activo: true,
  },
  {
    nombre: "Sala 102",
    piso: 1,
    capacidad: 40,
    equipamiento: ["Proyector", "Pizarra", "Computadores", "Aire Acondicionado"],
    posicion: { x: 300, y: 200 },
    activo: true,
  },
  {
    nombre: "Sala 103",
    piso: 1,
    capacidad: 25,
    equipamiento: ["TV", "Pizarra"],
    posicion: { x: 500, y: 200 },
    activo: true,
  },
  {
    nombre: "Sala 201",
    piso: 2,
    capacidad: 35,
    equipamiento: ["Proyector", "Sistema de Audio", "Pizarra"],
    posicion: { x: 100, y: 400 },
    activo: true,
  },
  {
    nombre: "Sala 202",
    piso: 2,
    capacidad: 50,
    equipamiento: ["Proyector", "Sistema de Audio", "Aire Acondicionado", "Internet"],
    posicion: { x: 300, y: 400 },
    activo: true,
  },
  {
    nombre: "Sala 203",
    piso: 2,
    capacidad: 20,
    equipamiento: ["Pizarra", "TV"],
    posicion: { x: 500, y: 400 },
    activo: true,
  },
  {
    nombre: "Laboratorio 301",
    piso: 3,
    capacidad: 30,
    equipamiento: ["Computadores", "Proyector", "Internet", "Software Especializado"],
    posicion: { x: 100, y: 600 },
    activo: true,
  },
  {
    nombre: "Laboratorio 302",
    piso: 3,
    capacidad: 25,
    equipamiento: ["Computadores", "Proyector", "Internet"],
    posicion: { x: 300, y: 600 },
    activo: true,
  },
  {
    nombre: "Auditorio",
    piso: 1,
    capacidad: 100,
    equipamiento: ["Proyector", "Sistema de Audio", "Micrófono", "Aire Acondicionado"],
    posicion: { x: 700, y: 200 },
    activo: true,
  },
  {
    nombre: "Sala de Reuniones",
    piso: 2,
    capacidad: 15,
    equipamiento: ["TV", "Pizarra", "Internet"],
    posicion: { x: 700, y: 400 },
    activo: true,
  },
];

/**
 * Poblar salas en Firestore
 */
async function poblarSalas() {
  console.log("📦 Poblando salas...");

  const batch = db.batch();

  for (const sala of salasEjemplo) {
    const salaRef = db.collection("salas").doc();
    batch.set(salaRef, {
      ...sala,
      creadoEn: Timestamp.now(),
    });
  }

  await batch.commit();
  console.log(`✅ ${salasEjemplo.length} salas creadas exitosamente`);
}

/**
 * Crear reservas de ejemplo para hoy
 * NOTA: Necesitas tener usuarios reales en Firestore primero
 */
async function poblarReservasEjemplo() {
  console.log("📦 Poblando reservas de ejemplo...");

  // Obtener las salas creadas
  const salasSnapshot = await db.collection("salas").limit(5).get();

  if (salasSnapshot.empty) {
    console.log("❌ No hay salas para crear reservas. Ejecuta poblarSalas() primero.");
    return;
  }

  const ahora = new Date();
  const reservasEjemplo = [];

  // Crear algunas reservas para hoy
  salasSnapshot.forEach((doc, index) => {
    const salaId = doc.id;
    const salaNombre = doc.data().nombre;

    // Reserva 1: En 30 minutos (debería aparecer AMARILLA)
    const inicio1 = new Date(ahora.getTime() + 30 * 60 * 1000);
    const fin1 = new Date(inicio1.getTime() + 90 * 60 * 1000);

    // Reserva 2: En 2 horas
    const inicio2 = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);
    const fin2 = new Date(inicio2.getTime() + 90 * 60 * 1000);

    // Si es la primera sala, crear una reserva que ESTÉ ACTIVA AHORA (debería aparecer ROJA)
    if (index === 0) {
      const inicioAhora = new Date(ahora.getTime() - 10 * 60 * 1000); // Empezó hace 10 min
      const finAhora = new Date(ahora.getTime() + 60 * 60 * 1000); // Termina en 1 hora

      reservasEjemplo.push({
        salaId,
        salaNombre,
        usuarioId: "USER_EJEMPLO_1", // Debes reemplazar con un UID real
        nombreDocente: "Carlos Ramírez",
        asignatura: "Programación Web",
        horaInicio: Timestamp.fromDate(inicioAhora),
        horaFin: Timestamp.fromDate(finAhora),
        estado: "activa",
        creadoEn: Timestamp.now(),
      });
    }

    reservasEjemplo.push({
      salaId,
      salaNombre,
      usuarioId: "USER_EJEMPLO_2",
      nombreDocente: "María González",
      asignatura: "Base de Datos",
      horaInicio: Timestamp.fromDate(inicio1),
      horaFin: Timestamp.fromDate(fin1),
      estado: "activa",
      creadoEn: Timestamp.now(),
    });

    reservasEjemplo.push({
      salaId,
      salaNombre,
      usuarioId: "USER_EJEMPLO_3",
      nombreDocente: "Pedro Sánchez",
      asignatura: "Cálculo II",
      horaInicio: Timestamp.fromDate(inicio2),
      horaFin: Timestamp.fromDate(fin2),
      estado: "activa",
      creadoEn: Timestamp.now(),
    });
  });

  const batch = db.batch();

  for (const reserva of reservasEjemplo) {
    const reservaRef = db.collection("reservas").doc();
    batch.set(reservaRef, reserva);
  }

  await batch.commit();
  console.log(`✅ ${reservasEjemplo.length} reservas creadas exitosamente`);
  console.log("\n📋 Resumen:");
  console.log("- 1 sala debería aparecer ROJA (ocupada ahora)");
  console.log("- Varias salas deberían aparecer AMARILLAS (reservadas próximamente)");
  console.log("- El resto deberían aparecer VERDES (disponibles)");
}

/**
 * Limpiar todas las colecciones
 * ⚠️ CUIDADO: Esto borra TODOS los datos
 */
async function limpiarDatos() {
  console.log("🗑️  Limpiando datos...");

  // Limpiar salas
  const salasSnapshot = await db.collection("salas").get();
  const salasBatch = db.batch();
  salasSnapshot.forEach((doc) => {
    salasBatch.delete(doc.ref);
  });
  await salasBatch.commit();
  console.log(`✅ ${salasSnapshot.size} salas eliminadas`);

  // Limpiar reservas
  const reservasSnapshot = await db.collection("reservas").get();
  const reservasBatch = db.batch();
  reservasSnapshot.forEach((doc) => {
    reservasBatch.delete(doc.ref);
  });
  await reservasBatch.commit();
  console.log(`✅ ${reservasSnapshot.size} reservas eliminadas`);
}

/**
 * Función principal
 */
async function main() {
  console.log("🚀 Iniciando población de datos de ejemplo para SalaSmart\n");

  try {
    // Descomentar lo que necesites:

    // await limpiarDatos();  // ⚠️ Cuidado: borra todo
    await poblarSalas();
    // await poblarReservasEjemplo();  // Requiere usuarios reales

    console.log("\n✅ Proceso completado exitosamente");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Ejecutar si se llama directamente
// Descomentar para ejecutar:
// main();

// Exportar para uso en otros scripts
export { poblarSalas, poblarReservasEjemplo, limpiarDatos };
