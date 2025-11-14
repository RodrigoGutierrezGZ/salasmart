# 🏗️ Arquitectura Jerárquica del Sistema SalaSmart

**Fecha de diseño:** 5 de Noviembre, 2025
**Versión:** 3.0 - Sistema Completo con Jerarquía

---

## 📐 Estructura de Datos en Firestore

### **1. Colección: `sedes`**

```javascript
sedes/{sedeId}
{
  id: "sede1",                    // Auto-generado por Firestore
  nombre: "INACAP Renca",         // Nombre completo
  codigo: "RENCA",                // Código único (UPPERCASE)
  direccion: "Av. Departamental 233, Renca",  // Opcional
  activa: true,                   // Boolean
  fechaCreacion: Timestamp,
  fechaActualizacion: Timestamp
}
```

**Validaciones:**
- ✅ `codigo` debe ser único en toda la colección
- ✅ `nombre` debe tener al menos 5 caracteres
- ✅ Conversión automática a mayúsculas para `codigo`

---

### **2. Colección: `edificios`**

```javascript
edificios/{edificioId}
{
  id: "edificio1",                // Auto-generado por Firestore
  nombre: "Edificio A",           // Nombre descriptivo
  codigo: "A",                    // Código corto (A, B, C, Principal, etc.)
  sedeId: "sede1",                // Relación con sede
  sedeCodigo: "RENCA",            // Denormalizado para queries rápidas
  sedeNombre: "INACAP Renca",    // Denormalizado para display
  descripcion: "Edificio principal", // Opcional
  activo: true,
  fechaCreacion: Timestamp,
  fechaActualizacion: Timestamp
}
```

**Relaciones:**
- ✅ `sedeId` → referencia a `sedes/{sedeId}`
- ✅ Un edificio pertenece a UNA sede
- ✅ Una sede puede tener MUCHOS edificios

**Validaciones:**
- ✅ `codigo` debe ser único dentro de la misma sede
- ✅ No puede haber dos "Edificio A" en "INACAP Renca"

---

### **3. Colección: `pisos`**

```javascript
pisos/{pisoId}
{
  id: "piso1",                    // Auto-generado por Firestore
  numero: 1,                      // Número de piso (1, 2, 3, etc.)
  edificioId: "edificio1",        // Relación con edificio
  edificioCodigo: "A",            // Denormalizado
  edificioNombre: "Edificio A",   // Denormalizado
  sedeId: "sede1",                // Denormalizado desde edificio
  sedeCodigo: "RENCA",            // Denormalizado

  // Imagen del plano del piso
  imagenURL: "https://firebasestorage.googleapis.com/.../piso1.png",
  imagenPath: "planos/sede1/edificio1/piso1.png", // Path en Storage

  // Metadatos de la imagen
  imagenMetadata: {
    nombre: "piso1.png",
    tamaño: 1024576,              // Bytes
    tipo: "image/png",
    fechaSubida: Timestamp
  },

  nombreCompleto: "Piso 1 - Edificio A - INACAP Renca", // Para display
  activo: true,
  fechaCreacion: Timestamp,
  fechaActualizacion: Timestamp
}
```

**Relaciones:**
- ✅ `edificioId` → referencia a `edificios/{edificioId}`
- ✅ Un piso pertenece a UN edificio
- ✅ Un edificio puede tener MUCHOS pisos

**Validaciones:**
- ✅ `numero` debe ser único dentro del mismo edificio
- ✅ No puede haber dos "Piso 1" en "Edificio A"
- ✅ Imagen es obligatoria al crear (aunque sea placeholder)

**Storage de Imágenes:**
- Ruta: `planos/{sedeId}/{edificioId}/{pisoId}.{ext}`
- Tipos permitidos: `image/png`, `image/jpeg`, `image/webp`
- Tamaño máximo: 5MB
- Dimensiones recomendadas: 1920x1080px

---

### **4. Colección: `salas` (Actualizada)**

```javascript
salas/{salaId}
{
  id: "sala1",                    // Auto-generado o nombreTrimmed
  nombre: "401",                  // Nombre de la sala (UPPERCASE)

  // ⭐ NUEVA JERARQUÍA
  pisoId: "piso1",                // Relación con piso
  pisoNumero: 1,                  // Denormalizado
  edificioId: "edificio1",        // Denormalizado desde piso
  edificioCodigo: "A",            // Denormalizado
  sedeId: "sede1",                // Denormalizado desde piso
  sedeCodigo: "RENCA",            // Denormalizado

  // Campos existentes (se mantienen igual)
  capacidad: 40,
  tipo: "aula_teorica",           // aula_teorica, laboratorio, sala_reuniones, etc.
  equipamiento: {
    proyector: true,
    computadores: 30,
    enchufes: 20,
    pizarra: "digital",           // tradicional, digital
    aire_acondicionado: true,
    parlantes: true,
    microfono: false,
    camara: false,
    otros: []
  },

  // Coordenadas en el plano (para editor visual)
  coordenadas: {
    x: 150,                       // Píxeles desde la izquierda
    y: 200                        // Píxeles desde arriba
  },

  nombreCompleto: "401 - Piso 1 - Edificio A - INACAP Renca", // Para display
  activa: true,
  fechaCreacion: Timestamp,
  fechaActualizacion: Timestamp
}
```

**Cambios respecto a versión anterior:**
- ✅ Eliminado campo `piso` (number) → ahora es `pisoId` (string)
- ✅ Agregados campos denormalizados para queries rápidas
- ✅ Campo `nombreCompleto` se genera automáticamente

**Validaciones:**
- ✅ `nombre` debe ser único dentro del mismo piso
- ✅ No puede haber dos salas "401" en "Piso 1 - Edificio A"

---

## 🔄 Denormalización Estratégica

**¿Por qué denormalizar?**

Firestore cobra por cada lectura de documento. Si queremos mostrar "Sala 401 - Piso 1 - Edificio A - INACAP Renca", necesitaríamos:

```javascript
// SIN denormalización (❌ 4 lecturas)
1. Leer sala → obtener pisoId
2. Leer piso → obtener edificioId
3. Leer edificio → obtener sedeId
4. Leer sede → obtener nombre

// CON denormalización (✅ 1 lectura)
1. Leer sala → ya tiene sedeCodigo, edificioCodigo, pisoNumero
```

**Trade-off:**
- ✅ Ventaja: Queries ultra rápidas, menos lecturas = menos costo
- ⚠️ Desventaja: Al actualizar un edificio, hay que actualizar todas sus salas

**Solución:**
- Crear funciones de "actualización en cascada" para mantener consistencia
- Ejemplo: Si cambio "Edificio A" a "Edificio Principal", actualizo todas las salas

---

## 📊 Queries y Filtros Comunes

### **1. Obtener todas las salas de una sede**
```javascript
const salasQuery = query(
  collection(db, 'salas'),
  where('sedeId', '==', 'sede1'),
  where('activa', '==', true)
);
```

### **2. Obtener todos los pisos de un edificio**
```javascript
const pisosQuery = query(
  collection(db, 'pisos'),
  where('edificioId', '==', 'edificio1'),
  orderBy('numero', 'asc')
);
```

### **3. Obtener edificios de una sede**
```javascript
const edificiosQuery = query(
  collection(db, 'edificios'),
  where('sedeId', '==', 'sede1'),
  where('activo', '==', true)
);
```

### **4. Buscar sala específica**
```javascript
// Query compuesta: Sala 401 en Piso 1 del Edificio A
const salaQuery = query(
  collection(db, 'salas'),
  where('nombre', '==', '401'),
  where('pisoId', '==', 'piso1')
);
```

---

## 🛠️ Servicios a Crear

### **1. `sedesService.js`**
```javascript
export async function crearSede(datos)
export async function obtenerSedes()
export async function obtenerSedePorId(sedeId)
export async function actualizarSede(sedeId, datos)
export async function eliminarSede(sedeId) // Con validación de dependencias
export async function obtenerSedeConEdificios(sedeId)
```

### **2. `edificiosService.js`**
```javascript
export async function crearEdificio(datos)
export async function obtenerEdificios()
export async function obtenerEdificiosPorSede(sedeId)
export async function obtenerEdificioPorId(edificioId)
export async function actualizarEdificio(edificioId, datos)
export async function eliminarEdificio(edificioId) // Con validación
export async function obtenerEdificioConPisos(edificioId)
```

### **3. `pisosService.js`**
```javascript
export async function crearPiso(datos, imagenFile) // Con upload a Storage
export async function obtenerPisos()
export async function obtenerPisosPorEdificio(edificioId)
export async function obtenerPisoPorId(pisoId)
export async function actualizarPiso(pisoId, datos)
export async function actualizarImagenPiso(pisoId, imagenFile)
export async function eliminarPiso(pisoId) // Elimina imagen de Storage también
export async function obtenerPisoConSalas(pisoId)
```

### **4. Actualizar `useSalas.js`**
- Agregar soporte para filtrar por sede/edificio/piso
- Mantener compatibilidad con código existente

---

## 🎨 UI/UX - AdminPanel

### **Nueva estructura de pestañas:**

```
AdminPanel
├── 📊 Dashboard (existente)
├── 🏢 Infraestructura (NUEVO)
│   ├── 📍 Sedes
│   │   ├── Lista de sedes
│   │   └── Formulario crear/editar sede
│   ├── 🏗️ Edificios
│   │   ├── Lista de edificios (filtrada por sede)
│   │   └── Formulario crear/editar edificio
│   ├── 🏢 Pisos
│   │   ├── Lista de pisos (filtrada por edificio)
│   │   ├── Formulario crear/editar piso
│   │   └── Upload de imagen de plano
│   └── 🚪 Salas
│       ├── Lista de salas (filtrada por piso)
│       ├── Editor de planos (existente, mejorado)
│       └── Formulario crear/editar sala
├── 👥 Usuarios (existente)
└── 📅 Reservas (existente)
```

### **Flujo de creación:**

```
1. Admin crea Sede
   ↓
2. Admin crea Edificio (selecciona sede)
   ↓
3. Admin crea Piso (selecciona edificio, sube imagen)
   ↓
4. Admin crea Salas (selecciona piso, posiciona en plano)
```

---

## 🔒 Firestore Security Rules (Actualización)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function para verificar si el usuario es admin
    function isAdmin() {
      return request.auth != null &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Sedes: Solo admin puede escribir, todos pueden leer
    match /sedes/{sedeId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // Edificios: Solo admin puede escribir, todos pueden leer
    match /edificios/{edificioId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // Pisos: Solo admin puede escribir, todos pueden leer
    match /pisos/{pisoId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // Salas: Solo admin puede escribir, todos pueden leer
    match /salas/{salaId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // ... resto de reglas existentes
  }
}
```

---

## 🔧 Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper function para verificar si el usuario es admin
    function isAdmin() {
      return request.auth != null &&
             firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Planos de pisos: Solo admin puede subir/eliminar
    match /planos/{sedeId}/{edificioId}/{pisoImage} {
      allow read: if request.auth != null;  // Todos pueden ver
      allow write: if isAdmin();            // Solo admin puede modificar

      // Validaciones adicionales para uploads
      allow create: if isAdmin() &&
                      request.resource.size < 5 * 1024 * 1024 && // Max 5MB
                      request.resource.contentType.matches('image/(png|jpeg|jpg|webp)');
    }
  }
}
```

---

## 📦 Migración de Datos Existentes

### **Script de migración:**

```javascript
// frontend/src/utils/migracionJerarquia.js

/**
 * Script de migración para convertir estructura actual a jerárquica
 *
 * ANTES:
 * salas/
 *   └── 401 { nombre: "401", piso: 4, ... }
 *
 * DESPUÉS:
 * sedes/sede1 { nombre: "INACAP Renca", ... }
 * edificios/edificio1 { nombre: "Edificio Principal", sedeId: "sede1", ... }
 * pisos/piso1 { numero: 1, edificioId: "edificio1", ... }
 * salas/401 { nombre: "401", pisoId: "piso1", ... }
 */

export async function migrarDatosExistentes() {
  console.log('🔄 Iniciando migración de datos...');

  // 1. Crear sede por defecto
  const sedeId = await crearSedeDefault();

  // 2. Crear edificio por defecto
  const edificioId = await crearEdificioDefault(sedeId);

  // 3. Obtener todas las salas actuales
  const salasActuales = await obtenerSalasActuales();

  // 4. Agrupar salas por piso
  const salasPorPiso = agruparPorPiso(salasActuales);

  // 5. Crear documentos de pisos (1, 2, 3, 4)
  const pisoIds = await crearPisos(edificioId, salasPorPiso);

  // 6. Actualizar salas con nueva estructura
  await actualizarSalasConJerarquia(salasActuales, pisoIds);

  console.log('✅ Migración completada exitosamente!');
}
```

---

## ⚠️ Consideraciones Importantes

### **1. Consistencia de Datos**

Al actualizar un edificio, hay que actualizar en cascada:
```javascript
async function actualizarEdificioEnCascada(edificioId, nuevosDatos) {
  // 1. Actualizar edificio
  await updateDoc(doc(db, 'edificios', edificioId), nuevosDatos);

  // 2. Actualizar todos los pisos de ese edificio
  const pisosQuery = query(collection(db, 'pisos'), where('edificioId', '==', edificioId));
  const pisosSnap = await getDocs(pisosQuery);
  const batch = writeBatch(db);

  pisosSnap.docs.forEach(doc => {
    batch.update(doc.ref, {
      edificioCodigo: nuevosDatos.codigo,
      edificioNombre: nuevosDatos.nombre
    });
  });

  // 3. Actualizar todas las salas de ese edificio
  const salasQuery = query(collection(db, 'salas'), where('edificioId', '==', edificioId));
  const salasSnap = await getDocs(salasQuery);

  salasSnap.docs.forEach(doc => {
    batch.update(doc.ref, {
      edificioCodigo: nuevosDatos.codigo
    });
  });

  await batch.commit();
}
```

### **2. Eliminación en Cascada**

Al eliminar un edificio:
```javascript
async function eliminarEdificioConValidacion(edificioId) {
  // 1. Verificar que no tenga pisos
  const pisosSnap = await getDocs(
    query(collection(db, 'pisos'), where('edificioId', '==', edificioId))
  );

  if (!pisosSnap.empty) {
    throw new Error('No se puede eliminar: el edificio tiene pisos asociados');
  }

  // 2. Si no tiene pisos, eliminar
  await deleteDoc(doc(db, 'edificios', edificioId));
}
```

### **3. Validación de Referencias**

Antes de crear una sala, validar que el piso existe:
```javascript
async function validarPisoExiste(pisoId) {
  const pisoDoc = await getDoc(doc(db, 'pisos', pisoId));
  if (!pisoDoc.exists()) {
    throw new Error('El piso seleccionado no existe');
  }
  return pisoDoc.data();
}
```

---

## 🎯 Fases de Implementación

### **Fase 1: Backend (Servicios y Storage)**
1. ✅ Configurar Firebase Storage
2. ✅ Crear `sedesService.js`
3. ✅ Crear `edificiosService.js`
4. ✅ Crear `pisosService.js` (con upload)
5. ✅ Actualizar Firestore Rules
6. ✅ Actualizar Storage Rules

### **Fase 2: Frontend (UI Admin)**
1. ✅ Crear componente `GestionSedes.jsx`
2. ✅ Crear componente `GestionEdificios.jsx`
3. ✅ Crear componente `GestionPisos.jsx`
4. ✅ Integrar componentes en `AdminPanel.jsx`
5. ✅ Actualizar formularios de salas

### **Fase 3: Migración**
1. ✅ Crear script de migración
2. ✅ Ejecutar migración de datos existentes
3. ✅ Verificar integridad de datos

### **Fase 4: Testing**
1. ✅ Crear sede, edificio, piso
2. ✅ Subir imagen de plano
3. ✅ Crear sala vinculada
4. ✅ Verificar filtros y queries
5. ✅ Probar eliminación con validaciones

---

**Desarrollado con ❤️ para INACAP 2025**
