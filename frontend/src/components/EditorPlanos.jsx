/**
 * Componente EditorPlanos - Editor visual de planos con coordenadas dinámicas
 * Diseño horizontal mejorado y más compacto
 */

import React, { useState, useRef, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

function EditorPlanos() {
  const [pisoSeleccionado, setPisoSeleccionado] = useState(1);
  const [salas, setSalas] = useState([]);
  const [salasDelPiso, setSalasDelPiso] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [coordenadasTemp, setCoordenadasTemp] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [salaArrastrada, setSalaArrastrada] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [offsetArrastre, setOffsetArrastre] = useState({ x: 0, y: 0 });
  const [posicionTemporal, setPosicionTemporal] = useState(null);

  const imagenRef = useRef(null);

  // Formulario de sala
  const [formulario, setFormulario] = useState({
    nombre: '',
    capacidad: 30,
    tipo: 'aula_teorica',
    equipamiento: {
      proyector: false,
      computadores: 0,
      enchufes: 0,
      pizarra: 'tradicional',
      aire_acondicionado: false,
      parlantes: false,
      microfono: false,
      camara: false,
      otros: []
    }
  });

  // Cargar salas al montar o cambiar piso
  useEffect(() => {
    cargarSalas();
  }, [pisoSeleccionado]);

  const cargarSalas = async () => {
    try {
      const salasSnapshot = await getDocs(collection(db, 'salas'));
      const todasSalas = salasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSalas(todasSalas);
      const salasPiso = todasSalas.filter(s => s.piso === pisoSeleccionado);
      setSalasDelPiso(salasPiso);
    } catch (error) {
      console.error('Error al cargar salas:', error);
      mostrarMensaje('error', 'Error al cargar las salas');
    }
  };

  // Sistema Pick & Place: Click para tomar, click para soltar
  const handleClickSala = (e, sala) => {
    if (!modoEdicion) return;
    e.stopPropagation();

    // Si ya hay una sala siendo movida, cancelar
    if (salaArrastrada) {
      setSalaArrastrada(null);
      setArrastrando(false);
      setPosicionTemporal(null);
      return;
    }

    // Tomar la sala
    setSalaArrastrada(sala);
    setArrastrando(true);
  };

  const handleMouseMovePlano = (e) => {
    if (!arrastrando || !salaArrastrada) return;

    const rect = imagenRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Limitar a los bordes del plano
    const xLimitado = Math.max(0, Math.min(100, x));
    const yLimitado = Math.max(0, Math.min(100, y));

    setPosicionTemporal({ x: xLimitado, y: yLimitado });
  };

  const handleClickEnPlano = async (e) => {
    if (!modoEdicion) return;

    const rect = imagenRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Limitar a los bordes
    const xLimitado = Math.max(0, Math.min(100, x));
    const yLimitado = Math.max(0, Math.min(100, y));

    // Si hay una sala siendo movida, colocarla aquí
    if (salaArrastrada && arrastrando) {
      try {
        await updateDoc(doc(db, 'salas', salaArrastrada.id), {
          coordenadas: { x: xLimitado, y: yLimitado },
          fechaActualizacion: new Date()
        });

        mostrarMensaje('success', `Sala ${salaArrastrada.nombre} movida exitosamente`);
        cargarSalas();
      } catch (error) {
        console.error('Error al mover sala:', error);
        mostrarMensaje('error', 'Error al mover la sala');
      }

      setSalaArrastrada(null);
      setArrastrando(false);
      setPosicionTemporal(null);
    } else {
      // Si no hay sala siendo movida, crear una nueva
      setCoordenadasTemp({ x: xLimitado, y: yLimitado });
      setMostrandoFormulario(true);
    }
  };

  const handleGuardarSala = async () => {
    if (!formulario.nombre.trim()) {
      mostrarMensaje('error', 'El nombre de la sala es obligatorio');
      return;
    }

    if (!coordenadasTemp) {
      mostrarMensaje('error', 'Debes hacer clic en el plano para establecer la posición');
      return;
    }

    // Validar nombre único
    const nombreUpper = formulario.nombre.toUpperCase();
    const nombreDuplicado = salas.some(
      sala => sala.nombre.toUpperCase() === nombreUpper && sala.piso === pisoSeleccionado
    );

    if (nombreDuplicado) {
      mostrarMensaje('error', `Ya existe una sala con el nombre "${nombreUpper}" en el Piso ${pisoSeleccionado}`);
      return;
    }

    try {
      const nuevaSala = {
        nombre: nombreUpper,
        piso: pisoSeleccionado,
        capacidad: parseInt(formulario.capacidad),
        tipo: formulario.tipo,
        equipamiento: {
          ...formulario.equipamiento,
          computadores: parseInt(formulario.equipamiento.computadores),
          enchufes: parseInt(formulario.equipamiento.enchufes)
        },
        coordenadas: coordenadasTemp,
        activa: true,
        fechaActualizacion: new Date()
      };

      const salaId = `${nombreUpper}-P${pisoSeleccionado}`;
      await setDoc(doc(db, 'salas', salaId), nuevaSala);

      mostrarMensaje('success', `Sala ${nombreUpper} creada exitosamente`);
      limpiarFormulario();
      cargarSalas();
    } catch (error) {
      console.error('Error al guardar sala:', error);
      mostrarMensaje('error', 'Error al guardar la sala');
    }
  };

  const handleEliminarSala = async (salaId, nombreSala) => {
    if (!confirm(`¿Estás seguro de eliminar la sala ${nombreSala}?`)) return;

    try {
      await deleteDoc(doc(db, 'salas', salaId));
      mostrarMensaje('success', `Sala ${nombreSala} eliminada`);
      cargarSalas();
    } catch (error) {
      console.error('Error al eliminar sala:', error);
      mostrarMensaje('error', 'Error al eliminar la sala');
    }
  };

  const limpiarFormulario = () => {
    setFormulario({
      nombre: '',
      capacidad: 30,
      tipo: 'aula_teorica',
      equipamiento: {
        proyector: false,
        computadores: 0,
        enchufes: 0,
        pizarra: 'tradicional',
        aire_acondicionado: false,
        parlantes: false,
        microfono: false,
        camara: false,
        otros: []
      }
    });
    setCoordenadasTemp(null);
    setMostrandoFormulario(false);
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
  };

  const tiposSala = [
    { value: 'aula_teorica', label: 'Aula Teórica' },
    { value: 'laboratorio', label: 'Laboratorio' },
    { value: 'sala_reuniones', label: 'Sala de Reuniones' },
    { value: 'auditorio', label: 'Auditorio' },
    { value: 'taller', label: 'Taller' },
    { value: 'sala_computo', label: 'Sala de Cómputo' }
  ];

  const tiposPizarra = [
    { value: 'tradicional', label: 'Tradicional' },
    { value: 'digital', label: 'Digital' },
    { value: 'ambas', label: 'Ambas' },
    { value: 'ninguna', label: 'Ninguna' }
  ];

  return (
    <div className="space-y-4 relative">
      {/* Header con título y controles */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">map</span>
          Editor de Planos - Piso {pisoSeleccionado}
        </h2>

        <div className="flex items-center gap-3">
          {/* Selector de Piso */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(piso => (
              <button
                key={piso}
                onClick={() => setPisoSeleccionado(piso)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  pisoSeleccionado === piso
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-gray-700 border border-neutral-light hover:bg-neutral-light'
                }`}
              >
                Piso {piso}
              </button>
            ))}
          </div>

          {/* Botón Modo Edición */}
          <button
            onClick={() => {
              setModoEdicion(!modoEdicion);
              // Limpiar estados si se desactiva modo edición
              if (modoEdicion) {
                setSalaArrastrada(null);
                setArrastrando(false);
                setPosicionTemporal(null);
                setMostrandoFormulario(false);
                setCoordenadasTemp(null);
              }
            }}
            className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              modoEdicion
                ? 'bg-danger text-white shadow-md'
                : 'bg-primary text-white shadow-md hover:bg-primary/90'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {modoEdicion ? 'close' : 'edit'}
            </span>
            {modoEdicion ? 'Desactivar' : 'Activar'} Edición
          </button>
        </div>
      </div>

      {/* Mensajes flotantes - Posición fija sin mover contenido */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4 pointer-events-none">
        {mensaje.texto && (
          <div className={`rounded-lg p-3 shadow-lg pointer-events-auto animate-slideDown ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                {mensaje.tipo === 'success' ? 'check_circle' : 'error'}
              </span>
              {mensaje.texto}
            </div>
          </div>
        )}

        {/* Instrucciones mientras se mueve una sala */}
        {modoEdicion && arrastrando && salaArrastrada && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg pointer-events-auto animate-slideDown mt-2">
            <div className="flex items-center gap-2 text-green-800">
              <span className="material-symbols-outlined animate-pulse">touch_app</span>
              <div className="flex-1">
                <p className="font-bold">Moviendo sala: {salaArrastrada.nombre}</p>
                <p className="text-sm">Haz clic donde quieras colocarla, o vuelve a hacer clic en la sala para cancelar</p>
              </div>
            </div>
          </div>
        )}

        {/* Instrucciones cuando está en modo edición - También flotante */}
        {modoEdicion && !arrastrando && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg pointer-events-auto animate-slideDown mt-2">
            <div className="flex items-start gap-2 text-blue-800">
              <span className="material-symbols-outlined">info</span>
              <div className="flex-1">
                <p className="font-medium mb-1">Modo Edición Activo:</p>
                <ul className="text-sm space-y-1 ml-4 list-disc">
                  <li><strong>Crear sala:</strong> Haz clic en el plano donde quieras ubicarla</li>
                  <li><strong>Mover sala:</strong> 1) Haz clic en la sala para tomarla, 2) Haz clic donde quieras colocarla</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layout Horizontal: Plano + Formulario/Lista */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Plano Interactivo - Ocupa 2 columnas */}
        <div className="xl:col-span-2">
          <div className="rounded-lg border border-neutral-light bg-white shadow-soft overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">location_on</span>
                  Plano Interactivo - Piso {pisoSeleccionado}
                </h4>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  {salasDelPiso.length} salas
                </span>
              </div>
            </div>

            <div
              className="relative select-none"
              style={{ cursor: arrastrando ? 'crosshair' : (modoEdicion ? 'crosshair' : 'default') }}
              onMouseMove={handleMouseMovePlano}
              onClick={handleClickEnPlano}
            >
              <img
                ref={imagenRef}
                src={`/planos/piso${pisoSeleccionado}.jpg`}
                alt={`Plano Piso ${pisoSeleccionado}`}
                className="w-full max-h-[600px] object-contain pointer-events-none"
                draggable={false}
              />

              {/* Renderizar salas existentes en el plano */}
              {salasDelPiso.map(sala => {
                if (!sala.coordenadas) return null;

                // Usar posición temporal si es la sala que se está arrastrando
                const esArrastrada = salaArrastrada?.id === sala.id;
                const posicion = esArrastrada && posicionTemporal ? posicionTemporal : sala.coordenadas;

                return (
                  <div
                    key={sala.id}
                    className="absolute group"
                    onClick={(e) => handleClickSala(e, sala)}
                    style={{
                      left: `${posicion.x}%`,
                      top: `${posicion.y}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: modoEdicion ? 'pointer' : 'default',
                      opacity: esArrastrada ? 0.8 : 1,
                      zIndex: esArrastrada ? 1000 : 10,
                      pointerEvents: esArrastrada ? 'none' : 'auto', // Deshabilitar clicks si está siendo arrastrada
                      transition: 'none',
                      filter: esArrastrada ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))' : 'none'
                    }}
                  >
                    <div className={`bg-green-500 text-white px-2 py-1 rounded shadow-lg text-xs font-semibold flex items-center gap-1 ${!esArrastrada && 'group-hover:scale-110'} transition-transform`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        meeting_room
                      </span>
                      {sala.nombre}
                    </div>
                  </div>
                );
              })}

              {/* Mostrar coordenadas temporales */}
              {coordenadasTemp && mostrandoFormulario && (
                <div
                  className="absolute"
                  style={{
                    left: `${coordenadasTemp.x}%`,
                    top: `${coordenadasTemp.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="bg-yellow-400 text-gray-800 px-2 py-1 rounded shadow-lg text-xs font-bold pulse flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add_location</span>
                    Nueva Sala
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel lateral: Formulario o Lista de Salas */}
        <div className="xl:col-span-1 space-y-4">

          {/* Formulario de Nueva Sala */}
          {mostrandoFormulario ? (
            <div className="rounded-lg border border-green-200 bg-white shadow-soft overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3">
                <h4 className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">add_circle</span>
                  Nueva Sala
                </h4>
              </div>

              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-neutral-light px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formulario.nombre}
                    onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                    placeholder="A310, LAB-01"
                  />
                </div>

                {/* Capacidad y Tipo */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Capacidad</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-neutral-light px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formulario.capacidad}
                      onChange={(e) => setFormulario({ ...formulario, capacidad: e.target.value })}
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
                    <select
                      className="w-full rounded-lg border border-neutral-light px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formulario.tipo}
                      onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
                    >
                      {tiposSala.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Equipamiento */}
                <div className="border-t border-neutral-light pt-3">
                  <h5 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>settings</span>
                    Equipamiento
                  </h5>

                  {/* Checkboxes en grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formulario.equipamiento.proyector}
                        onChange={(e) => setFormulario({
                          ...formulario,
                          equipamiento: { ...formulario.equipamiento, proyector: e.target.checked }
                        })}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
                      />
                      <span>Proyector</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formulario.equipamiento.aire_acondicionado}
                        onChange={(e) => setFormulario({
                          ...formulario,
                          equipamiento: { ...formulario.equipamiento, aire_acondicionado: e.target.checked }
                        })}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
                      />
                      <span>A/C</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formulario.equipamiento.parlantes}
                        onChange={(e) => setFormulario({
                          ...formulario,
                          equipamiento: { ...formulario.equipamiento, parlantes: e.target.checked }
                        })}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
                      />
                      <span>Parlantes</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formulario.equipamiento.microfono}
                        onChange={(e) => setFormulario({
                          ...formulario,
                          equipamiento: { ...formulario.equipamiento, microfono: e.target.checked }
                        })}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
                      />
                      <span>Micrófono</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formulario.equipamiento.camara}
                        onChange={(e) => setFormulario({
                          ...formulario,
                          equipamiento: { ...formulario.equipamiento, camara: e.target.checked }
                        })}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
                      />
                      <span>Cámara</span>
                    </label>
                  </div>

                  {/* Números */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Computadores</label>
                      <input
                        type="number"
                        className="w-full rounded border border-neutral-light px-2 py-1 text-sm"
                        value={formulario.equipamiento.computadores}
                        onChange={(e) => setFormulario({
                          ...formulario,
                          equipamiento: { ...formulario.equipamiento, computadores: e.target.value }
                        })}
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Enchufes</label>
                      <input
                        type="number"
                        className="w-full rounded border border-neutral-light px-2 py-1 text-sm"
                        value={formulario.equipamiento.enchufes}
                        onChange={(e) => setFormulario({
                          ...formulario,
                          equipamiento: { ...formulario.equipamiento, enchufes: e.target.value }
                        })}
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Pizarra</label>
                    <select
                      className="w-full rounded border border-neutral-light px-2 py-1 text-sm"
                      value={formulario.equipamiento.pizarra}
                      onChange={(e) => setFormulario({
                        ...formulario,
                        equipamiento: { ...formulario.equipamiento, pizarra: e.target.value }
                      })}
                    >
                      {tiposPizarra.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleGuardarSala}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    Guardar
                  </button>
                  <button
                    onClick={limpiarFormulario}
                    className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Lista de Salas del Piso */
            <div className="rounded-lg border border-neutral-light bg-white shadow-soft overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3">
                <h4 className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">list</span>
                  Salas en Piso {pisoSeleccionado}
                </h4>
              </div>

              <div className="p-3 max-h-[600px] overflow-y-auto">
                {salasDelPiso.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
                    <p className="text-sm">No hay salas en este piso</p>
                    <p className="text-xs mt-1">Activa el modo edición para agregar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {salasDelPiso.map(sala => (
                      <div key={sala.id} className="border border-neutral-light rounded-lg p-3 hover:bg-blue-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-bold text-gray-800">{sala.nombre}</h5>
                            <p className="text-xs text-gray-600 mt-1">
                              {tiposSala.find(t => t.value === sala.tipo)?.label} • {sala.capacidad} personas
                            </p>
                            {sala.coordenadas && (
                              <p className="text-xs text-gray-500 mt-1">
                                📍 ({sala.coordenadas.x.toFixed(1)}%, {sala.coordenadas.y.toFixed(1)}%)
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleEliminarSala(sala.id, sala.nombre)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                            title="Eliminar sala"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }
        .pulse {
          animation: pulse 1s infinite;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default EditorPlanos;
