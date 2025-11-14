import { useState, useEffect } from 'react';
import {
  obtenerEdificios,
  obtenerEdificiosPorSede,
  crearEdificio,
  actualizarEdificio,
  eliminarEdificio
} from '../services/edificiosService';
import {
  obtenerPisosPorEdificio,
  crearPiso,
  actualizarPiso,
  eliminarPiso,
  actualizarImagenPiso
} from '../services/pisosService';
import { obtenerSedes } from '../services/sedesService';

export default function GestionEdificios() {
  const [edificios, setEdificios] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [pisosPorEdificio, setPisosPorEdificio] = useState({}); // { edificioId: [pisos] }
  const [edificiosExpandidos, setEdificiosExpandidos] = useState({}); // { edificioId: true/false }
  const [sedeSeleccionada, setSedeSeleccionada] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [edificioEditar, setEdificioEditar] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Estados para Pisos
  const [modoEdicionPiso, setModoEdicionPiso] = useState(false);
  const [pisoEditar, setPisoEditar] = useState(null);
  const [edificioParaPiso, setEdificioParaPiso] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenFile, setImagenFile] = useState(null);

  // Formulario Edificio
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    sedeId: '',
    descripcion: '',
    activo: true
  });

  // Formulario Piso
  const [formDataPiso, setFormDataPiso] = useState({
    numero: '',
    edificioId: '',
    activo: true
  });

  // Cargar sedes y edificios al montar
  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar edificios cuando cambia el filtro de sede
  useEffect(() => {
    cargarEdificios();
  }, [sedeSeleccionada]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar sedes (solo activas para selector)
      const sedesData = await obtenerSedes(true);
      setSedes(sedesData);

      // Cargar edificios
      await cargarEdificios();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarMensaje(error.message || 'Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarEdificios = async () => {
    try {
      let edificiosData;
      if (sedeSeleccionada === 'todas') {
        // Obtener TODOS los edificios (activos e inactivos) para panel admin
        edificiosData = await obtenerEdificios(false);
      } else {
        edificiosData = await obtenerEdificiosPorSede(sedeSeleccionada, false);
      }

      setEdificios(edificiosData);
    } catch (error) {
      console.error('Error al cargar edificios:', error);
      mostrarMensaje(error.message || 'Error al cargar edificios', 'error');
    }
  };

  const cargarPisosDeEdificio = async (edificioId) => {
    try {
      // Obtener TODOS los pisos (activos e inactivos) para panel admin
      const pisosData = await obtenerPisosPorEdificio(edificioId, false);
      setPisosPorEdificio(prev => ({
        ...prev,
        [edificioId]: pisosData
      }));
    } catch (error) {
      console.error('Error al cargar pisos:', error);
      mostrarMensaje(error.message || 'Error al cargar pisos', 'error');
    }
  };

  const toggleEdificio = async (edificioId) => {
    const yaExpandido = edificiosExpandidos[edificioId];

    setEdificiosExpandidos(prev => ({
      ...prev,
      [edificioId]: !yaExpandido
    }));

    // Si se está expandiendo y no tiene pisos cargados, cargarlos
    if (!yaExpandido && !pisosPorEdificio[edificioId]) {
      await cargarPisosDeEdificio(edificioId);
    }
  };

  const mostrarMensaje = (texto, tipo = 'info') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleInputChangePiso = (e) => {
    const { name, value, type, checked } = e.target;
    setFormDataPiso(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        mostrarMensaje('Por favor selecciona un archivo de imagen válido', 'error');
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        mostrarMensaje('La imagen es muy grande. Máximo 5MB', 'error');
        return;
      }

      setImagenFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ========== EDIFICIOS ==========
  const abrirFormularioCrear = () => {
    setFormData({
      nombre: '',
      codigo: '',
      sedeId: sedeSeleccionada !== 'todas' ? sedeSeleccionada : '',
      descripcion: '',
      activo: true
    });
    setEdificioEditar(null);
    setModoEdicion(true);
  };

  const abrirFormularioEditar = (edificio) => {
    setFormData({
      nombre: edificio.nombre,
      codigo: edificio.codigo,
      sedeId: edificio.sedeId,
      descripcion: edificio.descripcion || '',
      activo: edificio.activo
    });
    setEdificioEditar(edificio);
    setModoEdicion(true);
  };

  const cerrarFormulario = () => {
    setModoEdicion(false);
    setEdificioEditar(null);
    setFormData({
      nombre: '',
      codigo: '',
      sedeId: '',
      descripcion: '',
      activo: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre.trim() || !formData.codigo.trim() || !formData.sedeId) {
      mostrarMensaje('Nombre, código y sede son obligatorios', 'error');
      return;
    }

    try {
      if (edificioEditar) {
        // Actualizar edificio existente
        await actualizarEdificio(edificioEditar.id, formData);
        mostrarMensaje('Edificio actualizado exitosamente', 'success');
      } else {
        // Crear nuevo edificio
        await crearEdificio(formData);
        mostrarMensaje('Edificio creado exitosamente', 'success');
      }

      cerrarFormulario();
      cargarEdificios();
    } catch (error) {
      console.error('Error al guardar edificio:', error);
      mostrarMensaje(error.message || 'Error al guardar edificio', 'error');
    }
  };

  const handleEliminar = async (edificio) => {
    if (!confirm(`¿Está seguro de eliminar el edificio "${edificio.nombre}"?\n\nEsta acción no se puede deshacer y eliminará todos los pisos y salas asociadas.`)) {
      return;
    }

    try {
      await eliminarEdificio(edificio.id);
      mostrarMensaje('Edificio eliminado exitosamente', 'success');
      cargarEdificios();
    } catch (error) {
      console.error('Error al eliminar edificio:', error);
      mostrarMensaje(error.message || 'Error al eliminar edificio', 'error');
    }
  };

  const toggleActivo = async (edificio) => {
    try {
      await actualizarEdificio(edificio.id, { activo: !edificio.activo });
      mostrarMensaje(
        `Edificio ${!edificio.activo ? 'activado' : 'desactivado'} exitosamente`,
        'success'
      );
      cargarEdificios();
    } catch (error) {
      console.error('Error al actualizar edificio:', error);
      mostrarMensaje(error.message || 'Error al actualizar edificio', 'error');
    }
  };

  // ========== PISOS ==========
  const abrirFormularioCrearPiso = (edificio) => {
    console.log('🔵 [GestionEdificios] Abriendo formulario crear piso para edificio:', { id: edificio.id, nombre: edificio.nombre });
    setFormDataPiso({
      numero: '',
      edificioId: edificio.id,
      activo: true
    });
    setPisoEditar(null);
    setEdificioParaPiso(edificio);
    setImagenPreview(null);
    setImagenFile(null);
    setModoEdicionPiso(true);
    console.log('🔵 [GestionEdificios] formDataPiso establecido con edificioId:', edificio.id);
  };

  const abrirFormularioEditarPiso = (piso, edificio) => {
    setFormDataPiso({
      numero: piso.numero,
      edificioId: piso.edificioId,
      activo: piso.activo
    });
    setPisoEditar(piso);
    setEdificioParaPiso(edificio);
    setImagenPreview(piso.imagenURL || null);
    setImagenFile(null);
    setModoEdicionPiso(true);
  };

  const cerrarFormularioPiso = () => {
    setModoEdicionPiso(false);
    setPisoEditar(null);
    setEdificioParaPiso(null);
    setFormDataPiso({
      numero: '',
      edificioId: '',
      activo: true
    });
    setImagenPreview(null);
    setImagenFile(null);
  };

  const handleSubmitPiso = async (e) => {
    e.preventDefault();

    console.log('🟢 [GestionEdificios] handleSubmitPiso - formDataPiso:', formDataPiso);
    console.log('🟢 [GestionEdificios] handleSubmitPiso - edificioParaPiso:', edificioParaPiso);

    // Validaciones
    if (!formDataPiso.numero || !formDataPiso.edificioId) {
      mostrarMensaje('Número de piso y edificio son obligatorios', 'error');
      return;
    }

    // Validar que haya imagen si es creación
    if (!pisoEditar && !imagenFile) {
      mostrarMensaje('Debes seleccionar una imagen del plano', 'error');
      return;
    }

    try {
      if (pisoEditar) {
        // Si hay nueva imagen, actualizarla
        if (imagenFile) {
          await actualizarImagenPiso(pisoEditar.id, imagenFile);
        }

        // Actualizar datos del piso
        await actualizarPiso(pisoEditar.id, formDataPiso);
        mostrarMensaje('Piso actualizado exitosamente', 'success');
      } else {
        // Crear nuevo piso
        console.log('🟢 [GestionEdificios] Llamando crearPiso con:', formDataPiso);
        await crearPiso(formDataPiso, imagenFile);
        mostrarMensaje('Piso creado exitosamente', 'success');
      }

      cerrarFormularioPiso();
      // Recargar pisos del edificio
      await cargarPisosDeEdificio(formDataPiso.edificioId);
    } catch (error) {
      console.error('Error al guardar piso:', error);
      mostrarMensaje(error.message || 'Error al guardar piso', 'error');
    }
  };

  const handleEliminarPiso = async (piso) => {
    if (!confirm(`¿Está seguro de eliminar el Piso ${piso.numero}?\n\nEsta acción eliminará todas las salas del piso y su imagen de plano.`)) {
      return;
    }

    try {
      await eliminarPiso(piso.id);
      mostrarMensaje('Piso eliminado exitosamente', 'success');
      // Recargar pisos del edificio
      await cargarPisosDeEdificio(piso.edificioId);
    } catch (error) {
      console.error('Error al eliminar piso:', error);
      mostrarMensaje(error.message || 'Error al eliminar piso', 'error');
    }
  };

  const toggleActivoPiso = async (piso) => {
    try {
      await actualizarPiso(piso.id, { activo: !piso.activo });
      mostrarMensaje(
        `Piso ${!piso.activo ? 'activado' : 'desactivado'} exitosamente`,
        'success'
      );
      // Recargar pisos del edificio
      await cargarPisosDeEdificio(piso.edificioId);
    } catch (error) {
      console.error('Error al actualizar piso:', error);
      mostrarMensaje(error.message || 'Error al actualizar piso', 'error');
    }
  };

  // Agrupar edificios por sede
  const edificiosPorSede = edificios.reduce((acc, edificio) => {
    const sede = edificio.sedeNombre || 'Sin sede';
    if (!acc[sede]) {
      acc[sede] = [];
    }
    acc[sede].push(edificio);
    return acc;
  }, {});

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🏢 Gestión de Edificios y Pisos</h2>
          <p className="text-gray-600 mt-1">Administra los edificios de cada sede y sus pisos</p>
        </div>
        <button
          onClick={abrirFormularioCrear}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={sedes.length === 0}
        >
          + Crear Edificio
        </button>
      </div>

      {/* Mensajes */}
      {mensaje.texto && (
        <div className={`mb-4 p-4 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' :
          mensaje.tipo === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Filtro por Sede */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Filtrar por Sede
        </label>
        <select
          value={sedeSeleccionada}
          onChange={(e) => setSedeSeleccionada(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="todas">Todas las Sedes</option>
          {sedes.map(sede => (
            <option key={sede.id} value={sede.id}>
              {sede.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Aviso si no hay sedes */}
      {sedes.length === 0 && (
        <div className="text-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-800 mb-2">⚠️ No hay sedes creadas</p>
          <p className="text-yellow-700 text-sm">
            Primero debes crear al menos una sede antes de crear edificios
          </p>
        </div>
      )}

      {/* Lista de Edificios */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando edificios...</p>
        </div>
      ) : edificios.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {sedeSeleccionada === 'todas'
              ? 'No hay edificios creados aún'
              : 'No hay edificios en esta sede'
            }
          </p>
          {sedes.length > 0 && (
            <button
              onClick={abrirFormularioCrear}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crear Primer Edificio
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(edificiosPorSede).map(([sedeNombre, edificiosSede]) => (
            <div key={sedeNombre}>
              <h3 className="text-lg font-bold text-gray-700 mb-3">
                📍 {sedeNombre}
              </h3>
              <div className="grid gap-4">
                {edificiosSede.map(edificio => {
                  const expandido = edificiosExpandidos[edificio.id];
                  const pisos = pisosPorEdificio[edificio.id] || [];

                  return (
                    <div
                      key={edificio.id}
                      className={`border rounded-lg ${
                        edificio.activo ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      {/* Header del Edificio */}
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-bold text-gray-800">{edificio.nombre}</h4>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                edificio.activo
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {edificio.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <p className="text-gray-600">
                                <span className="font-semibold">Código:</span> {edificio.codigo}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-semibold">Sede:</span> {edificio.sedeNombre}
                              </p>
                              {edificio.descripcion && (
                                <p className="text-gray-600">
                                  <span className="font-semibold">Descripción:</span> {edificio.descripcion}
                                </p>
                              )}
                              <p className="text-gray-500 text-sm">
                                Creado: {edificio.fechaCreacion?.toDate().toLocaleDateString('es-CL')}
                              </p>
                            </div>
                          </div>

                          {/* Acciones del Edificio */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleEdificio(edificio.id)}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
                              title={expandido ? 'Ocultar pisos' : 'Ver pisos'}
                            >
                              {expandido ? '▼' : '▶'} Pisos
                            </button>
                            <button
                              onClick={() => toggleActivo(edificio)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                edificio.activo
                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              title={edificio.activo ? 'Desactivar' : 'Activar'}
                            >
                              {edificio.activo ? '⏸️' : '▶️'}
                            </button>
                            <button
                              onClick={() => abrirFormularioEditar(edificio)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleEliminar(edificio)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Sección de Pisos (Expandible) */}
                      {expandido && (
                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="font-semibold text-gray-700">🏗️ Pisos de este edificio</h5>
                            <button
                              onClick={() => abrirFormularioCrearPiso(edificio)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                            >
                              + Agregar Piso
                            </button>
                          </div>

                          {pisos.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                              <p className="text-gray-500 mb-2">No hay pisos en este edificio</p>
                              <button
                                onClick={() => abrirFormularioCrearPiso(edificio)}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Crear primer piso
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {pisos.map(piso => (
                                <div
                                  key={piso.id}
                                  className={`p-3 rounded-lg flex gap-3 ${
                                    piso.activo ? 'bg-white border border-gray-200' : 'bg-gray-100 border border-gray-300'
                                  }`}
                                >
                                  {/* Preview de imagen */}
                                  <div className="flex-shrink-0">
                                    {piso.imagenURL ? (
                                      <img
                                        src={piso.imagenURL}
                                        alt={`Plano Piso ${piso.numero}`}
                                        className="w-20 h-16 object-cover rounded border border-gray-200"
                                      />
                                    ) : (
                                      <div className="w-20 h-16 bg-gray-200 rounded flex items-center justify-center">
                                        <span className="text-gray-400 text-xs">Sin imagen</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Información del piso */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-800">Piso {piso.numero}</span>
                                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                        piso.activo
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-200 text-gray-700'
                                      }`}>
                                        {piso.activo ? 'Activo' : 'Inactivo'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Creado: {piso.fechaCreacion?.toDate().toLocaleDateString('es-CL')}
                                    </p>
                                  </div>

                                  {/* Acciones del piso */}
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => toggleActivoPiso(piso)}
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        piso.activo
                                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                                      }`}
                                      title={piso.activo ? 'Desactivar' : 'Activar'}
                                    >
                                      {piso.activo ? '⏸️' : '▶️'}
                                    </button>
                                    <button
                                      onClick={() => abrirFormularioEditarPiso(piso, edificio)}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleEliminarPiso(piso)}
                                      className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-medium"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Formulario Edificio */}
      {modoEdicion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {edificioEditar ? 'Editar Edificio' : 'Crear Nuevo Edificio'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Sede *
                  </label>
                  <select
                    name="sedeId"
                    value={formData.sedeId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar sede...</option>
                    {sedes.map(sede => (
                      <option key={sede.id} value={sede.id}>
                        {sede.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nombre del Edificio *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Edificio Principal"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Código del Edificio *
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleInputChange}
                    placeholder="Ej: PRINCIPAL o A"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se convertirá automáticamente a mayúsculas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    placeholder="Ej: Edificio de aulas teóricas"
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="activo"
                    id="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="activo" className="ml-2 text-sm text-gray-700">
                    Edificio activo
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={cerrarFormulario}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {edificioEditar ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulario Piso */}
      {modoEdicionPiso && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {pisoEditar ? 'Editar Piso' : `Crear Nuevo Piso - ${edificioParaPiso?.nombre}`}
              </h3>

              <form onSubmit={handleSubmitPiso} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Número de Piso *
                  </label>
                  <input
                    type="number"
                    name="numero"
                    value={formDataPiso.numero}
                    onChange={handleInputChangePiso}
                    placeholder="Ej: 1, 2, 3, 4"
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Imagen del Plano {!pisoEditar && '*'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImagenChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos: JPG, PNG, WebP. Tamaño máximo: 5MB
                  </p>
                </div>

                {/* Preview de imagen */}
                {imagenPreview && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Vista Previa
                    </label>
                    <img
                      src={imagenPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="activo"
                    id="activoPiso"
                    checked={formDataPiso.activo}
                    onChange={handleInputChangePiso}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="activoPiso" className="ml-2 text-sm text-gray-700">
                    Piso activo
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={cerrarFormularioPiso}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {pisoEditar ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
