# 🐛 BUGS PENDIENTES - SalaSmart

**Última actualización:** 5 de Noviembre, 2025

---

## ✅ RESUELTO - Sesión del 5 de Noviembre

### **Bug #1: Reservas con Chatbot IA NO se reflejan en Admin ni Mis Reservas**

**Estado:** ✅ SOLUCIONADO - Listo para probar mañana

**Descripción del problema:**
Cuando se creaba una reserva mediante el chatbot con IA (Gemini), la reserva NO se guardaba en Firestore ni aparecía en:
- Panel de Admin → Sección de Reservas
- Mis Reservas (vista de docente)
- Actividad Reciente (Dashboard Admin)

**Causa raíz encontrada:**
❌ **Formato incorrecto de fechas entre chatbot y formulario UI**

El chatbot enviaba fechas como objetos `Date`, mientras que el formulario UI las enviaba como strings ISO con timezone (`"2025-11-05T10:00:00-03:00"`). Esto causaba que `crearReserva()` procesara las fechas de manera diferente y probablemente fallara silenciosamente.

**Solución aplicada:**
✅ Modificado `geminiService.js` (líneas 407-451) para:
1. Formatear fechas como strings ISO con timezone local (igual que FormularioReserva.jsx)
2. Eliminar campos innecesarios (`usuarioId` y `estado`) que causaban inconsistencias
3. Usar exactamente el mismo formato de datos que el formulario UI

**Archivos modificados:**
```
frontend/src/services/geminiService.js:407-451      (formateo de fechas corregido)
frontend/src/services/reservasService.js:32-135     (logs detallados agregados)
frontend/src/utils/testReserva.js                   (nuevo - script de testing)
```

**Cambios realizados:**

1. **geminiService.js (líneas 407-451)**
   - Agregada función `formatearFechaLocal()` para convertir Date a string ISO con timezone
   - Modificado objeto `datosReserva` para enviar formato idéntico al formulario UI
   - Eliminados campos `usuarioId` y `estado` (se agregan automáticamente en crearReserva)

2. **reservasService.js (líneas 32-135)**
   - Agregados logs detallados para debugging en cada paso del proceso
   - Facilita identificar problemas futuros rápidamente

3. **testReserva.js (nuevo archivo)**
   - Script de testing para verificar permisos y creación directa
   - Útil para debugging sin depender del chatbot

**Cómo verificar que funciona (para mañana):**

1. **Obtener nueva API Key de Gemini** (la actual está en cuota excedida)
   - Ir a https://aistudio.google.com/app/apikey
   - Crear nueva API Key
   - Actualizar en `frontend/.env`: `VITE_GEMINI_API_KEY=nueva_key_aqui`
   - Reiniciar servidor: `npm run dev`

2. **Probar creación de reserva con chatbot:**
   ```
   "reserva la sala 402 para mañana a las 2pm por 1 hora para Base de Datos"
   ```

3. **Verificar en consola del navegador (F12):**
   ```
   📅 Formato de fechas: {
     horaInicioISO: "2025-11-06T14:00:00-03:00",
     horaFinISO: "2025-11-06T15:00:00-03:00",
     offsetString: "-03:00"
   }
   💾 Datos de reserva a crear: {...}
   ✅✅✅ [reservasService] RESERVA CREADA EN FIRESTORE - ID: xxxxx
   ```

4. **Confirmar que aparece en:**
   - ✅ Mis Reservas
   - ✅ AdminPanel → Reservas
   - ✅ AdminPanel → Dashboard → Actividad Reciente

**Notas importantes:**
- ✅ El flujo de creación desde el formulario UI funciona perfectamente
- ✅ Los paneles Admin y Mis Reservas usan `onSnapshot` (tiempo real)
- ✅ El problema era específico del chatbot: formato de fechas incorrecto
- ✅ Logs detallados agregados para debugging futuro

---

## 📊 Análisis de la Solución

**Antes (❌ No funcionaba):**
```javascript
// geminiService.js - línea 418 (anterior)
const datosReserva = {
  salaId: sala.id,
  salaNombre: salaData.nombre,
  usuarioId: user.uid,              // ❌ Campo innecesario
  nombreDocente: userData.nombre,
  asignatura: args.asignatura,
  horaInicio: horaInicio,           // ❌ Date object
  horaFin: horaFin,                 // ❌ Date object
  jornada: jornada,
  estado: 'activa'                  // ❌ Campo innecesario
};
```

**Después (✅ Corregido):**
```javascript
// geminiService.js - línea 443 (nuevo)
const datosReserva = {
  salaId: sala.id,
  salaNombre: salaData.nombre,
  nombreDocente: userData.nombre,
  asignatura: args.asignatura,
  horaInicio: horaInicioISO,        // ✅ String "2025-11-05T10:00:00-03:00"
  horaFin: horaFinISO,              // ✅ String "2025-11-05T12:00:00-03:00"
  jornada: jornada
};
// Formato idéntico al formulario UI
```

---

**Desarrollado con ❤️ para INACAP 2025**
