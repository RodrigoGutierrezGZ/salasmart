# 🎓 SalaSmart - Sistema de Gestión de Salas INACAP

Sistema web profesional para la gestión inteligente de reservas de salas educativas con chatbot conversacional basado en IA, Progressive Web App (PWA) con instalación offline y control por voz.

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

---

## 📁 Estructura del Proyecto

```
salasmart/
├── frontend/              # Aplicación React + Vite + Tailwind
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas/Rutas
│   │   ├── services/     # Lógica de negocio
│   │   ├── hooks/        # Custom React hooks
│   │   ├── config/       # Configuraciones centralizadas
│   │   ├── utils/        # Utilidades
│   │   └── firebase/     # Config Firebase
│   └── dist/             # Build de producción
│
├── firebase/              # Configuración Firebase
│   ├── firestore.rules   # Reglas de seguridad
│   └── firestore.indexes.json  # Índices
│
├── docs/                  # Documentación completa
│   ├── sesiones/         # Resúmenes de desarrollo
│   ├── chatbot/          # Docs del chatbot IA
│   ├── arquitectura/     # Arquitectura del sistema
│   └── guias/            # Guías técnicas
│
├── firebase.json          # Config principal Firebase
├── .firebaserc           # Proyecto Firebase activo
└── README.md             # Este archivo
```

---

## 🚀 Inicio Rápido

### **Prerrequisitos**
- Node.js 18+ instalado
- Cuenta Firebase (plan gratuito Spark)
- Git

### **Desarrollo Local**

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd salasmart

# 2. Instalar dependencias del frontend
cd frontend
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:5173
```

### **Desplegar a Producción**

```bash
# 1. Build del frontend
cd frontend
npm run build

# 2. Desplegar a Firebase Hosting
cd ..
firebase deploy --only hosting

# 3. Desplegar reglas de Firestore (si cambiaron)
firebase deploy --only firestore:rules
```

---

## 🛠️ Stack Tecnológico

### **Frontend**
- **React 18** - Biblioteca UI
- **Vite** - Build tool y dev server (ultra rápido)
- **Tailwind CSS** - Framework CSS utility-first
- **Firebase SDK v10** - Cliente Firestore + Auth
- **vite-plugin-pwa** - Progressive Web App con Service Worker
- **Workbox** - Estrategias de caché offline

### **Backend / Base de Datos**
- **Firebase Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Authentication** - Autenticación email/password
- **Firebase Hosting** - Hosting estático global
- **Firebase Storage** - Almacenamiento de imágenes de planos
- **Firestore Security Rules** - Control de acceso a nivel de BD

### **Inteligencia Artificial**
- **Claude 3.5 Sonnet (Anthropic)** - Chatbot conversacional avanzado
- **Function Calling** - IA puede ejecutar acciones directamente
- **Web Speech API** - Reconocimiento y síntesis de voz
- **Entrada/Salida Multimodal** - Texto y voz

---

## ✨ Funcionalidades

### ✅ **Implementado (100%)**

#### **Progressive Web App (PWA)**
- **Instalación Nativa:**
  - Instalable en escritorio y móvil como app nativa
  - Botón "Instalar App" con detección automática
  - Icono en home screen y app drawer
- **Funcionamiento Offline:**
  - Service Worker con estrategias de caché
  - Caché de Google Fonts, Firebase Storage, APIs
  - Precaching de archivos estáticos
- **Sistema de Actualizaciones:**
  - Notificación cuando hay nueva versión disponible
  - Opción de recargar o continuar sin actualizar
  - Verificación automática cada hora
  - Control de caché con meta tags
  - Documentación completa en SOLUCION_CACHE_CHROME.md
- **Manifest PWA:**
  - Nombre: "SalaSmart - Gestión de Salas INACAP"
  - Tema personalizado (#1e40af)
  - Orientación landscape para planos
  - Soporte para splash screen

#### **Chatbot con IA y Control por Voz**
- **Claude 3.5 Sonnet (Anthropic):**
  - Sistema híbrido (comandos locales + IA avanzada)
  - Function calling para ejecutar acciones
  - Parseo inteligente de fechas naturales
  - Soporte para días de la semana ("viernes", "lunes", etc.)
  - Extracción inteligente de asignaturas
- **Control por Voz:**
  - Dictado por voz con Web Speech API
  - Síntesis de voz (Text-to-Speech)
  - Limpieza automática de emojis y markdown del TTS
  - Indicador visual de estado de grabación
  - Detección de idioma español
- **Características:**
  - Crear reservas en lenguaje natural
  - Consultas de disponibilidad
  - Explicaciones del sistema
  - Auto-envío con sugerencias
  - Input persistente

#### **Autenticación y Roles**
- Login / Registro con email y contraseña
- 3 roles: Estudiante, Docente, Admin
- Sesión persistente
- Protección de rutas por rol
- **Sistema de Notificaciones en Tiempo Real:**
  - Notificaciones para todos los roles (admin, docentes, estudiantes)
  - 7 tipos de notificaciones (reservas, cambios de rol, cuentas nuevas, etc.)
  - Auto-marcado como leído al abrir panel
  - Indicador de notificaciones no leídas (badge rojo)
  - Panel con scroll y max-height en desktop
- **Páginas de Usuario:**
  - Perfil con estadísticas de reservas
  - Configuración (placeholder para futuras funciones)

#### **Gestión de Salas Avanzada**
- CRUD completo (Crear, Leer, Actualizar, Eliminar)
- **Validaciones de Negocio:**
  - Nombres únicos por sala/piso
  - Conversión automática a mayúsculas
  - Prevención de duplicados
- **Sistema de Catalogación con Equipamiento:**
  - 6 tipos de salas (Aula Teórica, Laboratorio, Sala de Reuniones, Auditorio, Taller, Sala de Cómputo)
  - Equipamiento detallado: proyector, computadores, enchufes, pizarra (tradicional/digital), A/C, parlantes, micrófono, cámara
  - Visualización con badges en lista de salas
- **Editor Visual de Planos (Mejorado):**
  - Sistema Pick & Place para mover salas (click → mover → click)
  - **Detección de Colisiones:** Algoritmo que detecta badges superpuestos y los separa automáticamente
  - **Interacción Click-Based:** Click en badge → muestra tooltip → botón "Reservar Sala"
  - **Jerarquía Z-Index Optimizada:** Badges (10-30), Tooltips (35), Modals (9999+)
  - Seguimiento en tiempo real sin delay
  - Mensajes flotantes sin mover el contenido
  - Click-to-place para posicionar salas nuevas
  - 4 pisos con imágenes de planos reales almacenadas en Firebase Storage
  - Coordenadas dinámicas en Firestore (no hardcodeadas)
  - Sub-tabs: Lista de Salas / Editor de Planos
  - Click fuera del tooltip para cerrar
- Filtros avanzados: por piso, capacidad, disponibilidad, sede
- Vista de Cards y Vista de Plano interactivo
- **Estados visuales consistentes:**
  - 🟢 Disponible / 🟡 Próximamente / 🔴 Ocupado
  - Todas las salas visibles en cards (no se ocultan las ocupadas)

#### **Sistema de Reservas**
- Crear reservas con validación de disponibilidad
- **Asignaturas en mayúsculas automáticamente**
- Detección automática de jornada (Diurno/Vespertino)
- Cancelar reservas activas
- Ver mis reservas (docentes)
- Gestión completa (admin)
- **Modal de Reserva Mejorado:**
  - Z-index optimizado (99999) para estar sobre todos los elementos
  - Formulario con mejor contraste en dark mode
  - Inputs de fecha/hora con [color-scheme:dark]
  - Card de información de sala con colores adaptados

#### **UI/UX Optimizada**
- **Responsive Design:**
  - Mobile-first approach
  - Navbar adaptable (h-14 sm:h-16, text-xs sm:text-sm)
  - Padding superior en dashboards mobile (pt-16 lg:pt-0)
  - Formularios y modales optimizados para pantallas pequeñas
- **Dark Mode:**
  - Toggle persistente en localStorage
  - Contraste mejorado en todos los componentes
  - FormularioReserva con colores ajustados (gray-700, white text)
  - Inputs nativos con [color-scheme:dark]
  - Card de info sala con bg-blue-900/40
- **Espaciado y Legibilidad:**
  - Login con space-y-3 y leading-relaxed
  - Navbar con whitespace-nowrap para evitar wrap
  - Mejor uso de flex y truncate

#### **Estados en Tiempo Real**
- 🟢 **Disponible** - Sin reservas
- 🟡 **Próximamente** - Reserva en 15 minutos
- 🔴 **Ocupado** - Sala en uso ahora

#### **Dashboards por Rol**
- **Estudiante:** Solo lectura (ver salas y horarios)
- **Docente:** Crear y gestionar reservas propias
- **Admin:** Control total (CRUD completo + Editor de Planos)

---

## 👥 Roles y Permisos

| Rol | Salas | Reservas | Usuarios |
|-----|-------|----------|----------|
| **Estudiante** | 👁️ Ver | 👁️ Ver horarios | ❌ |
| **Docente** | 👁️ Ver | ✏️ Crear/Cancelar propias | ❌ |
| **Admin** | ✏️ CRUD | ✏️ CRUD todas | ✏️ Gestionar |

---

## 📊 Estado del Proyecto

- **Versión:** 3.0
- **Estado:** ✅ Producción (mejoras continuas)
- **Plan Firebase:** Spark (gratuito)
- **Costo Mensual:** Variable (API Claude)
- **Última actualización:** 8 de Diciembre, 2025
- **Última sesión:** PWA completo + Mejoras UI/UX + Voice Chat + Planos mejorados

---

## 🏗️ Arquitectura

### **Flujo de Datos**

```
Usuario
  ↓
React App (Frontend)
  ↓
Services (Lógica de negocio)
  ↓
Firebase SDK
  ↓
Firebase Cloud (Firestore + Auth)
```

### **Sin Backend Intermediario**
El sistema trabaja **directamente con Firestore** desde el frontend:
- ✅ Plan gratuito compatible
- ✅ Tiempo real sin polling
- ✅ Firestore Rules como seguridad
- ✅ Menos complejidad

---

## 🤖 Chatbot Conversacional

### **Sistema Híbrido Inteligente con Claude 3.5 Sonnet**

```
Comandos Locales → Respuestas instantáneas (gratis)
Claude AI → Conversación avanzada con function calling
```

### **Capacidades**
- **Crear reservas:** *"quiero sala A310 mañana a las 2pm por 2 horas para prog web"*
- **Fechas naturales:** *"reserva para el viernes"* → Calcula el próximo viernes automáticamente
- **Consultar:** *"¿qué salas están disponibles ahora?"*
- **Mis reservas:** *"muestra mis reservas de esta semana"*
- **Ayuda:** *"explícame cómo funcionan las jornadas"*
- **Control por voz:** Dictado y lectura de respuestas con TTS limpio (sin emojis/markdown)

### **Mejoras Recientes**
- ✅ Control por voz con Web Speech API
- ✅ Parseo de días de la semana (viernes, lunes, etc.)
- ✅ Limpieza de emojis y markdown en síntesis de voz
- ✅ Auto-envío al hacer clic en sugerencias
- ✅ Input persistente después de respuestas del bot
- ✅ Migración de Gemini a Claude 3.5 Sonnet

---

## 📚 Documentación

La documentación completa está en [`/docs`](./docs):

- **[Sesiones](./docs/sesiones/)** - Resúmenes de desarrollo
- **[Chatbot](./docs/chatbot/)** - Configuración IA y uso
- **[Arquitectura](./docs/arquitectura/)** - Estado del sistema
- **[Guías](./docs/guias/)** - Soluciones técnicas

---

## 🔧 Comandos Útiles

### **Frontend**
```bash
cd frontend

npm install           # Instalar dependencias
npm run dev           # Dev server (localhost:5173)
npm run build         # Build producción
npm run preview       # Preview del build
npm run lint          # Linter ESLint
```

### **Firebase**
```bash
firebase login                          # Autenticarse
firebase projects:list                  # Ver proyectos
firebase deploy --only hosting          # Desplegar sitio
firebase deploy --only firestore:rules  # Desplegar reglas
firebase emulators:start                # Emuladores locales
```

### **Git**
```bash
git status
git add .
git commit -m "descripción"
git push origin main
```

---

## 🎯 Roadmap

### **Completado Recientemente ✅**

#### **Sesión 8 Dic 2025 - PWA + UI/UX + Voice + Planos Mejorados**
- [x] **Progressive Web App (PWA) Completo:**
  - Sistema de actualización con notificaciones (UpdateNotification.jsx)
  - Service Worker en modo 'prompt' con skipWaiting y clientsClaim
  - Meta tags de control de caché
  - Verificación de actualizaciones cada hora
  - Documentación completa (SOLUCION_CACHE_CHROME.md)
  - Instalable en escritorio y móvil
- [x] **Planos Interactivos Mejorados:**
  - Algoritmo de detección de colisiones para badges superpuestos
  - Interacción basada en click (badge → tooltip → "Reservar Sala")
  - Click-outside para cerrar tooltip
  - Jerarquía z-index optimizada (badges 10-30, tooltips 35, modals 9999+)
  - Mejoras visuales (bordes, sombras, espaciado, tamaños)
- [x] **UI/UX Mobile y Dark Mode:**
  - Navbar responsive (h-14 sm:h-16, text-xs sm:text-sm, whitespace-nowrap)
  - Login con mejor espaciado (space-y-3, leading-relaxed)
  - StudentDashboard con padding superior mobile (pt-16 lg:pt-0)
  - NotificacionesPanel con max-height en desktop
  - FormularioReserva con contraste mejorado en dark mode
  - Inputs date/time con [color-scheme:dark]
  - Modal de reserva con z-index 99999
- [x] **Chatbot Mejorado:**
  - Parseo de días de la semana ("viernes", "lunes", etc.)
  - Cálculo automático del próximo día especificado
  - Soporte para fechas naturales en español
- [x] **Control por Voz:**
  - Limpieza completa de emojis de TTS (todos los rangos Unicode)
  - Eliminación de markdown del speech (**, *, #, [], ``, listas, etc.)
  - Supresión de errores 'interrupted'/'canceled'
  - Controles simplificados (solo botón "Detener Voz")
- [x] **Fixes:**
  - Corrección de sintaxis en TeacherDashboard y PlanoSalasDinamico
  - Service worker actualizado con nueva revisión

#### **Sesión 15 Nov 2025 (Parte 2) - Notificaciones para Estudiantes + Filtros**
- [x] **Notificaciones habilitadas para estudiantes** - Antes solo admin y docentes, ahora todos reciben notificaciones
- [x] **Mensajes de bienvenida mejorados** - Incluyen las sedes asignadas al activar cuenta
- [x] **Filtros por sede en dashboards** - Edificios y pisos filtrados según sedes afiliadas del usuario
- [x] **Pantalla de Cuenta Pendiente** - Vista amigable para usuarios sin sede asignada
- [x] **Componente reutilizable** - CuentaPendiente.jsx en /shared para mejor organización
- [x] **Scripts de utilidad** - Debug y corrección de datos de sedes/edificios

#### **Sesión 15 Nov 2025 (Parte 1) - Notificaciones y Limpieza**
- [x] **Sistema de Notificaciones Completo** - 7 tipos de notificaciones en tiempo real
- [x] **Mejora de Notificación de Cambio de Rol** - Ahora incluye nombre del usuario
- [x] **Páginas de Usuario** - Perfil y Configuración implementadas
- [x] **Limpieza de Código** - Eliminada funcionalidad de recuperación de contraseña (requiere Cloud Functions/plan Blaze)
- [x] **Navegación Corregida** - Tabs de admin y páginas separadas funcionando correctamente
- [x] **ChatBot Visible** - Ahora aparece en todas las páginas autenticadas

#### **Sesión 4 Nov 2025 - UX/UI y Validaciones**
- [x] **Vista de Cards mejorada** - Muestra TODAS las salas con sus estados (verde/amarillo/rojo)
- [x] **Validación de nombres únicos** - No permite crear salas duplicadas en el mismo piso
- [x] **Asignaturas en mayúsculas** - Conversión automática en formularios
- [x] **Chatbot con IA mejorada** - Extracción inteligente de asignaturas ("clase de diseño web" → "DISEÑO WEB")
- [x] **Drag & Drop Pick & Place** - Sistema fluido para mover salas (click → mover → click)
- [x] **Mensajes flotantes** - Notificaciones sin mover el contenido del editor
- [x] **Bug fixes** - Limpieza de estados al desactivar modo edición

#### **Anteriores**
- [x] **Migrar de Gemini a Claude 3.5 Sonnet** (IA más avanzada)
- [x] **Sistema de Catalogación de Salas** (equipamiento completo)
- [x] **Editor Visual de Planos** (click-to-place, coordenadas dinámicas)
- [x] **PlanoSalasDinamico** - Implementado en todos los dashboards (estudiante/docente/admin)
- [x] **Control por Voz** - Web Speech API para dictado y TTS
- [x] **Sub-tabs en AdminPanel** (Lista / Editor de Planos)

### **Próximas Mejoras**

- [ ] **Optimizaciones PWA:**
  - [ ] Notificaciones push
  - [ ] Sincronización en background
  - [ ] Mejor estrategia de caché para imágenes grandes
- [ ] **Chatbot Admin** - Funciones administrativas (bloquear usuarios, cambiar roles, eliminar salas)
- [ ] **Filtros por equipamiento** (buscar salas por tipo de pizarra, proyector, etc.)
- [ ] **Más Funciones Chatbot** (buscar_salas avanzado, cancelar_reserva por voz)
- [ ] **Analytics** (seguimiento de uso de salas, estadísticas)
- [ ] **Tests** (Jest + React Testing Library)

---

## 🐛 Reporte de Bugs

Si encuentras algún problema, por favor:
1. Revisa la [documentación](./docs)
2. Verifica la consola del navegador (F12)
3. Revisa Firebase Console
4. Documenta el error con screenshots

### **Bugs Conocidos:**
- Ninguno crítico reportado actualmente ✅

---

## 📞 Información del Proyecto

- **Proyecto:** SalaSmart INACAP
- **Firebase Project ID:** `sala-gestion`
- **Plan:** Spark (gratuito)
- **Región:** us-central1

---

## 📝 Notas Importantes

### **Seguridad**
- ✅ Firestore Security Rules implementadas
- ✅ Control de acceso por roles
- ✅ Autenticación obligatoria
- ⚠️ API Keys en código (normal para Firebase cliente)

### **Costos**
- **Hosting:** GRATIS (10GB/mes)
- **Firestore:** GRATIS (50k reads, 20k writes diarios)
- **Auth:** GRATIS (sin límite)
- **Storage:** GRATIS (5GB almacenamiento, 1GB/día transfer)
- **Chatbot IA:** Variable (Claude API - pay-as-you-go)
- **PWA:** GRATIS (funcionalidad nativa del navegador)
- **💰 TOTAL:** ~$5-20 USD/mes (dependiendo de uso del chatbot)

### **Escalabilidad**
- Plan actual: hasta ~1,000 usuarios/día
- Si crece: migrar a plan Blaze (pay-as-you-go)

---

## 🎉 Estado Actual

**✅ Sistema 100% funcional en producción**

El proyecto está organizado profesionalmente con:
- ✅ Progressive Web App instalable
- ✅ Sistema de actualización automática con notificaciones
- ✅ Código limpio y bien estructurado
- ✅ Servicios separados de componentes
- ✅ Configuraciones centralizadas
- ✅ Documentación completa
- ✅ UI/UX optimizada para mobile y desktop
- ✅ Dark mode con contraste mejorado
- ✅ Chatbot con IA avanzada y control por voz
- ✅ Planos interactivos con detección de colisiones

**Funcionalidades principales:**
- ✅ Creación de reservas desde formulario UI y chatbot
- ✅ Visualización en tiempo real en todos los dashboards
- ✅ Gestión de salas completa con editor visual
- ✅ Autenticación y roles con notificaciones
- ✅ Estados en tiempo real
- ✅ Instalación como app nativa (PWA)
- ✅ Control por voz en chatbot

---

**Desarrollado con ❤️ para INACAP 2025**
