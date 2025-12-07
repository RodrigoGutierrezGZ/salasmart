// src/components/admin/DashboardTab.jsx

import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import StatsCard from '../../shared/StatsCard';
import ActividadReciente from '../../dashboard/ActividadReciente';

/**
 * Tab de Dashboard con estadísticas y gráficos
 */
function DashboardTab({ stats, chartDataBar, chartDataDoughnut }) {
  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6 md:space-y-8">
      {/* Stats Cards - Mobile optimized */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-4">
        <StatsCard
          icon="inventory_2"
          iconColor="text-secondary"
          label="Total Salas"
          value={stats.totalSalas}
        />
        <StatsCard
          icon="check_circle"
          iconColor="text-success"
          label="Salas Disponibles"
          value={stats.salasDisponibles}
        />
        <StatsCard
          icon="group"
          iconColor="text-primary"
          label="Total Usuarios"
          value={stats.totalUsuarios}
        />
        <StatsCard
          icon="event_available"
          iconColor="text-warning"
          label="Reservas Activas"
          value={stats.reservasActivas}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark p-3 sm:p-4 md:p-6 shadow-soft overflow-hidden">
          <h3 className="mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base md:text-lg font-bold text-neutral-dark dark:text-text-dark-primary truncate">
            <span className="material-symbols-outlined text-primary flex-shrink-0">bar_chart</span>
            <span className="truncate">Reservas por Día</span>
          </h3>
          <div className="h-40 sm:h-52 md:h-64 w-full overflow-x-auto">
            <Bar data={chartDataBar} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark p-3 sm:p-4 md:p-6 shadow-soft overflow-hidden">
          <h3 className="mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base md:text-lg font-bold text-neutral-dark dark:text-text-dark-primary truncate">
            <span className="material-symbols-outlined text-primary flex-shrink-0">pie_chart</span>
            <span className="truncate">Disponibilidad</span>
          </h3>
          <div className="h-40 sm:h-52 md:h-64 flex items-center justify-center w-full overflow-hidden">
            <Doughnut data={chartDataDoughnut} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 shadow-soft overflow-hidden">
        <ActividadReciente limite={15} />
      </div>
    </div>
  );
}

export default DashboardTab;
