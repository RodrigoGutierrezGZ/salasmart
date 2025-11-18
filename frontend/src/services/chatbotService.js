/**
 * Servicio de integración con Claude AI (Anthropic)
 * Chatbot con function calling - Modelo: Claude 3.5 Haiku
 */

import Anthropic from '@anthropic-ai/sdk';
import { db } from '../firebase/config';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { crearReserva, validarDisponibilidad, obtenerMisReservas } from './reservasService';

// Configuración de Claude
const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const CLAUDE_MODEL = import.meta.env.VITE_CLAUDE_MODEL || 'claude-3-5-haiku-20241022';
const CLAUDE_TEMPERATURE = parseFloat(import.meta.env.VITE_CLAUDE_TEMPERATURE) || 0.7;

// Inicializar cliente de Claude
let client = null;

if (CLAUDE_API_KEY && CLAUDE_API_KEY !== 'tu_api_key_aqui') {
  client = new Anthropic({
    apiKey: CLAUDE_API_KEY,
    dangerouslyAllowBrowser: true // Necesario para uso en navegador
  });
}

/**
 * Prompt del sistema OPTIMIZADO - Menos tokens, misma funcionalidad
 */
const SYSTEM_PROMPT = `Eres el asistente de **SalaSmart** (gestión de salas INACAP). Eres amigable, profesional y conciso.

## Sistema:
**Jerarquía:** Sede → Edificio → Piso → Salas
- Cada sala pertenece a un edificio específico en una sede específica
- Ejemplo: "Sala 402 - Piso 4 - Edificio Principal - INACAP Renca"
- Cuando busques salas, usa el campo "nombreCompleto" que tiene la ubicación completa

**Horario:** 8:00-22:00 (lunes-viernes)
**Reservas:** 45min mínimo, 4h máximo
**Roles:**
- Estudiante: solo consulta
- Docente: consulta + reservar
- Admin: todo

## Capacidades:
Usa funciones para:
1. **crear_reserva**: crear reservas directamente
2. **obtener_mis_reservas**: ver reservas del usuario
3. **buscar_salas**: buscar por criterios (capacidad, piso, edificio, disponibilidad)
4. **consultar_disponibilidad_sala**: ver si una sala está ocupada/disponible a cierta hora

## INFORMACIÓN DE SALAS:
Cada sala tiene:
- nombre: número/código de la sala (ej: "402", "A310")
- nombreCompleto: ubicación completa con jerarquía
- sedeCodigo: código de la sede (ej: "RENCA")
- edificioCodigo: código del edificio (ej: "PRINCIPAL", "SECUNDARIO", "A", "B")
- pisoNumero: número de piso (1, 2, 3, 4)
- capacidad: aforo máximo
- equipamiento: recursos disponibles

## CONSULTAR DISPONIBILIDAD - MUY IMPORTANTE:
Cuando usuario pregunta si una sala está disponible/ocupada/en clases:
1. Usa **consultar_disponibilidad_sala** (NO buscar_salas)
2. TODOS los usuarios (estudiantes, docentes, admin) pueden ver las reservas
3. Extrae el nombre de la sala, fecha y hora del mensaje
4. Si pregunta "a las 8" o "a las 8am", usa "08:00" en formato 24h

Ejemplos:
- "¿La sala cine está disponible a las 8 hoy?" → consultar_disponibilidad_sala({salaId:"CINE-B101", fecha:"hoy", hora:"08:00"})
- "¿Está ocupada la sala 402 mañana a las 2pm?" → consultar_disponibilidad_sala({salaId:"402", fecha:"mañana", hora:"14:00"})
- "¿Qué reservas tiene la sala A310 hoy?" → consultar_disponibilidad_sala({salaId:"A310", fecha:"hoy"})

## CREAR RESERVAS - IMPORTANTE:
Cuando usuario pide reservar CON todos los datos → ejecuta crear_reserva inmediatamente (NO pidas confirmación)

**FORMATO CRÍTICO:**
- fecha: "hoy" o "mañana" (NO fechas específicas)
- horaInicio: formato 24h "08:00", "14:30" (NO "8am")
- duracionHoras: número decimal (0.75 = 45min, 1 = 1h, 2 = 2h)

Ejemplo:
"reserva sala 402 mañana 8am 2h programación" →
crear_reserva({salaId:"402", fecha:"mañana", horaInicio:"08:00", duracionHoras:2, asignatura:"programación"})

## LISTAR SALAS - MUY IMPORTANTE:
Cuando el usuario pida "todas las salas", "dime todas", "cuáles hay disponibles", etc.:
1. Ejecuta buscar_salas sin filtros para obtener todas
2. LISTA TODAS las salas del array "salas" que recibes en el resultado
3. NO resumas, NO omitas salas, LISTA CADA UNA con su nombre y ubicación
4. Agrupa por edificio/piso para mejor organización
5. Si hay más de 15 salas, organízalas en una lista estructurada pero NO omitas ninguna

Ejemplo de formato cuando listas todas:
"Encontré X salas en total:

**Edificio Principal:**
Piso 1: A101, A102, A103...
Piso 2: A201, A202...

**Edificio Secundario B:**
Piso 1: CINE-B101, LAB-B102..."

## Reglas generales:
- Respuestas normales: cortas (2-4 líneas)
- Listados completos: cuando usuario pide "todas"
- NO inventes información
- Si falta dato, pregunta solo eso
- Usa emojis moderadamente
- Si estudiante intenta reservar: explica que solo docentes pueden
- Cuando menciones una sala, indica su ubicación completa (piso, edificio, sede)`;

/**
 * Declaración de herramientas (tools) para Claude
 */
const HERRAMIENTAS_DISPONIBLES = [
  {
    name: "crear_reserva",
    description: "Crea una nueva reserva de sala cuando el usuario proporciona todos los datos necesarios (sala, fecha, hora, duración, asignatura). IMPORTANTE: Solo ejecutar si el usuario es docente o admin.",
    input_schema: {
      type: "object",
      properties: {
        salaId: {
          type: "string",
          description: "ID o nombre de la sala a reservar (ej: 'A310', '402', 'S101')"
        },
        fecha: {
          type: "string",
          description: "Fecha de la reserva. Puede ser 'hoy', 'mañana' o formato YYYY-MM-DD"
        },
        horaInicio: {
          type: "string",
          description: "Hora de inicio en formato HH:mm de 24 horas (ej: '08:00', '14:30')"
        },
        duracionHoras: {
          type: "number",
          description: "Duración de la reserva en horas (0.75 = 45min, 1 = 1h, 1.5 = 1h30min, 2 = 2h, etc.). Mínimo 0.75 (45 minutos)"
        },
        asignatura: {
          type: "string",
          description: "Nombre LIMPIO de la asignatura en MAYÚSCULAS, sin frases como 'clase de', 'quiero dar', 'voy a enseñar', etc. Ejemplo: si el usuario dice 'quiero dar clase de diseño web', extraer solo 'DISEÑO WEB'"
        }
      },
      required: ["salaId", "fecha", "horaInicio", "duracionHoras", "asignatura"]
    }
  },
  {
    name: "obtener_mis_reservas",
    description: "Obtiene la lista de reservas del usuario actual. Muestra solo las reservas activas por defecto.",
    input_schema: {
      type: "object",
      properties: {
        soloActivas: {
          type: "boolean",
          description: "Si es true, muestra solo reservas activas. Si es false, muestra todas (activas, canceladas, completadas). Por defecto true."
        }
      }
    }
  },
  {
    name: "buscar_salas",
    description: "Busca salas según criterios específicos (edificio, piso, capacidad, disponibilidad). IMPORTANTE: Cuando el usuario mencione un edificio específico (ej: 'edificio principal', 'edificio A'), DEBES usar el parámetro edificioCodigo para filtrar.",
    input_schema: {
      type: "object",
      properties: {
        edificioCodigo: {
          type: "string",
          description: "Código del edificio para filtrar (ej: 'PRINCIPAL', 'SECUNDARIO', 'A', 'B'). Usar cuando el usuario mencione un edificio específico."
        },
        sedeCodigo: {
          type: "string",
          description: "Código de la sede para filtrar (ej: 'RENCA', 'TEMUCO'). Usar cuando el usuario mencione una sede específica."
        },
        capacidadMinima: {
          type: "number",
          description: "Capacidad mínima de personas requerida"
        },
        pisoNumero: {
          type: "number",
          description: "Número de piso específico (1, 2, 3, 4)"
        },
        soloDisponibles: {
          type: "boolean",
          description: "Si es true, muestra solo salas disponibles en este momento. Por defecto false."
        }
      }
    }
  },
  {
    name: "consultar_disponibilidad_sala",
    description: "Consulta las reservas y disponibilidad de una sala específica para una fecha y hora determinada. IMPORTANTE: Todos los usuarios (estudiantes, docentes, admin) pueden consultar la disponibilidad de cualquier sala. Usa esta función cuando el usuario pregunte si una sala está disponible, ocupada, o en clases a cierta hora.",
    input_schema: {
      type: "object",
      properties: {
        salaId: {
          type: "string",
          description: "ID o nombre de la sala a consultar (ej: 'CINE-B101', 'A310', '402')"
        },
        fecha: {
          type: "string",
          description: "Fecha a consultar. Puede ser 'hoy', 'mañana' o formato YYYY-MM-DD. Por defecto 'hoy'."
        },
        hora: {
          type: "string",
          description: "Hora específica a consultar en formato HH:mm de 24 horas (ej: '08:00', '14:30'). Opcional: si no se especifica, muestra todas las reservas del día."
        }
      },
      required: ["salaId"]
    }
  }
];

/**
 * Parsea fecha relativa (hoy, mañana) a fecha real
 */
function parsearFecha(fechaStr) {
  const str = fechaStr.toLowerCase().trim();

  console.log('📅 Parseando fecha:', fechaStr);

  // Opción 1: "hoy"
  if (str === 'hoy' || str === 'today') {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    console.log('   → Detectado "hoy":', hoy);
    return hoy;
  }

  // Opción 2: "mañana"
  if (str === 'mañana' || str === 'manana' || str === 'tomorrow') {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    console.log('   → Detectado "mañana":', manana);
    return manana;
  }

  // Opción 3: Formato YYYY-MM-DD (ISO)
  const matchISO = str.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (matchISO) {
    const year = parseInt(matchISO[1]);
    const month = parseInt(matchISO[2]) - 1; // Los meses en JS son 0-indexed
    const day = parseInt(matchISO[3]);
    const fecha = new Date(year, month, day, 0, 0, 0, 0);
    console.log('   → Detectado formato ISO:', fecha);
    return fecha;
  }

  // Opción 4: Formato DD-MM-YYYY o DD/MM/YYYY
  const matchDMY = str.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (matchDMY) {
    const day = parseInt(matchDMY[1]);
    const month = parseInt(matchDMY[2]) - 1;
    const year = parseInt(matchDMY[3]);
    const fecha = new Date(year, month, day, 0, 0, 0, 0);
    console.log('   → Detectado formato DD-MM-YYYY:', fecha);
    return fecha;
  }

  // Por defecto, hoy
  console.warn('   ⚠️ Formato no reconocido, usando hoy');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

/**
 * Limpia la asignatura removiendo frases innecesarias y convierte a mayúsculas
 */
function limpiarAsignatura(asignatura) {
  if (!asignatura) return '';

  let limpia = asignatura.trim();

  // Remover frases comunes al inicio
  const frasesRemover = [
    /^clase de\s+/i,
    /^dar clase de\s+/i,
    /^quiero dar\s+/i,
    /^voy a dar\s+/i,
    /^voy a enseñar\s+/i,
    /^enseñar\s+/i,
    /^impartir\s+/i,
    /^taller de\s+/i,
    /^curso de\s+/i,
    /^una clase de\s+/i
  ];

  for (const regex of frasesRemover) {
    limpia = limpia.replace(regex, '');
  }

  // Convertir a mayúsculas
  return limpia.toUpperCase();
}

/**
 * Crea una reserva desde Claude
 */
async function crearReservaDesdeClaude(args, user, userData) {
  try {
    console.log('🎯 Creando reserva desde Claude:', args);
    console.log('👤 Datos del usuario:', {
      role: userData?.role,
      nombre: userData?.nombre,
      email: user?.email
    });

    // Validar que el usuario sea docente o admin
    if (userData?.role !== 'docente' && userData?.role !== 'admin') {
      console.error('❌ Rol no autorizado:', userData?.role);
      return {
        exito: false,
        mensaje: `Solo los docentes y administradores pueden crear reservas. Tu rol actual es: ${userData?.role || 'desconocido'}`
      };
    }

    // Limpiar asignatura
    args.asignatura = limpiarAsignatura(args.asignatura);
    console.log('   📚 Asignatura limpia:', args.asignatura);

    // Parsear fecha
    const fecha = parsearFecha(args.fecha);
    console.log('   📅 Fecha parseada:', fecha);

    // Validar que la fecha sea válida
    if (isNaN(fecha.getTime())) {
      console.error('❌ Fecha inválida:', args.fecha);
      return {
        exito: false,
        mensaje: `La fecha '${args.fecha}' no es válida. Usa 'hoy', 'mañana' o formato YYYY-MM-DD.`
      };
    }

    // Construir hora inicio completa
    const [horaStr, minutoStr] = args.horaInicio.split(':');

    // Validar formato de hora
    if (!horaStr || !minutoStr) {
      console.error('❌ Formato de hora inválido:', args.horaInicio);
      return {
        exito: false,
        mensaje: `La hora '${args.horaInicio}' no tiene formato válido. Usa formato HH:mm (ej: 14:30).`
      };
    }

    const horaInicio = new Date(fecha);
    horaInicio.setHours(parseInt(horaStr), parseInt(minutoStr), 0, 0);

    console.log('   ⏰ Hora inicio:', horaInicio);

    // Validar que la hora de inicio sea válida
    if (isNaN(horaInicio.getTime())) {
      console.error('❌ Hora de inicio inválida');
      return {
        exito: false,
        mensaje: `La hora de inicio no es válida. Verifica el formato.`
      };
    }

    // Calcular hora fin
    const duracionMinutos = Math.round(args.duracionHoras * 60);

    // Validar duración mínima de 45 minutos
    if (duracionMinutos < 45) {
      return {
        exito: false,
        mensaje: 'La duración mínima de una reserva es de 45 minutos. Por favor, solicita una duración mayor.'
      };
    }

    const horaFin = new Date(horaInicio.getTime() + duracionMinutos * 60000);

    // Buscar sala (puede venir como ID o nombre)
    const salasSnapshot = await getDocs(collection(db, 'salas'));
    const sala = salasSnapshot.docs.find(doc =>
      doc.id.toLowerCase() === args.salaId.toLowerCase() ||
      doc.data().nombre?.toLowerCase() === args.salaId.toLowerCase()
    );

    if (!sala) {
      return {
        exito: false,
        mensaje: `No se encontró la sala '${args.salaId}'. Verifica el nombre.`
      };
    }

    const salaData = sala.data();

    // Validar disponibilidad (validarDisponibilidad espera Date objects)
    const resultadoDisponibilidad = await validarDisponibilidad(
      sala.id,
      horaInicio,  // Date object
      horaFin      // Date object
    );

    console.log('   🔍 Resultado de disponibilidad:', resultadoDisponibilidad);

    if (!resultadoDisponibilidad.disponible) {
      return {
        exito: false,
        mensaje: `La sala ${salaData.nombre} no está disponible en ese horario. Ya hay una reserva conflictiva.`,
        conflictos: resultadoDisponibilidad.conflictos
      };
    }

    // Determinar jornada (usar 18:00 como separador INACAP)
    const hora = horaInicio.getHours();
    const jornada = hora < 18 ? 'diurno' : 'vespertino';

    // Convertir fechas a formato ISO string con timezone local (igual que el formulario UI)
    // Obtener offset de timezone (ej: "-03:00" para Chile)
    const offsetMinutos = new Date().getTimezoneOffset();
    const offsetHoras = -offsetMinutos / 60;
    const offsetString = offsetHoras >= 0
      ? `+${String(Math.floor(offsetHoras)).padStart(2, '0')}:00`
      : `-${String(Math.floor(Math.abs(offsetHoras))).padStart(2, '0')}:00`;

    // Formatear fechas en hora LOCAL (no UTC) con timezone
    // Formato: "2025-11-05T10:00:00-03:00" (igual que FormularioReserva.jsx)
    const formatearFechaLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`;
    };

    const horaInicioISO = formatearFechaLocal(horaInicio);
    const horaFinISO = formatearFechaLocal(horaFin);

    console.log('   📅 Formato de fechas:', {
      horaInicioISO,
      horaFinISO,
      offsetString
    });

    // Crear la reserva con el MISMO formato que el formulario UI
    // NO incluir usuarioId ni estado (crearReserva los agrega automáticamente)
    const datosReserva = {
      salaId: sala.id,
      salaNombre: salaData.nombre,
      nombreDocente: userData.nombre,
      asignatura: args.asignatura,
      horaInicio: horaInicioISO,  // String ISO con timezone local
      horaFin: horaFinISO,        // String ISO con timezone local
      jornada: jornada,
      origen: 'chatbot' // Marcar que fue creada por el chatbot
    };

    console.log('   💾 Datos de reserva a crear:', datosReserva);

    const resultado = await crearReserva(datosReserva);

    console.log('   📊 Resultado de crearReserva:', resultado);

    // Verificar si la creación fue exitosa
    if (!resultado.success) {
      console.error('❌ Error al crear reserva:', resultado.error);
      return {
        exito: false,
        mensaje: resultado.error || 'Error desconocido al crear la reserva'
      };
    }

    console.log('✅ Reserva creada exitosamente:', resultado.data.id);

    return {
      exito: true,
      reservaId: resultado.data.id,
      datos: {
        sala: salaData.nombre,
        fecha: fecha.toLocaleDateString('es-CL'),
        horaInicio: horaInicio.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        horaFin: horaFin.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        duracion: `${args.duracionHoras} hora${args.duracionHoras !== 1 ? 's' : ''}`,
        asignatura: args.asignatura,
        jornada: jornada
      },
      mensaje: "Reserva creada exitosamente"
    };

  } catch (error) {
    console.error('❌ Error en crearReservaDesdeClaude:', error);
    return {
      exito: false,
      mensaje: `Error al crear la reserva: ${error.message}`
    };
  }
}

/**
 * Obtiene reservas del usuario desde Claude
 */
async function obtenerReservasDesdeClaude(args, user) {
  try {
    console.log('📋 Obteniendo reservas desde Claude:', args);

    const soloActivas = args.soloActivas !== false; // Por defecto true
    const resultado = await obtenerMisReservas(soloActivas);

    // Extraer el array de reservas del objeto de respuesta
    const reservas = resultado.success ? resultado.data : [];

    if (reservas.length === 0) {
      return {
        exito: true,
        reservas: [],
        mensaje: soloActivas
          ? "No tienes reservas activas en este momento."
          : "No tienes ninguna reserva registrada."
      };
    }

    // Formatear reservas para respuesta
    const reservasFormateadas = reservas.map(r => ({
      id: r.id,
      sala: r.salaNombre,
      asignatura: r.asignatura,
      fecha: r.horaInicio?.toDate().toLocaleDateString('es-CL'),
      horaInicio: r.horaInicio?.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      horaFin: r.horaFin?.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      jornada: r.jornada,
      estado: r.estado
    }));

    return {
      exito: true,
      reservas: reservasFormateadas,
      cantidad: reservas.length,
      mensaje: `Encontré ${reservas.length} reserva${reservas.length !== 1 ? 's' : ''}.`
    };

  } catch (error) {
    console.error('❌ Error en obtenerReservasDesdeClaude:', error);
    return {
      exito: false,
      reservas: [],
      mensaje: `Error al obtener reservas: ${error.message}`
    };
  }
}

/**
 * Busca salas según criterios desde Claude
 */
async function buscarSalasDesdeClaude(args, userData) {
  try {
    console.log('🔍 Buscando salas desde Claude:', args);

    // Obtener todas las salas
    const salasSnapshot = await getDocs(collection(db, 'salas'));
    let salas = salasSnapshot.docs
      .map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre,
        nombreCompleto: doc.data().nombreCompleto,
        capacidad: doc.data().capacidad,
        pisoNumero: doc.data().pisoNumero || doc.data().piso,
        pisoId: doc.data().pisoId,
        edificioId: doc.data().edificioId,
        edificioCodigo: doc.data().edificioCodigo,
        edificioNombre: doc.data().edificioNombre,
        sedeId: doc.data().sedeId,
        sedeCodigo: doc.data().sedeCodigo,
        sedeNombre: doc.data().sedeNombre,
        equipamiento: doc.data().equipamiento || [],
        activa: doc.data().activa !== false
      }))
      .filter(s => s.activa);

    // Filtrar automáticamente por sedes afiliadas (solo para no-admin)
    if (userData?.role !== 'admin' && userData?.sedesAfiliadas && userData.sedesAfiliadas.length > 0) {
      salas = salas.filter(s => userData.sedesAfiliadas.includes(s.sedeId));
    }

    // Filtrar por edificio
    if (args.edificioCodigo) {
      salas = salas.filter(s => s.edificioCodigo && s.edificioCodigo.toUpperCase() === args.edificioCodigo.toUpperCase());
    }

    // Filtrar por sede
    if (args.sedeCodigo) {
      salas = salas.filter(s => s.sedeCodigo && s.sedeCodigo.toUpperCase() === args.sedeCodigo.toUpperCase());
    }

    // Filtrar por capacidad mínima
    if (args.capacidadMinima) {
      salas = salas.filter(s => s.capacidad >= args.capacidadMinima);
    }

    // Filtrar por piso
    if (args.pisoNumero) {
      salas = salas.filter(s => s.pisoNumero === args.pisoNumero);
    }

    // Filtrar por disponibilidad (si se solicita)
    if (args.soloDisponibles) {
      const ahora = new Date();
      const reservasSnapshot = await getDocs(collection(db, 'reservas'));
      const reservasActivas = reservasSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => {
          if (r.estado !== 'activa') return false;
          const horaFin = r.horaFin?.toDate();
          return horaFin && horaFin > ahora;
        });

      salas = salas.filter(sala => {
        const reservasDeSala = reservasActivas.filter(r => r.salaId === sala.id);
        const ocupada = reservasDeSala.some(r => {
          const inicio = r.horaInicio?.toDate();
          const fin = r.horaFin?.toDate();
          return inicio && fin && ahora >= inicio && ahora < fin;
        });
        return !ocupada;
      });
    }

    if (salas.length === 0) {
      return {
        exito: true,
        salas: [],
        mensaje: "No se encontraron salas con esos criterios."
      };
    }

    // Agrupar salas por sede y edificio
    const salasPorSede = {};
    const salasPorEdificio = {};

    salas.forEach(sala => {
      // Agrupar por sede
      const sedeKey = sala.sedeNombre || sala.sedeCodigo || 'Sede desconocida';
      if (!salasPorSede[sedeKey]) {
        salasPorSede[sedeKey] = [];
      }
      salasPorSede[sedeKey].push(sala.nombre);

      // Agrupar por edificio
      let edificioKey = '';
      if (sala.edificioNombre) {
        edificioKey = `Edificio ${sala.edificioNombre}`;
      } else if (sala.edificioCodigo) {
        edificioKey = `Edificio ${sala.edificioCodigo}`;
      } else {
        edificioKey = 'Edificio sin nombre';
      }

      if (!salasPorEdificio[edificioKey]) {
        salasPorEdificio[edificioKey] = [];
      }
      salasPorEdificio[edificioKey].push(sala.nombre);
    });

    // Construir mensaje descriptivo
    const sedes = Object.keys(salasPorSede);
    const edificios = Object.keys(salasPorEdificio);
    let mensaje = `Encontré ${salas.length} sala${salas.length !== 1 ? 's' : ''}.`;

    // Mencionar sedes solo si hay más de una
    if (sedes.length > 1) {
      mensaje += ` Distribuidas en ${sedes.length} sedes: `;
      mensaje += sedes.map(sede => `${salasPorSede[sede].length} en ${sede}`).join(', ');
      mensaje += '.';
    }

    // Mencionar edificios (dentro de la(s) sede(s))
    if (edificios.length > 1) {
      mensaje += ` Por edificio: `;
      mensaje += edificios.map(ed => `${salasPorEdificio[ed].length} en el ${ed}`).join(', ');
      mensaje += '.';
    } else if (edificios.length === 1 && sedes.length === 1) {
      mensaje += ` Todas en el ${edificios[0]}.`;
    }

    return {
      exito: true,
      salas: salas,
      cantidad: salas.length,
      salasPorEdificio: salasPorEdificio,
      mensaje: mensaje
    };

  } catch (error) {
    console.error('❌ Error en buscarSalasDesdeClaude:', error);
    return {
      exito: false,
      salas: [],
      mensaje: `Error al buscar salas: ${error.message}`
    };
  }
}

/**
 * Consulta la disponibilidad de una sala específica
 */
async function consultarDisponibilidadSala(args) {
  try {
    console.log('🔍 Consultando disponibilidad de sala:', args);

    const { salaId, fecha = 'hoy', hora } = args;

    // Parsear fecha
    const fechaConsulta = parsearFecha(fecha);
    const inicioDia = new Date(fechaConsulta);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fechaConsulta);
    finDia.setHours(23, 59, 59, 999);

    // Buscar la sala
    const salasSnapshot = await getDocs(collection(db, 'salas'));
    const sala = salasSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .find(s =>
        s.id === salaId ||
        s.nombre === salaId ||
        s.nombre?.toUpperCase() === salaId?.toUpperCase()
      );

    if (!sala) {
      return {
        exito: false,
        mensaje: `No se encontró la sala "${salaId}". Verifica el nombre e intenta de nuevo.`
      };
    }

    // Obtener reservas de esa sala para ese día
    const reservasSnapshot = await getDocs(collection(db, 'reservas'));
    const reservasDelDia = reservasSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(r => {
        if (r.salaId !== sala.id && r.salaNombre !== sala.nombre) return false;
        if (r.estado !== 'activa') return false;

        const horaInicio = r.horaInicio?.toDate();
        if (!horaInicio) return false;

        return horaInicio >= inicioDia && horaInicio <= finDia;
      })
      .sort((a, b) => {
        const aTime = a.horaInicio?.toDate().getTime() || 0;
        const bTime = b.horaInicio?.toDate().getTime() || 0;
        return aTime - bTime;
      });

    // Si se especificó una hora, verificar si está disponible considerando duración mínima (45 min)
    if (hora) {
      const [horaNum, minNum] = hora.split(':').map(Number);
      const horaConsulta = new Date(fechaConsulta);
      horaConsulta.setHours(horaNum, minNum, 0, 0);

      // Calcular hora de fin con duración mínima de 45 minutos
      const DURACION_MINIMA_HORAS = 0.75; // 45 minutos
      const horaFinConsulta = new Date(horaConsulta);
      horaFinConsulta.setMinutes(horaFinConsulta.getMinutes() + (DURACION_MINIMA_HORAS * 60));

      // Verificar si hay conflicto con alguna reserva existente
      // Conflicto si: (horaInicio < reserva.fin) Y (horaFin > reserva.inicio)
      const reservaConflictiva = reservasDelDia.find(r => {
        const inicio = r.horaInicio?.toDate();
        const fin = r.horaFin?.toDate();
        return horaConsulta < fin && horaFinConsulta > inicio;
      });

      if (reservaConflictiva) {
        const inicio = reservaConflictiva.horaInicio.toDate();
        const fin = reservaConflictiva.horaFin.toDate();

        return {
          exito: true,
          disponible: false,
          sala: sala,
          mensaje: `La sala ${sala.nombre} (${sala.nombreCompleto}) NO está disponible el ${fechaConsulta.toLocaleDateString('es-CL')} a las ${hora} (se solaparía con una reserva existente de ${inicio.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} a ${fin.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}).`,
          reservaActual: {
            asignatura: reservaConflictiva.asignatura,
            docente: reservaConflictiva.nombreDocente,
            horaInicio: inicio.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
            horaFin: fin.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
          }
        };
      } else {
        return {
          exito: true,
          disponible: true,
          sala: sala,
          mensaje: `La sala ${sala.nombre} (${sala.nombreCompleto}) está DISPONIBLE el ${fechaConsulta.toLocaleDateString('es-CL')} a las ${hora}.`,
          reservasDelDia: reservasDelDia.length
        };
      }
    }

    // Si no se especificó hora, mostrar todas las reservas del día
    if (reservasDelDia.length === 0) {
      return {
        exito: true,
        disponible: true,
        sala: sala,
        mensaje: `La sala ${sala.nombre} (${sala.nombreCompleto}) NO tiene reservas para el ${fechaConsulta.toLocaleDateString('es-CL')}. Está completamente disponible.`,
        reservas: []
      };
    }

    // Construir lista de reservas
    const reservasFormateadas = reservasDelDia.map(r => {
      const inicio = r.horaInicio.toDate();
      const fin = r.horaFin.toDate();
      return {
        asignatura: r.asignatura,
        docente: r.nombreDocente,
        horaInicio: inicio.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        horaFin: fin.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      };
    });

    return {
      exito: true,
      sala: sala,
      mensaje: `La sala ${sala.nombre} (${sala.nombreCompleto}) tiene ${reservasDelDia.length} reserva${reservasDelDia.length > 1 ? 's' : ''} el ${fechaConsulta.toLocaleDateString('es-CL')}:`,
      reservas: reservasFormateadas,
      totalReservas: reservasDelDia.length
    };

  } catch (error) {
    console.error('❌ Error en consultarDisponibilidadSala:', error);
    return {
      exito: false,
      mensaje: `Error al consultar disponibilidad: ${error.message}`
    };
  }
}

/**
 * Ejecuta una función solicitada por Claude
 */
async function ejecutarFuncion(nombreFuncion, argumentos, user, userData) {
  console.log(`🔧 Ejecutando función: ${nombreFuncion}`, argumentos);

  try {
    switch (nombreFuncion) {
      case 'crear_reserva':
        return await crearReservaDesdeClaude(argumentos, user, userData);

      case 'obtener_mis_reservas':
        return await obtenerReservasDesdeClaude(argumentos, user);

      case 'buscar_salas':
        return await buscarSalasDesdeClaude(argumentos, userData);

      case 'consultar_disponibilidad_sala':
        return await consultarDisponibilidadSala(argumentos);

      default:
        return {
          exito: false,
          mensaje: `Función '${nombreFuncion}' no implementada`
        };
    }
  } catch (error) {
    console.error(`❌ Error ejecutando función ${nombreFuncion}:`, error);
    return {
      exito: false,
      mensaje: `Error al ejecutar ${nombreFuncion}: ${error.message}`
    };
  }
}

/**
 * Obtiene contexto actualizado de salas y reservas (filtrado por sedes del usuario)
 */
async function obtenerContextoSistema(user, userData) {
  try {
    const contexto = {
      timestamp: new Date().toISOString(),
      salas: [],
      salasDisponibles: [],
      reservasActivas: [],
      sedesUsuario: [],
    };

    // Obtener todas las salas
    const salasSnapshot = await getDocs(collection(db, 'salas'));
    let salasData = salasSnapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().nombre,
      nombreCompleto: doc.data().nombreCompleto,
      capacidad: doc.data().capacidad,
      pisoNumero: doc.data().pisoNumero || doc.data().piso,
      pisoId: doc.data().pisoId,
      edificioId: doc.data().edificioId,
      edificioCodigo: doc.data().edificioCodigo,
      edificioNombre: doc.data().edificioNombre,
      sedeId: doc.data().sedeId,
      sedeCodigo: doc.data().sedeCodigo,
      sedeNombre: doc.data().sedeNombre,
      equipamiento: doc.data().equipamiento || [],
      activa: doc.data().activa !== false
    }));

    // Filtrar salas según las sedes del usuario (solo para docentes/estudiantes)
    if (userData?.role !== 'admin' && userData?.sedesAfiliadas && userData.sedesAfiliadas.length > 0) {
      salasData = salasData.filter(sala => userData.sedesAfiliadas.includes(sala.sedeId));
      contexto.sedesUsuario = userData.sedesAfiliadas;
    } else if (userData?.role === 'admin') {
      contexto.sedesUsuario = ['todas'];
    }

    contexto.salas = salasData;

    // Obtener reservas activas
    const ahora = new Date();
    const reservasSnapshot = await getDocs(collection(db, 'reservas'));
    const reservasActivas = reservasSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(r => {
        if (r.estado !== 'activa') return false;
        const horaFin = r.horaFin?.toDate();
        return horaFin && horaFin > ahora;
      });

    contexto.reservasActivas = reservasActivas.map(r => ({
      salaId: r.salaId,
      salaNombre: r.salaNombre,
      asignatura: r.asignatura,
      nombreDocente: r.nombreDocente,
      horaInicio: r.horaInicio?.toDate()?.toISOString(),
      horaFin: r.horaFin?.toDate()?.toISOString(),
    }));

    // Calcular salas disponibles AHORA
    contexto.salasDisponibles = contexto.salas.filter(sala => {
      if (!sala.activa) return false;
      const reservasDeSala = reservasActivas.filter(r => r.salaId === sala.id);
      const ocupada = reservasDeSala.some(r => {
        const inicio = r.horaInicio?.toDate();
        const fin = r.horaFin?.toDate();
        return inicio && fin && ahora >= inicio && ahora < fin;
      });
      return !ocupada;
    }).map(s => s.id);

    return contexto;
  } catch (error) {
    console.error('❌ Error al obtener contexto del sistema:', error);
    return {
      timestamp: new Date().toISOString(),
      salas: [],
      salasDisponibles: [],
      reservasActivas: [],
      error: 'No se pudo obtener información actualizada del sistema'
    };
  }
}

/**
 * Consulta a Claude AI (función principal)
 */
export async function consultarClaude(mensajeUsuario, user, userData, historial = []) {
  // Validar API Key
  if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'tu_api_key_aqui') {
    return {
      texto: '⚠️ **Configuración Pendiente**\n\n' +
             'El chatbot inteligente con Claude necesita configuración. Por favor:\n\n' +
             '1. Obtén tu API Key en [Anthropic Console](https://console.anthropic.com/settings/keys)\n' +
             '2. Crea un archivo `.env` en `frontend/`\n' +
             '3. Agrega: `VITE_CLAUDE_API_KEY=tu_api_key`\n\n' +
             'Pay-as-you-go: solo pagas lo que usas 💰',
      tipo: 'warning',
      usandoIA: false
    };
  }

  try {
    console.log('🤖 Consultando Claude AI...');

    // Obtener contexto del sistema (filtrado por sedes del usuario)
    const contexto = await obtenerContextoSistema(user, userData);

    // Generar saludo personalizado basado en rol y nombre
    const nombreUsuario = userData?.nombre || user?.displayName || 'Usuario';
    const rolUsuario = userData?.role || 'estudiante';

    let saludoPersonalizado;
    if (rolUsuario === 'admin') {
      saludoPersonalizado = `¡Hola, Administrador ${nombreUsuario}! 👨‍💼 Soy el asistente de SalaSmart. Como administrador, puedo ayudarte con todo: salas, reservas, usuarios y más. ¿Qué necesitas?`;
    } else if (rolUsuario === 'docente') {
      saludoPersonalizado = `¡Hola, Docente ${nombreUsuario}! 👨‍🏫 Soy el asistente de SalaSmart. Puedo ayudarte a consultar disponibilidad y crear reservas para tus clases. ¿En qué te puedo ayudar?`;
    } else {
      saludoPersonalizado = `¡Hola, ${nombreUsuario}! 👋 Soy el asistente de SalaSmart. Puedo ayudarte a consultar salas, ver disponibilidad y horarios. ¿Qué necesitas?`;
    }

    // Construir SYSTEM PROMPT dinámico con info del usuario
    const systemPromptConContexto = SYSTEM_PROMPT + `\n\n## INFORMACIÓN DEL USUARIO ACTUAL:\n` +
      `**Nombre:** ${userData?.nombre || 'Usuario'}\n` +
      `**Rol:** ${userData?.role || 'estudiante'}\n` +
      `**Email:** ${user?.email || 'N/A'}\n` +
      `**Fecha:** ${new Date().toLocaleDateString('es-CL')}\n` +
      `**Hora:** ${new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}\n\n` +
      `**IMPORTANTE:** El usuario es ${userData?.role === 'docente' ? 'DOCENTE' : userData?.role === 'admin' ? 'ADMINISTRADOR' : 'ESTUDIANTE'}. ` +
      `${userData?.role === 'docente' || userData?.role === 'admin' ? 'PUEDE crear reservas.' : 'NO puede crear reservas, solo consultar.'}\n\n` +
      `**Estado del Sistema:**\n` +
      `- Salas totales: ${contexto.salas.length}\n` +
      `- Disponibles ahora: ${contexto.salasDisponibles.length}\n` +
      `- Reservas activas: ${contexto.reservasActivas.length}`;

    // Construir mensajes para Claude
    const mensajes = [];

    // Incluir historial previo (si existe)
    if (historial.length > 0) {
      mensajes.push(...historial);
    }

    // Agregar mensaje actual del usuario
    mensajes.push({
      role: 'user',
      content: mensajeUsuario
    });

    // Llamar a Claude con tools y SYSTEM PROMPT DINÁMICO
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      temperature: CLAUDE_TEMPERATURE,
      system: systemPromptConContexto, // Ahora incluye el rol del usuario
      messages: mensajes,
      tools: HERRAMIENTAS_DISPONIBLES
    });

    console.log('📩 Respuesta de Claude:', response);

    // Verificar si Claude quiere ejecutar herramientas
    const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');

    if (toolUseBlocks.length > 0) {
      console.log('🎯 Claude solicita ejecutar herramientas:', toolUseBlocks.length);

      // Ejecutar todas las herramientas solicitadas
      const resultadosHerramientas = [];

      for (const toolUse of toolUseBlocks) {
        const nombreFuncion = toolUse.name;
        const argumentos = toolUse.input;

        console.log(`   → Ejecutando: ${nombreFuncion}`, argumentos);

        const resultado = await ejecutarFuncion(nombreFuncion, argumentos, user, userData);

        resultadosHerramientas.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(resultado)
        });

        console.log(`   ✅ Resultado:`, resultado.exito ? 'Éxito' : 'Error');
      }

      // Enviar resultados a Claude para que genere respuesta final
      const mensajesConResultados = [
        ...mensajes,
        {
          role: 'assistant',
          content: response.content
        },
        {
          role: 'user',
          content: resultadosHerramientas
        }
      ];

      const response2 = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        temperature: CLAUDE_TEMPERATURE,
        system: systemPromptConContexto, // Usar mismo system prompt con info del usuario
        messages: mensajesConResultados,
        tools: HERRAMIENTAS_DISPONIBLES
      });

      // Extraer texto de la respuesta
      const textoRespuesta = response2.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      // Determinar tipo de respuesta según resultado
      const algunaExitosa = toolUseBlocks.some((tool, i) => {
        const resultado = JSON.parse(resultadosHerramientas[i].content);
        return resultado.exito;
      });

      return {
        texto: textoRespuesta,
        tipo: algunaExitosa ? 'success' : 'error',
        usandoIA: true,
        funcionesEjecutadas: toolUseBlocks.map(t => t.name),
        metadata: {
          modelo: CLAUDE_MODEL,
          funciones: toolUseBlocks.length,
          proveedor: 'Anthropic'
        }
      };
    }

    // Respuesta normal (sin tool calls)
    const textoRespuesta = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      texto: textoRespuesta,
      tipo: 'info',
      usandoIA: true,
      metadata: {
        modelo: CLAUDE_MODEL,
        proveedor: 'Anthropic'
      }
    };

  } catch (error) {
    console.error('❌ Error al consultar Claude:', error);

    // Manejar errores específicos
    if (error.status === 401) {
      return {
        texto: '❌ **API Key Inválida**\n\nLa API Key de Claude no es válida. Verifica tu configuración en `.env`.',
        tipo: 'error',
        usandoIA: false
      };
    }

    if (error.status === 429) {
      return {
        texto: '⏳ **Límite de Rate Alcanzado**\n\n' +
               'Has alcanzado el límite de requests por minuto.\n\n' +
               '**Soluciones:**\n' +
               '• ⏱️ Espera unos segundos e intenta de nuevo\n' +
               '• 📊 Revisa tu uso en [Anthropic Console](https://console.anthropic.com)',
        tipo: 'warning',
        usandoIA: false
      };
    }

    return {
      texto: '❌ **Error al procesar tu mensaje**\n\n' +
             'Hubo un problema al conectar con Claude AI. ' +
             'Por favor intenta nuevamente.\n\n' +
             `Detalle: ${error.message}`,
      tipo: 'error',
      usandoIA: false,
      errorDetalle: error.message
    };
  }
}

export { obtenerContextoSistema };

// Alias para compatibilidad con ChatBot
export { consultarClaude as procesarMensaje };
