// ============================================================================
// HOOK PERSONALIZADO - useNotificaciones
// ============================================================================
// Hook para gestionar notificaciones de un usuario en tiempo real
// Uso: const { notificaciones, noLeidas, marcarLeida, eliminar, marcarTodasLeidas } = useNotificaciones(userId)
// ============================================================================

import { useState, useEffect } from 'react';
import {
  escucharNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  contarNoLeidas
} from '../services/notificacionesService';

/**
 * Hook para gestionar notificaciones en tiempo real
 * @param {string} usuarioId - ID del usuario autenticado
 * @returns {object} { notificaciones, noLeidas, loading, marcarLeida, eliminar, marcarTodasLeidas }
 */
export const useNotificaciones = (usuarioId) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // EFECTO: Suscripción en tiempo real
  // ============================================================================
  useEffect(() => {
    if (!usuarioId) {
      setNotificaciones([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Suscribirse a cambios en tiempo real
    const unsubscribe = escucharNotificaciones(usuarioId, (nuevasNotificaciones) => {
      setNotificaciones(nuevasNotificaciones);
      setLoading(false);
    });

    // Cleanup: cancelar suscripción al desmontar
    return () => unsubscribe();
  }, [usuarioId]);

  // ============================================================================
  // FUNCIONES
  // ============================================================================

  /**
   * Marca una notificación como leída
   */
  const marcarLeida = async (notificacionId) => {
    try {
      await marcarComoLeida(notificacionId);
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  /**
   * Marca todas las notificaciones como leídas
   */
  const marcarTodasLeidas = async () => {
    try {
      await marcarTodasComoLeidas(usuarioId);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  /**
   * Elimina una notificación
   */
  const eliminar = async (notificacionId) => {
    try {
      await eliminarNotificacion(notificacionId);
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  // ============================================================================
  // VALORES CALCULADOS
  // ============================================================================

  const noLeidas = contarNoLeidas(notificaciones);

  return {
    notificaciones,
    noLeidas,
    loading,
    marcarLeida,
    eliminar,
    marcarTodasLeidas
  };
};
