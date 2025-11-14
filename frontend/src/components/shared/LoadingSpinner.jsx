// src/components/shared/LoadingSpinner.jsx

import React from 'react';

/**
 * Componente de loading spinner reutilizable
 *
 * @param {Object} props
 * @param {string} props.message - Mensaje a mostrar debajo del spinner
 * @param {string} props.size - Tamaño del spinner: 'sm' | 'md' | 'lg'
 */
function LoadingSpinner({ message = 'Cargando...', size = 'md' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-primary mx-auto ${sizeClasses[size]}`}></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
