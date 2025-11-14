/**
 * Modal para asignar sedes a un usuario
 */

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { obtenerSedes } from '../../../services/sedesService';
import { registrarLog } from '../../../services/logsService';
import { useToast } from '../../../contexts/ToastContext';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                Asignar Sedes
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {usuario?.nombre || usuario?.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-3">Cargando sedes...</p>
            </div>
          ) : sedes.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-6xl text-gray-300">school</span>
              <p className="text-gray-500 mt-3">No hay sedes disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
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

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-lg">info</span>
                  <p className="text-xs text-blue-700">
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

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={guardando}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || loading}
            className="flex-1 px-4 py-2 bg-primary rounded-lg font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
