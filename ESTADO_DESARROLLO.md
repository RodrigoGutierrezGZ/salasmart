# Estado de Desarrollo - SalaSmart

**Fecha de actualización:** 31 de Octubre, 2025
**Proyecto:** Sistema de Gestión de Salas INACAP
**Stack:** React + Firebase (Firestore, Auth) + Tailwind CSS
**Versión Actual:** 1.5-tailwind-complete

---

## 📋 Resumen Ejecutivo

### ¿Dónde Estamos?

**Estado Actual:** � Sistema Base Completado (Migración a Tailwind CSS finalizada)

- ✅ **Fase 0 (Auth & Admin):** 100% Completada
- ✅ **Fase 1 (Reservas):** 100% Completada (Frontend completo)
- ✅ **Migración Tailwind CSS:** 100% Completada
- ✅ **Sistema de Roles:** 100% Implementado y funcional
- ⚪ **Fase 2-8:** Pendientes

### ✅ ¿Qué Funciona Ahora? (VERIFICADO - Octubre 31, 2025)

#### Autenticación y Roles
✅ Sistema de autenticación con 3 roles (estudiante, docente, admin)
✅ Protección de rutas por rol
✅ Sesión persistente
✅ Logout funcional

#### Panel de Administración (AdminPanel)
✅ **Dashboard con estadísticas:**
  - Total de salas
  - Salas disponibles en tiempo real
  - Total de usuarios
  - Reservas activas
  - Gráficas con Chart.js (Bar y Doughnut)
✅ **Gestión de Salas:**
  - CRUD completo (Crear, Leer, Actualizar, Eliminar)
  - Validación de datos
  - Búsqueda y filtros
✅ **Gestión de Usuarios:**
  - Listado completo con búsqueda
  - Cambio de roles (admin, docente, estudiante)
  - Activar/Desactivar usuarios
  - Filtros por rol
  - Botón de migración para usuarios sin campo 'activo'
✅ **Gestión de Reservas:**
  - Tabla con todas las reservas
  - **Filtros avanzados:**
    * Por estado (Activas, Todas, Canceladas, Completadas)
    * Por sala (dropdown con todas las salas)
    * Búsqueda por docente o asignatura
  - Cancelación de reservas
  - Vista con scroll y sticky headers
  - Estados visuales con colores (badges)
  - Botón "Limpiar Filtros"

#### Panel del Docente (TeacherDashboard)
✅ **Sistema de Reservas:**
  - Botón "Nueva Reserva" que abre modal de selección de salas
  - FormularioReserva con modal max-w-4xl
  - Verificación de disponibilidad
  - Confirmación de reserva
  - Header con gradiente (from-primary to-primary/80)
✅ **Visualización de Salas:**
  - Toggle entre Cards y Plano
  - PlanoSalas interactivo con tooltips personalizados
  - Filtros por Piso (1-4)
  - Filtros por Capacidad (pequeña, mediana, grande)
  - Toggle "Solo Disponibles" / "Todas las Salas"
  - Botón "Limpiar Filtros"
✅ **Sin estadísticas** (removidas según requerimiento)

#### Panel del Estudiante (StudentDashboard)
✅ **Modo Solo Lectura:**
  - Título: "Consulta de Salas"
  - Descripción: "Visualiza el estado y disponibilidad de las salas en tiempo real"
  - NO puede reservar (sin onClick handlers)
  - NO muestra "Haz clic para reservar" en tooltips
  - Sin FormularioReserva
  - Sin botón "Reservar ahora"
✅ **Visualización:**
  - Toggle entre Cards y Plano (solo visualización)
  - Filtros por Piso y Capacidad (funcionales)
  - Toggle "Solo Disponibles" / "Todas las Salas"
  - Información completa de cada sala
✅ **Sin estadísticas** (removidas según requerimiento)
✅ **Sidebar simplificado:**
  - Solo "Dashboard" y "Perfil"
  - NO tiene "Mis Reservas"

#### Componentes Compartidos
✅ **Sidebar:**
  - Logo "SalaSmart" clickeable (lleva al dashboard principal de cada rol)
  - Navegación dinámica según rol
  - Hover effects y transiciones
  - Admin: navegación por tabs
  - Docente/Estudiante: navegación por rutas
✅ **PlanoSalas:**
  - Tooltips personalizados con React state (sin Bootstrap)
  - Prop `showReservarText` para controlar texto de reserva
  - Animaciones suaves (hover, scale)
  - Estados de color: verde (disponible), amarillo (próximamente), rojo (ocupado)
  - Arrow pointer con CSS
✅ **FormularioReserva:**
  - Migrado 100% a Tailwind CSS
  - Modal max-w-4xl con gradiente
  - Validaciones completas
  - 3 botones de acción: Verificar Disponibilidad, Confirmar, Cancelar
  - Spinners personalizados con SVG
  - Detección automática de jornada
✅ **MisReservas:**
  - Migrado 100% a Tailwind CSS
  - Toggle "Solo Activas" / "Todas"
  - Tabla con sticky header y scroll
  - Columna de Jornada con auto-detección
  - Botones Cancelar y Eliminar con validaciones
  - 2 modales de confirmación
  - Función `obtenerJornada()` para reservas antiguas
  - Función `puedeCancelar()` con validación de tiempo

#### Sistema de Diseño
✅ **Tailwind CSS v3.4.0:**
  - Bootstrap 100% removido
  - Theme personalizado con color primario #4F46E5 (indigo-600)
  - Plugin @tailwindcss/forms
  - Animaciones personalizadas (fadeIn, slideUp)
  - Gradientes y efectos de hover
  - Dropdowns personalizados con Material Icons
  - Cards con sombras suaves (shadow-soft)
✅ **Material Symbols Outlined:**
  - Iconos consistentes en toda la aplicación
  - Tamaños y colores personalizados

### � ¿Qué Falta Implementar?

#### Funcionalidades Pendientes (Próxima Sesión)

1. **Sistema de Notificaciones** (Fase 3)
   - Notificaciones push
   - Emails de confirmación
   - Recordatorios de reservas

2. **Estadísticas Avanzadas** (Solo para Admin)
   - Reportes por período
   - Salas más utilizadas
   - Horarios peak
   - Exportación a PDF/Excel

3. **Gestión de Equipamiento**
   - CRUD de equipos por sala
   - Filtrado por equipamiento disponible
   - Reporte de equipos en mantenimiento

4. **Sistema de Conflictos**
   - Detección automática de conflictos
   - Sugerencias de horarios alternativos
   - Reservas recurrentes

5. **Historial y Auditoría**
   - Log de cambios en reservas
   - Historial de uso por usuario
   - Reportes de cancelaciones

6. **Optimizaciones**
   - Caché de datos frecuentes
   - Paginación en tablas grandes
   - Lazy loading de componentes
   - Service Worker para PWA

7. **Testing**
   - Tests unitarios
   - Tests de integración
   - Tests E2E con Cypress

8. **Cloud Functions** (Opcional - actualmente sin plan Blaze)
   - Validación de reservas en servidor
   - Limpieza automática de reservas antiguas
   - Generación de reportes programados

#### Mejoras de UX Pendientes

1. **Notificaciones Toast**
   - Confirmaciones visuales de acciones
   - Errores más descriptivos
   - Biblioteca react-hot-toast

2. **Loading States Mejorados**
   - Skeletons en lugar de spinners
   - Feedback visual en acciones async

3. **Modo Oscuro** (Opcional)
   - Toggle en configuración
   - Persistencia de preferencia

4. **Búsqueda Global**
   - Buscar salas, usuarios, reservas desde cualquier lugar
   - Keyboard shortcuts (Ctrl+K)

5. **Calendario Visual**
   - Vista de calendario mensual
   - Drag & drop para reservas
   - Integración con Google Calendar

---

## ✅ Fase 0: Autenticación y Admin Panel (100% Completado)

### Características Implementadas

#### Sistema de Autenticación
- ✅ **Firebase Authentication** integrado
- ✅ **Registro de usuarios** con email/contraseña
- ✅ **Login con validación**
- ✅ **Gestión de sesión** persistente
- ✅ **Sistema de roles** (estudiante, docente, admin)
- ✅ **ProtectedRoute** con renderizado dinámico por rol
- ✅ **Rutas configuradas:** /, /login, /registro, /dashboard, /mis-reservas, /perfil

#### Admin Panel
- ✅ **Tab "Dashboard":**
  - 3 Stats cards (Total Salas, Salas Disponibles, Total Usuarios, Reservas Activas)
  - Gráfica de barras: Reservas por Sala
  - Gráfica de dona: Distribución de uso
- ✅ **Tab "Salas":**
  - CRUD completo
  - Formulario con validaciones
  - Tabla con scroll y sticky header
  - Búsqueda en tiempo real
  - Edición inline
- ✅ **Tab "Usuarios":**
  - Listado completo
  - Cambio de roles (excepto el propio)
  - Activar/Desactivar usuarios
  - Búsqueda y filtro por rol
  - Botón "Activar Todos" para migración
- ✅ **Tab "Reservas":**
  - Filtros: Estado, Sala, Búsqueda
  - Tabla con información completa
  - Cancelación de reservas
  - Estados visuales (badges)
  - Scroll y sticky header
- ✅ **Navegación por tabs** (sin router, state-based)

#### Firestore Collections
```javascript
// Colección: users
{
  email: string,
  nombre: string,
  role: "estudiante" | "docente" | "admin",
  activo: boolean,
  fechaCreacion: Timestamp
}

// Colección: salas
{
  nombre: string,
  capacidad: number,
  piso: number,
  activa: boolean,
  equipamiento: string[], // Opcional
  fechaCreacion: Timestamp,
  fechaActualizacion: Timestamp
}

// Colección: reservas
{
  salaId: string,
  salaNombre: string,
  usuarioId: string,
  nombreDocente: string,
  asignatura: string,
  horaInicio: Timestamp,
  horaFin: Timestamp,
  jornada: "DIURNO" | "VESPERTINO",
  estado: "activa" | "cancelada" | "completada",
  fechaCreacion: Timestamp
}
```

**Archivos Clave:**
- `salasmart-frontend/src/hooks/useAuth.js` ✅
- `salasmart-frontend/src/components/AdminPanel.jsx` ✅ (Migrado a Tailwind)
- `salasmart-frontend/src/firebase/config.js` ✅
- `salasmart-frontend/src/pages/Login.jsx` ✅
- `salasmart-frontend/src/pages/Registro.jsx` ✅
- `salasmart-frontend/src/components/ProtectedRoute.jsx` ✅

---

## ✅ Fase 1: Sistema de Reservas (100% Frontend Completado)

### Frontend Implementado

#### Panel del Docente (TeacherDashboard)
- ✅ **Vista de Salas:**
  - Toggle Cards / Plano
  - Filtros por Piso (1-4)
  - Filtros por Capacidad (pequeña ≤15, mediana 16-30, grande >30)
  - Botón "Limpiar filtros"
  - Toggle "Solo Disponibles" / "Todas las Salas"
- ✅ **Sistema de Reservas:**
  - Botón "Nueva Reserva" en header
  - Modal de selección de salas
  - FormularioReserva integrado
  - Verificación de disponibilidad en tiempo real
  - Confirmación de reserva
- ✅ **PlanoSalas Interactivo:**
  - Tooltips personalizados (React state, sin Bootstrap)
  - Estados de color (verde/amarillo/rojo)
  - Animaciones hover
  - onClick para reservar
- ✅ **Sin estadísticas** (removidas según diseño)

#### Panel del Estudiante (StudentDashboard)  
- ✅ **Modo Solo Lectura:**
  - Título: "Consulta de Salas"
  - Sin capacidad de reservar
  - Sin onClick en PlanoSalas ni Cards
  - Tooltips SIN texto "Haz clic para reservar"
- ✅ **Visualización:**
  - Toggle Cards / Plano (solo visualización)
  - Filtros por Piso y Capacidad
  - Toggle "Solo Disponibles" / "Todas las Salas"
  - Información completa de salas
- ✅ **Sidebar Simplificado:**
  - Solo "Dashboard" y "Perfil"
  - NO tiene "Mis Reservas"

#### Componentes Clave

**PlanoSalas.jsx** ✅
- Tooltips personalizados con React useState
- Prop `showReservarText` (true para docente, false para estudiante)
- Badge con nombre de sala
- Estados de color dinámicos
- Arrow pointer con CSS
- Hover effects (scale-110, transition)

**FormularioReserva.jsx** ✅
- Modal max-w-4xl con gradiente
- Header con info de sala (capacidad, piso)
- Validaciones completas:
  * Asignatura (mínimo 3 caracteres)
  * Horarios (8:00-22:00)
  * Duración (30min - 4 horas)
- 3 botones de acción:
  * Verificar Disponibilidad (outline)
  * Confirmar Reserva (primary, con validación)
  * Cancelar (gray)
- Spinners SVG personalizados
- Detección automática de jornada
- Integración con Firestore (crear reserva)

**MisReservas.jsx** ✅
- Toggle "Solo Activas" / "Todas"
- Tabla con sticky header y scroll
- Columnas: Sala, Asignatura, Fecha y Hora, Jornada, Estado, Acciones
- Función `obtenerJornada()`: auto-detecta jornada de reservas antiguas
- Función `puedeCancelar()`: valida si puede cancelarse (activa + horaInicio > now)
- Estados con badges coloridos:
  * Activa: bg-success/10 text-success
  * Cancelada: bg-danger/10 text-danger
  * Completada: bg-gray-100 text-gray-600
- 2 modales de confirmación (Cancelar, Eliminar)
- Botones contextuales según estado

**Sidebar.jsx** ✅
- Logo "SalaSmart" clickeable:
  * Admin: onChange tab a 'dashboard'
  * Docente/Estudiante: window.location.href = '/dashboard'
- Hover effects: bg-primary/5, scale-110 en logo
- Navegación dinámica por rol:
  * Admin: buttons con activeTab
  * Docente: Dashboard, Mis Reservas, Perfil (Links)
  * Estudiante: Dashboard, Perfil (sin Mis Reservas)
- Sección inferior: Ajustes, Cerrar Sesión

#### Sistema de Diseño - Tailwind CSS

**Migración Completa** ✅
- Bootstrap 100% removido de todos los componentes
- Tailwind CSS v3.4.0 configurado
- Theme personalizado:
  ```js
  colors: {
    primary: '#4F46E5',  // indigo-600
    secondary: '#7C3AED', // violet-600
    success: '#10B981',   // green-500
    danger: '#EF4444',    // red-500
    warning: '#F59E0B',   // amber-500
  }
  ```
- Plugin @tailwindcss/forms
- Animaciones CSS personalizadas:
  ```css
  @keyframes fadeIn { opacity: 0 → 1; duration: 0.2s }
  @keyframes slideUp { opacity: 0 → 1; translateY: 20px → 0; duration: 0.3s }
  ```

**Material Symbols Outlined** ✅
- Iconos consistentes en toda la app
- Tamaños: text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px)
- Colores: text-primary, text-success, text-danger, text-gray-400

**Componentes Reutilizables:**
- Dropdowns personalizados con `appearance-none` + Material Icons
- Cards con `shadow-soft` y `border-neutral-light`
- Modales con `backdrop-blur-sm` y `animate-fadeIn`
- Botones con estados hover y disabled
- Tables con sticky headers y scroll

#### Rutas Configuradas (App.jsx)
```javascript
/ → Home (o Navigate /dashboard si autenticado)
/login → Login page
/registro → Registro page
/dashboard → ProtectedRoute → AdminPanel | TeacherDashboard | StudentDashboard (según rol)
/mis-reservas → ProtectedRoute → MisReservasPage
/perfil → ProtectedRoute → PerfilPage (placeholder)
```

### Backend Pendiente (Opcional - requiere plan Blaze)

#### 📁 Estructura Cloud Functions

```
functions/
├── package.json
├── src/
│   ├── index.js                     
│   ├── utils/
│   │   ├── constants.js             
│   │   ├── timeHelpers.js           
│   │   ├── validators.js            
│   │   └── estadoSala.js            
│   ├── services/
│   │   ├── salasService.js          
│   │   └── reservasService.js       
│   └── api/
│       └── reservasAPI.js
└── firestore.rules                  ✅ Reglas de seguridad
└── firestore.indexes.json           ✅ Índices compuestos
```

#### 🔧 Cloud Functions Creadas

| Función | Endpoint | Descripción | Estado |
|---------|----------|-------------|--------|
| `crearReserva` | POST | Crea nueva reserva con validación de conflictos | ✅ |
| `obtenerReservasSala` | GET | Lista reservas de una sala específica | ✅ |
| `obtenerMisReservas` | GET | Lista reservas del usuario actual | ✅ |
| `cancelarReserva` | PUT | Cancela una reserva (soft delete) | ✅ |
| `actualizarReserva` | PUT | Actualiza datos de una reserva | ✅ |
| `validarDisponibilidad` | POST | Verifica disponibilidad antes de reservar | ✅ |

#### 🔒 Seguridad Implementada

- **Firestore Rules**: Control de acceso por roles (admin, docente, estudiante)
- **Validación Server-Side**: Todas las reservas validan conflictos en el backend
- **Autenticación**: Todas las Cloud Functions requieren auth

#### 🧮 Lógica de Estados (3 Colores)

**Implementado en:** `functions/src/utils/estadoSala.js`

| Color | Estado | Condición | Hex |
|-------|--------|-----------|-----|
| 🟢 Verde | Disponible | Sin reservas activas ni próximas | `#4CAF50` |
| 🟡 Amarillo | Próximamente | Reserva en los próximos 15 minutos | `#FFC107` |
| 🔴 Rojo | Ocupado | Reserva activa en este momento | `#F44336` |

---

### Frontend Implementado

#### 📁 Archivos Creados/Modificados

```
salasmart-frontend/src/
├── utils/
│   ├── constants.js                 ✅ NUEVO - Constantes (copia del backend)
│   └── estadoSala.js                ✅ NUEVO - Lógica de estados (versión cliente)
├── services/
│   └── reservasService.js           ✅ NUEVO - Cliente para Cloud Functions
├── hooks/
│   └── useSalas.js                  ✅ MODIFICADO - Ahora calcula 3 estados
├── components/
│   ├── PlanoSalas.jsx               ✅ MODIFICADO - Badges con 3 colores
│   ├── FormularioReserva.jsx        ✅ NUEVO - Formulario completo de reserva
│   └── MisReservas.jsx              ✅ NUEVO - Lista y gestión de reservas
└── pages/
    └── TeacherDashboard.jsx         ✅ MODIFICADO - Integra formulario y estados
```

#### 🎨 Componentes UI

| Componente | Ubicación | Funcionalidad | Estado |
|------------|-----------|---------------|--------|
| **PlanoSalas** | `components/PlanoSalas.jsx` | Plano interactivo con badges de colores | ✅ |
| **FormularioReserva** | `components/FormularioReserva.jsx` | Form con validación en tiempo real | ✅ |
| **MisReservas** | `components/MisReservas.jsx` | Tabla de reservas + cancelación | ✅ |
| **TeacherDashboard** | `pages/TeacherDashboard.jsx` | Panel principal con modal de reserva | ✅ |

#### 🔄 Arquitectura Híbrida

**Decisión Arquitectónica:** Combinar acceso directo a Firestore con Cloud Functions

| Operación | Método | Razón |
|-----------|--------|-------|
| **Lectura de salas** | Firestore directo (`onSnapshot`) | Tiempo real + performance |
| **Lectura de reservas** | Firestore directo (`onSnapshot`) | Listeners eficientes |
| **Admin Panel CRUD** | Firestore directo | Protegido por rules |
| **Crear reserva** | Cloud Function | Validación server-side |
| **Cancelar reserva** | Cloud Function | Lógica de negocio |
| **Validar disponibilidad** | Cloud Function | Prevenir conflictos |

---

## ❌ Lo que Falta por Hacer

### Tareas Inmediatas (Fase 1 - 5% restante)

- [ ] **Instalar dependencias del backend**
  ```bash
  cd functions
  npm install
  ```

- [ ] **Desplegar reglas e índices de Firestore**
  ```bash
  firebase deploy --only firestore:rules
  firebase deploy --only firestore:indexes
  ```

- [ ] **Desplegar Cloud Functions**
  ```bash
  firebase deploy --only functions
  ```

- [ ] **Integrar MisReservas en la navegación**
  - Agregar al TeacherDashboard o crear ruta separada
  - Ejemplo:
    ```jsx
    // En TeacherDashboard.jsx
    import MisReservas from '../components/MisReservas';

    // Agregar después del PlanoSalas:
    <div className="mt-5">
      <MisReservas />
    </div>
    ```

- [ ] **Poblar datos de prueba**
  - Usar AdminPanel para crear salas
  - O agregar manualmente en Firebase Console

- [ ] **Pruebas de integración**
  - Probar creación de reservas
  - Probar validación de conflictos
  - Probar cancelación de reservas
  - Verificar estados en tiempo real

---

## 🚀 Próximas Fases

### Fase 2: Chatbot con Dialogflow (0%)

**Requisitos del PDF:**
- RF-09: Integración con Dialogflow
- RF-10: Consultas por voz/texto sobre disponibilidad
- RF-11: Reservas mediante chatbot

**Tareas:**
- [ ] Configurar agente Dialogflow
- [ ] Crear intents principales:
  - Consultar disponibilidad de sala
  - Crear reserva
  - Cancelar reserva
  - Consultar mis reservas
- [ ] Crear Webhook para conectar Dialogflow con Firebase
- [ ] Integrar widget de chat en el frontend
- [ ] Implementar contextos de conversación

**Archivos a crear:**
```
functions/src/
└── api/
    └── dialogflowWebhook.js         ⚪ Pendiente

salasmart-frontend/src/
└── components/
    └── ChatBot.jsx                  ⚪ Pendiente
```

---

### Fase 3: Sistema de Notificaciones (0%)

**Requisitos del PDF:**
- RF-04: Notificaciones de cambios de estado

**Tareas:**
- [ ] Configurar Firebase Cloud Messaging (FCM)
- [ ] Implementar triggers para notificaciones:
  - Nueva reserva creada
  - Reserva cancelada
  - Sala próxima a ser ocupada (15 min antes)
  - Cambio de estado de sala
- [ ] Crear servicio de notificaciones en backend
- [ ] Implementar notificaciones push en frontend
- [ ] Agregar preferencias de notificaciones por usuario

**Archivos a crear:**
```
functions/src/
└── services/
    └── notificacionesService.js     ⚪ Pendiente

salasmart-frontend/src/
└── services/
    └── notificacionesService.js     ⚪ Pendiente
```

---

### Fase 4: Dashboard de Estadísticas (0%)

**Tareas:**
- [ ] Diseñar métricas clave:
  - Tasa de ocupación por sala
  - Salas más/menos utilizadas
  - Reservas por docente
  - Horarios pico
- [ ] Crear agregaciones periódicas (Cloud Functions scheduled)
- [ ] Implementar componente Dashboard con gráficos
- [ ] Agregar filtros (fecha, sala, docente)

**Archivos a crear:**
```
functions/src/
└── scheduled/
    └── calcularEstadisticas.js      ⚪ Pendiente

salasmart-frontend/src/
└── pages/
    └── EstadisticasPanel.jsx        ⚪ Pendiente
```

---

### Fase 5: Integraciones Externas (0%)

**Objetivo:** Conectar SalaSmart con servicios externos para mejorar la experiencia del usuario.

**Características:**

#### 5.1 Integración con Google Calendar
- [ ] Sincronización bidireccional con Google Calendar
- [ ] Crear eventos automáticamente al hacer reservas
- [ ] Actualizar/cancelar eventos cuando cambia la reserva
- [ ] Importar calendario académico de INACAP

#### 5.2 Notificaciones por Email
- [ ] Envío de emails con Firebase Extension (Trigger Email)
- [ ] Templates de email personalizados:
  - Confirmación de reserva
  - Recordatorio 24h antes
  - Recordatorio 1h antes
  - Cancelación de reserva
  - Cambios en la reserva
- [ ] Emails con formato HTML responsive

#### 5.3 Exportación de Reportes
- [ ] Exportar reservas a Excel/CSV
- [ ] Generar PDF con resumen de reservas
- [ ] Exportar estadísticas en diferentes formatos

#### 5.4 API REST Pública (Opcional)
- [ ] Documentación con Swagger/OpenAPI
- [ ] Endpoints públicos para consultar disponibilidad
- [ ] Sistema de API Keys para terceros
- [ ] Rate limiting y control de acceso

**Archivos a crear:**
```
functions/src/
├── integrations/
│   ├── googleCalendarService.js     ⚪
│   ├── emailService.js              ⚪
│   └── exportService.js             ⚪
└── api/
    └── publicAPI.js                 ⚪

salasmart-frontend/src/
└── services/
    └── exportService.js             ⚪
```

**Dependencias:**
- `@google-cloud/firestore` (exportación)
- `googleapis` (Google Calendar)
- `nodemailer` o Firebase Extension
- `pdfkit` o `jspdf` (generación de PDFs)
- `xlsx` (exportación Excel)

---

### Fase 6: Modo Kiosco para Pantallas Públicas (0%)

**Objetivo:** Desplegar pantallas táctiles en pasillos/entradas mostrando disponibilidad en tiempo real.

**Características:**

#### 6.1 Interfaz Kiosco
- [ ] Vista fullscreen optimizada para pantallas grandes (32"-55")
- [ ] Plano interactivo de gran tamaño
- [ ] Actualización automática cada 30 segundos
- [ ] Modo night/day según horario
- [ ] Sin necesidad de login (solo consulta)

#### 6.2 Funcionalidades
- [ ] Visualización de disponibilidad actual de todas las salas
- [ ] Filtros por piso/edificio
- [ ] QR code para reservar desde celular
- [ ] Información de la próxima reserva de cada sala
- [ ] Mapa de ubicación física del usuario

#### 6.3 Gestión de Dispositivos
- [ ] Panel admin para gestionar pantallas kiosco
- [ ] Configuración remota (brillo, horarios, contenido)
- [ ] Monitoreo de estado de dispositivos
- [ ] Reinicio remoto

**Archivos a crear:**
```
salasmart-frontend/src/
├── pages/
│   └── KioskoMode.jsx               ⚪
├── components/
│   ├── KioskoPlano.jsx              ⚪
│   └── QRReserva.jsx                ⚪
└── styles/
    └── kiosco.css                   ⚪
```

**Tecnologías:**
- React (modo fullscreen)
- QR Code generation (`qrcode.react`)
- Geolocalización
- Screen Wake Lock API

---

### Fase 7: Aplicación Móvil (0%) - OPCIONAL

**Objetivo:** App nativa para iOS y Android con notificaciones push y reservas rápidas.

**Características:**

#### 7.1 Funcionalidades Móviles
- [ ] Todas las funcionalidades del web
- [ ] Notificaciones push nativas
- [ ] Escaneo de QR codes
- [ ] Navegación indoor (AR opcional)
- [ ] Modo offline con sincronización
- [ ] Widgets para pantalla de inicio

#### 7.2 Características Nativas
- [ ] Calendario del dispositivo integrado
- [ ] Compartir reserva vía WhatsApp/Email
- [ ] Shortcuts de Siri/Google Assistant
- [ ] Modo oscuro automático
- [ ] Biometría (Face ID / Fingerprint)

**Stack Tecnológico:**
```
Opción 1: React Native
├── react-native
├── react-navigation
├── firebase-react-native
└── react-native-push-notification

Opción 2: Flutter
├── flutter
├── firebase_flutter
└── flutter_local_notifications
```

**Archivos a crear:**
```
salasmart-mobile/                    ⚪ Nuevo proyecto
├── ios/
├── android/
└── src/
    ├── screens/
    ├── components/
    └── services/
```

---

### Fase 8: Testing, Optimización y Deployment (0%)

**Objetivo:** Garantizar calidad, performance y disponibilidad del sistema en producción.

#### 8.1 Testing Unitario (Backend)
- [ ] **estadoSala.js** - Probar lógica de 3 colores
- [ ] **validators.js** - Validar todas las reglas de negocio
- [ ] **reservasService.js** - Detección de conflictos
- [ ] **timeHelpers.js** - Manipulación de fechas
- [ ] Framework: Jest + Firebase Emulators

#### 8.2 Testing de Integración (Cloud Functions)
- [ ] Probar todos los endpoints HTTP
- [ ] Validar reglas de Firestore
- [ ] Verificar autenticación y autorización
- [ ] Probar límites y edge cases
- [ ] Framework: Jest + Supertest + Firebase Test SDK

#### 8.3 Testing E2E (Frontend)
- [ ] **Flujo de reserva completa**:
  - Login → Ver plano → Seleccionar sala → Reservar → Confirmar
- [ ] **Cancelación de reserva**
- [ ] **Actualización en tiempo real** de estados
- [ ] **Validación de conflictos** en UI
- [ ] Framework: Playwright o Cypress

#### 8.4 Testing de Performance
- [ ] Lighthouse (PWA score, performance)
- [ ] Load testing con k6 o Artillery
- [ ] Stress testing de Cloud Functions
- [ ] Optimización de bundle size (code splitting)
- [ ] Lazy loading de componentes

#### 8.5 Optimización
- [ ] **Frontend:**
  - [ ] Code splitting por rutas
  - [ ] Lazy loading de imágenes
  - [ ] Service Worker (PWA)
  - [ ] Compresión de assets
  - [ ] CDN para archivos estáticos
- [ ] **Backend:**
  - [ ] Caché de queries frecuentes
  - [ ] Índices compuestos optimizados
  - [ ] Batching de operaciones
  - [ ] Cold start optimization

#### 8.6 CI/CD Pipeline
- [ ] **GitHub Actions** configurado:
  ```yaml
  # .github/workflows/deploy.yml
  - Lint code
  - Run tests
  - Build frontend
  - Deploy Functions
  - Deploy Hosting
  - Deploy Firestore Rules
  ```
- [ ] Environments: `dev`, `staging`, `production`
- [ ] Rollback automático si fallan tests
- [ ] Notificaciones en Slack/Discord

#### 8.7 Monitoreo y Logging
- [ ] **Firebase Performance Monitoring**
- [ ] **Google Analytics** para métricas de uso
- [ ] **Sentry** para error tracking
- [ ] **Cloud Logging** para auditoría
- [ ] **Uptime monitoring** (UptimeRobot o similar)
- [ ] Dashboard de métricas en Grafana (opcional)

#### 8.8 Deployment a Producción
- [ ] Dominio personalizado configurado
- [ ] SSL/HTTPS habilitado
- [ ] Backup automático de Firestore
- [ ] Disaster recovery plan
- [ ] Documentación de deployment
- [ ] Manual de operaciones para admin

**Herramientas:**
```bash
# Testing
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev cypress playwright
npm install --save-dev @firebase/rules-unit-testing

# Monitoring
npm install @sentry/react @sentry/node
npm install firebase-performance

# CI/CD
# GitHub Actions (incluido en GitHub)
```

**Archivos a crear:**
```
salasmart/
├── .github/
│   └── workflows/
│       ├── deploy.yml               ⚪
│       ├── test.yml                 ⚪
│       └── lint.yml                 ⚪
├── tests/
│   ├── unit/
│   │   ├── estadoSala.test.js       ⚪
│   │   ├── validators.test.js       ⚪
│   │   └── reservasService.test.js  ⚪
│   ├── integration/
│   │   └── api.test.js              ⚪
│   └── e2e/
│       └── reserva-flow.spec.js     ⚪
└── docs/
    ├── DEPLOYMENT.md                ⚪
    ├── TESTING.md                   ⚪
    └── OPERATIONS.md                ⚪
```

---

## 📂 Estructura Completa del Proyecto

```
salasmart/
├── functions/                           ✅ Backend completo
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   ├── api/
│   │   │   ├── reservasAPI.js
│   │   │   └── dialogflowWebhook.js     ⚪ Fase 2
│   │   ├── services/
│   │   │   ├── salasService.js
│   │   │   ├── reservasService.js
│   │   │   └── notificacionesService.js ⚪ Fase 3
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   ├── timeHelpers.js
│   │   │   ├── validators.js
│   │   │   └── estadoSala.js
│   │   └── scheduled/
│   │       └── calcularEstadisticas.js  ⚪ Fase 4
│   ├── firestore.rules
│   └── firestore.indexes.json
│
├── salasmart-frontend/                  ✅ Frontend Fase 1 completo
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminPanel.jsx           ✅ Existente (sin cambios)
│   │   │   ├── PlanoSalas.jsx           ✅ Actualizado
│   │   │   ├── FormularioReserva.jsx    ✅ Nuevo
│   │   │   ├── MisReservas.jsx          ✅ Nuevo
│   │   │   └── ChatBot.jsx              ⚪ Fase 2
│   │   ├── pages/
│   │   │   ├── TeacherDashboard.jsx     ✅ Actualizado
│   │   │   ├── StudentDashboard.jsx     ✅ Existente
│   │   │   └── EstadisticasPanel.jsx    ⚪ Fase 4
│   │   ├── hooks/
│   │   │   ├── useSalas.js              ✅ Actualizado
│   │   │   └── useAuth.js               ✅ Existente
│   │   ├── services/
│   │   │   ├── reservasService.js       ✅ Nuevo
│   │   │   └── notificacionesService.js ⚪ Fase 3
│   │   ├── utils/
│   │   │   ├── constants.js             ✅ Nuevo
│   │   │   └── estadoSala.js            ✅ Nuevo
│   │   └── firebase/
│   │       └── config.js                ✅ Existente
│   └── public/
│       └── plano_inacap.jpg             ✅ Existente
│
└── ESTADO_DESARROLLO.md                 ✅ Este archivo
```

---

## 🛠️ Comandos Útiles

### Desarrollo Local

```bash
# Instalar dependencias frontend
cd salasmart-frontend
npm install

# Instalar dependencias backend
cd ../functions
npm install

# Ejecutar emuladores Firebase (opcional)
firebase emulators:start

# Ejecutar frontend en desarrollo
cd ../salasmart-frontend
npm run dev
```

### Deployment

```bash
# Deploy completo
firebase deploy

# Deploy solo Cloud Functions
firebase deploy --only functions

# Deploy solo Firestore rules
firebase deploy --only firestore:rules

# Deploy solo Firestore indexes
firebase deploy --only firestore:indexes

# Deploy solo hosting
firebase deploy --only hosting
```

---

## 📋 Checklist para Completar Fase 1

1. ✅ Backend: Estructura de carpetas
2. ✅ Backend: Cloud Functions
3. ✅ Backend: Firestore Rules
4. ✅ Backend: Lógica de estados 3 colores
5. ✅ Frontend: Componentes UI
6. ✅ Frontend: Integración con Cloud Functions
7. ✅ Frontend: Sistema de 3 colores en PlanoSalas
8. ⬜ Backend: Instalar dependencias (`npm install`)
9. ⬜ Backend: Deploy Cloud Functions
10. ⬜ Firestore: Deploy rules e indexes
11. ⬜ Frontend: Integrar MisReservas en navegación
12. ⬜ Testing: Pruebas de flujo completo
13. ⬜ Datos: Poblar salas de prueba

---

## 🎯 Requisitos Funcionales del Sistema

### Requisitos del PDF (Core - Alta Prioridad)

| Código | Requisito | Estado | Fase |
|--------|-----------|--------|------|
| RF-01 | Visualización de plano interactivo | ✅ | 0, 1 |
| RF-02 | Estados con colores (verde/amarillo/rojo) | ✅ | 1 |
| RF-03 | Reserva de salas por docentes | ✅ | 1 |
| RF-04 | Notificaciones de cambio de estado | ⚪ | 3 |
| RF-05 | Consulta de disponibilidad | ✅ | 1 |
| RF-06 | Gestión de salas (Admin) | ✅ | 0 |
| RF-07 | Autenticación con roles | ✅ | 0 |
| RF-08 | Cancelación de reservas | ✅ | 1 |
| RF-09 | Integración con Dialogflow | ⚪ | 2 |
| RF-10 | Consultas por chatbot | ⚪ | 2 |
| RF-11 | Reservas por chatbot | ⚪ | 2 |

**Progreso Core:** 7/11 requisitos (64%)

---

### Requisitos Adicionales (Extensiones - Media/Baja Prioridad)

| Código | Requisito | Estado | Fase | Prioridad |
|--------|-----------|--------|------|-----------|
| RF-12 | Notificaciones push en tiempo real | ⚪ | 3 | Media |
| RF-13 | Notificaciones por email | ⚪ | 3, 5 | Media |
| RF-14 | Dashboard de estadísticas y reportes | ⚪ | 4 | Media |
| RF-15 | Exportación de datos (CSV/PDF/Excel) | ⚪ | 4, 5 | Media |
| RF-16 | Integración con Google Calendar | ⚪ | 5 | Baja |
| RF-17 | API REST pública para terceros | ⚪ | 5 | Baja |
| RF-18 | Modo Kiosco para pantallas públicas | ⚪ | 6 | Baja |
| RF-19 | Gestión remota de dispositivos kiosco | ⚪ | 6 | Baja |
| RF-20 | Generación de QR codes para reservas | ⚪ | 6 | Baja |
| RF-21 | Aplicación móvil iOS/Android | ⚪ | 7 | Opcional |
| RF-22 | Notificaciones push móviles nativas | ⚪ | 7 | Opcional |
| RF-23 | Modo offline con sincronización | ⚪ | 7 | Opcional |
| RF-24 | Testing automatizado (unit/e2e) | ⚪ | 8 | Alta |
| RF-25 | CI/CD con GitHub Actions | ⚪ | 8 | Alta |
| RF-26 | Monitoreo y logging de producción | ⚪ | 8 | Alta |
| RF-27 | Reservas recurrentes (semanal/mensual) | ⚪ | Backlog | Baja |
| RF-28 | Sistema de permisos granular | ⚪ | Backlog | Media |
| RF-29 | Check-in/check-out de salas | ⚪ | Backlog | Baja |
| RF-30 | Historial y auditoría completa | ⚪ | Backlog | Media |

**Progreso Total:** 7/30 requisitos (23%)
**Progreso Alta Prioridad (RF-01 a RF-11 + RF-24 a RF-26):** 7/14 requisitos (50%)

---

## 📝 Notas Técnicas

### Decisiones Arquitectónicas Clave

1. **Arquitectura Híbrida**: Combinar Firestore directo (lecturas) con Cloud Functions (escrituras críticas)
   - **Ventaja**: Performance + seguridad
   - **Implementado en**: `useSalas.js` (lecturas directas) + `reservasService.js` (escrituras via Functions)

2. **Lógica Duplicada**: `estadoSala.js` existe en backend Y frontend
   - **Razón**: Backend para cálculos server-side, frontend para UI reactiva
   - **Mantenimiento**: Mantener ambas versiones sincronizadas

3. **Soft Delete**: Reservas se marcan como "cancelada" en vez de eliminarse
   - **Ventaja**: Auditoría e historial completo
   - **Implementado en**: `reservasService.js` línea 183

4. **Validación de Conflictos**: Siempre en servidor, nunca solo en cliente
   - **Razón**: Prevenir condiciones de carrera (race conditions)
   - **Implementado en**: `reservasService.js:validarDisponibilidad()`

### Mejoras Futuras (Backlog)

- [ ] Implementar paginación en MisReservas
- [ ] Agregar filtros avanzados (por fecha, sala, estado)
- [ ] Implementar reservas recurrentes (semanal/mensual)
- [ ] Agregar exportación de reservas (CSV/PDF)
- [ ] Implementar sistema de permisos granular (por piso, edificio)
- [ ] Agregar comentarios/notas a las reservas
- [ ] Implementar check-in/check-out de salas
- [ ] Dashboard en tiempo real con WebSockets

---

## 🗺️ Roadmap Visual del Proyecto

```
COMPLETADO
═══════════════════════════════════════════════════════════════════
✅ FASE 0: Autenticación y Admin Panel (100%)
   └─ Auth + Roles + CRUD Salas + Gestión Usuarios

EN CURSO
═══════════════════════════════════════════════════════════════════
🟡 FASE 1: Sistema de Reservas (95%)
   └─ Plano 3 Colores + Cloud Functions + Validación + MisReservas
   └─ FALTA: Deploy + Integrar MisReservas + Testing

PLANIFICADO (Alta Prioridad)
═══════════════════════════════════════════════════════════════════
⚪ FASE 2: Chatbot Dialogflow (0%)
   └─ NLP + Intents + Webhook + UI Chat Widget
   └─ Tiempo estimado: 3-4 semanas

⚪ FASE 3: Sistema de Notificaciones (0%)
   └─ Push + Email + FCM + Triggers
   └─ Tiempo estimado: 2-3 semanas

PLANIFICADO (Media Prioridad)
═══════════════════════════════════════════════════════════════════
⚪ FASE 4: Dashboard de Estadísticas (0%)
   └─ Métricas + Gráficos + Reportes + Exportación
   └─ Tiempo estimado: 2-3 semanas

PLANIFICADO (Baja Prioridad)
═══════════════════════════════════════════════════════════════════
⚪ FASE 5: Integraciones Externas (0%)
   └─ Google Calendar + Email Templates + API Pública
   └─ Tiempo estimado: 2-3 semanas

⚪ FASE 6: Modo Kiosco (0%)
   └─ Pantallas Públicas + QR Codes + Gestión Remota
   └─ Tiempo estimado: 2 semanas

OPCIONAL
═══════════════════════════════════════════════════════════════════
⚪ FASE 7: App Móvil (0%)
   └─ React Native/Flutter + Push Nativo + Offline Mode
   └─ Tiempo estimado: 6-8 semanas

CRÍTICO (Alta Prioridad)
═══════════════════════════════════════════════════════════════════
⚪ FASE 8: Testing y Deployment (0%)
   └─ Unit Tests + E2E + CI/CD + Monitoring + Producción
   └─ Tiempo estimado: 2-3 semanas
```

### Timeline Sugerido

```
Mes 1-2:  ✅ Fase 0 (Completada)
Mes 3:    🟡 Fase 1 (95% - En progreso)
Mes 4-5:  ⚪ Fase 2 (Chatbot)
Mes 6:    ⚪ Fase 3 (Notificaciones)
Mes 7:    ⚪ Fase 4 (Estadísticas)
Mes 8:    ⚪ Fase 8 (Testing & Deploy)
-------------------------------------------
MVP LISTO PARA PRODUCCIÓN ✨
-------------------------------------------
Post-MVP: Fases 5, 6, 7 (Opcional)
```

### Hitos Clave (Milestones)

| Hito | Fecha Objetivo | Estado | Descripción |
|------|----------------|--------|-------------|
| 🏁 M1: Auth & Admin | ✅ Completado | ✅ | Sistema base funcional |
| 🏁 M2: Reservas Core | 🎯 En 1 semana | 🟡 | Deploy Fase 1 completa |
| 🏁 M3: Chatbot Beta | 🎯 En 1.5 meses | ⚪ | Asistente virtual operativo |
| 🏁 M4: MVP Completo | 🎯 En 3 meses | ⚪ | Sistema completo en producción |
| 🏁 M5: Versión 2.0 | 🎯 En 6 meses | ⚪ | Con móvil y kiosco |

---

## 🐛 Problemas Conocidos y Soluciones

### ❌ Problema: "Cannot read properties of undefined (reading 'localeCompare')"
**Estado:** ✅ Resuelto  
**Solución Implementada:**
```javascript
// En filtros de sala (AdminPanel)
{salas
  .filter(sala => sala.nombre) // Solo salas con nombre
  .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
  .map(sala => (...))
}
```

### ❌ Problema: Bootstrap y Tailwind en conflicto
**Estado:** ✅ Resuelto  
**Solución:** Bootstrap 100% removido
- Eliminados todos los imports de Bootstrap
- Tooltips personalizados con React state
- Modales con Tailwind
- Dropdowns con appearance-none + Material Icons

### ❌ Problema: Firebase NET::ERR_BLOCKED_BY_CLIENT
**Estado:** ✅ Normal y esperado  
**Explicación:**
- Firebase intenta conectarse a Google APIs
- Bloqueado por adblockers o extensiones del navegador
- **NO afecta la funcionalidad** (usa configuración local)
- Se puede ignorar de manera segura en desarrollo

### ❌ Problema: Timestamps de Firebase en múltiples formatos
**Estado:** ✅ Resuelto  
**Solución:** Manejo defensivo en todos los componentes
```javascript
let fecha;
if (timestamp.toDate) {
  fecha = timestamp.toDate(); // Timestamp de Firebase
} else if (timestamp.seconds) {
  fecha = new Date(timestamp.seconds * 1000); // Serializado
} else {
  fecha = new Date(timestamp); // String o Date
}
```

---

## 📝 Notas Técnicas Importantes

### Decisiones de Diseño Implementadas

1. **Roles y Permisos:**
   - **Admin:** Acceso completo (CRUD salas, usuarios, reservas + estadísticas con gráficas)
   - **Docente:** Crear/cancelar sus propias reservas + ver disponibilidad de todas las salas
   - **Estudiante:** Solo visualización (sin capacidad de reservar, sin "Mis Reservas")

2. **Sin Estadísticas para Docente/Estudiante:**
   - Decisión de UX: mantener dashboards enfocados en tareas principales
   - Estadísticas solo relevantes para administradores (toma de decisiones)
   - Removido de ambos dashboards en sesión actual

3. **Navegación:**
   - **Admin:** State-based (activeTab) sin rutas - botones cambian tabs
   - **Docente/Estudiante:** React Router con rutas - Links de navegación
   - **Logo clickeable:** Siempre lleva al dashboard principal de cada rol
     * Admin → tab 'dashboard'
     * Docente/Estudiante → route '/dashboard'

4. **Estados de Reservas:**
   - **Activa:** Estado inicial, horaFin > now
   - **Cancelada:** Cancelada manualmente por usuario/admin
   - **Completada:** horaFin < now (calculado en tiempo real, no guardado)

5. **Jornadas:**
   - **DIURNO:** 08:00 - 12:59
   - **VESPERTINO:** 13:00 - 22:00
   - Auto-detección en reservas antiguas sin jornada guardada (función `obtenerJornada()`)

6. **Tooltips del Plano:**
   - Docente: Muestra "Haz clic para reservar" (prop `showReservarText={true}`)
   - Estudiante: NO muestra texto de reserva (prop `showReservarText={false}`)

### Comandos Útiles de Desarrollo

```bash
# Desarrollo Frontend
cd salasmart-frontend
npm install                 # Instalar dependencias
npm run dev                 # Servidor dev en http://localhost:5173

# Deploy Firebase (requiere plan Blaze para Functions)
cd C:\Repositorio\salasmart
firebase deploy --only firestore:rules    # Reglas de seguridad
firebase deploy --only firestore:indexes  # Índices
firebase deploy --only functions          # Cloud Functions
firebase deploy --only hosting            # Frontend estático

# Build Producción
cd salasmart-frontend
npm run build              # Compila a ./dist
npm run preview            # Preview del build

# Linting
npm run lint               # ESLint (configurado)

# Git
git status
git add .
git commit -m "mensaje"
git push origin main
```

### Archivos de Configuración Principales

**tailwind.config.js**
```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',      // indigo-600
        secondary: '#7C3AED',    // violet-600
        success: '#10B981',      // green-500
        danger: '#EF4444',       // red-500
        warning: '#F59E0B',      // amber-500
        'neutral-light': '#F3F4F6',
        'neutral-dark': '#1F2937',
        'background-light': '#F9FAFB',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
```

**firebase.json**
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "salasmart-frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

---

## 🚀 Roadmap para Próximas Sesiones

### Sesión Inmediata (Próximos 1-2 días)

1. **✅ Completado en esta sesión:**
   - Migración completa a Tailwind CSS
   - Sistema de roles implementado (Admin, Docente, Estudiante)
   - Gestión de reservas del Admin con filtros avanzados
   - StudentDashboard en modo solo lectura
   - TeacherDashboard sin estadísticas
   - Logo clickeable en Sidebar
   - Tooltips del plano diferenciados por rol

2. **⬜ Pendiente para siguiente sesión:**
   - **Notificaciones Toast** (react-hot-toast)
     * Confirmaciones de acciones
     * Errores amigables
     * Tiempo estimado: 2-3 horas
   
   - **Loading Skeletons**
     * Reemplazar spinners genéricos
     * Mejor UX durante carga
     * Tiempo estimado: 2-3 horas
   
   - **Perfil de Usuario**
     * Página /perfil funcional
     * Editar nombre, email
     * Cambiar contraseña
     * Tiempo estimado: 4-5 horas

### Corto Plazo (1-2 semanas)

1. **Sistema de Notificaciones por Email** (Requiere Cloud Functions)
   - Confirmación al crear reserva
   - Recordatorio 1 día antes
   - Notificación de cancelación
   - Requiere: plan Blaze + SendGrid/similar
   - Tiempo estimado: 8-10 horas

2. **Reportes para Admin** (Fase 4)
   - Reporte de uso por sala
   - Reporte de uso por usuario
   - Estadísticas por período
   - Exportación a PDF
   - Tiempo estimado: 12-15 horas

3. **Gestión de Equipamiento**
   - CRUD de equipos por sala
   - Filtrado por equipamiento en búsqueda
   - Estados de mantenimiento
   - Tiempo estimado: 8-10 horas

4. **Reservas Recurrentes**
   - Crear reserva semanal/mensual
   - Editar serie completa o instancia
   - Cancelar serie o instancia
   - Tiempo estimado: 10-12 horas

### Mediano Plazo (1-2 meses)

1. **Calendario Visual**
   - Vista mensual de reservas
   - Vista semanal
   - Drag & drop para crear/mover reservas
   - Integración con Google Calendar (opcional)
   - Librería: FullCalendar o react-big-calendar
   - Tiempo estimado: 15-20 horas

2. **Sistema de Conflictos Inteligente**
   - Detección automática de conflictos
   - Sugerencias de horarios disponibles
   - Validación de superposición
   - Tiempo estimado: 8-10 horas

3. **PWA (Progressive Web App)**
   - Manifest.json
   - Service Worker
   - Instalable en dispositivos
   - Modo offline básico
   - Tiempo estimado: 6-8 horas

4. **Testing Automatizado**
   - Tests unitarios con Jest
   - Tests de componentes con React Testing Library
   - Tests E2E con Cypress
   - Coverage > 70%
   - Tiempo estimado: 20-25 horas

### Largo Plazo (2-3 meses)

1. **Aplicación Móvil** (Opcional)
   - React Native
   - Expo para desarrollo rápido
   - Notificaciones push nativas
   - Tiempo estimado: 40-50 horas

2. **Modo Kiosco**
   - Pantalla pública de disponibilidad
   - Auto-refresh cada 30 segundos
   - QR codes por sala
   - Tiempo estimado: 10-12 horas

3. **Analytics y Métricas**
   - Google Analytics 4
   - Métricas personalizadas
   - Dashboard de uso
   - Tiempo estimado: 8-10 horas

---

## 📊 Métricas del Proyecto

### Líneas de Código (Actualizado)
- **Frontend:** ~4,500 líneas
- **Backend (Functions):** ~800 líneas (no desplegadas)
- **Configuración:** ~200 líneas
- **Tests:** 0 líneas (pendiente)
- **Total:** ~5,500 líneas

### Componentes React Principales
| Componente | Líneas | Estado | Descripción |
|------------|--------|--------|-------------|
| AdminPanel.jsx | ~1,065 | ✅ Completo | Dashboard + Tabs (Salas, Usuarios, Reservas) |
| TeacherDashboard.jsx | ~500 | ✅ Completo | Vista salas + Reservas (sin stats) |
| StudentDashboard.jsx | ~300 | ✅ Completo | Solo lectura (sin reservas, sin stats) |
| PlanoSalas.jsx | ~164 | ✅ Completo | Plano interactivo con tooltips |
| FormularioReserva.jsx | ~350 | ✅ Completo | Modal de reserva max-w-4xl |
| MisReservas.jsx | ~400 | ✅ Completo | Tabla con filtros y acciones |
| Sidebar.jsx | ~160 | ✅ Completo | Navegación dinámica por rol |

### Tiempo de Desarrollo Invertido
- **Sesión 1:** Auth + AdminPanel base (~15 horas)
- **Sesión 2:** Sistema de reservas (~20 horas)
- **Sesión 3:** Migración Tailwind + Mejoras UX (~25 horas)
- **Sesión 4 (actual):** StudentDashboard + Roles + Filtros Admin (~10 horas)
- **Total:** ~70 horas de desarrollo

### Próximo Milestone
**Objetivo:** Sistema completo con notificaciones y reportes  
**Tiempo estimado:** ~40 horas adicionales  
**Fecha objetivo:** Diciembre 2025

---

## 👥 Contacto y Soporte

- **Repositorio Local:** `C:\Repositorio\salasmart`
- **Branch Principal:** `main`
- **Firebase Project:** sala-gestion (Plan Spark - FREE)
- **Dev Server:** http://localhost:5173
- **Última Actualización:** 31 de Octubre, 2025
- **Versión:** 1.5-tailwind-complete

### Próxima Sesión - Recordatorios

1. ✅ Sistema base completamente funcional
2. ⬜ Implementar notificaciones toast
3. ⬜ Completar página de perfil
4. ⬜ Agregar loading skeletons
5. ⬜ Considerar upgrade a plan Blaze para Cloud Functions

---

**Última actualización de este documento:** 31 de Octubre, 2025  
**Próxima revisión sugerida:** Al completar notificaciones toast

**FIN DEL DOCUMENTO**
