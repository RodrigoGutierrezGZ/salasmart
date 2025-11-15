# 🎓 SalaSmart - Sistema de Gestión de Salas INACAP

Sistema web profesional para la gestión inteligente de reservas de salas educativas con chatbot conversacional basado en IA.

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

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

### **Backend / Base de Datos**
- **Firebase Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Authentication** - Autenticación email/password
- **Firebase Hosting** - Hosting estático global
- **Firestore Security Rules** - Control de acceso a nivel de BD

### **Inteligencia Artificial**
- **Google Gemini 2.0 Flash** - Chatbot conversacional (GRATUITO)
- **Function Calling** - IA puede ejecutar acciones directamente
- **Entrada/Salida Multimodal** - Texto y potencial para imágenes

---

## ✨ Funcionalidades

### ✅ **Implementado (100%)**

#### **Autenticación y Roles**
- Login / Registro con email y contraseña
- 3 roles: Estudiante, Docente, Admin
- Sesión persistente
- Protección de rutas por rol
- **Sistema de Notificaciones en Tiempo Real:**
  - Notificaciones para admin y docentes
  - 7 tipos de notificaciones (reservas, cambios de rol, cuentas nuevas, etc.)
  - Auto-marcado como leído al abrir panel
  - Indicador de notificaciones no leídas (badge rojo)
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
  - Seguimiento en tiempo real sin delay
  - Mensajes flotantes sin mover el contenido
  - Click-to-place para posicionar salas nuevas
  - 4 pisos con imágenes de planos reales
  - Coordenadas dinámicas en Firestore (no hardcodeadas)
  - Sub-tabs: Lista de Salas / Editor de Planos
- Filtros avanzados: por piso, capacidad, disponibilidad
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

#### **Estados en Tiempo Real**
- 🟢 **Disponible** - Sin reservas
- 🟡 **Próximamente** - Reserva en 15 minutos
- 🔴 **Ocupado** - Sala en uso ahora

#### **Chatbot Inteligente con IA (Gemini)**
- Sistema híbrido (60% local + 40% IA)
- Migrado a Gemini 2.0 Flash (gratuito)
- Function calling (IA ejecuta acciones)
- **Extracción inteligente de asignaturas:**
  - "quiero dar clase de diseño web" → extrae "DISEÑO WEB"
  - Limpieza automática de frases innecesarias
  - Conversión a mayúsculas
- Auto-envío al hacer clic en sugerencias
- Input persistente después de respuestas
- Crear reservas en lenguaje natural
- Consultas de disponibilidad
- Explicaciones del sistema

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

- **Versión:** 2.7
- **Estado:** ✅ Funcional (mejoras continuas)
- **Plan Firebase:** Spark (gratuito)
- **Costo Mensual:** $0 USD (100% gratuito con Gemini)
- **Última actualización:** 15 de Noviembre, 2025
- **Última sesión:** Implementación de notificaciones + limpieza de código

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

### **Sistema Híbrido Inteligente con Gemini 2.0 Flash**

```
60% → Comandos Locales (gratis, instantáneo)
40% → Gemini AI (conversacional, inteligente, GRATUITO)
```

### **Capacidades**
- Crear reservas: *"quiero sala A310 mañana a las 2pm por 2 horas para prog web"*
- Consultar: *"¿qué salas están disponibles ahora?"*
- Mis reservas: *"muestra mis reservas de esta semana"*
- Ayuda: *"explícame cómo funcionan las jornadas"*

### **Mejoras Recientes**
- ✅ Auto-envío al hacer clic en sugerencias
- ✅ Input persistente después de respuestas del bot
- ✅ Migración completa a Gemini (costo $0)

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

#### **Sesión 15 Nov 2025 - Notificaciones y Limpieza**
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
- [x] **Migrar a Gemini 2.0 Flash** (GRATIS vs GPT pagado)
- [x] **Sistema de Catalogación de Salas** (equipamiento completo)
- [x] **Editor Visual de Planos** (click-to-place, coordenadas dinámicas)
- [x] **PlanoSalasDinamico** - Implementado en todos los dashboards (estudiante/docente/admin)
- [x] **Mejoras UX Chatbot** (auto-envío, input persistente)
- [x] **Sub-tabs en AdminPanel** (Lista / Editor de Planos)

### **Próximas Mejoras**

- [ ] **Crear 24 salas nuevas** (6 por piso con equipamiento completo)
- [ ] **Chatbot Admin** - Funciones administrativas (bloquear usuarios, cambiar roles, eliminar salas)
- [ ] **Filtros por equipamiento** (buscar salas por tipo de pizarra, proyector, etc.)
- [ ] **Más Funciones Chatbot** (buscar_salas, cancelar_reserva, filtros avanzados)
- [ ] **Notificaciones** (toast messages, react-hot-toast)
- [ ] **Tests** (Jest + React Testing Library)

---

## 🐛 Reporte de Bugs

⚠️ **VER BUGS PENDIENTES:** [`BUGS_PENDIENTES.md`](./BUGS_PENDIENTES.md) - Lista actualizada de bugs en progreso

Si encuentras algún problema, por favor:
1. Revisa la [documentación](./docs)
2. Verifica la consola del navegador (F12)
3. Revisa Firebase Console
4. Documenta el error con screenshots

### **Bug Crítico Conocido:**
- 🔴 **Reservas con chatbot IA no se reflejan en paneles** - En investigación (ver BUGS_PENDIENTES.md)

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
- **Chatbot IA:** GRATIS (Google Gemini 2.0 Flash)
- **💰 TOTAL:** $0 USD/mes

### **Escalabilidad**
- Plan actual: hasta ~1,000 usuarios/día
- Si crece: migrar a plan Blaze (pay-as-you-go)

---

## 🎉 Estado Actual

**⚠️ Sistema funcional con bug crítico pendiente**

El proyecto está organizado profesionalmente con:
- ✅ Código limpio y bien estructurado
- ✅ Servicios separados de componentes
- ✅ Configuraciones centralizadas
- ✅ Documentación completa
- ✅ Sin código innecesario
- ⚠️ **BUG PENDIENTE:** Reservas con chatbot IA no se reflejan en paneles

**Funcionalidades que SÍ funcionan al 100%:**
- ✅ Creación de reservas desde formulario UI
- ✅ Visualización en Admin Panel y Mis Reservas
- ✅ Gestión de salas completa
- ✅ Editor de planos
- ✅ Autenticación y roles
- ✅ Estados en tiempo real

**Funcionalidad con problemas:**
- ❌ Creación de reservas mediante chatbot IA (ver BUGS_PENDIENTES.md)

---

**Desarrollado con ❤️ para INACAP 2025**
