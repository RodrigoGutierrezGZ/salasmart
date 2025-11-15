// ============================================================================
// COMPONENTE: NotificacionesPanel
// ============================================================================
// Panel dropdown de notificaciones en tiempo real para Navbar
// Uso: <NotificacionesPanel usuarioId={currentUser.uid} />
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import NotificacionItem from './NotificacionItem';

const NotificacionesPanel = ({ usuarioId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  const {
    notificaciones,
    noLeidas,
    loading,
    marcarLeida,
    eliminar,
    marcarTodasLeidas
  } = useNotificaciones(usuarioId);

  // ============================================================================
  // CERRAR AL HACER CLICK FUERA
  // ============================================================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const handleMarcarTodasLeidas = async () => {
    await marcarTodasLeidas();
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="relative" ref={panelRef}>
      {/* Botón de notificaciones */}
      <button
        onClick={togglePanel}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notificaciones"
      >
        <span className="material-symbols-outlined text-[24px]">
          notifications
        </span>

        {/* Badge de notificaciones no leídas */}
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Notificaciones
                {noLeidas > 0 && (
                  <span className="ml-2 text-sm font-normal text-blue-600">
                    ({noLeidas} {noLeidas === 1 ? 'nueva' : 'nuevas'})
                  </span>
                )}
              </h3>

              {/* Botón marcar todas como leídas */}
              {noLeidas > 0 && (
                <button
                  onClick={handleMarcarTodasLeidas}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Marcar todas
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              // Loading skeleton
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-sm text-gray-500">Cargando notificaciones...</p>
              </div>
            ) : notificaciones.length === 0 ? (
              // Estado vacío
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px] text-gray-400">
                    notifications_off
                  </span>
                </div>
                <h4 className="font-semibold text-gray-700 mb-1">
                  No hay notificaciones
                </h4>
                <p className="text-sm text-gray-500">
                  Te avisaremos cuando haya algo nuevo
                </p>
              </div>
            ) : (
              // Lista de notificaciones
              <div className="divide-y divide-gray-100">
                {notificaciones.map((notificacion) => (
                  <div key={notificacion.id} className="group">
                    <NotificacionItem
                      notificacion={notificacion}
                      onMarcarLeida={marcarLeida}
                      onEliminar={eliminar}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificaciones.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificacionesPanel;
