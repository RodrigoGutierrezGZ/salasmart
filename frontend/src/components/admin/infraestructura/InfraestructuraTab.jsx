// src/components/admin/InfraestructuraTab.jsx

import React from 'react';
import GestionSedes from './GestionSedes';
import GestionEdificios from './GestionEdificios';

/**
 * Tab de Infraestructura con sub-tabs de Sedes y Edificios
 */
function InfraestructuraTab({ infraSubTab, setInfraSubTab }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Sub-tabs para Infraestructura */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setInfraSubTab('sedes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            infraSubTab === 'sedes'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 border border-neutral-light hover:bg-neutral-light'
          }`}
        >
          <span className="material-symbols-outlined">location_city</span>
          Sedes
        </button>
        <button
          onClick={() => setInfraSubTab('edificios')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            infraSubTab === 'edificios'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 border border-neutral-light hover:bg-neutral-light'
          }`}
        >
          <span className="material-symbols-outlined">domain</span>
          Edificios y Pisos
        </button>
      </div>

      {/* Contenido de cada sub-tab */}
      {infraSubTab === 'sedes' && <GestionSedes />}
      {infraSubTab === 'edificios' && <GestionEdificios />}
    </div>
  );
}

export default InfraestructuraTab;
