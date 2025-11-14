# 🚀 Guía de Migración - Sistema Jerárquico SalaSmart

**Fecha:** 5 de Noviembre, 2025
**Versión:** 3.0 - Sistema Sede → Edificio → Piso → Salas

---

## 📋 Resumen

Esta guía te ayudará a migrar tu sistema actual de SalaSmart a la nueva estructura jerárquica que permite gestionar múltiples sedes, edificios y pisos.

### **¿Qué cambia?**

**ANTES (v2.x):**
```
salas/
  └── 401 { nombre: "401", piso: 4, capacidad: 40, ... }
```

**DESPUÉS (v3.0):**
```
sedes/
  └── INACAP Renca
      └── edificios/
          └── Edificio Principal
              └── pisos/
                  └── Piso 4 (con imagen en Storage)
                      └── salas/
                          └── 401 { nombre: "401", pisoId: "piso4_principal", ... }
```

---

## ✅ Pre-requisitos

Antes de empezar, asegúrate de tener:

- [x] **Acceso como Admin** en tu cuenta de SalaSmart
- [x] **Imágenes de planos** en `frontend/public/planos/` (piso1.jpg, piso2.jpg, piso3.jpg, piso4.jpg)
- [x] **Servidor de desarrollo corriendo** (`npm run dev`)
- [x] **Backup de Firestore** (recomendado)

---

## 📝 Pasos de Migración

### **PASO 1: Desplegar las nuevas reglas de seguridad**

Antes de ejecutar la migración, debes actualizar las reglas de Firestore y Storage en Firebase.

```bash
# Desde la raíz del proyecto
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

**Verificar en Firebase Console:**
1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto `sala-gestion`
3. Ve a **Firestore Database → Rules**
4. Verifica que aparezcan las reglas para `sedes`, `edificios`, `pisos`
5. Ve a **Storage → Rules**
6. Verifica que aparezcan las reglas para `planos/{sedeId}/{edificioId}/{imagenFile}`

---

### **PASO 2: Iniciar el servidor de desarrollo**

```bash
cd frontend
npm run dev
```

Abre tu navegador en `http://localhost:5173`

---

### **PASO 3: Acceder al panel de migración**

1. **Inicia sesión** con tu cuenta de administrador
2. En el **Sidebar**, haz clic en la nueva pestaña **"Migración"** (tiene un badge "NUEVO")
3. Verás el panel de migración jerárquica

---

### **PASO 4: Revisar información del panel**

Antes de ejecutar, el panel muestra:

```
⚠️ Importante antes de migrar:
• Esta operación solo debe ejecutarse UNA VEZ
• Asegúrate de tener las imágenes en public/planos/ (piso1.jpg, piso2.jpg, piso3.jpg, piso4.jpg)
• Se recomienda hacer un backup de Firestore antes de proceder
• Las salas existentes NO se eliminarán, solo se actualizarán
```

---

### **PASO 5: Ejecutar la migración**

1. Haz clic en el botón **"🚀 Iniciar Migración"**
2. Confirma la operación en el diálogo que aparece
3. **Observa el log en tiempo real** (el panel mostrará cada paso)

**El proceso hará:**
```
✅ Crear sede "INACAP Renca"
✅ Crear edificio "Edificio Principal"
✅ Crear 4 pisos (1, 2, 3, 4)
✅ Subir 4 imágenes de planos a Firebase Storage
✅ Migrar todas las salas existentes vinculándolas a los pisos correctos
```

**Duración estimada:** 30-60 segundos (depende del número de salas)

---

### **PASO 6: Verificar el resultado**

Una vez completada la migración, verás:

```
🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Puedes verificar en Firebase Console:
   • Firestore → sedes, edificios, pisos, salas
   • Storage → planos/
```

**Estadísticas mostradas:**
- 📊 Salas Existentes: X
- ✅ Salas Migradas: X
- 🏢 Pisos Creados: 4
- 📸 Imágenes Subidas: 4

---

### **PASO 7: Verificar en Firebase Console**

#### **7.1. Verificar Firestore**

1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto `sala-gestion`
3. Ve a **Firestore Database**
4. Verifica las nuevas colecciones:

```
✅ sedes/
   └── sede_renca
       ├── nombre: "INACAP Renca"
       ├── codigo: "RENCA"
       └── activa: true

✅ edificios/
   └── edificio_principal
       ├── nombre: "Edificio Principal"
       ├── codigo: "PRINCIPAL"
       ├── sedeId: "sede_renca"
       └── activo: true

✅ pisos/
   ├── piso1_principal
   │   ├── numero: 1
   │   ├── edificioId: "edificio_principal"
   │   ├── imagenURL: "https://..."
   │   └── nombreCompleto: "Piso 1 - Edificio Principal - INACAP Renca"
   ├── piso2_principal
   ├── piso3_principal
   └── piso4_principal

✅ salas/ (actualizadas)
   └── 401
       ├── nombre: "401"
       ├── pisoId: "piso4_principal"      ← NUEVO
       ├── pisoNumero: 4                  ← NUEVO
       ├── edificioId: "edificio_principal" ← NUEVO
       ├── sedeId: "sede_renca"           ← NUEVO
       ├── nombreCompleto: "401 - Piso 4 - ..." ← NUEVO
       └── (campos originales conservados)
```

#### **7.2. Verificar Storage**

1. En Firebase Console, ve a **Storage**
2. Verifica la estructura:

```
✅ planos/
   └── sede_renca/
       └── edificio_principal/
           ├── piso1_principal.jpg  (subido desde public/planos/piso1.jpg)
           ├── piso2_principal.jpg
           ├── piso3_principal.jpg
           └── piso4_principal.jpg
```

3. Haz clic en una imagen y verifica que se puede ver correctamente

---

## ⚠️ Solución de Problemas

### **Problema 1: Error de permisos al migrar**

**Error:**
```
❌ Error al crear sede: permission-denied
```

**Solución:**
1. Verifica que estés logueado como **admin**
2. Ve a Firestore → `users/{tu-uid}` → verifica que `role: "admin"`
3. Despliega las reglas nuevamente: `firebase deploy --only firestore:rules`

---

### **Problema 2: No se suben las imágenes**

**Error:**
```
⚠️ Error al cargar imagen piso X: 404
```

**Solución:**
1. Verifica que las imágenes existen en `frontend/public/planos/`
2. Los archivos deben llamarse exactamente: `piso1.jpg`, `piso2.jpg`, `piso3.jpg`, `piso4.jpg`
3. Si no tienes las imágenes, coloca placeholders con esos nombres

---

### **Problema 3: Error de Storage Rules**

**Error:**
```
❌ Error al subir imagen: Unauthorized
```

**Solución:**
1. Despliega las Storage Rules: `firebase deploy --only storage:rules`
2. Verifica en Firebase Console → Storage → Rules que existan reglas para `planos/`

---

### **Problema 4: Migración se ejecutó dos veces**

Si ejecutaste la migración dos veces accidentalmente:

**Opción A: Eliminar duplicados manualmente**
1. Ve a Firebase Console → Firestore
2. Elimina las colecciones duplicadas: `sedes`, `edificios`, `pisos`
3. Ejecuta la migración nuevamente

**Opción B: Restaurar backup**
1. Si hiciste backup antes de migrar, restáuralo
2. Ejecuta la migración nuevamente

---

## 📊 Después de la Migración

### **✅ ¿Qué funciona inmediatamente?**

- ✅ Todas las salas tienen su nueva estructura jerárquica
- ✅ Las imágenes de planos están en Storage
- ✅ El sistema actual sigue funcionando (compatible hacia atrás)
- ✅ Puedes consultar las nuevas colecciones desde los servicios

### **⏳ ¿Qué falta implementar?**

Para aprovechar completamente el sistema jerárquico, necesitas crear la UI de gestión:

**Próxima Sesión (Componentes UI):**
- [ ] Componente `GestionSedes.jsx` → Crear/editar/eliminar sedes
- [ ] Componente `GestionEdificios.jsx` → Crear/editar/eliminar edificios
- [ ] Componente `GestionPisos.jsx` → Crear/editar/eliminar pisos + subir imágenes
- [ ] Actualizar formulario de salas para seleccionar sede/edificio/piso
- [ ] Actualizar filtros en dashboards

---

## 🔧 Comandos Útiles

### **Desplegar reglas**
```bash
# Solo Firestore Rules
firebase deploy --only firestore:rules

# Solo Storage Rules
firebase deploy --only storage:rules

# Ambas
firebase deploy --only firestore:rules,storage:rules
```

### **Ver logs de migración**
Los logs completos están en la consola del navegador (F12 → Console)

### **Backup de Firestore**
```bash
# Exportar colecciones (requiere Firebase CLI configurado)
firebase firestore:export backup-$(date +%Y%m%d)
```

---

## 🎯 Siguiente Paso

Una vez completada la migración, puedes:

1. **Verificar que todo funciona** navegando por el sistema
2. **Crear nuevas sedes/edificios/pisos** (cuando tengas los componentes UI)
3. **Actualizar el README.md** con la nueva versión 3.0

---

## 📞 Soporte

Si encuentras algún problema durante la migración:

1. **Revisa los logs** en la consola del navegador (F12)
2. **Verifica Firebase Console** para ver el estado de los datos
3. **Consulta la documentación técnica** en `ARQUITECTURA_JERARQUICA.md`

---

## ✅ Checklist Post-Migración

Marca cada item después de completarlo:

- [ ] Migración ejecutada exitosamente
- [ ] Verificado en Firestore: colecciones `sedes`, `edificios`, `pisos`, `salas`
- [ ] Verificado en Storage: carpeta `planos/` con 4 imágenes
- [ ] Probado navegar por el sistema (todo funciona)
- [ ] Probado crear una reserva (todo funciona)
- [ ] Probado visualizar planos (todo funciona)
- [ ] Reglas de Firestore desplegadas
- [ ] Reglas de Storage desplegadas
- [ ] Eliminada pestaña "Migración" del Sidebar (ya no es necesaria)

---

**¡Felicidades! 🎉 Tu sistema ahora tiene una estructura jerárquica escalable.**

**Próximos pasos:** Implementar los componentes UI para gestionar sedes, edificios y pisos desde el AdminPanel.

---

**Desarrollado con ❤️ para INACAP 2025**
