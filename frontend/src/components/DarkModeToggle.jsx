/**
 * Componente DarkModeToggle - Selector de tema con auto mode
 * Muestra opción de seguir preferencia del sistema
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

function DarkModeToggle() {
  const { isDarkMode, themeMode, setTheme } = useTheme();
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú al clickear afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMostrarMenu(false);
      }
    };

    if (mostrarMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mostrarMenu]);

  const opciones = [
    {
      id: 'auto',
      label: 'Auto',
      icon: 'brightness_auto',
      descripcion: 'Seguir preferencia del sistema'
    },
    {
      id: 'light',
      label: 'Claro',
      icon: 'light_mode',
      descripcion: 'Siempre usar modo claro'
    },
    {
      id: 'dark',
      label: 'Oscuro',
      icon: 'dark_mode',
      descripcion: 'Siempre usar modo oscuro'
    }
  ];

  const opcionActual = opciones.find(o => o.id === themeMode);

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón principal */}
      <button
        onClick={() => setMostrarMenu(!mostrarMenu)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        title={`Tema: ${opcionActual?.label} (${opcionActual?.descripcion})`}
      >
        <span className="material-symbols-outlined text-2xl">
          {opcionActual?.icon || 'brightness_auto'}
        </span>
        {mostrarMenu && (
          <span className="absolute inset-0 rounded-lg bg-blue-500/20 animate-pulse pointer-events-none"></span>
        )}
      </button>

      {/* Menú desplegable */}
      {mostrarMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Preferencia de Tema
            </h3>
          </div>

          {/* Opciones */}
          <div className="py-1">
            {opciones.map((opcion) => (
              <button
                key={opcion.id}
                onClick={() => {
                  setTheme(opcion.id);
                  setMostrarMenu(false);
                }}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors duration-150 ${
                  themeMode === opcion.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {opcion.icon}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{opcion.label}</p>
                  <p className={`text-xs ${
                    themeMode === opcion.id
                      ? 'text-blue-600 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {opcion.descripcion}
                  </p>
                </div>

                {/* Checkmark para opción activa */}
                {themeMode === opcion.id && (
                  <span className="material-symbols-outlined text-lg text-blue-600 dark:text-blue-400">
                    check
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Footer con info */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tema actual: <span className="font-medium">{isDarkMode ? 'Oscuro' : 'Claro'}</span>
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export default DarkModeToggle;
