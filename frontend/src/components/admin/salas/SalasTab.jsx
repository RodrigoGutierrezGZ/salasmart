// src/components/admin/SalasTab.jsx

import React from 'react';
import EditorPlanos from '../../planos/EditorPlanos';
import EditarSalaModal from './EditarSalaModal';

/**
 * Tab de Salas con sub-tabs: Lista de Salas y Editor de Planos
 */
function SalasTab({
  // Sub-tab state
  salasSubTab,
  setSalasSubTab,

  // Filtros state
  filtroSede,
  filtroEdificio,
  filtroPiso,
  setFiltroPiso,
  sedesFiltro,
  edificiosFiltro,
  pisosFiltro,
  handleFiltroSedeChange,
  handleFiltroEdificioChange,
  limpiarFiltrosLista,

  // Salas data
  salas,

  // Modal state
  salaEditando,
  setSalaEditando,

  // Functions
  handleDeleteSala,
  handleDeleteAllSalas,
  handleActualizarSala
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Sub-tabs para Salas */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSalasSubTab('lista')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            salasSubTab === 'lista'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 border border-neutral-light hover:bg-neutral-light'
          }`}
        >
          <span className="material-symbols-outlined">list</span>
          Lista de Salas
        </button>
        <button
          onClick={() => setSalasSubTab('planos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            salasSubTab === 'planos'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 border border-neutral-light hover:bg-neutral-light'
          }`}
        >
          <span className="material-symbols-outlined">map</span>
          Editor de Planos
        </button>
      </div>

      {/* Sub-tab: Lista de Salas */}
      {salasSubTab === 'lista' && (
        <>
          {/* Mensaje informativo */}
          <div className="rounded-xl border-2 border-blue-300 bg-blue-100 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500">
                <span className="material-symbols-outlined text-white text-2xl">info</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-blue-900 mb-2">
                  📋 Lista de Salas
                </h3>
                <p className="text-sm leading-relaxed text-blue-800">
                  Aquí puedes ver todas las salas y <strong className="font-semibold">editar sus datos</strong> (capacidad, equipamiento, etc.).
                  Para <strong className="font-semibold">cambiar la ubicación</strong> o <strong>crear nuevas salas</strong>, usa el <strong className="font-semibold">Editor de Planos</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Filtros Jerárquicos */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="mb-3 font-semibold text-neutral-dark flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">filter_list</span>
              Filtros Jerárquicos
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {/* Filtro Sede */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Filtrar por Sede
                </label>
                <select
                  value={filtroSede}
                  onChange={(e) => handleFiltroSedeChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Todas las sedes</option>
                  {sedesFiltro.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      {sede.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Edificio */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Filtrar por Edificio
                </label>
                <select
                  value={filtroEdificio}
                  onChange={(e) => handleFiltroEdificioChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={!filtroSede}
                >
                  <option value="">
                    {filtroSede ? 'Todos los edificios' : 'Primero selecciona una sede'}
                  </option>
                  {edificiosFiltro.map((edificio) => (
                    <option key={edificio.id} value={edificio.id}>
                      {edificio.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Piso */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Filtrar por Piso
                </label>
                <select
                  value={filtroPiso}
                  onChange={(e) => setFiltroPiso(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={!filtroEdificio}
                >
                  <option value="">
                    {filtroEdificio ? 'Todos los pisos' : 'Primero selecciona un edificio'}
                  </option>
                  {pisosFiltro.map((piso) => (
                    <option key={piso.id} value={piso.id}>
                      Piso {piso.numero} - {piso.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botón limpiar filtros */}
            {(filtroSede || filtroEdificio || filtroPiso) && (
              <div className="mt-4 text-center">
                <button
                  onClick={limpiarFiltrosLista}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-200"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* Lista de Salas */}
          <div className="rounded-lg border border-neutral-light bg-white shadow-soft">
            <div className="border-b border-neutral-light px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-dark">
                Lista de Salas ({(() => {
                  // Aplicar filtros
                  let filtradas = salas;
                  if (filtroSede) filtradas = filtradas.filter(s => s.sedeId === filtroSede);
                  if (filtroEdificio) filtradas = filtradas.filter(s => s.edificioId === filtroEdificio);
                  if (filtroPiso) filtradas = filtradas.filter(s => s.pisoId === filtroPiso);
                  return filtradas.length;
                })()})
              </h3>
              {salas.length > 0 && (
                <button
                  onClick={handleDeleteAllSalas}
                  className="flex items-center gap-2 rounded-lg bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                >
                  <span className="material-symbols-outlined text-base">delete_sweep</span>
                  Eliminar Todas las Salas
                </button>
              )}
            </div>
            <div className="divide-y divide-neutral-light max-h-[600px] overflow-y-auto">
              {(() => {
                // Aplicar filtros
                let salasFiltradas = salas;
                if (filtroSede) salasFiltradas = salasFiltradas.filter(s => s.sedeId === filtroSede);
                if (filtroEdificio) salasFiltradas = salasFiltradas.filter(s => s.edificioId === filtroEdificio);
                if (filtroPiso) salasFiltradas = salasFiltradas.filter(s => s.pisoId === filtroPiso);

                return salasFiltradas.length > 0 ? salasFiltradas.map((sala) => (
                  <div key={sala.id} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-light/50">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <span className="material-symbols-outlined text-primary">meeting_room</span>
                      </div>
                      <div>
                        <p className="font-bold text-neutral-dark">{sala.nombre}</p>
                        <p className="text-sm text-gray-500">
                          {sala.sedeNombre && sala.edificioNombre && sala.pisoNumero ? (
                            `${sala.sedeNombre} → ${sala.edificioNombre} → Piso ${sala.pisoNumero}`
                          ) : (
                            `Piso ${sala.piso || 'N/A'}`
                          )}
                          {' • Capacidad: '}{sala.capacidad} personas
                          {sala.tipo && ` • ${sala.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                        </p>
                        {/* Equipment badges */}
                        {sala.equipamiento && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {sala.equipamiento.proyector && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>video_settings</span>
                                Proyector
                              </span>
                            )}
                            {sala.equipamiento.computadores > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>computer</span>
                                {sala.equipamiento.computadores} PCs
                              </span>
                            )}
                            {sala.equipamiento.enchufes > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>power</span>
                                {sala.equipamiento.enchufes}
                              </span>
                            )}
                            {sala.equipamiento.pizarra && sala.equipamiento.pizarra !== 'ninguna' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>edit_square</span>
                                {sala.equipamiento.pizarra}
                              </span>
                            )}
                            {sala.equipamiento.aire_acondicionado && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>ac_unit</span>
                                A/C
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSalaEditando(sala)}
                        className="flex items-center gap-1 rounded-lg bg-warning/10 px-3 py-1.5 text-sm font-semibold text-warning transition-colors hover:bg-warning/20"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteSala(sala.id, sala.nombre)}
                        className="flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Eliminar
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="px-6 py-12 text-center text-gray-500">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-3">inbox</span>
                    <p className="text-lg font-semibold">No hay salas que coincidan con los filtros</p>
                    <p className="text-sm mt-2">Prueba ajustando los filtros o crea nuevas salas en el Editor de Planos</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Sub-tab: Editor de Planos */}
      {salasSubTab === 'planos' && (
        <EditorPlanos />
      )}

      {/* Modal de Edición */}
      {salaEditando && (
        <EditarSalaModal
          sala={salaEditando}
          onClose={() => setSalaEditando(null)}
          onSave={handleActualizarSala}
        />
      )}
    </div>
  );
}

export default SalasTab;
