/**
 * ConfirmDialog - Modal de confirmación moderno
 */

import React from 'react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info' // 'info', 'warning', 'danger', 'success'
}) {
  if (!isOpen) return null;

  // Configuración de colores según tipo
  const typeConfig = {
    info: {
      icon: 'info',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-primary hover:bg-primary-dark',
      buttonText: 'text-white'
    },
    warning: {
      icon: 'warning',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      buttonBg: 'bg-warning hover:bg-yellow-600',
      buttonText: 'text-neutral-dark'
    },
    danger: {
      icon: 'error',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-danger hover:bg-red-700',
      buttonText: 'text-white'
    },
    success: {
      icon: 'check_circle',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-success hover:bg-green-700',
      buttonText: 'text-white'
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con icono */}
          <div className="flex flex-col items-center pt-8 pb-4 px-6">
            <div className={`${config.iconBg} rounded-full p-4 mb-4`}>
              <span className={`material-symbols-outlined text-4xl ${config.iconColor}`}>
                {config.icon}
              </span>
            </div>
            <h3 className="text-xl font-bold text-neutral-dark text-center">
              {title}
            </h3>
          </div>

          {/* Mensaje */}
          <div className="px-6 pb-6">
            <p className="text-neutral-medium text-center leading-relaxed">
              {message}
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-neutral-light text-neutral-dark font-semibold hover:bg-neutral-light/50 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${config.buttonBg} ${config.buttonText} shadow-md hover:shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      {/* Animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </>
  );
}
