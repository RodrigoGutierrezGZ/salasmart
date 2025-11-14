/**
 * Componente ChatBot - Widget de chat inteligente con comandos
 */

import React, { useState, useEffect, useRef } from 'react';
import { procesarMensaje } from '../services/chatbotService';
import { useAuth } from '../hooks/useAuth';

function ChatBot() {
  const { user, userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [conversacion, setConversacion] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll automático al último mensaje
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversacion]);

  // Enfocar el input cuando se abre el chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Generar saludo de bienvenida al abrir el chat
  useEffect(() => {
    if (isOpen && conversacion.length === 0 && userData && user) {
      // Enviar mensaje automático "hola" para que Claude genere el saludo
      handleSaludoInicial();
    }
  }, [isOpen, userData, user]);

  const handleSaludoInicial = async () => {
    if (enviando) return;

    setEnviando(true);
    try {
      // Enviar "hola" invisible al chat para que Claude responda con el saludo personalizado
      const respuesta = await procesarMensaje('hola', user, userData, []);

      const nuevoMensajeBot = {
        id: Date.now(),
        tipo: 'bot',
        texto: respuesta.texto,
        tipoMensaje: respuesta.tipo || 'info',
        timestamp: new Date()
      };

      setConversacion([nuevoMensajeBot]);
    } catch (error) {
      console.error('Error al generar saludo inicial:', error);
      // Fallback: mostrar saludo genérico
      setConversacion([
        {
          id: Date.now(),
          tipo: 'bot',
          texto: `¡Hola! 👋\n\nSoy el asistente virtual de SalaSmart. ¿En qué puedo ayudarte?`,
          tipoMensaje: 'info',
          timestamp: new Date()
        }
      ]);
    } finally {
      setEnviando(false);
    }
  };

  const handleEnviar = async (e) => {
    e.preventDefault();

    if (!mensaje.trim() || enviando) return;

    const mensajeUsuario = mensaje.trim();
    const nuevoMensajeUsuario = {
      id: Date.now(),
      tipo: 'usuario',
      texto: mensajeUsuario,
      timestamp: new Date()
    };

    // Agregar mensaje del usuario
    setConversacion(prev => [...prev, nuevoMensajeUsuario]);
    setMensaje('');
    setEnviando(true);

    // Simular delay para mejor UX
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // Construir historial para Claude (formato requerido por la API)
      const historialClaude = conversacion.map(msg => ({
        role: msg.tipo === 'usuario' ? 'user' : 'assistant',
        content: msg.texto
      }));

      // Procesar mensaje con Claude AI
      const respuesta = await procesarMensaje(mensajeUsuario, user, userData, historialClaude);

      const nuevoMensajeBot = {
        id: Date.now() + 1,
        tipo: 'bot',
        texto: respuesta.texto,
        tipoMensaje: respuesta.tipo,
        datos: respuesta.datos,
        timestamp: new Date()
      };

      setConversacion(prev => [...prev, nuevoMensajeBot]);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);

      const mensajeError = {
        id: Date.now() + 1,
        tipo: 'bot',
        texto: '❌ Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta nuevamente.',
        tipoMensaje: 'error',
        timestamp: new Date()
      };

      setConversacion(prev => [...prev, mensajeError]);
    } finally {
      setEnviando(false);
      // Mantener el foco en el input después de recibir respuesta
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleLimpiarChat = () => {
    setConversacion([]);
  };

  const sugerencias = [
    { texto: 'Salas disponibles', icono: 'meeting_room' },
    { texto: 'Mis reservas', icono: 'event' },
    { texto: 'Ayuda', icono: 'help' },
  ];

  const handleSugerencia = async (texto) => {
    // Establecer el mensaje y enviarlo automáticamente
    setMensaje(texto);

    // Simular el evento de envío
    const mensajeUsuario = texto.trim();
    if (!mensajeUsuario || enviando) return;

    const nuevoMensajeUsuario = {
      id: Date.now(),
      tipo: 'usuario',
      texto: mensajeUsuario,
      timestamp: new Date()
    };

    // Agregar mensaje del usuario
    setConversacion(prev => [...prev, nuevoMensajeUsuario]);
    setMensaje('');
    setEnviando(true);

    // Simular delay para mejor UX
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // Construir historial para Claude
      const historialClaude = conversacion.map(msg => ({
        role: msg.tipo === 'usuario' ? 'user' : 'assistant',
        content: msg.texto
      }));

      // Procesar mensaje con Claude AI
      const respuesta = await procesarMensaje(mensajeUsuario, user, userData, historialClaude);

      const nuevoMensajeBot = {
        id: Date.now() + 1,
        tipo: 'bot',
        texto: respuesta.texto,
        tipoMensaje: respuesta.tipo,
        datos: respuesta.datos,
        timestamp: new Date()
      };

      setConversacion(prev => [...prev, nuevoMensajeBot]);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);

      const mensajeError = {
        id: Date.now() + 1,
        tipo: 'bot',
        texto: '❌ Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta nuevamente.',
        tipoMensaje: 'error',
        timestamp: new Date()
      };

      setConversacion(prev => [...prev, mensajeError]);
    } finally {
      setEnviando(false);
      // Mantener el foco en el input después de recibir respuesta
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  return (
    <>
      {/* Botón flotante para abrir/cerrar chat */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-danger hover:bg-danger/90 rotate-0'
            : 'bg-primary hover:bg-primary/90 hover:scale-110'
        }`}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        <span className="material-symbols-outlined text-3xl text-white">
          {isOpen ? 'close' : 'chat'}
        </span>
        {/* Badge de notificación (opcional) */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-xs font-bold text-white">
            !
          </span>
        )}
      </button>

      {/* Ventana del chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <span className="material-symbols-outlined text-2xl text-white">smart_toy</span>
              </div>
              <div>
                <h3 className="font-bold text-white">Asistente SalaSmart</h3>
                <p className="text-xs text-white/80">En línea</p>
              </div>
            </div>
            <button
              onClick={handleLimpiarChat}
              className="rounded-full p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white"
              title="Limpiar conversación"
            >
              <span className="material-symbols-outlined text-xl">delete_sweep</span>
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto bg-background-light p-4 space-y-4">
            {conversacion.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.tipo === 'usuario'
                      ? 'bg-primary text-white'
                      : msg.tipoMensaje === 'error'
                      ? 'bg-danger/10 text-danger border border-danger/20'
                      : msg.tipoMensaje === 'warning'
                      ? 'bg-warning/10 text-warning border border-warning/20'
                      : msg.tipoMensaje === 'success'
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-white text-gray-800 border border-neutral-light'
                  }`}
                >
                  {/* Icono para mensajes del bot */}
                  {msg.tipo === 'bot' && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">
                        {msg.tipoMensaje === 'error' ? 'error' :
                         msg.tipoMensaje === 'warning' ? 'warning' :
                         msg.tipoMensaje === 'success' ? 'check_circle' :
                         'info'}
                      </span>
                      <span className="text-xs font-semibold opacity-70">Asistente</span>
                    </div>
                  )}

                  {/* Texto del mensaje (con soporte para Markdown simple) */}
                  <div className="text-sm whitespace-pre-wrap" style={{ lineHeight: '1.6' }}>
                    {msg.texto.split('\n').map((linea, i) => {
                      // Soporte para **negrita**
                      const conNegrita = linea.split(/(\*\*.*?\*\*)/g).map((parte, j) => {
                        if (parte.startsWith('**') && parte.endsWith('**')) {
                          return <strong key={j}>{parte.slice(2, -2)}</strong>;
                        }
                        // Soporte para `código`
                        return parte.split(/(`.*?`)/g).map((subparte, k) => {
                          if (subparte.startsWith('`') && subparte.endsWith('`')) {
                            return (
                              <code
                                key={k}
                                className="rounded bg-black/10 px-1.5 py-0.5 text-xs font-mono"
                              >
                                {subparte.slice(1, -1)}
                              </code>
                            );
                          }
                          return subparte;
                        });
                      });

                      return (
                        <span key={i}>
                          {conNegrita}
                          {i < msg.texto.split('\n').length - 1 && <br />}
                        </span>
                      );
                    })}
                  </div>

                  {/* Timestamp */}
                  <p className={`mt-2 text-xs opacity-60 ${
                    msg.tipo === 'usuario' ? 'text-right' : 'text-left'
                  }`}>
                    {msg.timestamp.toLocaleTimeString('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Indicador de "escribiendo..." */}
            {enviando && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 shadow-sm border border-neutral-light">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">Escribiendo...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Referencia para scroll */}
            <div ref={chatEndRef} />
          </div>

          {/* Sugerencias rápidas */}
          {conversacion.length <= 1 && !enviando && (
            <div className="border-t border-neutral-light bg-white px-4 py-3">
              <p className="mb-2 text-xs font-semibold text-gray-500">Sugerencias rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {sugerencias.map((sug, index) => (
                  <button
                    key={index}
                    onClick={() => handleSugerencia(sug.texto)}
                    className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/10 hover:border-primary/50"
                  >
                    <span className="material-symbols-outlined text-sm">{sug.icono}</span>
                    {sug.texto}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input de mensaje */}
          <form onSubmit={handleEnviar} className="border-t border-neutral-light bg-white p-4">
            <div className="flex items-end gap-2">
              <input
                ref={inputRef}
                type="text"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribe tu mensaje..."
                disabled={enviando}
                className="flex-1 rounded-lg border border-neutral-light px-4 py-3 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!mensaje.trim() || enviando}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary disabled:hover:shadow-md"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default ChatBot;
