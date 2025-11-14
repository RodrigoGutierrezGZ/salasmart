/**
 * ToastContainer - Contenedor de notificaciones toast con botones de cierre
 */

import React, { useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

function Toast({ id, message, type, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Duración de la animación
  };

  // Configuración según tipo
  const typeConfig = {
    success: {
      icon: 'check_circle',
      bgColor: 'bg-success',
      borderColor: 'border-success',
      textColor: 'text-white',
      iconBg: 'bg-white/20'
    },
    error: {
      icon: 'error',
      bgColor: 'bg-danger',
      borderColor: 'border-danger',
      textColor: 'text-white',
      iconBg: 'bg-white/20'
    },
    warning: {
      icon: 'warning',
      bgColor: 'bg-warning',
      borderColor: 'border-warning',
      textColor: 'text-neutral-dark',
      iconBg: 'bg-neutral-dark/10'
    },
    info: {
      icon: 'info',
      bgColor: 'bg-primary',
      borderColor: 'border-primary',
      textColor: 'text-white',
      iconBg: 'bg-white/20'
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border-2 ${config.borderColor} ${config.bgColor} ${config.textColor} px-4 py-3 shadow-lg transition-all duration-300 min-w-[320px] max-w-md ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
      style={{ animation: isExiting ? 'slideOut 0.3s ease-out' : 'slideIn 0.3s ease-out' }}
    >
      {/* Icono */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}>
        <span className={`material-symbols-outlined text-xl ${config.textColor}`}>
          {config.icon}
        </span>
      </div>

      {/* Mensaje */}
      <div className="flex-1 pt-0.5">
        <p className={`text-sm font-medium leading-relaxed ${config.textColor}`}>
          {message}
        </p>
      </div>

      {/* Botón cerrar */}
      <button
        onClick={handleClose}
        className={`shrink-0 rounded-full p-1 transition-all hover:bg-white/20 ${config.textColor}/80 hover:${config.textColor}`}
        aria-label="Cerrar notificación"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
          />
        </div>
      ))}

      {/* Animaciones CSS personalizadas */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
