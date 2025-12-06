// src/services/cloudinaryService.js
// Servicio para subir imágenes a Cloudinary

import { CLOUDINARY_CONFIG, getUploadUrl, isCloudinaryConfigured } from '../config/cloudinary';

/**
 * Subir una imagen a Cloudinary
 * @param {File} file - Archivo de imagen a subir
 * @param {Object} options - Opciones adicionales
 * @param {string} options.folder - Carpeta donde guardar (opcional)
 * @param {Function} options.onProgress - Callback para progreso (opcional)
 * @returns {Promise<Object>} Datos de la imagen subida
 */
export async function uploadImageToCloudinary(file, options = {}) {
  try {
    // Verificar que Cloudinary esté configurado
    if (!isCloudinaryConfigured()) {
      throw new Error(
        'Cloudinary no está configurado. Por favor, edita src/config/cloudinary.js con tus credenciales.'
      );
    }

    console.log('📤 [cloudinaryService] Subiendo imagen a Cloudinary...');
    console.log('📁 [cloudinaryService] Archivo:', file.name, '- Tamaño:', (file.size / 1024 / 1024).toFixed(2), 'MB');

    // Validar archivo
    if (!file) {
      throw new Error('No se ha seleccionado ningún archivo');
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Formato de imagen no permitido. Use PNG, JPG, JPEG o WEBP');
    }

    // Validar tamaño (10MB máximo para Cloudinary free)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(
        `La imagen es muy grande (${(file.size / 1024 / 1024).toFixed(2)} MB). Máximo: 10 MB`
      );
    }

    // Crear FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    // Agregar folder si se especifica
    const folder = options.folder || CLOUDINARY_CONFIG.folder;
    if (folder) {
      formData.append('folder', folder);
    }

    // Configurar XMLHttpRequest para poder rastrear progreso
    const uploadUrl = getUploadUrl();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Event listener para progreso
      if (options.onProgress && typeof options.onProgress === 'function') {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            options.onProgress(percentComplete);
          }
        });
      }

      // Event listener para completado
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ [cloudinaryService] Imagen subida exitosamente');
            console.log('🔗 [cloudinaryService] URL:', response.secure_url);

            resolve({
              url: response.secure_url,
              publicId: response.public_id,
              format: response.format,
              width: response.width,
              height: response.height,
              bytes: response.bytes,
              createdAt: response.created_at,
              resourceType: response.resource_type,
              type: response.type
            });
          } catch (error) {
            console.error('❌ [cloudinaryService] Error al parsear respuesta:', error);
            reject(new Error('Error al procesar la respuesta de Cloudinary'));
          }
        } else {
          console.error('❌ [cloudinaryService] Error en upload:', xhr.status, xhr.statusText);
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error?.message || 'Error al subir la imagen'));
          } catch {
            reject(new Error(`Error al subir la imagen: ${xhr.status} ${xhr.statusText}`));
          }
        }
      });

      // Event listener para errores
      xhr.addEventListener('error', () => {
        console.error('❌ [cloudinaryService] Error de red al subir imagen');
        reject(new Error('Error de red al subir la imagen. Verifica tu conexión.'));
      });

      // Event listener para timeout
      xhr.addEventListener('timeout', () => {
        console.error('❌ [cloudinaryService] Timeout al subir imagen');
        reject(new Error('Timeout al subir la imagen. Intenta de nuevo.'));
      });

      // Configurar y enviar request
      xhr.open('POST', uploadUrl);
      xhr.timeout = 60000; // 60 segundos timeout
      xhr.send(formData);
    });
  } catch (error) {
    console.error('❌ [cloudinaryService] Error al subir imagen:', error);
    throw error;
  }
}

/**
 * Eliminar una imagen de Cloudinary
 * NOTA: Requiere backend con autenticación firmada.
 * Para el plan gratuito, es más fácil eliminar manualmente desde el dashboard.
 *
 * @param {string} publicId - ID público de la imagen
 * @returns {Promise<void>}
 */
export async function deleteImageFromCloudinary(publicId) {
  console.warn(
    '⚠️ [cloudinaryService] La eliminación de imágenes requiere autenticación del servidor. ' +
    'Por ahora, elimina las imágenes manualmente desde tu dashboard de Cloudinary.'
  );
  // Esta función requeriría un backend para firmar la petición
  // Por ahora, las imágenes se eliminan manualmente desde Cloudinary dashboard
}

/**
 * Validar configuración de Cloudinary
 * @returns {Object} Estado de configuración
 */
export function validateCloudinaryConfig() {
  const configured = isCloudinaryConfigured();

  return {
    configured,
    cloudName: CLOUDINARY_CONFIG.cloudName,
    uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
    message: configured
      ? 'Cloudinary está configurado correctamente'
      : 'Cloudinary no está configurado. Edita src/config/cloudinary.js'
  };
}
