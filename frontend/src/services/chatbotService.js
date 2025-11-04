/**
 * Servicio del Chatbot - 100% IA con Gemini
 * Sin comandos locales - Todo manejado por inteligencia artificial
 */

import { consultarGemini } from './geminiService';

/**
 * Procesa un mensaje del usuario usando 100% Gemini AI
 * @param {string} mensaje - Mensaje del usuario
 * @param {Object} user - Usuario autenticado
 * @param {Object} userData - Datos del usuario (nombre, rol)
 * @param {Array} historial - Historial de conversación (opcional)
 * @returns {Promise<Object>} - { texto, tipo, usandoIA, metadata }
 */
export async function procesarMensaje(mensaje, user, userData, historial = []) {
  if (!mensaje || !user) {
    return {
      texto: 'Error: Usuario no autenticado',
      tipo: 'error'
    };
  }

  console.log('💬 Procesando mensaje con Gemini AI:', mensaje);

  try {
    // Delegar TODO a Gemini (sin comandos locales)
    const respuesta = await consultarGemini(mensaje, user, userData, historial);

    return respuesta;

  } catch (error) {
    console.error('❌ Error al procesar mensaje:', error);
    return {
      texto: '❌ **Error al procesar tu mensaje**\n\n' +
             'Hubo un problema al procesar tu solicitud. Por favor intenta nuevamente.',
      tipo: 'error',
      errorDetalle: error.message
    };
  }
}

/**
 * NOTA: Sistema híbrido eliminado
 *
 * Anteriormente teníamos comandos locales (ayuda, salas disponibles, etc.)
 * que se procesaban sin IA para ahorrar costos.
 *
 * Ahora TODO es manejado por Gemini AI que:
 * - Es GRATIS (1,500 requests/día)
 * - Entiende contexto conversacional
 * - Ejecuta funciones reales (crear reservas, buscar salas, etc.)
 * - Responde de forma natural y proactiva
 *
 * Ventajas del nuevo sistema:
 * ✅ Conversaciones más naturales
 * ✅ No hay conflicto entre comandos locales y IA
 * ✅ Gemini decide cuándo ejecutar funciones
 * ✅ Respuestas contextuales y personalizadas
 * ✅ Gratis (vs GPT que costaba $1-3/mes)
 */
