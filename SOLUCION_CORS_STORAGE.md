# Solución Error CORS en Firebase Storage

## Problema
Al intentar crear pisos, sale este error:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...'
from origin 'http://localhost:5174' has been blocked by CORS policy
```

## Causa
Firebase Storage no está configurado para aceptar peticiones desde `localhost` durante desarrollo.

## Solución (3 opciones)

### Opción 1: Google Cloud Console (MÁS FÁCIL) ✅

1. Ve a: https://console.cloud.google.com/storage/browser
2. Inicia sesión con tu cuenta de Google/Firebase
3. Encuentra el bucket `sala-gestion.firebasestorage.app`
4. Haz clic en los **tres puntos verticales** (⋮) del bucket
5. Selecciona "Edit CORS configuration"
6. Pega esto:

```json
[
  {
    "origin": ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "X-Requested-With"]
  }
]
```

7. Guarda

---

### Opción 2: Instalar Google Cloud SDK + gsutil

1. **Descarga Google Cloud SDK:**
   - Windows: https://cloud.google.com/sdk/docs/install#windows
   - Descarga el instalador `.exe` y ejecuta

2. **Instala y autentícate:**
   ```bash
   # Después de instalar, abre una terminal nueva y ejecuta:
   gcloud init

   # Inicia sesión cuando te lo pida
   ```

3. **Aplica configuración CORS:**
   ```bash
   # Desde la carpeta del proyecto:
   gsutil cors set cors.json gs://sala-gestion.firebasestorage.app
   ```

4. **Verifica que se aplicó:**
   ```bash
   gsutil cors get gs://sala-gestion.firebasestorage.app
   ```

---

### Opción 3: Firebase Console (si las anteriores no funcionan)

1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto `sala-gestion`
3. Ve a **Storage** en el menú lateral
4. Haz clic en la pestaña **Rules**
5. Las reglas actuales están correctas, pero si CORS no funciona, ve a **Files**
6. Haz clic en los tres puntos (⋮) del bucket
7. Busca opción de CORS o "Configuración del bucket"

---

## Notas Importantes

- **Esto es GRATUITO** - No requiere plan de pago en Firebase
- **Es solo para desarrollo** - En producción agregarás tu dominio real
- El archivo `cors.json` ya está creado en la raíz del proyecto
- Las reglas de Storage (`firebase/storage.rules`) ya están bien configuradas

---

## Próxima Sesión: Tareas Pendientes

1. ✅ Configurar CORS en Firebase Storage (seguir estas instrucciones)
2. 🔍 Verificar logs de creación de pisos (ya agregamos los console.log)
3. 📋 Revisar archivo `PROXIMA_SESION.md` para ver qué más falta
4. 🧪 Probar creación de pisos en diferentes edificios

---

## Comandos Útiles

```bash
# Ver versión de gcloud (después de instalar)
gcloud --version

# Ver versión de gsutil
gsutil version

# Ver CORS actual del bucket
gsutil cors get gs://sala-gestion.firebasestorage.app

# Aplicar CORS
gsutil cors set cors.json gs://sala-gestion.firebasestorage.app
```
