// src/components/shared/CuentaPendiente.jsx
// Componente que muestra pantalla de "Cuenta en Proceso de Activación"
// Para usuarios sin sedes asignadas

import React from 'react';
import Sidebar from '../layout/Sidebar';

/**
 * Componente que muestra una pantalla informativa cuando un usuario
 * no tiene sedes asignadas aún
 *
 * @param {Object} props
 * @param {Object} props.user - Usuario autenticado
 * @param {string} props.role - Rol del usuario
 * @param {Object} props.userData - Datos completos del usuario desde Firestore
 */
function CuentaPendiente({ user, role, userData }) {
  const rolTexto = userData?.role === 'estudiante' ? 'Estudiante' : 'Usuario';

  return (
    <div className="flex h-screen bg-background-light">
      <Sidebar user={user} role={role} />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icono */}
          <div className="flex justify-center">
            <div className="bg-warning/10 rounded-full p-6">
              <span className="material-symbols-outlined text-6xl text-warning">pending</span>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-neutral-dark">
            Cuenta en Proceso de Activación
          </h2>

          {/* Mensaje */}
          <div className="space-y-4 text-gray-600">
            <p className="text-lg">
              Tu cuenta como <span className="font-semibold text-primary">{rolTexto}</span> está siendo procesada por nuestro equipo de administración.
            </p>
            <p>
              Una vez que se te asigne una sede, podrás acceder a la consulta de salas y realizar reservas.
            </p>
            <p className="text-sm">
              Recibirás una notificación cuando tu cuenta esté completamente configurada.
            </p>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">¿Qué sigue?</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Un administrador revisará tu cuenta</li>
                  <li>Se te asignará una o más sedes</li>
                  <li>Recibirás una notificación de bienvenida</li>
                  <li>Podrás comenzar a reservar salas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <p className="text-sm text-gray-500">
            Si tienes alguna pregunta, contacta al administrador del sistema.
          </p>
        </div>
      </main>
    </div>
  );
}

export default CuentaPendiente;
