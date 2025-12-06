# Implementación de Cloudinary - Resumen

## ✅ Cambios Realizados

Se implementó un sistema completo de carga de imágenes usando Cloudinary para reemplazar Firebase Storage, eliminando la necesidad del plan Blaze (que requiere tarjeta de crédito).

### Archivos Creados

1. **`frontend/src/config/cloudinary.js`**
   - Archivo de configuración para Cloudinary
   - Contiene las credenciales (Cloud Name, Upload Preset)
   - Define transformaciones de imagen para optimización

2. **`frontend/src/services/cloudinaryService.js`**
   - Servicio para subir imágenes a Cloudinary
   - Maneja validación de archivos
   - Implementa seguimiento de progreso
   - Gestión de errores

3. **`CLOUDINARY_SETUP.md`**
   - Guía completa paso a paso para configurar Cloudinary
   - Incluye capturas de pantalla y solución de problemas
   - Explica cómo crear cuenta, obtener credenciales y configurar upload presets

### Archivos Modificados

1. **`frontend/src/services/pisosService.js`**
   - Se importó `cloudinaryService`
   - Se reemplazó la función `usarImagenLocal` por `subirImagenCloudinary`
   - Se actualizó `crearPiso` para usar Cloudinary
   - Se actualizó `actualizarImagenPiso` para usar Cloudinary
   - Las imágenes ahora se suben a Cloudinary en carpetas organizadas: `salasmart/planos/{sedeCodigo}/{edificioCodigo}/`

2. **`frontend/src/components/planos/EditorPlanos.jsx`**
   - Se agregó botón "Cambiar Imagen" en el header del plano interactivo
   - Se implementó handler `handleCambiarImagen` con validación
   - Se agregó input file oculto
   - Se agregaron estados para progreso de subida (`subiendoImagen`, `progresoSubida`)
   - Se agregó animación de spinning para el icono durante la carga
   - Se agregó recarga automática de la imagen después de la subida

## 🎯 Características Implementadas

### 1. Validación de Archivos
- ✅ Solo permite PNG, JPG, JPEG, WEBP
- ✅ Tamaño máximo: 10MB
- ✅ Mensajes de error claros

### 2. Progreso de Carga
- ✅ Indicador visual durante la subida
- ✅ Porcentaje de progreso en tiempo real
- ✅ Icono animado (spinning) mientras sube

### 3. Gestión de Errores
- ✅ Manejo de errores de red
- ✅ Manejo de errores de Cloudinary
- ✅ Mensajes informativos para el usuario
- ✅ Validación de configuración

### 4. Organización de Imágenes
- ✅ Carpetas jerárquicas en Cloudinary: `salasmart/planos/{sede}/{edificio}/`
- ✅ Metadata completa almacenada en Firestore
- ✅ URLs permanentes y públicas

### 5. Optimización
- ✅ Cloudinary optimiza automáticamente las imágenes
- ✅ Compresión automática
- ✅ Formato automático (WebP cuando es soportado)

## 📋 Cómo Usar

### Para Configurar (Solo una vez)

1. Sigue la guía en `CLOUDINARY_SETUP.md`
2. Crea una cuenta gratuita en Cloudinary
3. Obtén tu Cloud Name
4. Crea un Upload Preset (unsigned)
5. Edita `frontend/src/config/cloudinary.js` con tus credenciales

### Para Subir Imágenes de Planos

1. Inicia sesión como **Administrador**
2. Ve a **Panel Admin** → **Editor de Planos**
3. Selecciona: **Sede** → **Edificio** → **Piso**
4. Haz clic en el botón **"Cambiar Imagen"** (aparece en el header del plano)
5. Selecciona una imagen de tu computadora
6. Espera a que se suba (verás el progreso)
7. ¡Listo! El plano se actualizará automáticamente

### Formatos Permitidos
- PNG
- JPG / JPEG
- WEBP

### Tamaño Máximo
- 10MB por imagen

### Recomendaciones
- Usa imágenes de buena calidad pero no excesivamente grandes
- Formato recomendado: PNG o JPG
- Resolución recomendada: 2000px de ancho máximo
- Cloudinary optimizará automáticamente la imagen

## 🔄 Flujo de Subida

```
Usuario selecciona imagen
    ↓
Validación (formato, tamaño)
    ↓
Subida a Cloudinary
    ↓
Cloudinary procesa y optimiza
    ↓
URL pública generada
    ↓
URL guardada en Firestore (campo imagenURL del piso)
    ↓
Plano actualizado en la interfaz
```

## 💾 Datos Guardados en Firestore

Cuando se sube una imagen, se guarda en el documento del piso:

```javascript
{
  imagenURL: "https://res.cloudinary.com/tu-cloud/image/upload/v123/salasmart/planos/...",
  imagenPath: "salasmart/planos/SEDE1/EDI1/piso-id",
  imagenMetadata: {
    nombre: "plano-piso-1.jpg",
    tamaño: 1234567,
    tipo: "image/jpeg",
    ancho: 1920,
    alto: 1080,
    formato: "jpg",
    publicId: "salasmart/planos/SEDE1/EDI1/piso-id",
    fechaSubida: Timestamp,
    cloudinary: true
  }
}
```

## 🆓 Límites del Plan Gratuito

Cloudinary ofrece generosamente en su plan gratuito:

- **Almacenamiento**: 25GB
- **Ancho de banda**: 25GB/mes
- **Transformaciones**: 25 créditos/mes
- **Imágenes**: Ilimitadas

Esto es **más que suficiente** para SalaSmart, ya que:
- Cada imagen de plano pesa aprox. 1-3MB
- Con 25GB puedes almacenar aprox. **8,000-25,000 planos**
- El ancho de banda mensual soporta **miles de visualizaciones**

## 🔧 Solución de Problemas

### "Cloudinary no está configurado"
→ Edita `frontend/src/config/cloudinary.js` con tus credenciales

### "Upload preset not found"
→ Verifica que el preset exista y sea "Unsigned" en Cloudinary

### "Imagen muy grande"
→ Comprime la imagen a menos de 10MB usando TinyPNG o similar

### No se ve la imagen después de subir
→ Espera unos segundos y recarga la página (F5)

Para más detalles, consulta `CLOUDINARY_SETUP.md`

## 🎨 Interfaz de Usuario

### Botón "Cambiar Imagen"

- **Ubicación**: Header del plano interactivo, al lado del contador de salas
- **Estados**:
  - Normal: "Cambiar Imagen" con icono de upload
  - Cargando: "Subiendo... X%" con icono giratorio
  - Deshabilitado cuando no hay piso seleccionado

### Mensajes

- ✅ **Éxito**: "¡Imagen del plano actualizada exitosamente!"
- ❌ **Error**: Mensaje específico según el tipo de error
- ⚠️ **Validación**: "Formato no válido", "Imagen muy grande", etc.

## 📝 Notas Técnicas

### Diferencias con Firebase Storage

| Aspecto | Firebase Storage | Cloudinary |
|---------|-----------------|------------|
| Plan requerido | Blaze (pago) | Gratuito |
| Tarjeta de crédito | ✅ Requerida | ❌ No requerida |
| Límite gratuito | - | 25GB |
| Optimización | Manual | Automática |
| URLs | Complejas | Simples y limpias |
| Upload desde navegador | Requiere reglas | Nativo (unsigned) |

### Compatibilidad con Código Anterior

El sistema es **totalmente compatible** con el código anterior:
- El campo `imagenURL` se sigue usando igual
- Las salas siguen referenciando los pisos de la misma manera
- Solo cambia la fuente de las URLs (ahora son de Cloudinary)
- Los planos viejos siguen funcionando (fallback a `/planos/pisoX.jpg`)

### Migración de Imágenes Existentes

Si tienes imágenes en `/public/planos/`:
1. Puedes dejarlas ahí (seguirán funcionando como fallback)
2. Para migrarlas a Cloudinary, solo súbelas usando el botón "Cambiar Imagen"
3. Una vez subidas a Cloudinary, las del `/public/` ya no se usarán

## 🚀 Próximos Pasos

Después de configurar Cloudinary:

1. ✅ Crea tu cuenta en Cloudinary
2. ✅ Configura el upload preset
3. ✅ Edita `cloudinary.js`
4. ✅ Reinicia el servidor (`npm run dev`)
5. ✅ Sube tus primeros planos
6. ✅ ¡Disfruta de almacenamiento ilimitado sin costo!

## 📚 Recursos

- [Documentación de Cloudinary](https://cloudinary.com/documentation)
- [Dashboard de Cloudinary](https://cloudinary.com/console)
- [Media Library](https://cloudinary.com/console/media_library) (para ver tus imágenes)

---

**¡Implementación completada! 🎉**

Ahora puedes subir imágenes de planos sin necesidad de Firebase Storage ni tarjeta de crédito.
