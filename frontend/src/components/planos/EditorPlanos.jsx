/**
 * Componente EditorPlanos - Editor visual de planos con coordenadas dinámicas
 * Diseño horizontal mejorado y más compacto
 * Actualizado con filtros jerárquicos: Sede → Edificio → Piso
 */

import React, { useState, useRef, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { obtenerSedes } from '../../services/sedesService';
import { obtenerEdificiosPorSede } from '../../services/edificiosService';
import { obtenerPisosPorEdificio, actualizarImagenPiso } from '../../services/pisosService';
import { crearSala, eliminarSala, actualizarCoordenadasSala } from '../../services/salasService';
import GaleriaImagenes from './GaleriaImagenes';
import EditorImagen from './EditorImagen';

function EditorPlanos() {
  // Estados de jerarquía
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [edificiosDisponibles, setEdificiosDisponibles] = useState([]);
  const [pisosDisponibles, setPisosDisponibles] = useState([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState('');
  const [edificioSeleccionado, setEdificioSeleccionado] = useState('');
  const [pisoSeleccionado, setPisoSeleccionado] = useState('');

  // Estados de salas y editor
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
  const [mostrarMensajeEdicion, setMostrarMensajeEdicion] = useState(true);
  const [panelLateralAbierto, setPanelLateralAbierto] = useState(true);

  // Estados para subida de imagen
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState(0);
  
  // Nuevos estados para galería y editor
  const [mostrarGaleria, setMostrarGaleria] = useState(false);
  const [editandoImagen, setEditandoImagen] = useState(false);
  const [imagenParaEditar, setImagenParaEditar] = useState(null);

  const imagenRef = useRef(null);
  const contenedorPlanoRef = useRef(null);
  const panelAcordeonRef = useRef(null);
  const inputImagenRef = useRef(null);

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

  // Cargar sedes al montar
  useEffect(() => {
    cargarSedesIniciales();
  }, []);

  // Listener en TIEMPO REAL para salas al cambiar piso seleccionado
  useEffect(() => {
    if (!pisoSeleccionado) {
      setSalas([]);
      setSalasDelPiso([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'salas'),
      (snapshot) => {
        const todasSalas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSalas(todasSalas);

        // Filtrar por pisoId (nuevo sistema) o piso (retrocompatibilidad)
        const salasPiso = todasSalas.filter(s =>
          s.pisoId === pisoSeleccionado || s.piso === pisoSeleccionado
        );
        setSalasDelPiso(salasPiso);
      },
      (error) => {
        console.error('Error en listener de salas:', error);
        mostrarMensaje('error', 'Error al cargar las salas');
      }
    );

    return () => unsubscribe();
  }, [pisoSeleccionado]);

  /**
   * Cargar sedes iniciales
   */
  const cargarSedesIniciales = async () => {
    try {
      const sedes = await obtenerSedes(true); // true = solo activas
      console.log('Editor Planos - Sedes cargadas:', sedes);
      setSedesDisponibles(sedes);
    } catch (error) {
      console.error('Error al cargar sedes:', error);
    }
  };

  /**
   * Cascade: Sede → Edificios
   */
  const handleSedeChange = async (sedeId) => {
    setSedeSeleccionada(sedeId);
    setEdificioSeleccionado('');
    setPisoSeleccionado('');
    setEdificiosDisponibles([]);
    setPisosDisponibles([]);
    setSalasDelPiso([]);

    if (sedeId) {
      const edificios = await obtenerEdificiosPorSede(sedeId, true); // true = solo activos
      setEdificiosDisponibles(edificios);
    }
  };

  /**
   * Cascade: Edificio → Pisos
   */
  const handleEdificioChange = async (edificioId) => {
    setEdificioSeleccionado(edificioId);
    setPisoSeleccionado('');
    setPisosDisponibles([]);
    setSalasDelPiso([]);

    if (edificioId) {
      const pisos = await obtenerPisosPorEdificio(edificioId, true); // true = solo activos
      setPisosDisponibles(pisos);
    }
  };

  /**
   * Seleccionar piso
   */
  const handlePisoChange = (pisoId) => {
    setPisoSeleccionado(pisoId);
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

    // Tomar la sala y establecer posición inicial como temporal
    setSalaArrastrada(sala);
    setArrastrando(true);
    setPosicionTemporal(sala.coordenadas); // Inicializar con la posición actual de la sala
  };

  // Función helper para obtener las dimensiones reales de la imagen renderizada
  const getImageActualDimensions = () => {
    if (!imagenRef.current) return null;

    const img = imagenRef.current;
    const imgRect = img.getBoundingClientRect();

    // Usar directamente las dimensiones reales que el navegador está usando
    return {
      width: imgRect.width,
      height: imgRect.height,
      offsetX: imgRect.left,
      offsetY: imgRect.top
    };
  };

  const handleMouseMovePlano = (e) => {
    if (!arrastrando || !salaArrastrada) return;

    const dimensions = getImageActualDimensions();
    if (!dimensions) return;

    // Calcular coordenadas basadas en la imagen REAL, no el contenedor
    const x = ((e.clientX - dimensions.offsetX) / dimensions.width) * 100;
    const y = ((e.clientY - dimensions.offsetY) / dimensions.height) * 100;

    // Limitar a los bordes del plano
    const xLimitado = Math.max(0, Math.min(100, x));
    const yLimitado = Math.max(0, Math.min(100, y));

    setPosicionTemporal({ x: xLimitado, y: yLimitado });
  };

  const handleClickEnPlano = async (e) => {
    if (!modoEdicion) return;

    // Asegurarse de que la imagen esté completamente cargada
    if (imagenRef.current && !imagenRef.current.complete) {
      await new Promise(resolve => {
        imagenRef.current.onload = resolve;
      });
    }

    const dimensions = getImageActualDimensions();
    if (!dimensions) return;

    // Calcular coordenadas basadas en la imagen REAL, no el contenedor
    const x = ((e.clientX - dimensions.offsetX) / dimensions.width) * 100;
    const y = ((e.clientY - dimensions.offsetY) / dimensions.height) * 100;

    // Limitar a los bordes
    const xLimitado = Math.max(0, Math.min(100, x));
    const yLimitado = Math.max(0, Math.min(100, y));

    // Si hay una sala siendo movida, colocarla aquí
    if (salaArrastrada && arrastrando) {
      try {
        await actualizarCoordenadasSala(salaArrastrada.id, xLimitado, yLimitado);

        mostrarMensaje('success', `Sala ${salaArrastrada.nombre} movida exitosamente`);
        // El listener en tiempo real actualizará automáticamente
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

    // Validar que se haya seleccionado un piso
    if (!pisoSeleccionado) {
      mostrarMensaje('error', 'Debes seleccionar Sede, Edificio y Piso antes de crear salas');
      return;
    }

    // Obtener datos completos de la jerarquía
    const pisoActual = pisosDisponibles.find(p => p.id === pisoSeleccionado);
    const edificioActual = edificiosDisponibles.find(e => e.id === edificioSeleccionado);
    const sedeActual = sedesDisponibles.find(s => s.id === sedeSeleccionada);

    if (!pisoActual || !edificioActual || !sedeActual) {
      mostrarMensaje('error', 'Error al obtener datos de jerarquía. Intenta recargar la página.');
      return;
    }

    // Validar nombre único
    const nombreUpper = formulario.nombre.toUpperCase();
    const nombreDuplicado = salas.some(
      sala => sala.nombre.toUpperCase() === nombreUpper && sala.pisoId === pisoSeleccionado
    );

    if (nombreDuplicado) {
      mostrarMensaje('error', `Ya existe una sala "${nombreUpper}" en ${pisoActual.nombreCompleto || 'este piso'}`);
      return;
    }

    try {
      // Usar el servicio de salas para crear con estructura correcta
      const datosSala = {
        nombre: nombreUpper,
        pisoId: pisoActual.id,
        capacidad: parseInt(formulario.capacidad),
        tipo: formulario.tipo,
        equipamiento: {
          ...formulario.equipamiento,
          computadores: parseInt(formulario.equipamiento.computadores),
          enchufes: parseInt(formulario.equipamiento.enchufes)
        },
        coordenadas: coordenadasTemp
      };

      await crearSala(datosSala);

      mostrarMensaje('success', `Sala ${nombreUpper} creada exitosamente`);
      limpiarFormulario();
      // El listener en tiempo real actualizará automáticamente
    } catch (error) {
      console.error('Error al guardar sala:', error);
      mostrarMensaje('error', 'Error al guardar la sala');
    }
  };

  const handleEliminarSala = async (salaId, nombreSala) => {
    if (!confirm(`¿Estás seguro de eliminar la sala ${nombreSala}?`)) return;

    try {
      await eliminarSala(salaId);
      mostrarMensaje('success', `Sala ${nombreSala} eliminada`);
      // El listener en tiempo real actualizará automáticamente
    } catch (error) {
      console.error('Error al eliminar sala:', error);
      mostrarMensaje('error', error.message || 'Error al eliminar la sala');
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

  /**
   * Handler para cambiar la imagen del plano
   */
  const handleCambiarImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      mostrarMensaje('error', 'Formato no válido. Use PNG, JPG o WEBP');
      return;
    }

    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      mostrarMensaje('error', `Imagen muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 10MB`);
      return;
    }

    // Abrir editor de imagen
    setImagenParaEditar(file);
    setEditandoImagen(true);
  };

  const handleGuardarImagenEditada = async (imagenEditada) => {
    try {
      setEditandoImagen(false);
      setImagenParaEditar(null);
      setSubiendoImagen(true);
      setProgresoSubida(0);

      await actualizarImagenPiso(pisoSeleccionado, imagenEditada, (progreso) => {
        setProgresoSubida(progreso);
      });

      mostrarMensaje('success', '¡Imagen del plano actualizada exitosamente!');
      
      // Recargar pisos para actualizar galería
      const pisosActualizados = await obtenerPisosPorEdificio(edificioSeleccionado);
      setPisosDisponibles(pisosActualizados);

      // Recargar la imagen después de un delay para que Cloudinary la procese
      setTimeout(() => {
        if (imagenRef.current) {
          const pisoActual = pisosActualizados.find(p => p.id === pisoSeleccionado);
          if (pisoActual?.imagenURL) {
            imagenRef.current.src = pisoActual.imagenURL + '?t=' + Date.now();
          }
        }
      }, 1000);
    } catch (error) {
      console.error('Error al subir imagen:', error);
      mostrarMensaje('error', error.message || 'Error al subir la imagen');
    } finally {
      setSubiendoImagen(false);
      setProgresoSubida(0);
      // Limpiar el input
      if (inputImagenRef.current) {
        inputImagenRef.current.value = '';
      }
    }
  };

  const handleCancelarEdicion = () => {
    setEditandoImagen(false);
    setImagenParaEditar(null);
    if (inputImagenRef.current) {
      inputImagenRef.current.value = '';
    }
  };

  const handleImagenRestaurada = async () => {
    // Recargar pisos para actualizar la imagen mostrada
    const pisosActualizados = await obtenerPisosPorEdificio(edificioSeleccionado);
    setPisosDisponibles(pisosActualizados);
    
    // Recargar imagen
    setTimeout(() => {
      if (imagenRef.current) {
        const pisoActual = pisosActualizados.find(p => p.id === pisoSeleccionado);
        if (pisoActual?.imagenURL) {
          imagenRef.current.src = pisoActual.imagenURL + '?t=' + Date.now();
        }
      }
    }, 500);
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

  // Obtener datos completos para el header y la imagen
  const pisoActual = pisosDisponibles.find(p => p.id === pisoSeleccionado);
  const edificioActual = edificiosDisponibles.find(e => e.id === edificioSeleccionado);
  const sedeActual = sedesDisponibles.find(s => s.id === sedeSeleccionada);

  // Obtener URL de imagen del piso
  const imagenPlanoURL = pisoActual?.imagenURL || `/planos/piso${pisoActual?.numero || 1}.jpg`;

  return (
    <div className="space-y-4 relative">
      {/* Header con título */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-dark dark:text-text-dark-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">map</span>
            Editor de Planos
          </h2>
          {pisoActual && (
            <p className="text-sm text-gray-600 dark:text-text-dark-secondary mt-1">
              {sedeActual?.nombre} → {edificioActual?.nombre} → Piso {pisoActual.numero}
            </p>
          )}
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
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={!pisoSeleccionado}
        >
          <span className="material-symbols-outlined text-sm">
            {modoEdicion ? 'close' : 'edit'}
          </span>
          {modoEdicion ? 'Desactivar' : 'Activar'} Edición
        </button>
      </div>

      {/* Filtros jerárquicos: Sede → Edificio → Piso */}
      <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-4">
          {/* Selector de Sede */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-text-dark-secondary">
              Sede *
            </label>
            <select
              value={sedeSeleccionada}
              onChange={(e) => handleSedeChange(e.target.value)}
              className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="" className="dark:bg-neutral-dark">Seleccionar sede...</option>
              {sedesDisponibles.map((sede) => (
                <option key={sede.id} value={sede.id} className="dark:bg-neutral-dark">
                  {sede.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Edificio */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-text-dark-secondary">
              Edificio *
            </label>
            <select
              value={edificioSeleccionado}
              onChange={(e) => handleEdificioChange(e.target.value)}
              className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={!sedeSeleccionada}
            >
              <option value="" className="dark:bg-neutral-dark">
                {sedeSeleccionada ? 'Seleccionar edificio...' : 'Primero selecciona una sede'}
              </option>
              {edificiosDisponibles.map((edificio) => (
                <option key={edificio.id} value={edificio.id} className="dark:bg-neutral-dark">
                  {edificio.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Piso */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-text-dark-secondary">
              Piso *
            </label>
            <select
              value={pisoSeleccionado}
              onChange={(e) => handlePisoChange(e.target.value)}
              className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={!edificioSeleccionado}
            >
              <option value="" className="dark:bg-neutral-dark">
                {edificioSeleccionado ? 'Seleccionar piso...' : 'Primero selecciona un edificio'}
              </option>
              {pisosDisponibles.map((piso) => (
                <option key={piso.id} value={piso.id} className="dark:bg-neutral-dark">
                  Piso {piso.numero} - {piso.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Información adicional */}
        {pisoSeleccionado && (
          <div className="mt-4 rounded-lg bg-primary/10 dark:bg-primary/20 p-3 text-sm text-primary dark:text-primary">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">info</span>
              <p>
                Mostrando {salasDelPiso.length} sala{salasDelPiso.length !== 1 ? 's' : ''} en este piso.
                {modoEdicion ? ' Click en el plano para agregar nuevas salas.' : ' Activa el modo edición para gestionar salas.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mensajes flotantes - Posición fija sin mover contenido */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4 pointer-events-none">
        {mensaje.texto && (
          <div className={`rounded-lg p-3 shadow-lg pointer-events-auto animate-slideDown ${
            mensaje.tipo === 'success'
              ? 'bg-success/10 text-success border border-success/30 dark:bg-success/20 dark:border-success/40'
              : 'bg-danger/10 text-danger border border-danger/30 dark:bg-danger/20 dark:border-danger/40'
          }`}>
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
          <div className="bg-success/10 border border-success/30 dark:bg-success/20 dark:border-success/40 rounded-lg p-3 shadow-lg pointer-events-auto animate-slideDown mt-2">
            <div className="flex items-center gap-2 text-success">
              <span className="material-symbols-outlined animate-pulse">touch_app</span>
              <div className="flex-1">
                <p className="font-bold">Moviendo sala: {salaArrastrada.nombre}</p>
                <p className="text-sm">Haz clic donde quieras colocarla, o vuelve a hacer clic en la sala para cancelar</p>
              </div>
            </div>
          </div>
        )}

        {/* Instrucciones cuando está en modo edición - Dismissible */}
        {modoEdicion && !arrastrando && mostrarMensajeEdicion && (
          <div className="bg-primary/10 border border-primary/30 dark:bg-primary/20 dark:border-primary/40 rounded-lg p-3 shadow-lg pointer-events-auto animate-slideDown mt-2">
            <div className="flex items-start gap-2 text-primary">
              <span className="material-symbols-outlined">info</span>
              <div className="flex-1">
                <p className="font-medium mb-1">Modo Edición Activo:</p>
                <ul className="text-sm space-y-1 ml-4 list-disc">
                  <li><strong>Crear sala:</strong> Haz clic en el plano donde quieras ubicarla</li>
                  <li><strong>Mover sala:</strong> 1) Haz clic en la sala para tomarla, 2) Haz clic donde quieras colocarla</li>
                </ul>
              </div>
              <button
                onClick={() => setMostrarMensajeEdicion(false)}
                className="text-primary hover:bg-primary/20 p-1 rounded transition-colors"
                title="Cerrar mensaje"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Layout: Plano a ancho completo + Panel inferior colapsable */}
      <div className="space-y-4">

        {pisoSeleccionado && pisoActual ? (
        <>
        {/* Plano Interactivo - Ancho completo */}
        <div>
          <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark shadow-soft overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">location_on</span>
                  Plano Interactivo - {pisoActual.nombre || `Piso ${pisoActual.numero}`}
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {salasDelPiso.length} salas
                  </span>
                  {/* Botón para ver galería */}
                  <button
                    onClick={() => setMostrarGaleria(!mostrarGaleria)}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    title="Ver historial de imágenes"
                  >
                    <span className="material-symbols-outlined text-sm">
                      photo_library
                    </span>
                    Historial
                  </button>
                  {/* Botón para cambiar imagen del plano */}
                  <button
                    onClick={() => inputImagenRef.current?.click()}
                    disabled={subiendoImagen}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cambiar imagen del plano"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {subiendoImagen ? 'sync' : 'upload'}
                    </span>
                    {subiendoImagen ? `Subiendo... ${progresoSubida}%` : 'Cambiar Imagen'}
                  </button>
                  <input
                    ref={inputImagenRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleCambiarImagen}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Contenedor con aspect ratio fijo 16:9 para consistencia entre vistas */}
            <div
              ref={contenedorPlanoRef}
              className="relative select-none bg-neutral-light/30 dark:bg-neutral-dark/30 rounded-lg overflow-hidden flex items-center justify-center"
              style={{
                aspectRatio: '16 / 9',
                cursor: arrastrando ? 'crosshair' : (modoEdicion ? 'crosshair' : 'default')
              }}
              onMouseMove={handleMouseMovePlano}
              onClick={handleClickEnPlano}
            >
              <img
                ref={imagenRef}
                src={imagenPlanoURL}
                alt={pisoActual ? `Plano ${pisoActual.nombre || `Piso ${pisoActual.numero}`}` : 'Plano del piso'}
                className="object-contain pointer-events-none"
                style={{ width: '100%', height: '100%' }}
                draggable={false}
                onError={(e) => {
                  console.error('Error al cargar imagen del plano:', imagenPlanoURL);
                  e.target.src = '/planos/placeholder.jpg'; // Fallback
                }}
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
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999
                  }}
                >
                  <div className="bg-yellow-400 text-gray-800 px-2 py-1 rounded shadow-lg text-xs font-bold pulse flex items-center gap-1" style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add_location</span>
                    Nueva Sala
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel Acordeón: Formulario o Lista de Salas */}
        <div ref={panelAcordeonRef} className="rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-card-bg-dark shadow-soft overflow-hidden">
          {/* Header clickeable para expandir/colapsar */}
          <button
            onClick={() => {
              const nuevoEstado = !panelLateralAbierto;
              setPanelLateralAbierto(nuevoEstado);

              // Si se está expandiendo, hacer scroll al panel después de un pequeño delay
              if (nuevoEstado && panelAcordeonRef.current) {
                setTimeout(() => {
                  panelAcordeonRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }, 100);
              }
            }}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-3 flex items-center justify-between hover:from-primary/90 hover:to-primary/70 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">
                {mostrandoFormulario ? 'add_circle' : 'list'}
              </span>
              <h4 className="font-bold">
                {mostrandoFormulario ? 'Nueva Sala' : `Salas en ${pisoActual?.nombre || `Piso ${pisoActual?.numero}`}`}
              </h4>
              <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                {salasDelPiso.length}
              </span>
            </div>
            <span className="material-symbols-outlined transition-transform" style={{ transform: panelLateralAbierto ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              expand_more
            </span>
          </button>

          {/* Contenido colapsable */}
          {panelLateralAbierto && (
          <div className="p-4 max-h-96 overflow-y-auto border-t border-neutral-light dark:border-border-dark">

          {/* Formulario de Nueva Sala */}
          {mostrandoFormulario ? (
              <div className="space-y-3">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-text-dark-secondary mb-1">Nombre *</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400 dark:placeholder:text-text-dark-secondary"
                    value={formulario.nombre}
                    onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                    placeholder="A310, LAB-01"
                  />
                </div>

                {/* Capacidad y Tipo */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-text-dark-secondary mb-1">Capacidad</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formulario.capacidad}
                      onChange={(e) => setFormulario({ ...formulario, capacidad: e.target.value })}
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-text-dark-secondary mb-1">Tipo</label>
                    <select
                      className="w-full rounded-lg border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formulario.tipo}
                      onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
                    >
                      {tiposSala.map(tipo => (
                        <option key={tipo.value} value={tipo.value} className="dark:bg-neutral-dark">{tipo.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Equipamiento */}
                <div className="border-t border-neutral-light dark:border-border-dark pt-3">
                  <h5 className="text-sm font-bold text-gray-700 dark:text-text-dark-primary mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>settings</span>
                    Equipamiento
                  </h5>

                  {/* Checkboxes en grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-text-dark-secondary cursor-pointer">
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

                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-text-dark-secondary cursor-pointer">
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

                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-text-dark-secondary cursor-pointer">
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

                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-text-dark-secondary cursor-pointer">
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

                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-text-dark-secondary cursor-pointer">
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
                      <label className="block text-xs text-gray-600 dark:text-text-dark-secondary mb-1">Computadores</label>
                      <input
                        type="number"
                        className="w-full rounded border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-2 py-1 text-sm"
                        value={formulario.equipamiento.computadores}
                        onChange={(e) => setFormulario({
                          ...formulario,
                          equipamiento: { ...formulario.equipamiento, computadores: e.target.value }
                        })}
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-text-dark-secondary mb-1">Enchufes</label>
                      <input
                        type="number"
                        className="w-full rounded border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-2 py-1 text-sm"
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
                    <label className="block text-xs text-gray-600 dark:text-text-dark-secondary mb-1">Pizarra</label>
                    <select
                      className="w-full rounded border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary px-2 py-1 text-sm"
                      value={formulario.equipamiento.pizarra}
                      onChange={(e) => setFormulario({
                        ...formulario,
                        equipamiento: { ...formulario.equipamiento, pizarra: e.target.value }
                      })}
                    >
                      {tiposPizarra.map(tipo => (
                        <option key={tipo.value} value={tipo.value} className="dark:bg-neutral-dark">{tipo.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleGuardarSala}
                    className="flex-1 bg-success text-white px-4 py-2 rounded-lg font-semibold hover:bg-success/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    Guardar
                  </button>
                  <button
                    onClick={limpiarFormulario}
                    className="flex-1 bg-gray-400 dark:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    Cancelar
                  </button>
                </div>
              </div>
          ) : (
            /* Lista de Salas del Piso */
            <div>
                {salasDelPiso.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-text-dark-secondary">
                    <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
                    <p className="text-sm">No hay salas en este piso</p>
                    <p className="text-xs mt-1">Activa el modo edición para agregar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {salasDelPiso.map(sala => (
                      <div key={sala.id} className="border border-neutral-light dark:border-border-dark rounded-lg p-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-bold text-neutral-dark dark:text-text-dark-primary">{sala.nombre}</h5>
                            <p className="text-xs text-gray-600 dark:text-text-dark-secondary mt-1">
                              {tiposSala.find(t => t.value === sala.tipo)?.label} • {sala.capacidad} personas
                            </p>
                            {sala.coordenadas && (
                              <p className="text-xs text-gray-500 dark:text-text-dark-secondary mt-1">
                                📍 ({sala.coordenadas.x.toFixed(1)}%, {sala.coordenadas.y.toFixed(1)}%)
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleEliminarSala(sala.id, sala.nombre)}
                            className="text-danger hover:bg-danger/10 p-1 rounded transition-colors"
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
          )}

          </div>
          )}
        </div>
        </>
        ) : (
          // Mensaje cuando no hay piso seleccionado
          <div>
            <div className="rounded-lg border border-neutral-light dark:border-border-dark bg-neutral-light/30 dark:bg-neutral-dark/30 p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600 mb-4 block">map</span>
              <h3 className="text-xl font-bold text-neutral-dark dark:text-text-dark-primary mb-2">Selecciona un piso para ver el plano</h3>
              <p className="text-gray-500 dark:text-text-dark-secondary">Usa los filtros arriba para elegir Sede → Edificio → Piso</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Editor de Imagen */}
      {editandoImagen && imagenParaEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <EditorImagen
              imagenFile={imagenParaEditar}
              onGuardar={handleGuardarImagenEditada}
              onCancelar={handleCancelarEdicion}
            />
          </div>
        </div>
      )}

      {/* Modal de Galería */}
      {mostrarGaleria && pisoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button
                onClick={() => setMostrarGaleria(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
              <GaleriaImagenes
                pisoActual={pisosDisponibles.find(p => p.id === pisoSeleccionado)}
                onImagenRestaurada={handleImagenRestaurada}
              />
            </div>
          </div>
        </div>
      )}

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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        button:disabled .material-symbols-outlined {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default EditorPlanos;
