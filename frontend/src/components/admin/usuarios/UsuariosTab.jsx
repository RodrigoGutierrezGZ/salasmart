// src/components/admin/UsuariosTab.jsx

import React from 'react';
import { auth } from '../../../firebase/config';
import AsignarSedesModal from './AsignarSedesModal';

/**
 * Tab de Usuarios con sub-tabs: Activos y Pendientes
 */
function UsuariosTab({
  // Sub-tab state
  usuariosSubTab,
  setUsuariosSubTab,

  // UI state
  messageUser,
  searchUser,
  setSearchUser,
  filterRole,
  setFilterRole,

  // Usuarios data
  users,
  filteredUsers,
  hayUsuariosSinNombre,
  migrandoNombres,

  // Modal state
  mostrarModalSedes,
  usuarioSeleccionado,
  handleAbrirModalSedes,
  handleCerrarModalSedes,
  handleSedesAsignadas,

  // Functions
  handleRoleChange,
  handleToggleUserStatus,
  handleDeleteUser,
  handleMigrarNombres
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Message Alert */}
      {messageUser && (
        <div className={`flex items-center gap-2 rounded-lg p-4 ${
          messageUser.includes('✅') || messageUser.includes('exitosamente')
            ? 'bg-success/10 dark:bg-success/20 border border-success/30 dark:border-success/50 text-success'
            : 'bg-danger/10 dark:bg-danger/20 border border-danger/30 dark:border-danger/50 text-danger'
        }`}>
          <span className="material-symbols-outlined">
            {messageUser.includes('✅') || messageUser.includes('exitosamente') ? 'check_circle' : 'error'}
          </span>
          <p className="text-sm font-medium">{messageUser}</p>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="flex gap-2 rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark p-2">
        <button
          onClick={() => setUsuariosSubTab('activos')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            usuariosSubTab === 'activos'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-600 dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-card-bg-dark-hover'
          }`}
        >
          <span className="material-symbols-outlined text-base">check_circle</span>
          Usuarios Activos
        </button>
        <button
          onClick={() => setUsuariosSubTab('pendientes')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            usuariosSubTab === 'pendientes'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-600 dark:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-card-bg-dark-hover'
          }`}
        >
          <span className="material-symbols-outlined text-base">pending</span>
          Pendientes de Aprobación
          {users.filter(u => !u.activo && u.eliminado !== true).length > 0 && (
            <span className="ml-1 rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-white">
              {users.filter(u => !u.activo && u.eliminado !== true).length}
            </span>
          )}
        </button>
      </div>

      {/* Botón de Migración de Nombres */}
      {hayUsuariosSinNombre && (
        <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">badge</span>
              <div>
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-300">
                  Actualizar Nombres de Usuarios
                </p>
                <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
                  Hay usuarios con nombre "usuario". Este botón los actualizará automáticamente extrayendo el nombre desde su email institucional.
                </p>
              </div>
            </div>
            <button
              onClick={handleMigrarNombres}
              disabled={migrandoNombres}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-purple-600 hover:to-purple-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <span className={`material-symbols-outlined text-lg ${migrandoNombres ? 'animate-spin' : ''}`}>
                {migrandoNombres ? 'sync' : 'auto_fix_high'}
              </span>
              {migrandoNombres ? 'Migrando...' : 'Migrar Nombres'}
            </button>
          </div>
        </div>
      )}

      {/* Info y Filtros según vista */}
      {usuariosSubTab === 'pendientes' ? (
        <div className="rounded-xl border-2 border-blue-300 dark:border-blue-800 bg-blue-100 dark:bg-blue-900/30 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600">
              <span className="material-symbols-outlined text-white text-2xl">info</span>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-blue-900 dark:text-blue-300 mb-2">
                Cuentas Pendientes de Aprobación
              </h3>
              <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-300">
                Estas cuentas fueron registradas pero están inactivas. Puedes <strong className="font-semibold">cambiar el rol</strong> si corresponde (docente/admin) y luego hacer clic en <strong className="font-semibold">Aprobar</strong> para activarlas, o <strong className="font-semibold">Rechazar</strong> para eliminarlas.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark p-4 shadow-soft">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-text-dark-primary">search</span>
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Buscar por email..."
                  className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400 dark:placeholder:text-text-dark-secondary"
                />
              </div>
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="todos" className="dark:bg-neutral-dark">Todos los roles</option>
              <option value="estudiante" className="dark:bg-neutral-dark">Estudiantes</option>
              <option value="docente" className="dark:bg-neutral-dark">Docentes</option>
              <option value="admin" className="dark:bg-neutral-dark">Administradores</option>
            </select>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark shadow-soft overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
          <table className="w-full min-w-full text-xs sm:text-sm">
            <thead className="bg-gray-100 dark:bg-neutral-dark sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-text-dark-primary bg-gray-100 dark:bg-neutral-dark">Usuario</th>
                <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-text-dark-primary bg-gray-100 dark:bg-neutral-dark hidden sm:table-cell">Rol</th>
                <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-text-dark-primary bg-gray-100 dark:bg-neutral-dark hidden md:table-cell">Sedes</th>
                <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-text-dark-primary bg-gray-100 dark:bg-neutral-dark hidden lg:table-cell">Estado</th>
                <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-text-dark-primary bg-gray-100 dark:bg-neutral-dark">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light dark:divide-border-dark">
              {filteredUsers.map((u) => {
                // No mostrar nuestra propia cuenta
                if (u.id === auth.currentUser?.uid) return null;

                return (
                  <tr key={u.id} className="hover:bg-neutral-light/30 dark:hover:bg-card-bg-dark-hover">
                    <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
                      <div>
                        <p className="font-semibold text-neutral-dark dark:text-text-dark-primary text-xs sm:text-sm truncate">{u.nombre || 'Sin nombre'}</p>
                        <p className="text-xs text-gray-600 dark:text-text-dark-primary truncate">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 hidden sm:table-cell">
                      {/* No permitir cambiar nuestro propio rol */}
                      {u.id === auth.currentUser?.uid ? (
                        <span className="rounded-lg bg-primary/10 px-2 lg:px-3 py-1 lg:py-1.5 text-xs font-semibold text-primary">
                          {u.role === 'admin' ? 'Admin' : u.role === 'docente' ? 'Docente' : 'Est.'}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          title="Cambiar rol del usuario"
                        >
                          <option value="estudiante" className="dark:bg-neutral-dark">Estudiante</option>
                          <option value="docente" className="dark:bg-neutral-dark">Docente</option>
                          <option value="admin" className="dark:bg-neutral-dark">Administrador</option>
                        </select>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1 lg:gap-2">
                        {u.sedesAfiliadas && u.sedesAfiliadas.length > 0 ? (
                          <span className="text-xs font-semibold text-gray-700 dark:text-text-dark-primary">
                            {u.sedesAfiliadas.length} sede{u.sedesAfiliadas.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-text-dark-primary">-</span>
                        )}
                        <button
                          onClick={() => handleAbrirModalSedes(u)}
                          className="text-primary hover:text-primary/80 text-xs"
                          title="Asignar sedes"
                        >
                          <span className="material-symbols-outlined text-lg">edit_location</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 hidden lg:table-cell">
                      <span className={`rounded-full px-2 lg:px-3 py-1 text-xs font-bold ${
                        u.activo ? 'bg-success/10 dark:bg-success/20 text-success' : 'bg-gray-100 dark:bg-neutral-dark text-gray-600 dark:text-text-dark-primary'
                      }`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
                      <div className="flex gap-1 sm:gap-2">
                        {usuariosSubTab === 'pendientes' ? (
                          // Vista PENDIENTES: Aprobar o Rechazar
                          <>
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.activo)}
                              className="flex items-center gap-0.5 sm:gap-1 rounded-lg bg-success/10 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-success transition-colors hover:bg-success/20 whitespace-nowrap"
                              title="Aprobar usuario"
                            >
                              <span className="material-symbols-outlined text-sm lg:text-base">check_circle</span>
                              <span className="hidden sm:inline">Aprobar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="flex items-center gap-0.5 sm:gap-1 rounded-lg bg-danger/10 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-danger transition-colors hover:bg-danger/20 whitespace-nowrap"
                              title="Rechazar usuario"
                            >
                              <span className="material-symbols-outlined text-sm lg:text-base">delete</span>
                              <span className="hidden sm:inline">Rechazar</span>
                            </button>
                          </>
                        ) : (
                          // Vista ACTIVOS: Desactivar o Eliminar
                          <>
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.activo)}
                              className="flex items-center gap-0.5 sm:gap-1 rounded-lg bg-warning/10 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-warning transition-colors hover:bg-warning/20 whitespace-nowrap"
                              title="Desactivar usuario"
                            >
                              <span className="material-symbols-outlined text-sm lg:text-base">block</span>
                              <span className="hidden sm:inline">Desactivar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="flex items-center gap-0.5 sm:gap-1 rounded-lg bg-danger/10 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-danger transition-colors hover:bg-danger/20 whitespace-nowrap"
                              title="Eliminar usuario"
                            >
                              <span className="material-symbols-outlined text-sm lg:text-base">delete</span>
                              <span className="hidden sm:inline">Eliminar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-600 dark:text-text-dark-primary">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">person_off</span>
              <p className="text-lg font-semibold dark:text-text-dark-primary">No hay usuarios que mostrar</p>
              <p className="text-sm mt-2">
                {usuariosSubTab === 'pendientes'
                  ? 'No hay cuentas pendientes de aprobación.'
                  : 'No se encontraron usuarios con los filtros seleccionados.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Asignar Sedes */}
      {mostrarModalSedes && usuarioSeleccionado && (
        <AsignarSedesModal
          usuario={usuarioSeleccionado}
          onClose={handleCerrarModalSedes}
          onSedesAsignadas={handleSedesAsignadas}
        />
      )}
    </div>
  );
}

export default UsuariosTab;
