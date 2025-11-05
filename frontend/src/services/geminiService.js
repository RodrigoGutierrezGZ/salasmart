/**
 * Servicio de integración con Google Gemini AI
 * Chatbot 100% IA con function calling - GRATIS
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../firebase/config';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { crearReserva, validarDisponibilidad, obtenerMisReservas } from './reservasService';

// Configuración de Gemini
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-exp';
const GEMINI_TEMPERATURE = parseFloat(import.meta.env.VITE_GEMINI_TEMPERATURE) || 0.7;

// Inicializar cliente de Gemini
let genAI = null;
let model = null;

if (GEMINI_API_KEY && GEMINI_API_KEY !== 'tu_api_key_aqui') {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: GEMINI_TEMPERATURE,
      maxOutputTokens: 1000,
    },
  });
}

/**
 * Prompt del sistema - Define la personalidad y conocimientos del bot
 */
const SYSTEM_PROMPT = `Eres el asistente virtual de **SalaSmart**, un sistema de gestión de salas para INACAP (universidad chilena).

## Tu Personalidad:
- Amigable, claro y profesional
- Hablas en español chileno (puedes usar "po", "cachái", etc. ocasionalmente)
- Usas emojis para ser más ameno (sin exagerar)
- Explicas las cosas de forma simple y didáctica
- Eres proactivo: ofreces ayuda y sugerencias sin que te las pidan

## Conocimientos del Sistema:

### Salas:
- Hay salas distribuidas en 4 pisos (Piso 1, 2, 3, 4)
- Cada sala tiene: nombre (ej: A310, S101), capacidad (personas), equipamiento
- Los nombres con "A" suelen ser del piso 3, con "S" del piso 1

### Reservas:
- Horario: 8:00 AM - 10:00 PM (lunes a viernes)
- Duración: 30 minutos mínimo, 4 horas máximo
- Se valida automáticamente que no haya conflictos
- Los usuarios ven estados en tiempo real: 🟢 Disponible, 🟡 Próximamente, 🔴 Ocupado

### Jornadas:
- 🌞 **Diurno**: 8:00 AM - 6:00 PM (18:00)
- 🌙 **Vespertino**: 6:00 PM (18:00) - 10:00 PM

### Roles:
- **Estudiante**: Solo puede consultar (ver salas, estados, horarios)
- **Docente**: Puede consultar + crear y cancelar sus propias reservas
- **Admin**: Puede hacer todo (gestionar salas, usuarios, todas las reservas)

## Tus Capacidades:

Tienes acceso en tiempo real a:
- Lista de todas las salas con su información
- Reservas activas y disponibilidad
- Estado actual de cada sala
- Información del usuario (nombre, rol)

Puedes:
1. **Responder preguntas** sobre el sistema, salas, reservas
2. **Explicar cómo funcionan** las cosas de forma didáctica
3. **CREAR RESERVAS DIRECTAMENTE** cuando el usuario te proporcione todos los datos necesarios
4. **CONSULTAR RESERVAS** del usuario
5. **BUSCAR SALAS** según criterios (capacidad, piso, disponibilidad)
6. **Sugerir salas** según necesidades

### IMPORTANTE: Crear Reservas

Cuando un usuario quiera reservar una sala:
- Si te da TODOS los datos (sala, fecha, hora, duración, asignatura) → Llama la función crear_reserva inmediatamente
- Si falta algún dato → Pregunta solo lo que falta
- NO pidas confirmación si ya tienes todos los datos, ejecuta directamente

**FORMATO CRÍTICO de parámetros:**
- **fecha**: SIEMPRE usa "hoy" o "mañana" (en minúsculas). NO uses fechas específicas como "2025-01-04".
- **horaInicio**: SIEMPRE formato 24h con dos dígitos: "08:00", "14:30", "17:40" (NO uses "8am" ni "2pm")
- **duracionHoras**: Número decimal (0.5 para 30min, 1 para 1h, 2 para 2h)

Ejemplo CORRECTO:
Usuario: "quiero reservar sala 402 mañana a las 8am por 2 horas para programación web"
→ Llamas crear_reserva({
    salaId: "402",
    fecha: "mañana",
    horaInicio: "08:00",
    duracionHoras: 2,
    asignatura: "programación web"
  })

Ejemplo INCORRECTO:
→ fecha: "2025-01-05" ❌ (usa "mañana")
→ horaInicio: "8am" ❌ (usa "08:00")
→ Responder: "¿Confirmas la reserva?" ❌ (ejecuta directamente)

## Reglas Importantes:

1. **NUNCA inventes información**
   - Si no tienes datos en el contexto, di "Déjame consultar..."
   - No inventes nombres de salas, capacidades o equipamiento

2. **Sé conciso pero completo**
   - Respuestas de 2-5 líneas idealmente
   - Si la pregunta es simple, respuesta simple
   - Si es compleja, estructúrala con bullets o números

3. **Guía proactivamente**
   - Si alguien pregunta algo vago, sugiere opciones
   - Si detectas que quiere reservar, ayúdale paso a paso

4. **Valida permisos**
   - Si un estudiante intenta reservar, explícale amablemente que solo docentes pueden
   - Sugiere que consulte con su profesor o administrador

5. **Formato de respuestas**
   - Usa **negritas** para destacar información importante
   - Usa emojis relevantes (📍 para ubicación, 📅 para fechas, etc.)
   - Usa listas cuando enumeres opciones
   - Mantén el tono conversacional

## Ejemplos de Buen Estilo:

❌ MAL: "La sala A310 tiene capacidad para 15 personas y está en el piso 3."

✅ BIEN: "La sala **A310** es perfecta para grupos pequeños:
• 👥 Capacidad: 15 personas
• 🏢 Ubicación: Piso 3
• ✅ Estado: Disponible ahora

¿Te gustaría reservarla?"

❌ MAL: "Error: no tienes permisos."

✅ BIEN: "Uy, veo que eres **estudiante**. Las reservas solo pueden hacerlas los profes o el admin 😅

Pero igual puedo ayudarte a:
• Ver qué salas están disponibles
• Revisar horarios
• Darte info de cualquier sala

¿Qué necesitas saber?"

¡Tu objetivo es hacer que los usuarios se sientan ayudados y que el sistema sea fácil de usar! 🚀`;

/**
 * Declaración de funciones disponibles para Gemini
 */
const FUNCIONES_DISPONIBLES = [
  {
    name: "crear_reserva",
    description: "Crea una nueva reserva de sala cuando el usuario proporciona todos los datos necesarios (sala, fecha, hora, duración, asignatura). IMPORTANTE: Solo ejecutar si el usuario es docente o admin.",
    parameters: {
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
          description: "Duración de la reserva en horas (0.5 = 30min, 1 = 1h, 1.5 = 1h30min, 2 = 2h, etc.)"
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
    parameters: {
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
    description: "Busca salas según criterios específicos (capacidad mínima, piso, disponibilidad)",
    parameters: {
      type: "object",
      properties: {
        capacidadMinima: {
          type: "number",
          description: "Capacidad mínima de personas requerida"
        },
        piso: {
          type: "number",
          description: "Número de piso específico (1, 2, 3, 4)"
        },
        soloDisponibles: {
          type: "boolean",
          description: "Si es true, muestra solo salas disponibles en este momento. Por defecto false."
        }
      }
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
 * Crea una reserva desde Gemini
 */
async function crearReservaDesdeGemini(args, user, userData) {
  try {
    console.log('🎯 Creando reserva desde Gemini:', args);

    // Validar que el usuario sea docente o admin
    if (userData.role !== 'docente' && userData.role !== 'admin') {
      return {
        exito: false,
        mensaje: "Solo los docentes y administradores pueden crear reservas."
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
      jornada: jornada
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
    console.error('❌ Error en crearReservaDesdeGemini:', error);
    return {
      exito: false,
      mensaje: `Error al crear la reserva: ${error.message}`
    };
  }
}

/**
 * Obtiene reservas del usuario desde Gemini
 */
async function obtenerReservasDesdeGemini(args, user) {
  try {
    console.log('📋 Obteniendo reservas desde Gemini:', args);

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
    console.error('❌ Error en obtenerReservasDesdeGemini:', error);
    return {
      exito: false,
      reservas: [],
      mensaje: `Error al obtener reservas: ${error.message}`
    };
  }
}

/**
 * Busca salas según criterios desde Gemini
 */
async function buscarSalasDesdeGemini(args) {
  try {
    console.log('🔍 Buscando salas desde Gemini:', args);

    // Obtener todas las salas
    const salasSnapshot = await getDocs(collection(db, 'salas'));
    let salas = salasSnapshot.docs
      .map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre,
        capacidad: doc.data().capacidad,
        piso: doc.data().piso,
        equipamiento: doc.data().equipamiento || [],
        activa: doc.data().activa !== false
      }))
      .filter(s => s.activa);

    // Filtrar por capacidad mínima
    if (args.capacidadMinima) {
      salas = salas.filter(s => s.capacidad >= args.capacidadMinima);
    }

    // Filtrar por piso
    if (args.piso) {
      salas = salas.filter(s => s.piso === args.piso);
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

    return {
      exito: true,
      salas: salas,
      cantidad: salas.length,
      mensaje: `Encontré ${salas.length} sala${salas.length !== 1 ? 's' : ''} que cumplen los criterios.`
    };

  } catch (error) {
    console.error('❌ Error en buscarSalasDesdeGemini:', error);
    return {
      exito: false,
      salas: [],
      mensaje: `Error al buscar salas: ${error.message}`
    };
  }
}

/**
 * Ejecuta una función solicitada por Gemini
 */
async function ejecutarFuncion(nombreFuncion, argumentos, user, userData) {
  console.log(`🔧 Ejecutando función: ${nombreFuncion}`, argumentos);

  try {
    switch (nombreFuncion) {
      case 'crear_reserva':
        return await crearReservaDesdeGemini(argumentos, user, userData);

      case 'obtener_mis_reservas':
        return await obtenerReservasDesdeGemini(argumentos, user);

      case 'buscar_salas':
        return await buscarSalasDesdeGemini(argumentos);

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
 * Obtiene contexto actualizado de salas y reservas
 */
async function obtenerContextoSistema(user) {
  try {
    const contexto = {
      timestamp: new Date().toISOString(),
      salas: [],
      salasDisponibles: [],
      reservasActivas: [],
    };

    // Obtener todas las salas
    const salasSnapshot = await getDocs(collection(db, 'salas'));
    contexto.salas = salasSnapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().nombre,
      capacidad: doc.data().capacidad,
      piso: doc.data().piso,
      equipamiento: doc.data().equipamiento || [],
      activa: doc.data().activa !== false
    }));

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
 * Consulta a Gemini AI (función principal)
 */
export async function consultarGemini(mensajeUsuario, user, userData, historial = []) {
  // Validar API Key
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'tu_api_key_aqui') {
    return {
      texto: '⚠️ **Configuración Pendiente**\n\n' +
             'El chatbot inteligente con Gemini necesita configuración. Por favor:\n\n' +
             '1. Obtén tu API Key gratis en [Google AI Studio](https://aistudio.google.com/app/apikey)\n' +
             '2. Crea un archivo `.env` en `frontend/`\n' +
             '3. Agrega: `VITE_GEMINI_API_KEY=tu_api_key`\n\n' +
             'Es **100% GRATIS** (1,500 requests/día) 🎉',
      tipo: 'warning',
      usandoIA: false
    };
  }

  try {
    console.log('🤖 Consultando Gemini AI...');

    // Obtener contexto del sistema
    const contexto = await obtenerContextoSistema(user);

    // Construir prompt con contexto
    const promptConContexto = SYSTEM_PROMPT + `\n\n## Contexto Actual (Tiempo Real):\n\n` +
      `**Fecha/Hora:** ${new Date().toLocaleString('es-CL')}\n` +
      `**Usuario:** ${userData?.nombre || user?.displayName || 'Usuario'}\n` +
      `**Rol:** ${userData?.role || 'estudiante'}\n\n` +
      `**Salas Totales:** ${contexto.salas.length}\n` +
      `**Salas Disponibles AHORA:** ${contexto.salasDisponibles.length} (${contexto.salasDisponibles.join(', ')})\n` +
      `**Reservas Activas:** ${contexto.reservasActivas.length}\n\n` +
      `**Lista de Salas:**\n` +
      contexto.salas.map(s =>
        `- **${s.nombre}**: ${s.capacidad} personas, Piso ${s.piso}${s.equipamiento.length > 0 ? `, Equip: ${s.equipamiento.join(', ')}` : ''}`
      ).join('\n') + '\n\n' +
      `**Reservas Activas Ahora:**\n` +
      (contexto.reservasActivas.length > 0
        ? contexto.reservasActivas.map(r =>
            `- ${r.salaNombre}: ${r.asignatura} (${r.nombreDocente}) - ${new Date(r.horaInicio).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})} a ${new Date(r.horaFin).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}`
          ).join('\n')
        : '(Ninguna)');

    // Configurar tools (funciones)
    const tools = [{
      functionDeclarations: FUNCIONES_DISPONIBLES
    }];

    // Iniciar chat con Gemini
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: promptConContexto }]
        },
        {
          role: 'model',
          parts: [{ text: '¡Hola! Soy el asistente de SalaSmart. Estoy listo para ayudarte con salas y reservas. ¿Qué necesitas? 😊' }]
        },
        ...historial
      ],
      tools: tools,
    });

    // Enviar mensaje del usuario
    const result = await chat.sendMessage(mensajeUsuario);
    const response = result.response;

    // Verificar si Gemini quiere ejecutar una función
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      console.log('🎯 Gemini solicita ejecutar funciones:', functionCalls.length);

      // Ejecutar todas las funciones solicitadas
      const resultadosFunciones = [];

      for (const fc of functionCalls) {
        const nombreFuncion = fc.name;
        const argumentos = fc.args;

        console.log(`   → Ejecutando: ${nombreFuncion}`, argumentos);

        const resultado = await ejecutarFuncion(nombreFuncion, argumentos, user, userData);

        resultadosFunciones.push({
          functionResponse: {
            name: nombreFuncion,
            response: resultado
          }
        });

        console.log(`   ✅ Resultado:`, resultado.exito ? 'Éxito' : 'Error');
      }

      // Enviar resultados a Gemini para que genere respuesta final
      const result2 = await chat.sendMessage(resultadosFunciones);
      const respuestaFinal = result2.response.text();

      // Determinar tipo de respuesta según resultado
      const algunaExitosa = functionCalls.some((fc, i) =>
        resultadosFunciones[i].functionResponse.response.exito
      );

      return {
        texto: respuestaFinal,
        tipo: algunaExitosa ? 'success' : 'error',
        usandoIA: true,
        funcionesEjecutadas: functionCalls.map(fc => fc.name),
        metadata: {
          modelo: GEMINI_MODEL,
          funciones: functionCalls.length,
          gratuito: true
        }
      };
    }

    // Respuesta normal (sin function calls)
    const textoRespuesta = response.text();

    return {
      texto: textoRespuesta,
      tipo: 'info',
      usandoIA: true,
      metadata: {
        modelo: GEMINI_MODEL,
        gratuito: true
      }
    };

  } catch (error) {
    console.error('❌ Error al consultar Gemini:', error);

    // Manejar errores específicos
    if (error.message?.includes('API_KEY_INVALID')) {
      return {
        texto: '❌ **API Key Inválida**\n\nLa API Key de Gemini no es válida. Verifica tu configuración en `.env`.',
        tipo: 'error',
        usandoIA: false
      };
    }

    if (error.message?.includes('QUOTA_EXCEEDED')) {
      return {
        texto: '⚠️ **Límite Diario Alcanzado**\n\nSe alcanzó el límite de 1,500 requests/día de Gemini. Intenta mañana o crea otra API Key.',
        tipo: 'warning',
        usandoIA: false
      };
    }

    return {
      texto: '❌ **Error al procesar tu mensaje**\n\n' +
             'Hubo un problema al conectar con Gemini AI. ' +
             'Por favor intenta nuevamente.\n\n' +
             `Detalle: ${error.message}`,
      tipo: 'error',
      usandoIA: false,
      errorDetalle: error.message
    };
  }
}

export { obtenerContextoSistema };
