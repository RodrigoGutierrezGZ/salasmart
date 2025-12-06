/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📋 HISTORIAL COMPLETO - VISTA AVANZADA
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Vista completa del historial de actividad del sistema con:
 * - Filtros avanzados por tipo, acción, fecha y usuario
 * - Paginación
 * - Búsqueda por entidad
 * - Exportar a CSV (futuro)
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

export default function HistorialCompleto() {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Paginación
  const [limite, setLimite] = useState(50);
  const [mostrandoTodos, setMostrandoTodos] = useState(false);

  // Cargar logs
  useEffect(() => {
    cargarLogs();
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
   * Limpiar todos los filtros
   */
  function limpiarFiltros() {
    setFiltroTipo('');
    setFiltroAccion('');
    setBusqueda('');
  }

  /**
   * Filtrar logs por búsqueda (en cliente)
   */
  const logsFiltrados = logs.filter(log => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      log.entidad.toLowerCase().includes(searchLower) ||
      log.usuarioEmail.toLowerCase().includes(searchLower) ||
      log.tipo.toLowerCase().includes(searchLower)
    );
  });

  /**
   * Cargar más logs
   */
  function cargarMas() {
    setLimite(limite + 50);
  }

  /**
   * Mostrar todos
   */
  function mostrarTodos() {
    setLimite(500);
    setMostrandoTodos(true);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-text-dark-primary">Historial de Actividad</h2>
          <p className="text-sm text-gray-500 dark:text-text-dark-secondary">
            Registro completo de todas las acciones en el sistema
          </p>
        </div>

        <button
          onClick={cargarLogs}
          disabled={cargando}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          <span className="material-symbols-outlined">refresh</span>
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border border-gray-200 dark:border-border-dark bg-white dark:bg-card-bg-dark p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-text-dark-secondary">
              Buscar
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-text-dark-secondary">
                search
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por entidad, usuario o tipo..."
                className="w-full rounded-lg border border-gray-300 dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary py-2 pl-10 pr-4 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-400 dark:placeholder:text-text-dark-secondary"
              />
            </div>
          </div>

          {/* Filtro por tipo */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-text-dark-secondary">
              Tipo
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="" className="dark:bg-neutral-dark">Todos</option>
              <option value="SEDES" className="dark:bg-neutral-dark">Sedes</option>
              <option value="EDIFICIOS" className="dark:bg-neutral-dark">Edificios</option>
              <option value="PISOS" className="dark:bg-neutral-dark">Pisos</option>
              <option value="SALAS" className="dark:bg-neutral-dark">Salas</option>
              <option value="USUARIOS" className="dark:bg-neutral-dark">Usuarios</option>
              <option value="RESERVAS" className="dark:bg-neutral-dark">Reservas</option>
            </select>
          </div>

          {/* Filtro por acción */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-text-dark-secondary">
              Acción
            </label>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="" className="dark:bg-neutral-dark">Todas</option>
              <option value="crear" className="dark:bg-neutral-dark">Crear</option>
              <option value="editar" className="dark:bg-neutral-dark">Editar</option>
              <option value="eliminar" className="dark:bg-neutral-dark">Eliminar</option>
              <option value="activar" className="dark:bg-neutral-dark">Activar</option>
              <option value="desactivar" className="dark:bg-neutral-dark">Desactivar</option>
              <option value="cambiar_imagen" className="dark:bg-neutral-dark">Cambiar imagen</option>
              <option value="reservar" className="dark:bg-neutral-dark">Reservar</option>
              <option value="cancelar" className="dark:bg-neutral-dark">Cancelar</option>
            </select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-border-dark pt-4">
          <div className="text-sm text-gray-600 dark:text-text-dark-secondary">
            Mostrando {logsFiltrados.length} de {logs.length} registros
            {filtroTipo || filtroAccion || busqueda ? ' (filtrados)' : ''}
          </div>

          <div className="flex gap-2">
            {(filtroTipo || filtroAccion || busqueda) && (
              <button
                onClick={limpiarFiltros}
                className="rounded-lg bg-gray-100 dark:bg-neutral-dark px-4 py-2 text-sm text-gray-700 dark:text-text-dark-secondary transition hover:bg-gray-200 dark:hover:bg-card-bg-dark-hover"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de logs */}
      <div className="rounded-lg border border-gray-200 dark:border-border-dark bg-white dark:bg-card-bg-dark shadow-sm">
        {cargando && logs.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
              <p className="text-sm text-gray-500 dark:text-text-dark-secondary">Cargando historial...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8">
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-2xl text-red-600 dark:text-red-400">error</span>
                <div>
                  <p className="font-medium text-red-900 dark:text-red-300">Error al cargar</p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : logsFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined mb-4 text-6xl text-gray-400 dark:text-gray-600">
              search_off
            </span>
            <p className="mb-2 text-lg font-medium text-gray-900 dark:text-text-dark-primary">No hay registros</p>
            <p className="text-sm text-gray-500 dark:text-text-dark-secondary">
              {filtroTipo || filtroAccion || busqueda
                ? 'Intenta cambiar los filtros'
                : 'Aún no hay actividad en el sistema'}
            </p>
          </div>
        ) : (
          <>
            {/* Tabla de logs */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-neutral-dark">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-text-dark-secondary">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-text-dark-secondary">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-text-dark-secondary">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-text-dark-secondary">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-border-dark">
                  {logsFiltrados.map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer con paginación */}
            {!mostrandoTodos && logs.length >= limite && (
              <div className="border-t border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-neutral-dark px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-text-dark-secondary">
                    Mostrando {logs.length} registros
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={cargarMas}
                      disabled={cargando}
                      className="rounded-lg bg-white dark:bg-card-bg-dark px-4 py-2 text-sm font-medium text-gray-700 dark:text-text-dark-secondary transition hover:bg-gray-100 dark:hover:bg-card-bg-dark-hover disabled:opacity-50"
                    >
                      Cargar 50 más
                    </button>
                    <button
                      onClick={mostrarTodos}
                      disabled={cargando}
                      className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
                    >
                      Mostrar todos
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📄 LOG ROW - FILA DE TABLA
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
function LogRow({ log }) {
  const [expandido, setExpandido] = useState(false);

  const icono = obtenerIconoAccion(log.accion);
  const colorClasses = obtenerColorAccion(log.accion);
  const texto = obtenerTextoAccion(log.accion, log.tipo, log.entidad);
  const tiempoRelativo = formatearTiempoRelativo(log.timestamp);

  // Determinar si hay detalles
  const tieneDetalles = log.datos && Object.keys(log.datos).length > 0;

  return (
    <>
      <tr className="transition hover:bg-gray-50 dark:hover:bg-card-bg-dark-hover">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${colorClasses}`}>
              <span className="material-symbols-outlined text-base">{icono}</span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-text-dark-primary">{texto}</p>
              {tieneDetalles && (
                <button
                  onClick={() => setExpandido(!expandido)}
                  className="mt-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                >
                  {expandido ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex rounded-full bg-gray-100 dark:bg-neutral-dark px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-text-dark-primary">
            {log.tipo}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-gray-400 dark:text-text-dark-secondary">person</span>
            <span className="text-sm text-gray-900 dark:text-text-dark-primary">{log.usuarioEmail || 'Sistema'}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span
            className="cursor-help text-sm text-gray-500 dark:text-text-dark-secondary"
            title={formatearTimestampAbsoluto(log.timestamp)}
          >
            {tiempoRelativo}
          </span>
        </td>
      </tr>

      {/* Fila expandida con detalles */}
      {expandido && tieneDetalles && (
        <tr>
          <td colSpan="4" className="bg-gray-50 dark:bg-neutral-dark px-6 py-4">
            <div className="rounded-lg bg-white dark:bg-card-bg-dark p-4">
              <p className="mb-3 text-xs font-medium uppercase text-gray-500 dark:text-text-dark-secondary">Detalles</p>
              <dl className="grid gap-3 text-sm md:grid-cols-2">
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
          </td>
        </tr>
      )}
    </>
  );
}
