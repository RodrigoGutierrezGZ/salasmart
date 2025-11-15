// ============================================================================
// COMPONENTE: NotificacionItem
// ============================================================================
// Representa una notificación individual en el panel
// Props: { notificacion, onMarcarLeida, onEliminar }
// ============================================================================

import React from 'react';
import { getIconoNotificacion, getColorNotificacion } from '../../services/notificacionesService';

const NotificacionItem = ({ notificacion, onMarcarLeida, onEliminar }) => {
  const { id, tipo, titulo, mensaje, leida, timestamp } = notificacion;

  // ============================================================================
  // CALCULAR TIEMPO RELATIVO
  // ============================================================================
  const getTiempoRelativo = (timestamp) => {
    if (!timestamp) return '';

    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // ============================================================================
  // COLORES POR TIPO
  // ============================================================================
  const colorConfig = {
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      icon: 'text-green-600'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      icon: 'text-red-600'
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      icon: 'text-blue-600'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      icon: 'text-purple-600'
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      icon: 'text-orange-600'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      icon: 'text-yellow-600'
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      icon: 'text-gray-600'
    }
  };

  const color = getColorNotificacion(tipo);
  const config = colorConfig[color] || colorConfig.gray;
  const icono = getIconoNotificacion(tipo);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleClick = () => {
    if (!leida) {
      onMarcarLeida(id);
    }
  };

  const handleEliminar = (e) => {
    e.stopPropagation(); // Evitar que se dispare el click del contenedor
    onEliminar(id);
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div
      onClick={handleClick}
      className={`
        px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors
        border-b border-gray-100 last:border-b-0
        ${!leida ? 'bg-blue-50/50' : ''}
      `}
    >
      <div className="flex gap-3">
        {/* Icono */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined text-[20px] ${config.icon}`}>
            {icono}
          </span>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Título y tiempo */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${!leida ? 'text-gray-900' : 'text-gray-700'}`}>
              {titulo}
            </h4>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {getTiempoRelativo(timestamp)}
            </span>
          </div>

          {/* Mensaje */}
          <p className={`text-sm ${!leida ? 'text-gray-700' : 'text-gray-500'} line-clamp-2`}>
            {mensaje}
          </p>

          {/* Badge "Nueva" */}
          {!leida && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded">
              Nueva
            </span>
          )}
        </div>

        {/* Botón eliminar */}
        <button
          onClick={handleEliminar}
          className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          title="Eliminar"
        >
          <span className="material-symbols-outlined text-[18px] text-gray-500">
            close
          </span>
        </button>
      </div>
    </div>
  );
};

export default NotificacionItem;
