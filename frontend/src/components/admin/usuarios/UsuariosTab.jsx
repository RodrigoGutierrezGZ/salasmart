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
            ? 'bg-success/10 border border-success/30 text-success'
            : 'bg-danger/10 border border-danger/30 text-danger'
        }`}>
          <span className="material-symbols-outlined">
            {messageUser.includes('✅') || messageUser.includes('exitosamente') ? 'check_circle' : 'error'}
          </span>
          <p className="text-sm font-medium">{messageUser}</p>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="flex gap-2 rounded-lg border border-neutral-light bg-white p-2">
        <button
          onClick={() => setUsuariosSubTab('activos')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            usuariosSubTab === 'activos'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
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
              : 'text-gray-600 hover:bg-gray-100'
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
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <span className="material-symbols-outlined text-purple-600">badge</span>
              <div>
                <p className="text-sm font-semibold text-purple-900">
                  Actualizar Nombres de Usuarios
                </p>
                <p className="mt-1 text-xs text-purple-700">
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
        <div className="rounded-xl border-2 border-blue-300 bg-blue-100 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500">
              <span className="material-symbols-outlined text-white text-2xl">info</span>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-blue-900 mb-2">
                Cuentas Pendientes de Aprobación
              </h3>
              <p className="text-sm leading-relaxed text-blue-800">
                Estas cuentas fueron registradas pero están inactivas. Puedes <strong className="font-semibold">cambiar el rol</strong> si corresponde (docente/admin) y luego hacer clic en <strong className="font-semibold">Aprobar</strong> para activarlas, o <strong className="font-semibold">Rechazar</strong> para eliminarlas.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-light bg-white p-4 shadow-soft">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Buscar por email..."
                  className="w-full rounded-lg border border-neutral-light py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-lg border border-neutral-light px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="todos">Todos los roles</option>
              <option value="estudiante">Estudiantes</option>
              <option value="docente">Docentes</option>
              <option value="admin">Administradores</option>
            </select>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-lg border border-neutral-light bg-white shadow-soft overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-100">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-100">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-100">Sedes</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-100">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-100">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light">
              {filteredUsers.map((u) => {
                // No mostrar nuestra propia cuenta
                if (u.id === auth.currentUser?.uid) return null;

                return (
                  <tr key={u.id} className="hover:bg-neutral-light/30">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-neutral-dark">{u.nombre || 'Sin nombre'}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* No permitir cambiar nuestro propio rol */}
                      {u.id === auth.currentUser?.uid ? (
                        <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                          {u.role === 'admin' ? 'Administrador' : u.role === 'docente' ? 'Docente' : 'Estudiante'}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="rounded-lg border border-neutral-light bg-white px-3 py-1.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          title="Cambiar rol del usuario"
                        >
                          <option value="estudiante">Estudiante</option>
                          <option value="docente">Docente</option>
                          <option value="admin">Administrador</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {u.sedesAfiliadas && u.sedesAfiliadas.length > 0 ? (
                          <span className="text-xs font-semibold text-gray-700">
                            {u.sedesAfiliadas.length} sede{u.sedesAfiliadas.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Sin sedes</span>
                        )}
                        <button
                          onClick={() => handleAbrirModalSedes(u)}
                          className="text-primary hover:text-primary/80"
                          title="Asignar sedes"
                        >
                          <span className="material-symbols-outlined text-lg">edit_location</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        u.activo ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {usuariosSubTab === 'pendientes' ? (
                          // Vista PENDIENTES: Aprobar o Rechazar
                          <>
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.activo)}
                              className="flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-sm font-semibold text-success transition-colors hover:bg-success/20"
                            >
                              <span className="material-symbols-outlined text-base">check_circle</span>
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                              Rechazar
                            </button>
                          </>
                        ) : (
                          // Vista ACTIVOS: Desactivar o Eliminar
                          <>
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.activo)}
                              className="flex items-center gap-1 rounded-lg bg-warning/10 px-3 py-1.5 text-sm font-semibold text-warning transition-colors hover:bg-warning/20"
                            >
                              <span className="material-symbols-outlined text-base">block</span>
                              Desactivar
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                              Eliminar
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
            <div className="px-6 py-12 text-center text-gray-500">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">person_off</span>
              <p className="text-lg font-semibold">No hay usuarios que mostrar</p>
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
