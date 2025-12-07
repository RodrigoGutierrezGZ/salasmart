/**
 * Modal para asignar sedes a un usuario
 */

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { obtenerSedes } from '../../../services/sedesService';
import { registrarLog } from '../../../services/logsService';
import { useToast } from '../../../contexts/ToastContext';
import { notificarSedeAsignada } from '../../../services/notificacionesService';

export default function AsignarSedesModal({ usuario, onClose, onSuccess }) {
  const { showError } = useToast();
  const [sedes, setSedes] = useState([]);
  const [sedesSeleccionadas, setSedesSeleccionadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarSedes();
  }, []);

  useEffect(() => {
    // Pre-seleccionar las sedes que ya tiene el usuario
    if (usuario?.sedesAfiliadas) {
      setSedesSeleccionadas(usuario.sedesAfiliadas);
    }
  }, [usuario]);

  const cargarSedes = async () => {
    try {
      const sedesData = await obtenerSedes(true); // Solo activas
      setSedes(sedesData);
    } catch (error) {
      console.error('Error cargando sedes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSede = (sedeId) => {
    setSedesSeleccionadas(prev => {
      if (prev.includes(sedeId)) {
        return prev.filter(id => id !== sedeId);
      } else {
        return [...prev, sedeId];
      }
    });
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      // Actualizar usuario
      await updateDoc(doc(db, 'users', usuario.id), {
        sedesAfiliadas: sedesSeleccionadas
      });

      // Registrar log
      const nombresSedesSeleccionadas = sedes
        .filter(s => sedesSeleccionadas.includes(s.id))
        .map(s => s.nombre)
        .join(', ');

      await registrarLog(
        'USUARIOS',
        'editar',
        usuario.email,
        usuario.id,
        {
          accion: 'Asignación de sedes',
          sedes: nombresSedesSeleccionadas || 'Ninguna'
        }
      );

      // Enviar notificación al usuario
      if (sedesSeleccionadas.length > 0) {
        try {
          await notificarSedeAsignada(usuario.id, nombresSedesSeleccionadas);
        } catch (notifError) {
          console.error('Error al enviar notificación de sedes:', notifError);
        }
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error asignando sedes:', error);
      showError('Error al asignar sedes: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-card-bg-dark rounded-lg shadow-xl max-w-md w-full max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-card-bg-dark border-b border-gray-200 dark:border-border-dark p-3 sm:p-6 z-10">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-text-dark-primary truncate">
                Asignar Sedes
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-text-dark-secondary mt-1 truncate">
                {usuario?.nombre || usuario?.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-text-dark-secondary hover:text-gray-600 dark:hover:text-text-dark-primary flex-shrink-0"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 dark:text-text-dark-secondary mt-3 text-sm">Cargando sedes...</p>
            </div>
          ) : sedes.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl sm:text-6xl text-gray-300 dark:text-text-dark-secondary">school</span>
              <p className="text-gray-500 dark:text-text-dark-secondary mt-3 text-sm">No hay sedes disponibles</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-text-dark-secondary mb-3 sm:mb-4">
                Selecciona las sedes a las que este usuario tendrá acceso:
              </p>

              {sedes.map(sede => (
                <label
                  key={sede.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                    sedesSeleccionadas.includes(sede.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sedesSeleccionadas.includes(sede.id)}
                    onChange={() => toggleSede(sede.id)}
                    className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {sede.nombre}
                    </p>
                    {sede.direccion && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {sede.direccion}
                      </p>
                    )}
                  </div>
                  {sedesSeleccionadas.includes(sede.id) && (
                    <span className="material-symbols-outlined text-primary">
                      check_circle
                    </span>
                  )}
                </label>
              ))}

              <div className="mt-4 sm:mt-6 p-2 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-base sm:text-lg flex-shrink-0">info</span>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                    {sedesSeleccionadas.length === 0 && (
                      <span>El usuario no tendrá acceso a ninguna sede específica.</span>
                    )}
                    {sedesSeleccionadas.length === 1 && (
                      <span>El usuario tendrá acceso a 1 sede.</span>
                    )}
                    {sedesSeleccionadas.length > 1 && (
                      <span>El usuario tendrá acceso a {sedesSeleccionadas.length} sedes.</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-neutral-dark border-t border-gray-200 dark:border-border-dark p-3 sm:p-6 flex gap-2 sm:gap-3">
          <button
            onClick={onClose}
            disabled={guardando}
            className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-border-dark rounded-lg font-semibold text-gray-700 dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-card-bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || loading}
            className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-primary rounded-lg font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2"
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                <span className="hidden sm:inline">Guardando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                <span className="hidden sm:inline">Guardar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
