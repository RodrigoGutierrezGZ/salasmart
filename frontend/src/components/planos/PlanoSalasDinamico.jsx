/**
 * Componente PlanoSalasDinamico - Visualización de planos con coordenadas desde Firestore
 * Diseño horizontal optimizado y más compacto
 */

import React, { useState, useEffect } from 'react';
import { useSalas } from '../../hooks/useSalas';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

function PlanoSalasDinamico({ onSalaClick, pisoInicial = 1, filtroSede = 'todos', filtroEdificio = 'todos' }) {
  const { salas, loading, error } = useSalas();
  const { userData } = useAuth();
  const [pisoSeleccionado, setPisoSeleccionado] = useState(pisoInicial);
  const [salasDelPiso, setSalasDelPiso] = useState([]);
  const [salaHover, setSalaHover] = useState(null);
  const [imagenPlanoURL, setImagenPlanoURL] = useState(null);

  // Calcular cuántas sedes únicas están disponibles para el usuario
  const sedesDisponibles = React.useMemo(() => {
    let salasDisponibles = salas;

    // Filtrar por sedes afiliadas (solo para no-admin)
    if (userData?.role !== 'admin' && userData?.sedesAfiliadas && userData.sedesAfiliadas.length > 0) {
      salasDisponibles = salas.filter(sala => userData.sedesAfiliadas.includes(sala.sedeId));
    }

    return [...new Set(salasDisponibles.map(s => s.sedeId))];
  }, [salas, userData]);

  // Obtener pisos únicos disponibles (DINÁMICO) respetando filtros de sede y edificio
  const pisosDisponibles = React.useMemo(() => {
    if (!salas || salas.length === 0) return [];

    // Filtrar por sedes afiliadas (solo para no-admin)
    let salasFiltradasPorSede = salas;
    if (userData?.role !== 'admin' && userData?.sedesAfiliadas && userData.sedesAfiliadas.length > 0) {
      salasFiltradasPorSede = salas.filter(sala =>
        userData.sedesAfiliadas.includes(sala.sedeId)
      );
    }

    // Aplicar filtros de sede y edificio
    let salasFiltradas = salasFiltradasPorSede;

    if (filtroSede !== 'todos') {
      salasFiltradas = salasFiltradas.filter(sala => sala.sedeId === filtroSede);
    }

    if (filtroEdificio !== 'todos') {
      salasFiltradas = salasFiltradas.filter(sala => sala.edificioId === filtroEdificio);
    }

    // Extraer pisos únicos de salas con coordenadas
    const pisos = [...new Set(
      salasFiltradas
        .filter(sala => sala.coordenadas) // Solo salas con coordenadas
        .map(sala => sala.pisoNumero || sala.piso)
        .filter(piso => piso !== undefined)
    )].sort((a, b) => a - b);

    return pisos;
  }, [salas, userData, filtroSede, filtroEdificio]);

  // Sincronizar pisoSeleccionado con pisoInicial cuando cambia
  useEffect(() => {
    if (pisoInicial && pisoInicial !== pisoSeleccionado) {
      setPisoSeleccionado(pisoInicial);
    }
  }, [pisoInicial]);

  // Auto-seleccionar primer piso disponible si el seleccionado no existe
  useEffect(() => {
    if (pisosDisponibles.length > 0 && !pisosDisponibles.includes(pisoSeleccionado)) {
      setPisoSeleccionado(pisosDisponibles[0]);
    }
  }, [pisosDisponibles]);

  // Obtener datos del piso desde Firestore para usar su imagen
  useEffect(() => {
    async function obtenerDatosPiso() {
      if (!salas || salas.length === 0) return;

      // Buscar una sala del piso seleccionado para obtener el pisoId
      const salaDelPiso = salas.find(sala => {
        const pisoSala = sala.pisoNumero || sala.piso;
        const coincidePiso = pisoSala === pisoSeleccionado;
        const coincideSede = filtroSede === 'todos' || sala.sedeId === filtroSede;
        const coincideEdificio = filtroEdificio === 'todos' || sala.edificioId === filtroEdificio;
        return coincidePiso && coincideSede && coincideEdificio;
      });

      if (salaDelPiso && salaDelPiso.pisoId) {
        try {
          const pisoDoc = await getDoc(doc(db, 'pisos', salaDelPiso.pisoId));
          if (pisoDoc.exists()) {
            const pisoData = pisoDoc.data();
            // Usar imagenURL del piso si existe, sino usar fallback local
            const urlImagen = pisoData.imagenURL || `/planos/piso${pisoSeleccionado}.jpg`;
            console.log(`[PlanoSalasDinamico] Imagen cargada: ${urlImagen}`);
            console.log(`[PlanoSalasDinamico] Piso ID: ${salaDelPiso.pisoId}`);
            console.log(`[PlanoSalasDinamico] Datos del piso:`, pisoData);
            setImagenPlanoURL(urlImagen);
          } else {
            // Fallback local
            console.warn(`[PlanoSalasDinamico] Piso ${salaDelPiso.pisoId} no encontrado en Firestore`);
            setImagenPlanoURL(`/planos/piso${pisoSeleccionado}.jpg`);
          }
        } catch (error) {
          console.error('[PlanoSalasDinamico] Error al obtener datos del piso:', error);
          // Fallback local en caso de error
          setImagenPlanoURL(`/planos/piso${pisoSeleccionado}.jpg`);
        }
      } else {
        // Fallback local si no se encuentra sala
        console.warn(`[PlanoSalasDinamico] No se encontró sala con pisoId para piso ${pisoSeleccionado}`);
        setImagenPlanoURL(`/planos/piso${pisoSeleccionado}.jpg`);
      }
    }

    obtenerDatosPiso();
  }, [salas, pisoSeleccionado, filtroSede, filtroEdificio]);

  useEffect(() => {
    if (salas && salas.length > 0) {
      // Filtrar por sedes afiliadas (solo para no-admin)
      let salasFiltradasPorSede = salas;
      if (userData?.role !== 'admin' && userData?.sedesAfiliadas && userData.sedesAfiliadas.length > 0) {
        salasFiltradasPorSede = salas.filter(sala =>
          userData.sedesAfiliadas.includes(sala.sedeId)
        );
      }

      // Aplicar filtros de sede y edificio
      let salasFiltradas = salasFiltradasPorSede;

      if (filtroSede !== 'todos') {
        salasFiltradas = salasFiltradas.filter(sala => sala.sedeId === filtroSede);
      }

      if (filtroEdificio !== 'todos') {
        salasFiltradas = salasFiltradas.filter(sala => sala.edificioId === filtroEdificio);
      }

      // Filtrar por piso y coordenadas
      const salasPorPiso = salasFiltradas.filter(sala => {
        const pisoSala = sala.pisoNumero || sala.piso; // Compatibilidad
        return pisoSala === pisoSeleccionado && sala.coordenadas;
      });
      setSalasDelPiso(salasPorPiso);
    }
  }, [salas, pisoSeleccionado, userData, filtroSede, filtroEdificio]);

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

  const getColorTextoEstado = (estado) => {
    // Devuelve color de texto que sea legible sobre el fondo del estado
    switch (estado) {
      case 'disponible':
        return '#FFFFFF'; // Blanco sobre verde
      case 'proximamente':
        return '#333333'; // Gris oscuro sobre amarillo (mejor contraste)
      case 'ocupado':
        return '#FFFFFF'; // Blanco sobre rojo
      default:
        return '#FFFFFF'; // Blanco sobre gris
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

  // Validación: Requiere edificio específico para mostrar plano
  // Solo pide sede si el usuario tiene múltiples sedes disponibles
  if ((sedesDisponibles.length > 1 && filtroSede === 'todos') || filtroEdificio === 'todos') {
    const mensaje = (sedesDisponibles.length > 1 && filtroSede === 'todos')
      ? {
          titulo: 'Selecciona una Sede Específica',
          descripcion: 'Tienes acceso a múltiples sedes. Para visualizar el plano, selecciona primero una sede específica.',
          filtros: 'Sede → Edificio → Piso'
        }
      : {
          titulo: 'Selecciona un Edificio Específico',
          descripcion: 'Para visualizar el plano, selecciona un edificio específico. Cada edificio tiene su propio plano arquitectónico.',
          filtros: 'Edificio → Piso'
        };

    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-6">
          <span className="material-symbols-outlined text-6xl text-primary">apartment</span>
        </div>
        <h3 className="text-xl font-semibold text-neutral-dark mb-2">
          {mensaje.titulo}
        </h3>
        <p className="text-gray-600 max-w-md">
          {mensaje.descripcion}
        </p>
        <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
          <span className="material-symbols-outlined text-lg">info</span>
          <span>Usa los filtros: <strong>{mensaje.filtros}</strong></span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas de Disponibilidad */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 dark:bg-green-500/30">
            <span className="material-symbols-outlined text-xl text-green-600 dark:text-green-400">check_circle</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {salasDelPiso.filter(s => s.estado === 'disponible').length}
            </p>
            <p className="text-xs font-medium text-green-600 dark:text-green-500 truncate">Disponibles</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20 dark:bg-yellow-500/30">
            <span className="material-symbols-outlined text-xl text-yellow-600 dark:text-yellow-400">schedule</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {salasDelPiso.filter(s => s.estado === 'proximamente').length}
            </p>
            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-500 truncate">Próximamente</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 dark:bg-red-500/30">
            <span className="material-symbols-outlined text-xl text-red-600 dark:text-red-400">cancel</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">
              {salasDelPiso.filter(s => s.estado === 'ocupado').length}
            </p>
            <p className="text-xs font-medium text-red-600 dark:text-red-500 truncate">Ocupadas</p>
          </div>
        </div>
      </div>

      {/* Plano con Salas - Vista Horizontal Optimizada */}
      <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark shadow-soft overflow-hidden">
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
          {/* Contenedor con aspect ratio fijo 16:9 para consistencia con Editor */}
          <div className="relative bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16 / 9' }}>
            <img
              src={imagenPlanoURL || `/planos/piso${pisoSeleccionado}.jpg`}
              alt={`Plano Piso ${pisoSeleccionado}`}
              className="max-w-full max-h-full object-contain"
              style={{ width: '100%', height: '100%' }}
              onError={(e) => {
                // Fallback en caso de error al cargar la imagen
                e.target.src = `/planos/piso${pisoSeleccionado}.jpg`;
              }}
            />

            {/* Renderizar Salas usando coordenadas en porcentaje */}
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
                    color: getColorTextoEstado(sala.estado),
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
                      // Posicionar arriba si la sala está en la mitad inferior, abajo si está en la mitad superior
                      bottom: sala.coordenadas.y > 50 ? '100%' : 'auto',
                      top: sala.coordenadas.y <= 50 ? '100%' : 'auto',
                      transform: 'translateX(-50%)',
                      marginTop: sala.coordenadas.y <= 50 ? '8px' : '0',
                      marginBottom: sala.coordenadas.y > 50 ? '8px' : '0',
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
