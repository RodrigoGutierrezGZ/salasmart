import { useState, useEffect } from 'react';
import {
  obtenerSedes,
  crearSede,
  actualizarSede,
  eliminarSede
} from '../../../services/sedesService';

export default function GestionSedes() {
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [sedeSeleccionada, setSedeSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    direccion: '',
    activa: true
  });

  // Cargar sedes al montar
  useEffect(() => {
    cargarSedes();
  }, []);

  const cargarSedes = async () => {
    setLoading(true);
    try {
      // Obtener TODAS las sedes (activas e inactivas) para el panel admin
      const sedesData = await obtenerSedes(false);
      setSedes(sedesData);
    } catch (error) {
      console.error('Error al cargar sedes:', error);
      mostrarMensaje('Error al cargar sedes', 'error');
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

  const abrirFormularioCrear = () => {
    setFormData({
      nombre: '',
      codigo: '',
      direccion: '',
      activa: true
    });
    setSedeSeleccionada(null);
    setModoEdicion(true);
  };

  const abrirFormularioEditar = (sede) => {
    setFormData({
      nombre: sede.nombre,
      codigo: sede.codigo,
      direccion: sede.direccion || '',
      activa: sede.activa
    });
    setSedeSeleccionada(sede);
    setModoEdicion(true);
  };

  const cerrarFormulario = () => {
    setModoEdicion(false);
    setSedeSeleccionada(null);
    setFormData({
      nombre: '',
      codigo: '',
      direccion: '',
      activa: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre.trim() || !formData.codigo.trim()) {
      mostrarMensaje('Nombre y código son obligatorios', 'error');
      return;
    }

    try {
      if (sedeSeleccionada) {
        // Actualizar sede existente
        await actualizarSede(sedeSeleccionada.id, formData);
        mostrarMensaje('Sede actualizada exitosamente', 'success');
      } else {
        // Crear nueva sede
        await crearSede(formData);
        mostrarMensaje('Sede creada exitosamente', 'success');
      }

      cerrarFormulario();
      cargarSedes();
    } catch (error) {
      console.error('Error al guardar sede:', error);
      mostrarMensaje(error.message || 'Error al guardar sede', 'error');
    }
  };

  const handleEliminar = async (sede) => {
    if (!confirm(`¿Está seguro de eliminar la sede "${sede.nombre}"?\n\nEsta acción no se puede deshacer y eliminará todos los edificios, pisos y salas asociadas.`)) {
      return;
    }

    try {
      await eliminarSede(sede.id);
      mostrarMensaje('Sede eliminada exitosamente', 'success');
      cargarSedes();
    } catch (error) {
      console.error('Error al eliminar sede:', error);
      mostrarMensaje(error.message || 'Error al eliminar sede', 'error');
    }
  };

  const toggleActiva = async (sede) => {
    try {
      await actualizarSede(sede.id, { activa: !sede.activa });
      mostrarMensaje(
        `Sede ${!sede.activa ? 'activada' : 'desactivada'} exitosamente`,
        'success'
      );
      cargarSedes();
    } catch (error) {
      console.error('Error al actualizar sede:', error);
      mostrarMensaje(error.message || 'Error al actualizar sede', 'error');
    }
  };

  // Filtrar sedes por búsqueda
  const sedesFiltradas = sedes.filter(sede =>
    sede.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    sede.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-dark dark:text-text-dark-primary">📍 Gestión de Sedes</h2>
          <p className="text-gray-600 dark:text-text-dark-secondary mt-1">Administra las sedes de la institución</p>
        </div>
        <button
          onClick={abrirFormularioCrear}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Crear Sede
        </button>
      </div>

      {/* Mensajes */}
      {mensaje.texto && (
        <div className={`mb-4 p-4 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-success/10 text-success dark:bg-success/20 dark:text-success' :
          mensaje.tipo === 'error' ? 'bg-danger/10 text-danger dark:bg-danger/20 dark:text-danger' :
          'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Buscador */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Buscar sede por nombre o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full px-4 py-2 border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-text-dark-secondary"
        />
      </div>

      {/* Lista de Sedes */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-text-dark-secondary">Cargando sedes...</p>
        </div>
      ) : sedesFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-neutral-light/30 dark:bg-neutral-dark/30 rounded-lg">
          <p className="text-gray-600 dark:text-text-dark-secondary">
            {busqueda ? 'No se encontraron sedes con ese criterio' : 'No hay sedes creadas aún'}
          </p>
          {!busqueda && (
            <button
              onClick={abrirFormularioCrear}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Crear Primera Sede
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {sedesFiltradas.map(sede => (
            <div
              key={sede.id}
              className={`p-4 border rounded-lg ${
                sede.activa
                  ? 'bg-white dark:bg-card-bg-dark border-neutral-light dark:border-border-dark'
                  : 'bg-neutral-light/50 dark:bg-neutral-dark/50 border-neutral-light dark:border-border-dark'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-neutral-dark dark:text-text-dark-primary">{sede.nombre}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      sede.activa
                        ? 'bg-success/10 text-success dark:bg-success/20'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {sede.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-600 dark:text-text-dark-secondary">
                      <span className="font-semibold">Código:</span> {sede.codigo}
                    </p>
                    {sede.direccion && (
                      <p className="text-gray-600 dark:text-text-dark-secondary">
                        <span className="font-semibold">Dirección:</span> {sede.direccion}
                      </p>
                    )}
                    <p className="text-gray-500 dark:text-text-dark-secondary text-sm">
                      Creada: {sede.fechaCreacion?.toDate().toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActiva(sede)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      sede.activa
                        ? 'bg-gray-100 dark:bg-neutral-dark text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-card-bg-dark-hover'
                        : 'bg-success/10 text-success hover:bg-success/20'
                    }`}
                    title={sede.activa ? 'Desactivar' : 'Activar'}
                  >
                    {sede.activa ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={() => abrirFormularioEditar(sede)}
                    className="px-3 py-1 bg-warning/10 text-warning rounded-lg hover:bg-warning/20 text-sm font-medium"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(sede)}
                    className="px-3 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 text-sm font-medium"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Formulario */}
      {modoEdicion && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card-bg-dark rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-neutral-light dark:border-border-dark">
            <div className="p-6">
              <h3 className="text-xl font-bold text-neutral-dark dark:text-text-dark-primary mb-4">
                {sedeSeleccionada ? 'Editar Sede' : 'Crear Nueva Sede'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-text-dark-secondary mb-1">
                    Nombre de la Sede *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: INACAP Renca"
                    required
                    className="w-full px-3 py-2 border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-text-dark-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-text-dark-secondary mb-1">
                    Código de la Sede *
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleInputChange}
                    placeholder="Ej: RENCA"
                    required
                    className="w-full px-3 py-2 border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-text-dark-secondary uppercase"
                  />
                  <p className="text-xs text-gray-500 dark:text-text-dark-secondary mt-1">
                    Se convertirá automáticamente a mayúsculas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-text-dark-secondary mb-1">
                    Dirección
                  </label>
                  <textarea
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    placeholder="Ej: Av. Departamental 233, Renca"
                    rows="2"
                    className="w-full px-3 py-2 border border-neutral-light dark:border-border-dark bg-white dark:bg-neutral-dark text-gray-900 dark:text-text-dark-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-text-dark-secondary"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="activa"
                    id="activa"
                    checked={formData.activa}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary border-gray-300 dark:border-border-dark rounded focus:ring-primary"
                  />
                  <label htmlFor="activa" className="ml-2 text-sm text-gray-700 dark:text-text-dark-secondary">
                    Sede activa
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={cerrarFormulario}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-neutral-dark text-gray-700 dark:text-text-dark-secondary rounded-lg hover:bg-gray-300 dark:hover:bg-card-bg-dark-hover font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-colors"
                  >
                    {sedeSeleccionada ? 'Actualizar' : 'Crear'}
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
