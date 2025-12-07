// src/components/shared/StatsCard.jsx

import React from 'react';

/**
 * Componente reutilizable para tarjetas de estadísticas
 *
 * @param {Object} props
 * @param {string} props.icon - Nombre del ícono Material Symbols
 * @param {string} props.iconColor - Color del ícono (text-primary, text-success, etc.)
 * @param {string} props.label - Etiqueta descriptiva
 * @param {string|number} props.value - Valor a mostrar
 */
function StatsCard({ icon, iconColor, label, value }) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4 rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark p-3 sm:p-4 lg:p-6 shadow-soft overflow-hidden">
      <span className={`material-symbols-outlined text-2xl sm:text-3xl lg:text-4xl ${iconColor} flex-shrink-0`}>{icon}</span>
      <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-text-dark-secondary truncate">{label}</p>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-dark dark:text-text-dark-primary break-words">{value}</p>
    </div>
  );
}

export default StatsCard;
