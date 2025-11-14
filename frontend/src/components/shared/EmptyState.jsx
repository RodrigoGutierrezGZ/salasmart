// src/components/shared/EmptyState.jsx

import React from 'react';

/**
 * Componente para mostrar estado vacío
 *
 * @param {Object} props
 * @param {string} props.icon - Nombre del ícono Material Symbols
 * @param {string} props.title - Título del mensaje
 * @param {string} props.message - Mensaje descriptivo
 */
function EmptyState({ icon = 'inbox', title = 'No hay datos', message = 'No se encontraron resultados' }) {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-gray-300">{icon}</span>
        <h3 className="mt-4 text-lg font-semibold text-gray-700">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}

export default EmptyState;
