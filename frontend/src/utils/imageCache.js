/**
 * Servicio de caché de imágenes usando IndexedDB
 * Optimiza la carga de imágenes de Cloudinary
 */

const DB_NAME = 'salasmart_image_cache';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos

/**
 * Inicializar la base de datos IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Guardar imagen en caché
 * @param {string} url - URL de la imagen
 * @param {Blob} blob - Blob de la imagen
 * @returns {Promise<void>}
 */
export async function cacheImage(url, blob) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const cacheEntry = {
      url,
      blob,
      timestamp: Date.now(),
      size: blob.size,
      type: blob.type
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[ImageCache] Error al guardar en caché:', error);
    // No fallar si el caché no funciona
  }
}

/**
 * Obtener imagen del caché
 * @param {string} url - URL de la imagen
 * @returns {Promise<Blob|null>} Blob de la imagen o null si no está en caché o expiró
 */
export async function getCachedImage(url) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(url);
      
      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve(null);
          return;
        }

        // Verificar si la caché expiró
        const age = Date.now() - result.timestamp;
        if (age > CACHE_DURATION) {
          // Eliminar entrada expirada
          const deleteRequest = store.delete(url);
          deleteRequest.onsuccess = () => resolve(null);
          deleteRequest.onerror = () => resolve(null);
          return;
        }

        resolve(result.blob);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[ImageCache] Error al obtener del caché:', error);
    return null;
  }
}

/**
 * Obtener imagen con caché automático
 * @param {string} url - URL de la imagen
 * @returns {Promise<string>} URL del objeto (blob URL o URL original)
 */
export async function fetchImageWithCache(url) {
  // Intentar obtener del caché primero
  const cachedBlob = await getCachedImage(url);
  
  if (cachedBlob) {
    console.log('[ImageCache] Hit:', url);
    return URL.createObjectURL(cachedBlob);
  }

  console.log('[ImageCache] Miss, descargando:', url);

  // Descargar imagen
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al descargar imagen');

    const blob = await response.blob();
    
    // Guardar en caché (sin esperar)
    cacheImage(url, blob).catch(err => 
      console.warn('[ImageCache] No se pudo cachear:', err)
    );

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('[ImageCache] Error al descargar imagen:', error);
    // Retornar URL original como fallback
    return url;
  }
}

/**
 * Limpiar caché expirado
 * @returns {Promise<number>} Número de entradas eliminadas
 */
export async function cleanExpiredCache() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');

    let deletedCount = 0;
    const cutoffTime = Date.now() - CACHE_DURATION;

    return new Promise((resolve, reject) => {
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          if (cursor.value.timestamp < cutoffTime) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[ImageCache] Error al limpiar caché:', error);
    return 0;
  }
}

/**
 * Obtener estadísticas del caché
 * @returns {Promise<Object>} Estadísticas del caché
 */
export async function getCacheStats() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result;
        const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
        const now = Date.now();
        const expiredCount = entries.filter(e => (now - e.timestamp) > CACHE_DURATION).length;

        resolve({
          totalEntries: entries.length,
          activeEntries: entries.length - expiredCount,
          expiredEntries: expiredCount,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        });
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[ImageCache] Error al obtener estadísticas:', error);
    return {
      totalEntries: 0,
      activeEntries: 0,
      expiredEntries: 0,
      totalSize: 0,
      totalSizeMB: '0.00'
    };
  }
}

/**
 * Limpiar todo el caché
 * @returns {Promise<void>}
 */
export async function clearAllCache() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log('[ImageCache] Caché limpiado completamente');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[ImageCache] Error al limpiar caché:', error);
  }
}

// Limpiar caché expirado al cargar el módulo
cleanExpiredCache().then(count => {
  if (count > 0) {
    console.log(`[ImageCache] ${count} entradas expiradas eliminadas`);
  }
});
