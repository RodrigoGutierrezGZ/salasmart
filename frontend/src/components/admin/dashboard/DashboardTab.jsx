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
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-dark dark:text-text-dark-primary">
            <span className="material-symbols-outlined text-primary">bar_chart</span>
            Reservas por Día (Última Semana)
          </h3>
          <div className="h-64">
            <Bar data={chartDataBar} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-dark dark:text-text-dark-primary">
            <span className="material-symbols-outlined text-primary">pie_chart</span>
            Disponibilidad de Salas
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={chartDataDoughnut} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark px-6 py-5 shadow-soft">
        <ActividadReciente limite={15} />
      </div>
    </div>
  );
}

export default DashboardTab;
