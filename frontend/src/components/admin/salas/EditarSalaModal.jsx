// src/components/shared/EditarSalaModal.jsx

import React, { useState, useEffect } from 'react';

/**
 * Modal para editar datos de una sala (excepto ubicación)
 *
 * @param {Object} sala - Sala a editar
 * @param {Function} onClose - Callback al cerrar
 * @param {Function} onSave - Callback al guardar cambios
 */
function EditarSalaModal({ sala, onClose, onSave }) {
  const [nombre, setNombre] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [tipo, setTipo] = useState('aula_teorica');
  const [proyector, setProyector] = useState(false);
  const [computadores, setComputadores] = useState(0);
  const [enchufes, setEnchufes] = useState(0);
  const [pizarra, setPizarra] = useState('tradicional');
  const [aireAcondicionado, setAireAcondicionado] = useState(false);
  const [parlantes, setParlantes] = useState(false);
  const [microfono, setMicrofono] = useState(false);
  const [camara, setCamara] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar datos de la sala al montar
  useEffect(() => {
    if (sala) {
      setNombre(sala.nombre || '');
      setCapacidad(sala.capacidad || '');
      setTipo(sala.tipo || 'aula_teorica');

      if (sala.equipamiento) {
        setProyector(sala.equipamiento.proyector || false);
        setComputadores(sala.equipamiento.computadores || 0);
        setEnchufes(sala.equipamiento.enchufes || 0);
        setPizarra(sala.equipamiento.pizarra || 'tradicional');
        setAireAcondicionado(sala.equipamiento.aire_acondicionado || false);
        setParlantes(sala.equipamiento.parlantes || false);
        setMicrofono(sala.equipamiento.microfono || false);
        setCamara(sala.equipamiento.camara || false);
      }
    }
  }, [sala]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const datosActualizados = {
      nombre: nombre.trim().toUpperCase(),
      capacidad: Number(capacidad),
      tipo: tipo,
      equipamiento: {
        proyector,
        computadores: Number(computadores) || 0,
        enchufes: Number(enchufes) || 0,
        pizarra,
        aire_acondicionado: aireAcondicionado,
        parlantes,
        microfono,
        camara,
        otros: sala.equipamiento?.otros || []
      },
      fechaActualizacion: new Date()
    };

    await onSave(sala.id, datosActualizados);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white dark:bg-card-bg-dark shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-neutral-light dark:border-border-dark bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined">edit</span>
              Editar Sala: {sala?.nombre}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/20"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mensaje informativo */}
          <div className="rounded-lg border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Nota:</strong> Solo puedes editar el nombre, capacidad, tipo y equipamiento.
              Para cambiar la <strong>ubicación</strong> (Sede/Edificio/Piso), usa el <strong>Editor de Planos</strong>.
            </p>
          </div>

          {/* Ubicación actual (solo lectura) */}
          <div className="rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-neutral-800 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-text-dark-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">location_on</span>
              Ubicación Actual (no editable)
            </h3>
            <p className="text-sm text-gray-600 dark:text-text-dark-secondary">
              {sala?.sedeNombre} → {sala?.edificioNombre} → Piso {sala?.pisoNumero}
            </p>
          </div>

          {/* Datos editables */}
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-text-dark-primary">
                Nombre de la Sala *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-900 px-4 py-2 text-gray-900 dark:text-text-dark-primary placeholder:text-gray-400 dark:placeholder:text-text-dark-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            {/* Capacidad y Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-text-dark-primary">
                  Capacidad *
                </label>
                <input
                  type="number"
                  value={capacidad}
                  onChange={(e) => setCapacidad(e.target.value)}
                  min="1"
                  max="200"
                  className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-900 px-4 py-2 text-gray-900 dark:text-text-dark-primary placeholder:text-gray-400 dark:placeholder:text-text-dark-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-text-dark-primary">
                  Tipo de Sala *
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-900 px-4 py-2 text-gray-900 dark:text-text-dark-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="aula_teorica">Aula Teórica</option>
                  <option value="laboratorio">Laboratorio</option>
                  <option value="sala_reuniones">Sala de Reuniones</option>
                  <option value="auditorio">Auditorio</option>
                  <option value="taller">Taller</option>
                  <option value="sala_computo">Sala de Cómputo</option>
                </select>
              </div>
            </div>

            {/* Equipamiento */}
            <div className="border-t border-neutral-light dark:border-border-dark pt-4">
              <h4 className="mb-3 text-sm font-semibold text-neutral-dark dark:text-text-dark-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings</span>
                Equipamiento
              </h4>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-text-dark-primary">
                    Computadores
                  </label>
                  <input
                    type="number"
                    value={computadores}
                    onChange={(e) => setComputadores(e.target.value)}
                    min="0"
                    max="100"
                    className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-900 px-4 py-2 text-gray-900 dark:text-text-dark-primary placeholder:text-gray-400 dark:placeholder:text-text-dark-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-text-dark-primary">
                    Enchufes
                  </label>
                  <input
                    type="number"
                    value={enchufes}
                    onChange={(e) => setEnchufes(e.target.value)}
                    min="0"
                    max="100"
                    className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-900 px-4 py-2 text-gray-900 dark:text-text-dark-primary placeholder:text-gray-400 dark:placeholder:text-text-dark-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-text-dark-primary">
                    Tipo de Pizarra
                  </label>
                  <select
                    value={pizarra}
                    onChange={(e) => setPizarra(e.target.value)}
                    className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-900 px-4 py-2 text-gray-900 dark:text-text-dark-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="ninguna">Ninguna</option>
                    <option value="tradicional">Tradicional</option>
                    <option value="digital">Digital</option>
                    <option value="ambas">Ambas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proyector}
                    onChange={(e) => setProyector(e.target.checked)}
                    className="w-4 h-4 text-primary border-neutral-light dark:border-border-dark rounded focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm text-gray-700 dark:text-text-dark-primary">Proyector</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aireAcondicionado}
                    onChange={(e) => setAireAcondicionado(e.target.checked)}
                    className="w-4 h-4 text-primary border-neutral-light dark:border-border-dark rounded focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm text-gray-700 dark:text-text-dark-primary">A/C</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={parlantes}
                    onChange={(e) => setParlantes(e.target.checked)}
                    className="w-4 h-4 text-primary border-neutral-light dark:border-border-dark rounded focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm text-gray-700 dark:text-text-dark-primary">Parlantes</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={microfono}
                    onChange={(e) => setMicrofono(e.target.checked)}
                    className="w-4 h-4 text-primary border-neutral-light dark:border-border-dark rounded focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm text-gray-700 dark:text-text-dark-primary">Micrófono</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={camara}
                    onChange={(e) => setCamara(e.target.checked)}
                    className="w-4 h-4 text-primary border-neutral-light dark:border-border-dark rounded focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm text-gray-700 dark:text-text-dark-primary">Cámara</span>
                </label>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 border-t border-neutral-light dark:border-border-dark pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">save</span>
                  Guardar Cambios
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-800 px-6 py-2 font-semibold text-gray-700 dark:text-text-dark-primary transition-colors hover:bg-neutral-light dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">close</span>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarSalaModal;
