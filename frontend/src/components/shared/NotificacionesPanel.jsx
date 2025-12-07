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
  const togglePanel = async () => {
    const nuevoEstado = !isOpen;
    setIsOpen(nuevoEstado);

    // Si se está abriendo el panel y hay notificaciones no leídas, marcarlas
    if (nuevoEstado && noLeidas > 0) {
      // Pequeño delay para que el usuario vea las notificaciones antes de marcarlas
      setTimeout(async () => {
        await marcarTodasLeidas();
      }, 300);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    await marcarTodasLeidas();
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="relative z-50" ref={panelRef}>
      {/* Botón de notificaciones */}
      <button
        onClick={togglePanel}
        className={`relative p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
          noLeidas > 0
            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            : 'text-gray-600 dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-card-bg-dark-hover'
        }`}
        title="Notificaciones"
        disabled={loading}
      >
        <span className={`material-symbols-outlined text-base sm:text-lg md:text-xl ${noLeidas > 0 ? 'font-bold' : ''}`}>
          notifications
        </span>

        {/* Badge de notificaciones no leídas */}
        {!loading && noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}

        {/* Indicador de carga inicial */}
        {loading && (
          <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Panel dropdown - Fixed positioning on mobile */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-[calc(100vw-16px)] sm:w-96 max-h-[70vh] sm:max-h-full bg-white dark:bg-card-bg-dark rounded-lg shadow-xl border border-neutral-light dark:border-border-dark z-[100] overflow-hidden">
          {/* Header */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-neutral-light dark:border-border-dark bg-neutral-light dark:bg-neutral-dark">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-xs sm:text-sm text-neutral-dark dark:text-text-dark-primary truncate">
                Notificaciones
                {noLeidas > 0 && (
                  <span className="ml-1 text-xs font-normal text-primary">
                    ({noLeidas} {noLeidas === 1 ? 'nueva' : 'nuevas'})
                  </span>
                )}
              </h3>

              {/* Botón marcar todas como leídas */}
              {noLeidas > 0 && (
                <button
                  onClick={handleMarcarTodasLeidas}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex-shrink-0 whitespace-nowrap"
                >
                  Marcar
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-[calc(70vh-120px)] sm:max-h-[500px] overflow-y-auto">
            {loading ? (
              // Loading skeleton
              <div className="p-3 sm:p-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="mb-2 sm:mb-3 animate-pulse">
                    <div className="flex gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-neutral-dark rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-3 sm:h-4 bg-gray-200 dark:bg-neutral-dark rounded w-3/4 mb-2"></div>
                        <div className="h-2 sm:h-3 bg-gray-200 dark:bg-neutral-dark rounded w-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notificaciones.length === 0 ? (
              // Estado vacío
              <div className="p-4 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 rounded-full bg-gray-100 dark:bg-neutral-dark flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl sm:text-3xl text-gray-400 dark:text-text-dark-secondary">
                    notifications_off
                  </span>
                </div>
                <h4 className="font-semibold text-xs sm:text-sm text-gray-700 dark:text-text-dark-primary mb-1">
                  Sin notificaciones
                </h4>
                <p className="text-xs text-gray-500 dark:text-text-dark-secondary">
                  Te avisaremos pronto
                </p>
              </div>
            ) : (
              // Lista de notificaciones
              <div className="divide-y divide-neutral-light dark:divide-border-dark">
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
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-neutral-light dark:border-border-dark bg-neutral-light dark:bg-neutral-dark text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs sm:text-sm text-gray-600 dark:text-text-dark-secondary hover:text-gray-800 dark:hover:text-text-dark-primary font-medium"
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
