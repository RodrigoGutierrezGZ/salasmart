# Configuración de Cloudinary para SalaSmart

Este documento explica cómo configurar Cloudinary para poder subir imágenes de planos de pisos sin necesidad de Firebase Storage (que requiere plan Blaze con tarjeta de crédito).

## ¿Por qué Cloudinary?

- **Gratis**: 25GB de almacenamiento y 25GB de ancho de banda mensual
- **Sin tarjeta de crédito**: No requiere información de pago para el plan gratuito
- **Fácil integración**: Funciona directamente desde el navegador con uploads no autenticados
- **Optimización automática**: Comprime y optimiza las imágenes automáticamente
- **URLs permanentes**: Las imágenes tienen URLs públicas y permanentes

## Paso 1: Crear cuenta en Cloudinary

1. Ve a [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Completa el formulario de registro:
   - Nombre
   - Email
   - Contraseña
   - Nombre de la empresa (puedes poner "SalaSmart" o tu nombre)
3. Acepta los términos y condiciones
4. Haz clic en "Create Account"
5. Verifica tu email (revisa tu bandeja de entrada o spam)

## Paso 2: Obtener tus credenciales

1. Una vez dentro del dashboard de Cloudinary, verás tus credenciales:
   - **Cloud Name**: Es un código único (ejemplo: `dxxxxx` o `tu-nombre`)
   - Copia este valor, lo necesitarás en el siguiente paso

![Dashboard de Cloudinary](https://res.cloudinary.com/demo/image/upload/docs/cloudinary_console.png)

## Paso 3: Crear un Upload Preset

Un "Upload Preset" es una configuración que permite subir imágenes sin autenticación desde el navegador.

1. En el menú lateral izquierdo, haz clic en **Settings** (⚙️)
2. Haz clic en la pestaña **Upload**
3. Scroll hacia abajo hasta encontrar **Upload presets**
4. Haz clic en **Add upload preset**
5. Configura el preset:
   - **Upload preset name**: `salasmart_planos` (o el nombre que prefieras)
   - **Signing Mode**: Selecciona **Unsigned** (MUY IMPORTANTE)
   - **Folder**: `salasmart/planos` (opcional, para organizar las imágenes)
   - Deja las demás opciones por defecto
6. Haz clic en **Save**
7. Copia el nombre del preset (normalmente es el que pusiste)

### Capturas de pantalla del proceso:

**Ubicación de Upload Presets:**
```
Settings → Upload → Upload presets → Add upload preset
```

**Configuración del Preset:**
```
┌─────────────────────────────────────┐
│ Upload preset name: salasmart_planos│
│ Signing Mode: Unsigned ✓            │
│ Folder: salasmart/planos            │
└─────────────────────────────────────┘
```

## Paso 4: Configurar el proyecto

1. Abre el archivo `frontend/src/config/cloudinary.js`
2. Reemplaza los valores con tus credenciales:

```javascript
export const CLOUDINARY_CONFIG = {
  // REEMPLAZA con tu Cloud Name
  cloudName: 'tu-cloud-name-aqui',  // ← Cambia esto

  // REEMPLAZA con el nombre de tu Upload Preset
  uploadPreset: 'salasmart_planos',  // ← Cambia esto si usaste otro nombre

  // Carpeta donde se guardarán las imágenes (debe coincidir con el preset)
  folder: 'salasmart/planos',

  // ... resto de la configuración (no cambiar)
};
```

### Ejemplo de configuración completa:

```javascript
export const CLOUDINARY_CONFIG = {
  cloudName: 'dxxx123abc',           // Tu Cloud Name real
  uploadPreset: 'salasmart_planos',  // El nombre del preset que creaste
  folder: 'salasmart/planos',
  uploadUrl: 'https://api.cloudinary.com/v1_1/{cloud_name}/image/upload',
  // ... resto de configuración
};
```

## Paso 5: ¡Listo para usar!

Una vez configurado, puedes:

1. Ir al **Editor de Planos** en el panel de administración
2. Seleccionar una Sede → Edificio → Piso
3. Hacer clic en el botón **"Cambiar Imagen"** en el header del plano
4. Seleccionar una imagen (PNG, JPG, WEBP - máximo 10MB)
5. La imagen se subirá a Cloudinary automáticamente
6. El plano se actualizará con la nueva imagen

## Solución de problemas

### Error: "Cloudinary no está configurado"

**Causa**: No has editado el archivo `cloudinary.js` con tus credenciales.

**Solución**:
1. Verifica que hayas editado `frontend/src/config/cloudinary.js`
2. Asegúrate de que `cloudName` no sea `'tu-cloud-name'`
3. Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "Upload preset not found" o "Invalid upload preset"

**Causa**: El nombre del preset no coincide o el preset no existe.

**Solución**:
1. Ve a Cloudinary → Settings → Upload → Upload presets
2. Verifica que el preset exista y esté como "Unsigned"
3. Copia el nombre exacto del preset
4. Actualiza `uploadPreset` en `cloudinary.js`

### Error: "Upload not allowed for this account"

**Causa**: El preset no está configurado como "Unsigned".

**Solución**:
1. Ve a Cloudinary → Settings → Upload → Upload presets
2. Edita tu preset
3. Cambia **Signing Mode** a **Unsigned**
4. Guarda los cambios

### Las imágenes no se cargan

**Causa**: Problema de CORS o URL incorrecta.

**Solución**:
1. Verifica que el `cloudName` sea correcto
2. Abre la consola del navegador (F12) y busca errores
3. Verifica que la URL de la imagen empiece con `https://res.cloudinary.com/`

### Error de tamaño de archivo

**Causa**: La imagen es mayor a 10MB.

**Solución**:
1. Comprime la imagen antes de subirla
2. Puedes usar herramientas online como:
   - [TinyPNG](https://tinypng.com/)
   - [Squoosh](https://squoosh.app/)
   - [CompressJPEG](https://compressjpeg.com/)

## Gestión de imágenes en Cloudinary

### Ver tus imágenes subidas

1. Ve a Cloudinary Dashboard
2. Haz clic en **Media Library** en el menú lateral
3. Verás todas tus imágenes organizadas por carpetas
4. Las imágenes de SalaSmart estarán en `salasmart/planos/`

### Eliminar imágenes antiguas

Las imágenes viejas NO se eliminan automáticamente. Para eliminarlas:

1. Ve a **Media Library**
2. Navega a la carpeta `salasmart/planos/`
3. Selecciona las imágenes que quieras eliminar
4. Haz clic en el botón de eliminar

### Límites del plan gratuito

- **Almacenamiento**: 25GB
- **Ancho de banda**: 25GB/mes
- **Transformaciones**: 25 créditos/mes
- **Imágenes y videos**: Ilimitados

Si necesitas más, puedes:
- Comprimir imágenes antes de subir
- Eliminar imágenes viejas que ya no uses
- Actualizar a un plan de pago (opcional)

## Recursos adicionales

- [Documentación oficial de Cloudinary](https://cloudinary.com/documentation)
- [Guía de Upload Presets](https://cloudinary.com/documentation/upload_presets)
- [Dashboard de Cloudinary](https://cloudinary.com/console)

## Soporte

Si tienes problemas con la configuración:

1. Revisa los logs en la consola del navegador (F12)
2. Verifica que hayas seguido todos los pasos
3. Asegúrate de que el preset sea "Unsigned"
4. Verifica que tu cuenta de Cloudinary esté activa

---

**Nota**: Este sistema reemplaza completamente la necesidad de Firebase Storage, por lo que no necesitas el plan Blaze de Firebase ni una tarjeta de crédito.
