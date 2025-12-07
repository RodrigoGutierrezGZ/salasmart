/**
 * Componente GaleriaImagenes - Historial y gestión de imágenes de planos
 * Muestra versiones anteriores con opción de restaurar
 */

import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '../../config/cloudinary';
import { restaurarImagenHistorial } from '../../services/pisosService';
import { fetchImageWithCache } from '../../utils/imageCache';

function GaleriaImagenes({ pisoActual, onImagenRestaurada }) {
  const [cargando, setCargando] = useState(false);
  const [imagenExpandida, setImagenExpandida] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [thumbnailURLs, setThumbnailURLs] = useState({});

  const historial = pisoActual?.historialImagenes || [];

  // Pre-cargar thumbnails con caché
  useEffect(() => {
    const cargarThumbnails = async () => {
      const urls = {};
      for (let i = 0; i < historial.length; i++) {
        const version = historial[i];
        if (version.imagenURL) {
          const thumbnailURL = obtenerURLThumbnail(version.imagenURL);
          const cachedURL = await fetchImageWithCache(thumbnailURL);
          urls[i] = cachedURL;
        }
      }
      setThumbnailURLs(urls);
    };

    if (historial.length > 0) {
      cargarThumbnails();
    }
  }, [historial]);

  const formatearFecha = (timestamp) => {
    if (!timestamp) return 'Fecha desconocida';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(fecha);
  };

  const formatearTamano = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleRestaurarImagen = async (indice) => {
    if (!confirm('¿Estás seguro de restaurar esta versión? La imagen actual se guardará en el historial.')) {
      return;
    }

    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      await restaurarImagenHistorial(pisoActual.id, indice);
      setMensaje({ tipo: 'success', texto: 'Imagen restaurada exitosamente' });
      
      // Notificar al padre para recargar datos
      if (onImagenRestaurada) {
        onImagenRestaurada();
      }

      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (error) {
      console.error('Error al restaurar imagen:', error);
      setMensaje({ tipo: 'error', texto: error.message || 'Error al restaurar imagen' });
    } finally {
      setCargando(false);
    }
  };

  const obtenerURLThumbnail = (imagenURL) => {
    if (!imagenURL) return null;
    
    // Si es de Cloudinary, optimizar
    if (imagenURL.includes('cloudinary.com')) {
      return getOptimizedImageUrl(imagenURL, {
        width: 300,
        height: 200,
        quality: 'auto:eco',
        crop: 'fill'
      });
    }
    
    return imagenURL;
  };

  if (historial.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
            history
          </span>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Historial de Imágenes
          </h3>
        </div>
        
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <span className="material-symbols-outlined text-5xl mb-2 opacity-50">
            photo_library
          </span>
          <p>No hay versiones anteriores de imágenes</p>
          <p className="text-sm mt-1">Las imágenes reemplazadas se guardarán aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
            history
          </span>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Historial de Imágenes
          </h3>
          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs font-medium">
            {historial.length} {historial.length === 1 ? 'versión' : 'versiones'}
          </span>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje.texto && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          mensaje.tipo === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
        }`}>
          <span className="material-symbols-outlined text-sm">
            {mensaje.tipo === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm">{mensaje.texto}</span>
        </div>
      )}

      {/* Grid de versiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {historial.map((version, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Imagen thumbnail */}
            <div 
              className="relative aspect-video bg-gray-100 dark:bg-gray-900 cursor-pointer group"
              onClick={() => setImagenExpandida(version)}
            >
              {version.imagenURL ? (
                <>
                  <img
                    src={thumbnailURLs[index] || obtenerURLThumbnail(version.imagenURL)}
                    alt={`Versión ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity">
                      zoom_in
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-gray-400">
                    broken_image
                  </span>
                </div>
              )}
              
              {/* Badge de versión */}
              <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                Versión {index + 1}
              </div>
            </div>

            {/* Metadata */}
            <div className="p-3 space-y-2">
              <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Reemplazada</p>
                  <p>{formatearFecha(version.fechaReemplazo)}</p>
                </div>
              </div>

              {version.imagenMetadata && (
                <>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="material-symbols-outlined text-sm">image</span>
                    <span>
                      {version.imagenMetadata.ancho || 0} × {version.imagenMetadata.alto || 0} px
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="material-symbols-outlined text-sm">storage</span>
                    <span>{formatearTamano(version.imagenMetadata.tamaño)}</span>
                  </div>

                  {version.imagenMetadata.formato && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="material-symbols-outlined text-sm">description</span>
                      <span>{version.imagenMetadata.formato.toUpperCase()}</span>
                    </div>
                  )}
                </>
              )}

              {/* Botón restaurar */}
              <button
                onClick={() => handleRestaurarImagen(index)}
                disabled={cargando}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">
                  {cargando ? 'hourglass_empty' : 'restore'}
                </span>
                {cargando ? 'Restaurando...' : 'Restaurar versión'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de imagen expandida */}
      {imagenExpandida && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setImagenExpandida(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <button
              onClick={() => setImagenExpandida(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            
            <img
              src={imagenExpandida.imagenURL}
              alt="Vista ampliada"
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Info overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
              <p className="text-sm mb-1">
                <strong>Fecha:</strong> {formatearFecha(imagenExpandida.fechaReemplazo)}
              </p>
              {imagenExpandida.imagenMetadata && (
                <>
                  <p className="text-sm mb-1">
                    <strong>Dimensiones:</strong> {imagenExpandida.imagenMetadata.ancho} × {imagenExpandida.imagenMetadata.alto} px
                  </p>
                  <p className="text-sm">
                    <strong>Tamaño:</strong> {formatearTamano(imagenExpandida.imagenMetadata.tamaño)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GaleriaImagenes;
