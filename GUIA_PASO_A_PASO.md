# Guía Paso a Paso - Configuración de Cloudinary

## ¿Qué se hizo hoy?

Se implementó un sistema de almacenamiento de imágenes usando **Cloudinary** para reemplazar Firebase Storage (que requiere plan Blaze con tarjeta de crédito).

### ✅ Archivos Creados/Modificados:
- `frontend/src/config/cloudinary.js` - Configuración de Cloudinary
- `frontend/src/services/cloudinaryService.js` - Servicio de subida de imágenes
- `frontend/src/services/pisosService.js` - Ahora usa Cloudinary
- `frontend/src/components/planos/EditorPlanos.jsx` - Botón "Cambiar Imagen"
- `CLOUDINARY_SETUP.md` - Guía detallada de configuración
- `CLOUDINARY_IMPLEMENTATION.md` - Documentación técnica

---

## 🚀 Próximos Pasos para Tu Compañero

### PASO 1: Crear Cuenta en Cloudinary (5 minutos)

1. **Ir a**: https://cloudinary.com/users/register_free
2. **Llenar formulario**:
   - Email
   - Contraseña
   - Nombre completo
   - Empresa: "SalaSmart"
3. **Crear cuenta** (NO requiere tarjeta de crédito)
4. **Verificar email** (revisar bandeja de entrada/spam)

### PASO 2: Obtener Cloud Name (1 minuto)

1. Iniciar sesión en Cloudinary
2. En el **Dashboard** verás:
   ```
   Cloud Name: dxxxxx  <-- COPIAR ESTE VALOR
   ```
3. Guardar este valor para el paso 4

### PASO 3: Crear Upload Preset (3 minutos)

1. En Cloudinary, ir a **Settings** (⚙️ arriba a la derecha)
2. Click en la pestaña **Upload**
3. Scroll hasta **Upload presets**
4. Click en **Add upload preset**
5. Configurar:
   - **Upload preset name**: `salasmart_planos`
   - **Signing Mode**: Seleccionar **Unsigned** ⚠️ MUY IMPORTANTE
   - **Folder**: `salasmart/planos`
6. Click en **Save**

### PASO 4: Configurar el Proyecto (2 minutos)

1. Abrir el archivo: `frontend/src/config/cloudinary.js`

2. Buscar estas líneas (19-21):
```javascript
cloudName: 'tu-cloud-name',        // ← CAMBIAR AQUÍ
uploadPreset: 'salasmart_planos',  // ← Verificar que coincida
```

3. Reemplazar `'tu-cloud-name'` con el Cloud Name del PASO 2

**Ejemplo**:
```javascript
cloudName: 'dxxx123abc',           // Tu Cloud Name real
uploadPreset: 'salasmart_planos',  // El nombre del preset
```

4. Guardar el archivo

### PASO 5: Reiniciar Servidor (30 segundos)

1. Detener el servidor (Ctrl+C en la terminal)
2. Reiniciar: `npm run dev`
3. Esperar a que cargue

### PASO 6: ¡Probar! (1 minuto)

1. Ir a **Panel Admin** → **Editor de Planos**
2. Seleccionar: Sede → Edificio → Piso
3. Click en el botón **"Cambiar Imagen"** (en el header del plano)
4. Seleccionar una imagen (PNG, JPG, WEBP - máx 10MB)
5. ¡La imagen se subirá a Cloudinary!

---

## 📋 Checklist Rápido

- [ ] Cuenta de Cloudinary creada y verificada
- [ ] Cloud Name copiado
- [ ] Upload Preset creado (Unsigned)
- [ ] Archivo `cloudinary.js` editado con credenciales
- [ ] Servidor reiniciado
- [ ] Subida de imagen probada

---

## ⚠️ Problemas Comunes

### Error: "Cloudinary no está configurado"
- **Solución**: Verificar que `cloudName` no sea `'tu-cloud-name'`

### Error: "Upload preset not found"
- **Solución**: Verificar que el preset:
  1. Exista en Cloudinary
  2. Se llame exactamente `salasmart_planos`
  3. Esté configurado como **Unsigned**

### La imagen no se sube
- **Solución**: Abrir consola del navegador (F12) y buscar errores

---

## 📚 Documentación Completa

Para más detalles, consulta:
- **CLOUDINARY_SETUP.md** - Guía detallada con capturas
- **CLOUDINARY_IMPLEMENTATION.md** - Documentación técnica

---

## 💡 Beneficios

- ✅ **Gratis**: 25GB de almacenamiento
- ✅ **Sin tarjeta**: No requiere información de pago
- ✅ **Fácil**: Solo configurar una vez
- ✅ **Rápido**: Subida directa desde el navegador
- ✅ **Automático**: Optimización de imágenes incluida

---

**Tiempo total de configuración: ~15 minutos**

**¿Dudas?** Revisa CLOUDINARY_SETUP.md para guía detallada con solución de problemas.
