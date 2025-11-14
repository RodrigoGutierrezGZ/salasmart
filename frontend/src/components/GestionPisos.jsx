import { useState, useEffect } from 'react';
import {
  obtenerPisos,
  obtenerPisosPorEdificio,
  crearPiso,
  actualizarPiso,
  eliminarPiso,
  actualizarImagenPiso
} from '../services/pisosService';
import { obtenerSedes } from '../services/sedesService';
import { obtenerEdificiosPorSede } from '../services/edificiosService';

export default function GestionPisos() {
  const [pisos, setPisos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState('');
  const [edificioSeleccionado, setEdificioSeleccionado] = useState('');
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [pisoEditar, setPisoEditar] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenFile, setImagenFile] = useState(null);

  // Formulario
  const [formData, setFormData] = useState({
    numero: '',
    edificioId: '',
    activo: true
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarSedes();
  }, []);

  // Cargar edificios cuando cambia la sede
  useEffect(() => {
    if (sedeSeleccionada) {
      cargarEdificios(sedeSeleccionada);
    } else {
      setEdificios([]);
      setEdificioSeleccionado('');
    }
  }, [sedeSeleccionada]);

  // Cargar pisos cuando cambia el edificio
  useEffect(() => {
    if (edificioSeleccionado) {
      cargarPisos();
    } else {
      setPisos([]);
    }
  }, [edificioSeleccionado]);

  const cargarSedes = async () => {
    setLoading(true);
    try {
      const resultado = await obtenerSedes();
      if (resultado.success) {
        setSedes(resultado.data.filter(s => s.activa));
      }
    } catch (error) {
      console.error('Error al cargar sedes:', error);
      mostrarMensaje('Error al cargar sedes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarEdificios = async (sedeId) => {
    try {
      const resultado = await obtenerEdificiosPorSede(sedeId);
      if (resultado.success) {
        setEdificios(resultado.data.filter(e => e.activo));
      }
    } catch (error) {
      console.error('Error al cargar edificios:', error);
      mostrarMensaje('Error al cargar edificios', 'error');
    }
  };

  const cargarPisos = async () => {
    setLoading(true);
    try {
      const resultado = await obtenerPisosPorEdificio(edificioSeleccionado);
      if (resultado.success) {
        setPisos(resultado.data);
      } else {
        mostrarMensaje('Error al cargar pisos', 'error');
      }
    } catch (error) {
      console.error('Error al cargar pisos:', error);
      mostrarMensaje('Error al cargar pisos', 'error');
    } finally {
      setLoading(false);
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

  const abrirFormularioCrear = () => {
    if (!edificioSeleccionado) {
      mostrarMensaje('Por favor selecciona un edificio primero', 'error');
      return;
    }

    setFormData({
      numero: '',
      edificioId: edificioSeleccionado,
      activo: true
    });
    setPisoEditar(null);
    setImagenPreview(null);
    setImagenFile(null);
    setModoEdicion(true);
  };

  const abrirFormularioEditar = (piso) => {
    setFormData({
      numero: piso.numero,
      edificioId: piso.edificioId,
      activo: piso.activo
    });
    setPisoEditar(piso);
    setImagenPreview(piso.imagenURL || null);
    setImagenFile(null);
    setModoEdicion(true);
  };

  const cerrarFormulario = () => {
    setModoEdicion(false);
    setPisoEditar(null);
    setFormData({
      numero: '',
      edificioId: '',
      activo: true
    });
    setImagenPreview(null);
    setImagenFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.numero || !formData.edificioId) {
      mostrarMensaje('Número de piso y edificio son obligatorios', 'error');
      return;
    }

    // Validar que haya imagen si es creación
    if (!pisoEditar && !imagenFile) {
      mostrarMensaje('Debes seleccionar una imagen del plano', 'error');
      return;
    }

    try {
      let resultado;

      if (pisoEditar) {
        // Si hay nueva imagen, actualizarla
        if (imagenFile) {
          const resultadoImagen = await actualizarImagenPiso(pisoEditar.id, imagenFile);
          if (!resultadoImagen.success) {
            mostrarMensaje(resultadoImagen.error || 'Error al actualizar imagen', 'error');
            return;
          }
        }

        // Actualizar datos del piso
        resultado = await actualizarPiso(pisoEditar.id, formData);
        if (resultado.success) {
          mostrarMensaje('Piso actualizado exitosamente', 'success');
        }
      } else {
        // Crear nuevo piso
        resultado = await crearPiso(formData, imagenFile);
        if (resultado.success) {
          mostrarMensaje('Piso creado exitosamente', 'success');
        }
      }

      if (resultado.success) {
        cerrarFormulario();
        cargarPisos();
      } else {
        mostrarMensaje(resultado.error || 'Error al guardar piso', 'error');
      }
    } catch (error) {
      console.error('Error al guardar piso:', error);
      mostrarMensaje('Error al guardar piso', 'error');
    }
  };

  const handleEliminar = async (piso) => {
    if (!confirm(`¿Está seguro de eliminar el Piso ${piso.numero}?\n\nEsta acción eliminará todas las salas del piso y su imagen de plano.`)) {
      return;
    }

    try {
      const resultado = await eliminarPiso(piso.id);
      if (resultado.success) {
        mostrarMensaje('Piso eliminado exitosamente', 'success');
        cargarPisos();
      } else {
        mostrarMensaje(resultado.error || 'Error al eliminar piso', 'error');
      }
    } catch (error) {
      console.error('Error al eliminar piso:', error);
      mostrarMensaje('Error al eliminar piso', 'error');
    }
  };

  const toggleActivo = async (piso) => {
    try {
      const resultado = await actualizarPiso(piso.id, { activo: !piso.activo });
      if (resultado.success) {
        mostrarMensaje(
          `Piso ${!piso.activo ? 'activado' : 'desactivado'} exitosamente`,
          'success'
        );
        cargarPisos();
      } else {
        mostrarMensaje(resultado.error || 'Error al actualizar piso', 'error');
      }
    } catch (error) {
      console.error('Error al actualizar piso:', error);
      mostrarMensaje('Error al actualizar piso', 'error');
    }
  };

  const getNombreSede = () => {
    const sede = sedes.find(s => s.id === sedeSeleccionada);
    return sede ? sede.nombre : '';
  };

  const getNombreEdificio = () => {
    const edificio = edificios.find(e => e.id === edificioSeleccionado);
    return edificio ? edificio.nombre : '';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🏗️ Gestión de Pisos</h2>
          <p className="text-gray-600 mt-1">Administra los pisos de cada edificio</p>
        </div>
        <button
          onClick={abrirFormularioCrear}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={!edificioSeleccionado}
        >
          + Crear Piso
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

      {/* Filtros */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Seleccionar Sede
          </label>
          <select
            value={sedeSeleccionada}
            onChange={(e) => setSedeSeleccionada(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Seleccionar Sede --</option>
            {sedes.map(sede => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Seleccionar Edificio
          </label>
          <select
            value={edificioSeleccionado}
            onChange={(e) => setEdificioSeleccionado(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!sedeSeleccionada || edificios.length === 0}
          >
            <option value="">-- Seleccionar Edificio --</option>
            {edificios.map(edificio => (
              <option key={edificio.id} value={edificio.id}>
                {edificio.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Avisos */}
      {sedes.length === 0 && (
        <div className="text-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-800 mb-2">⚠️ No hay sedes creadas</p>
          <p className="text-yellow-700 text-sm">
            Primero debes crear sedes y edificios antes de crear pisos
          </p>
        </div>
      )}

      {sedeSeleccionada && edificios.length === 0 && (
        <div className="text-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-800 mb-2">⚠️ No hay edificios en esta sede</p>
          <p className="text-yellow-700 text-sm">
            Primero debes crear un edificio en {getNombreSede()}
          </p>
        </div>
      )}

      {/* Lista de Pisos */}
      {edificioSeleccionado && (
        <>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              <span className="font-semibold">Mostrando pisos de:</span> {getNombreEdificio()} - {getNombreSede()}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando pisos...</p>
            </div>
          ) : pisos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No hay pisos creados en este edificio</p>
              <button
                onClick={abrirFormularioCrear}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Crear Primer Piso
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {pisos.map(piso => (
                <div
                  key={piso.id}
                  className={`p-4 border rounded-lg ${
                    piso.activo ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Preview de imagen */}
                    <div className="flex-shrink-0">
                      {piso.imagenURL ? (
                        <img
                          src={piso.imagenURL}
                          alt={`Plano Piso ${piso.numero}`}
                          className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-sm">Sin imagen</span>
                        </div>
                      )}
                    </div>

                    {/* Información */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-800">Piso {piso.numero}</h4>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          piso.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {piso.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          <span className="font-semibold">Edificio:</span> {piso.edificioNombre}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-semibold">Sede:</span> {piso.sedeNombre || getNombreSede()}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Creado: {piso.fechaCreacion?.toDate().toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActivo(piso)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          piso.activo
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={piso.activo ? 'Desactivar' : 'Activar'}
                      >
                        {piso.activo ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => abrirFormularioEditar(piso)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(piso)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Formulario */}
      {modoEdicion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {pisoEditar ? 'Editar Piso' : 'Crear Nuevo Piso'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Número de Piso *
                  </label>
                  <input
                    type="number"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
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
                    id="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="activo" className="ml-2 text-sm text-gray-700">
                    Piso activo
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
