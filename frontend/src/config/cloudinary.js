// src/config/cloudinary.js
// Configuración de Cloudinary para subir imágenes de planos

/**
 * INSTRUCCIONES PARA CONFIGURAR CLOUDINARY (GRATIS):
 *
 * 1. Crear cuenta gratis en https://cloudinary.com/users/register_free
 *    - 25GB de almacenamiento gratuito
 *    - 25GB de ancho de banda mensual gratuito
 *    - NO requiere tarjeta de crédito
 *
 * 2. Una vez creada la cuenta, ir al Dashboard:
 *    - Copia tu "Cloud Name" (ejemplo: "dxxxxx")
 *
 * 3. Configurar un Upload Preset sin autenticación:
 *    - Ir a Settings → Upload
 *    - Scroll hasta "Upload presets"
 *    - Click en "Add upload preset"
 *    - Nombre: "salasmart_planos" (o el que prefieras)
 *    - Signing Mode: "Unsigned"
 *    - Folder: "salasmart/planos" (opcional, para organizar)
 *    - Click en "Save"
 *
 * 4. Copiar el nombre del preset (normalmente es el que pusiste)
 *
 * 5. Reemplazar los valores abajo con tus credenciales
 */

export const CLOUDINARY_CONFIG = {
  // REEMPLAZA CON TU CLOUD NAME de Cloudinary
  cloudName: 'tu-cloud-name',

  // REEMPLAZA CON TU UPLOAD PRESET (debe ser unsigned)
  uploadPreset: 'salasmart_planos',

  // Carpeta donde se guardarán las imágenes (opcional)
  folder: 'salasmart/planos',

  // URL base de la API de upload
  uploadUrl: 'https://api.cloudinary.com/v1_1/{cloud_name}/image/upload',

  // Configuración de transformaciones para optimizar imágenes
  transformations: {
    // Transformación para las imágenes de planos (calidad optimizada)
    plano: {
      quality: 'auto:good',
      fetch_format: 'auto',
      width: 2000, // Ancho máximo
      crop: 'limit'
    },
    // Thumbnail para previews
    thumbnail: {
      quality: 'auto:low',
      fetch_format: 'auto',
      width: 400,
      crop: 'limit'
    }
  }
};

/**
 * Verificar si Cloudinary está configurado
 * @returns {boolean}
 */
export function isCloudinaryConfigured() {
  return CLOUDINARY_CONFIG.cloudName !== 'tu-cloud-name' &&
         CLOUDINARY_CONFIG.uploadPreset !== 'salasmart_planos' ||
         CLOUDINARY_CONFIG.cloudName.length > 0;
}

/**
 * Obtener URL de upload
 * @returns {string}
 */
export function getUploadUrl() {
  return CLOUDINARY_CONFIG.uploadUrl.replace(
    '{cloud_name}',
    CLOUDINARY_CONFIG.cloudName
  );
}

/**
 * Generar URL de imagen con transformaciones
 * @param {string} publicId - ID público de la imagen en Cloudinary
 * @param {string} transformType - Tipo de transformación ('plano' o 'thumbnail')
 * @returns {string}
 */
export function getImageUrl(publicId, transformType = 'plano') {
  const transformation = CLOUDINARY_CONFIG.transformations[transformType];
  const transformStr = Object.entries(transformation)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformStr}/${publicId}`;
}
