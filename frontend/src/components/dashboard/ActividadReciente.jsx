/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📋 ACTIVIDAD RECIENTE - COMPONENTE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Componente para visualizar la actividad reciente del sistema.
 * Muestra un feed compacto de las últimas acciones:
 * - Infraestructura: sedes, edificios, pisos, salas
 * - Reservas: crear, cancelar, completar
 * - Usuarios: crear, editar, cambiar roles
 *
 * @author Claude Code
 * @date 9 Nov 2025
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { useState, useEffect } from 'react';
import {
  obtenerLogs,
  formatearTiempoRelativo,
  formatearTimestampAbsoluto,
  obtenerIconoAccion,
  obtenerColorAccion,
  obtenerTextoAccion,
  traducirClave,
  formatearValor
} from '../../services/logsService';

export default function ActividadReciente({ limite = 15 }) {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');

  // Cargar logs al montar el componente
  useEffect(() => {
    cargarLogs();

    // Recargar cada 30 segundos para mantener actualizado
    const interval = setInterval(cargarLogs, 30000);

    return () => clearInterval(interval);
  }, [limite, filtroTipo, filtroAccion]);

  /**
   * Cargar logs desde Firestore
   */
  async function cargarLogs() {
    try {
      setCargando(true);
      setError(null);

      const filtros = {};
      if (filtroTipo) filtros.tipo = filtroTipo;
      if (filtroAccion) filtros.accion = filtroAccion;

      const logsObtenidos = await obtenerLogs(limite, filtros);
      setLogs(logsObtenidos);
    } catch (err) {
      console.error('Error al cargar logs:', err);
      setError('No se pudieron cargar los logs. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  /**
   * Limpiar filtros
   */
  function limpiarFiltros() {
    setFiltroTipo('');
    setFiltroAccion('');
  }

  return (
    <div className="space-y-4">
      {/* Header con filtros */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-text-dark-primary">
          Actividad Reciente
        </h3>

        <div className="flex items-center gap-3">
          {/* Filtro por tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: '2rem' }}
          >
            <option value="" className="dark:bg-neutral-dark">Todos los tipos</option>
            <option value="SEDES" className="dark:bg-neutral-dark">Sedes</option>
            <option value="EDIFICIOS" className="dark:bg-neutral-dark">Edificios</option>
            <option value="PISOS" className="dark:bg-neutral-dark">Pisos</option>
            <option value="SALAS" className="dark:bg-neutral-dark">Salas</option>
          </select>

          {/* Filtro por acción */}
          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: '2rem' }}
          >
            <option value="" className="dark:bg-neutral-dark">Todas las acciones</option>
            <option value="crear" className="dark:bg-neutral-dark">Crear</option>
            <option value="editar" className="dark:bg-neutral-dark">Editar</option>
            <option value="eliminar" className="dark:bg-neutral-dark">Eliminar</option>
            <option value="activar" className="dark:bg-neutral-dark">Activar</option>
            <option value="desactivar" className="dark:bg-neutral-dark">Desactivar</option>
            <option value="cambiar_imagen" className="dark:bg-neutral-dark">Cambiar imagen</option>
          </select>

          {/* Botón limpiar filtros */}
          {(filtroTipo || filtroAccion) && (
            <button
              onClick={limpiarFiltros}
              className="rounded-lg bg-gray-100 dark:bg-neutral-dark px-3 py-1.5 text-sm text-gray-700 dark:text-text-dark-secondary transition hover:bg-gray-200 dark:hover:bg-card-bg-dark-hover"
            >
              Limpiar filtros
            </button>
          )}

          {/* Botón recargar */}
          <button
            onClick={cargarLogs}
            disabled={cargando}
            className="rounded-lg bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 text-sm text-purple-700 dark:text-purple-400 transition hover:bg-purple-100 dark:hover:bg-purple-900/50 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
          </button>
        </div>
      </div>

      {/* Lista de logs */}
      <div className="space-y-2">
        {cargando && logs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
              <p className="text-sm text-gray-500 dark:text-text-dark-secondary">Cargando historial...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
              <div>
                <p className="font-medium text-red-900 dark:text-red-300">Error al cargar</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-neutral-dark p-8 text-center">
            <span className="material-symbols-outlined mb-3 text-5xl text-gray-400 dark:text-gray-600">
              history
            </span>
            <p className="mb-1 font-medium text-gray-900 dark:text-text-dark-primary">No hay cambios aún</p>
            <p className="text-sm text-gray-500 dark:text-text-dark-secondary">
              Los cambios en el sistema aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="max-h-[500px] space-y-2 overflow-y-auto pr-2">
            {logs.map((log) => (
              <LogCard key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📄 LOG CARD - COMPONENTE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
function LogCard({ log }) {
  const [expandido, setExpandido] = useState(false);

  const icono = obtenerIconoAccion(log.accion);
  const colorClasses = obtenerColorAccion(log.accion);
  const texto = obtenerTextoAccion(log.accion, log.tipo, log.entidad);
  const tiempoRelativo = formatearTiempoRelativo(log.timestamp);

  // Determinar si hay detalles para mostrar
  const tieneDetalles = log.datos && Object.keys(log.datos).length > 0;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-border-dark bg-white dark:bg-card-bg-dark p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        {/* Ícono de la acción */}
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${colorClasses}`}>
          <span className="material-symbols-outlined text-xl">{icono}</span>
        </div>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          {/* Texto de la acción */}
          <p className="font-medium text-gray-900 dark:text-text-dark-primary">{texto}</p>

          {/* Usuario y tiempo */}
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-text-dark-secondary">
            <span className="material-symbols-outlined text-base">person</span>
            <span className="truncate">{log.usuarioEmail || 'Usuario'}</span>
            <span>•</span>
            <span
              className="flex-shrink-0 cursor-help"
              title={formatearTimestampAbsoluto(log.timestamp)}
            >
              {tiempoRelativo}
            </span>
          </div>

          {/* Detalles expandibles */}
          {tieneDetalles && (
            <div className="mt-2">
              <button
                onClick={() => setExpandido(!expandido)}
                className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 transition hover:text-purple-700 dark:hover:text-purple-300"
              >
                <span className="material-symbols-outlined text-base">
                  {expandido ? 'expand_less' : 'expand_more'}
                </span>
                {expandido ? 'Ocultar detalles' : 'Ver detalles'}
              </button>

              {expandido && (
                <div className="mt-2 rounded-lg bg-gray-50 dark:bg-neutral-dark p-3">
                  <dl className="space-y-2 text-sm">
                    {Object.entries(log.datos).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <dt className="font-medium text-gray-700 dark:text-text-dark-secondary">{traducirClave(key)}:</dt>
                        <dd className="flex-1 text-gray-900 dark:text-text-dark-primary">
                          {key === 'origen' ? (
                            // Badge especial para origen
                            value === 'chatbot' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>smart_toy</span>
                                Chatbot (IA)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>mouse</span>
                                Manual
                              </span>
                            )
                          ) : (
                            formatearValor(value)
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Badge del tipo */}
        <div className="flex-shrink-0">
          <span className="inline-flex rounded-full bg-gray-100 dark:bg-neutral-dark px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-text-dark-primary">
            {log.tipo}
          </span>
        </div>
      </div>
    </div>
  );
}
