/**
 * Componente PlanoSalasDinamico - Visualización de planos con coordenadas desde Firestore
 * Diseño horizontal optimizado y más compacto
 */

import React, { useState, useEffect } from 'react';
import { useSalas } from '../hooks/useSalas';

function PlanoSalasDinamico({ onSalaClick, pisoInicial = 1 }) {
  const { salas, loading, error } = useSalas();
  const [pisoSeleccionado, setPisoSeleccionado] = useState(pisoInicial);
  const [salasDelPiso, setSalasDelPiso] = useState([]);
  const [salaHover, setSalaHover] = useState(null);

  useEffect(() => {
    if (salas && salas.length > 0) {
      const salasFiltradas = salas.filter(sala =>
        sala.piso === pisoSeleccionado && sala.coordenadas
      );
      setSalasDelPiso(salasFiltradas);
    }
  }, [salas, pisoSeleccionado]);

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'disponible':
        return '#4CAF50'; // Verde
      case 'proximamente':
        return '#FFC107'; // Amarillo
      case 'ocupado':
        return '#F44336'; // Rojo
      default:
        return '#9E9E9E'; // Gris
    }
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'laboratorio':
        return 'science';
      case 'sala_reuniones':
        return 'groups';
      case 'auditorio':
        return 'theater_comedy';
      case 'taller':
        return 'construction';
      case 'sala_computo':
        return 'computer';
      default:
        return 'meeting_room';
    }
  };

  const getTipoLabel = (tipo) => {
    const tipos = {
      'aula_teorica': 'Aula Teórica',
      'laboratorio': 'Laboratorio',
      'sala_reuniones': 'Sala de Reuniones',
      'auditorio': 'Auditorio',
      'taller': 'Taller',
      'sala_computo': 'Sala de Cómputo'
    };
    return tipos[tipo] || 'Aula';
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando plano...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        Error al cargar el plano: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con Selector de Piso y Estadísticas */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Selector de Piso */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(piso => (
            <button
              key={piso}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                pisoSeleccionado === piso
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-700 border border-neutral-light hover:bg-neutral-light'
              }`}
              onClick={() => setPisoSeleccionado(piso)}
            >
              <span className="material-symbols-outlined text-sm">layers</span>
              Piso {piso}
            </button>
          ))}
        </div>

        {/* Estadísticas Compactas */}
        <div className="flex gap-2">
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-semibold text-green-700">
              {salasDelPiso.filter(s => s.estado === 'disponible').length} Disponibles
            </span>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-sm font-semibold text-yellow-700">
              {salasDelPiso.filter(s => s.estado === 'proximamente').length} Próximamente
            </span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-sm font-semibold text-red-700">
              {salasDelPiso.filter(s => s.estado === 'ocupado').length} Ocupadas
            </span>
          </div>
        </div>
      </div>

      {/* Plano con Salas - Vista Horizontal Optimizada */}
      <div className="rounded-lg border border-neutral-light bg-white shadow-soft overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2.5">
          <div className="flex items-center justify-between">
            <h5 className="font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">map</span>
              Plano - Piso {pisoSeleccionado}
            </h5>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {salasDelPiso.length} salas
            </span>
          </div>
        </div>

        <div className="p-2">
          <div className="relative bg-gray-50 rounded-lg overflow-hidden">
            <img
              src={`/planos/piso${pisoSeleccionado}.jpg`}
              alt={`Plano Piso ${pisoSeleccionado}`}
              className="w-full max-h-[500px] object-contain"
            />

            {/* Renderizar Salas */}
            {salasDelPiso.map(sala => (
              <div
                key={sala.id}
                className="absolute group"
                style={{
                  left: `${sala.coordenadas.x}%`,
                  top: `${sala.coordenadas.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: onSalaClick ? 'pointer' : 'default',
                  zIndex: salaHover === sala.id ? 1000 : 10
                }}
                onMouseEnter={() => setSalaHover(sala.id)}
                onMouseLeave={() => setSalaHover(null)}
                onClick={() => onSalaClick && onSalaClick(sala)}
              >
                {/* Badge de la Sala */}
                <div
                  className="px-2 py-1 rounded shadow-lg text-xs font-semibold flex items-center gap-1 transition-all"
                  style={{
                    backgroundColor: getColorEstado(sala.estado),
                    color: 'white',
                    transform: salaHover === sala.id ? 'scale(1.15)' : 'scale(1)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                    {getIconoTipo(sala.tipo)}
                  </span>
                  {sala.nombre}
                </div>

                {/* Tooltip Mejorado y Compacto */}
                {salaHover === sala.id && (
                  <div
                    className="absolute bg-white rounded-lg shadow-2xl p-3 animate-fadeIn"
                    style={{
                      left: '50%',
                      top: '100%',
                      transform: 'translateX(-50%)',
                      marginTop: '8px',
                      minWidth: '240px',
                      maxWidth: '280px',
                      zIndex: 1001,
                      border: `2px solid ${getColorEstado(sala.estado)}`
                    }}
                  >
                    {/* Header del Tooltip */}
                    <div
                      className="text-white px-2 py-1.5 rounded mb-2 -mx-3 -mt-3"
                      style={{ backgroundColor: getColorEstado(sala.estado) }}
                    >
                      <h6 className="font-bold text-sm mb-0">{sala.nombre}</h6>
                      <small className="text-xs opacity-90">{getTipoLabel(sala.tipo)}</small>
                    </div>

                    {/* Información Compacta */}
                    <div className="space-y-1.5 text-xs text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>group</span>
                        <span><strong>Capacidad:</strong> {sala.capacidad} personas</span>
                      </div>

                      {/* Estado */}
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: getColorEstado(sala.estado) }}>
                          {sala.estado === 'disponible' ? 'check_circle' :
                           sala.estado === 'proximamente' ? 'schedule' : 'cancel'}
                        </span>
                        <span className="font-semibold">{sala.texto}</span>
                      </div>

                      {sala.textoSecundario && (
                        <div className="text-gray-500 text-xs pl-6">{sala.textoSecundario}</div>
                      )}

                      {/* Equipamiento Compacto */}
                      {sala.equipamiento && (
                        <div className="pt-2 mt-2 border-t border-gray-200">
                          <strong className="block mb-1.5 text-xs">Equipamiento:</strong>
                          <div className="flex flex-wrap gap-1">
                            {sala.equipamiento.proyector && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>video_settings</span>
                                Proyector
                              </span>
                            )}
                            {sala.equipamiento.computadores > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>computer</span>
                                {sala.equipamiento.computadores} PCs
                              </span>
                            )}
                            {sala.equipamiento.enchufes > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>power</span>
                                {sala.equipamiento.enchufes}
                              </span>
                            )}
                            {sala.equipamiento.pizarra !== 'ninguna' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>edit_square</span>
                                {sala.equipamiento.pizarra}
                              </span>
                            )}
                            {sala.equipamiento.aire_acondicionado && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>ac_unit</span>
                                A/C
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Call to Action */}
                      {onSalaClick && (
                        <div className="pt-2 mt-2 border-t border-gray-200 text-center">
                          <small className="text-primary flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>touch_app</span>
                            Clic para más opciones
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export default PlanoSalasDinamico;
