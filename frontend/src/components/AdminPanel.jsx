// src/components/AdminPanel.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PANEL DE ADMINISTRACIÓN - REFACTORIZADO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Componente principal del panel administrativo.
// Refactorizado en componentes modulares para mejor mantenibilidad.
//
// Estructura:
// - Estado y lógica centralizada aquí
// - Componentes Tab separados en /admin
// - Componentes compartidos en /shared
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';

// Components
import Sidebar from './layout/Sidebar';
import MobileHeader from './layout/MobileHeader';
import MobileSidebar from './layout/MobileSidebar';
import ChatBot from './chatbot/ChatBot';
import ConfirmDialog from './modals/ConfirmDialog';
import LoadingSpinner from './shared/LoadingSpinner';

// Tab Components
import DashboardTab from './admin/dashboard/DashboardTab';
import InfraestructuraTab from './admin/infraestructura/InfraestructuraTab';
import SalasTab from './admin/salas/SalasTab';
import UsuariosTab from './admin/usuarios/UsuariosTab';
import ReservasTab from './admin/reservas/ReservasTab';
import MigracionTab from './admin/migracion/MigracionTab';
import HistorialCompleto from './admin/HistorialCompleto';

// Hooks & Services
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { registrarLog } from '../services/logsService';
import { actualizarNombresDesdeEmails } from '../utils/actualizarNombresUsuarios';
import { obtenerSedes } from '../services/sedesService';
import { obtenerEdificiosPorSede } from '../services/edificiosService';
import { obtenerPisosPorEdificio } from '../services/pisosService';
import { notificarCuentaAprobada, notificarSedeAsignada, notificarRolCambiado } from '../services/notificacionesService';

// Chart.js
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function AdminPanel() {
  const { user, role } = useAuth();
  const { showSuccess, showError } = useToast();

  // ─────────────────────────────────────────────────────────────────
  // TAB NAVIGATION STATE
  // ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard');
  const [salasSubTab, setSalasSubTab] = useState('lista');
  const [infraSubTab, setInfraSubTab] = useState('sedes');
  const [usuariosSubTab, setUsuariosSubTab] = useState('activos');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ─────────────────────────────────────────────────────────────────
  // SALAS STATE
  // ─────────────────────────────────────────────────────────────────
  const [salas, setSalas] = useState([]);
  const [loadingSalas, setLoadingSalas] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [nombreSala, setNombreSala] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [tipoSala, setTipoSala] = useState('aula_teorica');
  const [proyector, setProyector] = useState(false);
  const [computadores, setComputadores] = useState(0);
  const [enchufes, setEnchufes] = useState(0);
  const [pizarra, setPizarra] = useState('tradicional');
  const [aireAcondicionado, setAireAcondicionado] = useState(false);
  const [parlantes, setParlantes] = useState(false);
  const [microfono, setMicrofono] = useState(false);
  const [camara, setCamara] = useState(false);
  const [messageSala, setMessageSala] = useState('');
  const [salaEditando, setSalaEditando] = useState(null); // Para el modal de edición

  // Jerarquía de Salas
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [edificiosDisponibles, setEdificiosDisponibles] = useState([]);
  const [pisosDisponibles, setPisosDisponibles] = useState([]);
  const [sedeSeleccionadaSala, setSedeSeleccionadaSala] = useState('');
  const [edificioSeleccionadoSala, setEdificioSeleccionadoSala] = useState('');
  const [pisoSeleccionadoSala, setPisoSeleccionadoSala] = useState('');

  // UI - Formulario y Filtros
  const [formularioColapsado, setFormularioColapsado] = useState(false);
  const [filtroSede, setFiltroSede] = useState('');
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [filtroPiso, setFiltroPiso] = useState('');
  const [sedesFiltro, setSedesFiltro] = useState([]);
  const [edificiosFiltro, setEdificiosFiltro] = useState([]);
  const [pisosFiltro, setPisosFiltro] = useState([]);

  // ─────────────────────────────────────────────────────────────────
  // USUARIOS STATE
  // ─────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [messageUser, setMessageUser] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [mostrarModalSedes, setMostrarModalSedes] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [migrandoNombres, setMigrandoNombres] = useState(false);

  // ─────────────────────────────────────────────────────────────────
  // RESERVAS STATE
  // ─────────────────────────────────────────────────────────────────
  const [reservas, setReservas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(true);
  const [filtroEstadoReserva, setFiltroEstadoReserva] = useState('activas');
  const [filtroSalaReserva, setFiltroSalaReserva] = useState('todas');
  const [buscarReserva, setBuscarReserva] = useState('');

  // ─────────────────────────────────────────────────────────────────
  // DASHBOARD STATE
  // ─────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalSalas: 0,
    salasDisponibles: 0,
    totalUsuarios: 0,
    reservasActivas: 0
  });

  // ─────────────────────────────────────────────────────────────────
  // CONFIRM DIALOG STATE
  // ─────────────────────────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'info',
    onConfirm: () => {}
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DATA LOADING - FIRESTORE LISTENERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Cargar Salas
  useEffect(() => {
    const unsubscribeSalas = onSnapshot(collection(db, 'salas'), (snapshot) => {
      const salasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSalas(salasData);
      setLoadingSalas(false);
    });
    return () => unsubscribeSalas();
  }, []);

  // Cargar Sedes disponibles para formulario de salas
  useEffect(() => {
    cargarSedesDisponibles();
    cargarSedesParaFiltros();
  }, []);

  const cargarSedesDisponibles = async () => {
    try {
      const sedes = await obtenerSedes(true); // true = solo activas
      setSedesDisponibles(sedes);
    } catch (error) {
      console.error('Error al cargar sedes:', error);
    }
  };

  const cargarSedesParaFiltros = async () => {
    try {
      const sedes = await obtenerSedes(true);
      setSedesFiltro(sedes);
    } catch (error) {
      console.error('Error al cargar sedes para filtros:', error);
    }
  };

  // Cargar Usuarios en TIEMPO REAL
  useEffect(() => {
    setLoadingUsers(true);
    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      async (snapshot) => {
        try {
          const usersData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              activo: data.activo !== undefined ? data.activo : true
            };
          });
          setUsers(usersData);

          // Migración: Actualizar usuarios sin campo activo (solo primera vez)
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            if (data.activo === undefined) {
              await updateDoc(docSnap.ref, { activo: true });
            }
          }

          setLoadingUsers(false);
        } catch (error) {
          console.error("Error al procesar usuarios: ", error);
          setMessageUser("No se pudieron cargar los usuarios.");
          setLoadingUsers(false);
        }
      },
      (error) => {
        console.error("Error en listener de usuarios: ", error);
        setMessageUser("Error al escuchar cambios de usuarios.");
        setLoadingUsers(false);
      }
    );

    return () => unsubscribeUsers();
  }, []);

  // Cargar Reservas
  useEffect(() => {
    const unsubscribeReservas = onSnapshot(collection(db, 'reservas'), (snapshot) => {
      const reservasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservas(reservasData);
      setLoadingReservas(false);
    });
    return () => unsubscribeReservas();
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CALCULAR ESTADÍSTICAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    if (!loadingSalas && !loadingUsers && !loadingReservas) {
      const ahora = new Date();

      // Salas disponibles
      const salasDisp = salas.filter(s => !reservas.some(r => {
        if (r.salaId !== s.id || r.estado !== 'activa') return false;

        let horaInicio, horaFin;
        if (r.horaInicio) {
          if (r.horaInicio.toDate) horaInicio = r.horaInicio.toDate();
          else if (r.horaInicio.seconds) horaInicio = new Date(r.horaInicio.seconds * 1000);
        }
        if (r.horaFin) {
          if (r.horaFin.toDate) horaFin = r.horaFin.toDate();
          else if (r.horaFin.seconds) horaFin = new Date(r.horaFin.seconds * 1000);
        }

        return horaInicio && horaFin && horaInicio <= ahora && horaFin >= ahora;
      })).length;

      // Reservas activas
      const reservasAct = reservas.filter(r => {
        if (r.estado !== 'activa') return false;
        let horaFin;
        if (r.horaFin) {
          if (r.horaFin.toDate) horaFin = r.horaFin.toDate();
          else if (r.horaFin.seconds) horaFin = new Date(r.horaFin.seconds * 1000);
        }
        return horaFin && horaFin > ahora;
      }).length;

      setStats({
        totalSalas: salas.length,
        salasDisponibles: salasDisp,
        totalUsuarios: users.length,
        reservasActivas: reservasAct
      });
    }
  }, [salas, users, reservas, loadingSalas, loadingUsers, loadingReservas]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SALAS - CRUD FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const resetFormSala = () => {
    setEditingId(null);
    setNombreSala('');
    setCapacidad('');
    setTipoSala('aula_teorica');
    setProyector(false);
    setComputadores(0);
    setEnchufes(0);
    setPizarra('tradicional');
    setAireAcondicionado(false);
    setParlantes(false);
    setMicrofono(false);
    setCamara(false);
    setMessageSala('');
    setSedeSeleccionadaSala('');
    setEdificioSeleccionadoSala('');
    setPisoSeleccionadoSala('');
    setEdificiosDisponibles([]);
    setPisosDisponibles([]);
  };

  const handleSedeChangeSala = async (sedeId) => {
    setSedeSeleccionadaSala(sedeId);
    setEdificioSeleccionadoSala('');
    setPisoSeleccionadoSala('');
    setEdificiosDisponibles([]);
    setPisosDisponibles([]);

    if (sedeId) {
      try {
        const edificios = await obtenerEdificiosPorSede(sedeId, true);
        setEdificiosDisponibles(edificios);
      } catch (error) {
        console.error('Error al cargar edificios:', error);
      }
    }
  };

  const handleEdificioChangeSala = async (edificioId) => {
    setEdificioSeleccionadoSala(edificioId);
    setPisoSeleccionadoSala('');
    setPisosDisponibles([]);

    if (edificioId) {
      try {
        const pisos = await obtenerPisosPorEdificio(edificioId, true);
        setPisosDisponibles(pisos);
      } catch (error) {
        console.error('Error al cargar pisos:', error);
      }
    }
  };

  const handleFiltroSedeChange = async (sedeId) => {
    setFiltroSede(sedeId);
    setFiltroEdificio('');
    setFiltroPiso('');
    setEdificiosFiltro([]);
    setPisosFiltro([]);

    if (sedeId) {
      try {
        const edificios = await obtenerEdificiosPorSede(sedeId, true);
        setEdificiosFiltro(edificios);
      } catch (error) {
        console.error('Error al cargar edificios para filtros:', error);
      }
    }
  };

  const handleFiltroEdificioChange = async (edificioId) => {
    setFiltroEdificio(edificioId);
    setFiltroPiso('');
    setPisosFiltro([]);

    if (edificioId) {
      try {
        const pisos = await obtenerPisosPorEdificio(edificioId, true);
        setPisosFiltro(pisos);
      } catch (error) {
        console.error('Error al cargar pisos para filtros:', error);
      }
    }
  };

  const limpiarFiltrosLista = () => {
    setFiltroSede('');
    setFiltroEdificio('');
    setFiltroPiso('');
    setEdificiosFiltro([]);
    setPisosFiltro([]);
  };

  const handleSaveSala = async (e) => {
    e.preventDefault();

    if (!nombreSala || !capacidad) {
      setMessageSala('Por favor, completa todos los campos básicos.');
      return;
    }

    if (!sedeSeleccionadaSala || !edificioSeleccionadoSala || !pisoSeleccionadoSala) {
      setMessageSala('Por favor, selecciona Sede, Edificio y Piso.');
      return;
    }

    const nombreTrimmed = nombreSala.trim().toUpperCase();
    if (nombreTrimmed.length < 2) {
      setMessageSala('El nombre de la sala debe tener al menos 2 caracteres.');
      return;
    }

    const capacidadNum = Number(capacidad);
    if (isNaN(capacidadNum) || capacidadNum < 1 || capacidadNum > 200) {
      setMessageSala('La capacidad debe ser un número entre 1 y 200 personas.');
      return;
    }

    const pisoSeleccionado = pisosDisponibles.find(p => p.id === pisoSeleccionadoSala);
    const edificioSeleccionado = edificiosDisponibles.find(e => e.id === edificioSeleccionadoSala);
    const sedeSeleccionada = sedesDisponibles.find(s => s.id === sedeSeleccionadaSala);

    if (!pisoSeleccionado || !edificioSeleccionado || !sedeSeleccionada) {
      setMessageSala('Error al obtener datos de la jerarquía. Intenta de nuevo.');
      return;
    }

    if (!editingId) {
      const nombreDuplicado = salas.some(
        sala => sala.nombre.toUpperCase() === nombreTrimmed && sala.pisoId === pisoSeleccionadoSala
      );

      if (nombreDuplicado) {
        setMessageSala(`Ya existe una sala "${nombreTrimmed}" en ${pisoSeleccionado.nombre}.`);
        return;
      }
    }

    const docId = editingId || nombreTrimmed;
    const salaRef = doc(db, 'salas', docId);
    const salaData = {
      nombre: nombreTrimmed,
      sedeId: sedeSeleccionada.id,
      sedeNombre: sedeSeleccionada.nombre,
      edificioId: edificioSeleccionado.id,
      edificioNombre: edificioSeleccionado.nombre,
      pisoId: pisoSeleccionado.id,
      pisoNumero: pisoSeleccionado.numero,
      pisoNombre: pisoSeleccionado.nombre,
      piso: pisoSeleccionado.numero,
      capacidad: capacidadNum,
      tipo: tipoSala,
      equipamiento: {
        proyector: proyector,
        computadores: Number(computadores) || 0,
        enchufes: Number(enchufes) || 0,
        pizarra: pizarra,
        aire_acondicionado: aireAcondicionado,
        parlantes: parlantes,
        microfono: microfono,
        camara: camara,
        otros: []
      },
      activa: true,
      fechaActualizacion: new Date()
    };

    try {
      await setDoc(salaRef, salaData, { merge: true });
      setMessageSala(`Sala "${nombreTrimmed}" ${editingId ? 'actualizada' : 'creada'} exitosamente!`);
      resetFormSala();
      setTimeout(() => setMessageSala(''), 3000);
    } catch (error) {
      setMessageSala("Error al guardar la sala. Verifica los permisos.");
      console.error("Error: ", error);
    }
  };

  const handleDeleteSala = async (id, nombreSala) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Sala',
      message: `¿Estás seguro que deseas eliminar la sala "${nombreSala}"?\n\nEsta acción NO se puede deshacer.\n\nNota: Si la sala tiene reservas activas, podrían generarse inconsistencias.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'salas', id));
          showSuccess(`Sala "${nombreSala}" eliminada exitosamente`);
          await registrarLog('SALAS', 'eliminar', nombreSala, id, {});
        } catch (error) {
          showError(`Error al eliminar la sala "${nombreSala}"`);
          console.error("Error deleting sala:", error);
        }
      }
    });
  };

  const handleDeleteAllSalas = async () => {
    const totalSalas = salas.length;

    if (totalSalas === 0) {
      setMessageSala('No hay salas para eliminar.');
      return;
    }

    const confirmacion = window.confirm(
      `⚠️⚠️ ELIMINAR TODAS LAS SALAS ⚠️⚠️\n\n` +
      `Esta acción eliminará TODAS las ${totalSalas} salas de la base de datos.\n\n` +
      `Esta acción NO se puede deshacer.\n\n` +
      `¿Está ABSOLUTAMENTE SEGURO de que desea continuar?`
    );

    if (!confirmacion) return;

    const confirmacion2 = window.confirm(
      `⚠️ ÚLTIMA CONFIRMACIÓN\n\nEscribe OK en la siguiente ventana para confirmar.\n\nSe eliminarán ${totalSalas} salas.`
    );

    if (!confirmacion2) return;

    try {
      setMessageSala(`🗑️ Eliminando ${totalSalas} salas...`);

      const batch = writeBatch(db);
      salas.forEach((sala) => {
        const salaRef = doc(db, 'salas', sala.id);
        batch.delete(salaRef);
      });

      await batch.commit();
      setMessageSala(`✅ ${totalSalas} salas eliminadas exitosamente. Puedes crear las nuevas salas usando el Editor de Planos.`);
    } catch (error) {
      setMessageSala(`❌ Error al eliminar las salas. Por favor, intenta nuevamente.`);
      console.error("Error deleting all salas:", error);
    }
  };

  const handleActualizarSala = async (salaId, datosActualizados) => {
    try {
      const salaRef = doc(db, 'salas', salaId);
      await updateDoc(salaRef, datosActualizados);
      showSuccess('Sala actualizada exitosamente');
      setSalaEditando(null);
      await registrarLog('SALAS', 'editar', datosActualizados.nombre, salaId, {});
    } catch (error) {
      showError('Error al actualizar la sala');
      console.error("Error updating sala:", error);
    }
  };

  const handleEditSala = async (sala) => {
    setEditingId(sala.id);
    setNombreSala(sala.nombre);
    setCapacidad(sala.capacidad);
    setTipoSala(sala.tipo || 'aula_teorica');
    setFormularioColapsado(false);

    if (sala.sedeId && sala.edificioId && sala.pisoId) {
      setSedeSeleccionadaSala(sala.sedeId);

      const edificios = await obtenerEdificiosPorSede(sala.sedeId, true);
      setEdificiosDisponibles(edificios);
      setEdificioSeleccionadoSala(sala.edificioId);

      const pisos = await obtenerPisosPorEdificio(sala.edificioId, true);
      setPisosDisponibles(pisos);
      setPisoSeleccionadoSala(sala.pisoId);
    } else {
      setSedeSeleccionadaSala('');
      setEdificioSeleccionadoSala('');
      setPisoSeleccionadoSala('');
    }

    if (sala.equipamiento) {
      setProyector(sala.equipamiento.proyector || false);
      setComputadores(sala.equipamiento.computadores || 0);
      setEnchufes(sala.equipamiento.enchufes || 0);
      setPizarra(sala.equipamiento.pizarra || 'tradicional');
      setAireAcondicionado(sala.equipamiento.aire_acondicionado || false);
      setParlantes(sala.equipamiento.parlantes || false);
      setMicrofono(sala.equipamiento.microfono || false);
      setCamara(sala.equipamiento.camara || false);
    } else {
      setProyector(false);
      setComputadores(0);
      setEnchufes(0);
      setPizarra('tradicional');
      setAireAcondicionado(false);
      setParlantes(false);
      setMicrofono(false);
      setCamara(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // USUARIOS - CRUD FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const handleRoleChange = async (userId, newRole) => {
    try {
      // Obtener información del usuario antes de actualizar
      const usuario = users.find(u => u.id === userId);
      const nombreUsuario = usuario?.nombre || usuario?.email?.split('@')[0] || 'Usuario';

      await updateDoc(doc(db, 'users', userId), { role: newRole });
      showSuccess('Rol actualizado exitosamente');
      // El listener en tiempo real actualizará automáticamente

      // Notificar al usuario del cambio de rol
      await notificarRolCambiado(userId, nombreUsuario, newRole);

      await registrarLog('USUARIOS', 'cambiar_rol', `Usuario ${userId}`, userId, { nuevoRol: newRole });
    } catch (error) {
      showError('Error al actualizar el rol');
      console.error("Error updating role:", error);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nuevoEstado = !currentStatus;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    setConfirmDialog({
      isOpen: true,
      title: nuevoEstado ? 'Activar Usuario' : 'Desactivar Usuario',
      message: `¿Estás seguro de que deseas ${accion} este usuario?`,
      confirmText: nuevoEstado ? 'Activar' : 'Desactivar',
      cancelText: 'Cancelar',
      type: nuevoEstado ? 'success' : 'warning',
      onConfirm: async () => {
        try {
          // Actualizar estado del usuario
          await updateDoc(doc(db, 'users', userId), { activo: nuevoEstado });
          showSuccess(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`);

          // Si se está activando, enviar notificación
          if (nuevoEstado) {
            try {
              const usuario = users.find(u => u.id === userId);
              const nombreUsuario = usuario?.nombre || usuario?.email?.split('@')[0] || 'Usuario';

              // Obtener nombres de las sedes asignadas
              let nombresSedesAsignadas = null;
              if (usuario?.sedesAfiliadas && usuario.sedesAfiliadas.length > 0) {
                const sedesUsuario = sedesDisponibles.filter(s => usuario.sedesAfiliadas.includes(s.id));
                nombresSedesAsignadas = sedesUsuario.map(s => s.nombre).join(', ');
              }

              await notificarCuentaAprobada(userId, nombreUsuario, nombresSedesAsignadas);
            } catch (notifError) {
              console.error('Error al enviar notificación de activación:', notifError);
            }
          }

          // El listener en tiempo real actualizará automáticamente
          await registrarLog('USUARIOS', accion, `Usuario ${userId}`, userId, {});
        } catch (error) {
          showError(`Error al ${accion} el usuario`);
          console.error("Error toggling user status:", error);
        }
      }
    });
  };

  const handleDeleteUser = async (userId, userEmail) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de que deseas eliminar al usuario "${userEmail}"?\n\nEl usuario no podrá volver a iniciar sesión.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          // No eliminamos el documento, solo lo marcamos como eliminado
          // Esto evita el bug de pantalla en blanco cuando el usuario intenta loguearse
          await updateDoc(doc(db, 'users', userId), {
            activo: false,
            eliminado: true,
            fechaEliminacion: new Date()
          });
          await registrarLog('USUARIOS', 'eliminar', userEmail, userId, {});
          showSuccess(`Usuario "${userEmail}" eliminado exitosamente`);
          // El listener en tiempo real actualizará automáticamente
        } catch (error) {
          showError(`Error al eliminar el usuario "${userEmail}"`);
          console.error("Error deleting user:", error);
        }
      }
    });
  };

  const handleAbrirModalSedes = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setMostrarModalSedes(true);
  };

  const handleCerrarModalSedes = () => {
    setMostrarModalSedes(false);
    setUsuarioSeleccionado(null);
  };

  const handleSedesAsignadas = () => {
    setMessageUser('✅ Sedes asignadas exitosamente.');
    // El listener en tiempo real actualizará automáticamente
    setTimeout(() => setMessageUser(''), 3000);
  };

  const filteredUsers = users.filter(u => {
    // No mostrar usuarios eliminados
    if (u.eliminado === true) return false;

    const matchesSearch = u.email?.toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = filterRole === 'todos' || u.role === filterRole;
    const matchesStatus = usuariosSubTab === 'activos' ? u.activo === true : u.activo === false;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const hayUsuariosSinNombre = users.some(u => {
    const nombre = u.nombre || '';
    return !nombre ||
      nombre.toLowerCase() === 'usuario' ||
      nombre.toLowerCase() === 'user' ||
      nombre.trim().length === 0;
  });

  const handleMigrarNombres = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Actualizar Nombres de Usuarios',
      message: 'Esta acción actualizará automáticamente los nombres de los usuarios que tengan "usuario" como nombre, extrayendo el nombre desde su email (ej: juan.perez@inacap.cl → Juan Perez).\n\n¿Deseas continuar?',
      confirmText: 'Actualizar',
      cancelText: 'Cancelar',
      type: 'info',
      onConfirm: async () => {
        setMigrandoNombres(true);

        try {
          const resultado = await actualizarNombresDesdeEmails();

          if (resultado.exito) {
            showSuccess(`${resultado.actualizados} usuario(s) actualizado(s) exitosamente`);
            // El listener en tiempo real actualizará automáticamente

            await registrarLog('USUARIOS', 'migrar_nombres', 'Sistema', 'admin', {
              usuariosActualizados: resultado.actualizados,
              mensaje: resultado.mensaje
            });
          } else {
            showError(`Error: ${resultado.mensaje}`);
          }
        } catch (error) {
          console.error('Error en migración:', error);
          showError('Error al migrar nombres de usuarios');
        } finally {
          setMigrandoNombres(false);
        }
      }
    });
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RESERVAS - FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const handleCancelarReserva = async (reservaId, salaNombre, inicio) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar Reserva',
      message: `¿Estás seguro de que deseas cancelar esta reserva de la sala ${salaNombre}?`,
      confirmText: 'Cancelar Reserva',
      cancelText: 'Volver',
      type: 'warning',
      onConfirm: async () => {
        try {
          const reservaRef = doc(db, 'reservas', reservaId);
          await updateDoc(reservaRef, {
            estado: 'cancelada',
            canceladaPor: 'admin',
            fechaCancelacion: new Date()
          });
          showSuccess('Reserva cancelada exitosamente');
        } catch (error) {
          console.error("Error al cancelar reserva:", error);
          showError('Error al cancelar la reserva');
        }
      }
    });
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHART DATA PREPARATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const reservasPorDia = {};
  reservas.forEach(r => {
    if (r.horaInicio?.toDate) {
      const fecha = r.horaInicio.toDate().toLocaleDateString('es-CL');
      reservasPorDia[fecha] = (reservasPorDia[fecha] || 0) + 1;
    }
  });

  const chartDataBar = {
    labels: Object.keys(reservasPorDia).slice(-7),
    datasets: [{
      label: 'Reservas por Día',
      data: Object.values(reservasPorDia).slice(-7),
      backgroundColor: '#4F46E5',
      borderRadius: 6
    }]
  };

  const chartDataDoughnut = {
    labels: ['Disponibles', 'Ocupadas'],
    datasets: [{
      data: [stats.salasDisponibles, stats.totalSalas - stats.salasDisponibles],
      backgroundColor: ['#10B981', '#EF4444'],
      borderWidth: 0
    }]
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LOADING STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (loadingSalas || loadingUsers || loadingReservas) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-gray-900">
        <LoadingSpinner message="Cargando panel administrativo..." size="lg" />
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="flex h-screen bg-background-light dark:bg-gray-900">
      {/* Sidebar Desktop */}
      <Sidebar user={user} role={role} activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Mobile Header */}
      <MobileHeader 
        user={user} 
        role={role} 
        userData={{}} // AdminPanel no necesita userData específico
        onMenuClick={() => setMobileSidebarOpen(true)}
      />
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        user={user} 
        role={role} 
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Header */}
        <div className="border-b border-neutral-light dark:border-gray-700 bg-white dark:bg-gray-800 px-4 lg:px-8 py-4 lg:py-6">
          <h1 className="flex items-center gap-2 lg:gap-3 text-xl lg:text-2xl font-bold text-neutral-dark">
            <span className="material-symbols-outlined text-2xl lg:text-3xl text-danger">admin_panel_settings</span>
            <span className="hidden sm:inline">Panel de Administración</span>
            <span className="sm:hidden">Admin</span>
          </h1>
        </div>

        {/* Tab Content */}
        <div className="p-4 lg:p-8">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <DashboardTab
              stats={stats}
              chartDataBar={chartDataBar}
              chartDataDoughnut={chartDataDoughnut}
            />
          )}

          {/* INFRAESTRUCTURA TAB */}
          {activeTab === 'infraestructura' && (
            <InfraestructuraTab
              infraSubTab={infraSubTab}
              setInfraSubTab={setInfraSubTab}
            />
          )}

          {/* SALAS TAB */}
          {activeTab === 'salas' && (
            <SalasTab
              salasSubTab={salasSubTab}
              setSalasSubTab={setSalasSubTab}
              filtroSede={filtroSede}
              filtroEdificio={filtroEdificio}
              filtroPiso={filtroPiso}
              setFiltroPiso={setFiltroPiso}
              sedesFiltro={sedesFiltro}
              edificiosFiltro={edificiosFiltro}
              pisosFiltro={pisosFiltro}
              handleFiltroSedeChange={handleFiltroSedeChange}
              handleFiltroEdificioChange={handleFiltroEdificioChange}
              limpiarFiltrosLista={limpiarFiltrosLista}
              salas={salas}
              salaEditando={salaEditando}
              setSalaEditando={setSalaEditando}
              handleDeleteSala={handleDeleteSala}
              handleDeleteAllSalas={handleDeleteAllSalas}
              handleActualizarSala={handleActualizarSala}
            />
          )}

          {/* USUARIOS TAB */}
          {activeTab === 'usuarios' && (
            <UsuariosTab
              usuariosSubTab={usuariosSubTab}
              setUsuariosSubTab={setUsuariosSubTab}
              messageUser={messageUser}
              searchUser={searchUser}
              setSearchUser={setSearchUser}
              filterRole={filterRole}
              setFilterRole={setFilterRole}
              users={users}
              filteredUsers={filteredUsers}
              hayUsuariosSinNombre={hayUsuariosSinNombre}
              migrandoNombres={migrandoNombres}
              mostrarModalSedes={mostrarModalSedes}
              usuarioSeleccionado={usuarioSeleccionado}
              handleAbrirModalSedes={handleAbrirModalSedes}
              handleCerrarModalSedes={handleCerrarModalSedes}
              handleSedesAsignadas={handleSedesAsignadas}
              handleRoleChange={handleRoleChange}
              handleToggleUserStatus={handleToggleUserStatus}
              handleDeleteUser={handleDeleteUser}
              handleMigrarNombres={handleMigrarNombres}
            />
          )}

          {/* RESERVAS TAB */}
          {activeTab === 'reservas' && (
            <ReservasTab
              reservas={reservas}
              salas={salas}
              filtroEstadoReserva={filtroEstadoReserva}
              setFiltroEstadoReserva={setFiltroEstadoReserva}
              filtroSalaReserva={filtroSalaReserva}
              setFiltroSalaReserva={setFiltroSalaReserva}
              buscarReserva={buscarReserva}
              setBuscarReserva={setBuscarReserva}
              handleCancelarReserva={handleCancelarReserva}
            />
          )}

          {/* HISTORIAL TAB */}
          {activeTab === 'historial' && (
            <HistorialCompleto />
          )}

          {/* MIGRACIÓN TAB */}
          {activeTab === 'migracion' && (
            <MigracionTab />
          )}
        </div>
      </main>

      {/* Modal de Confirmación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
      />

      {/* Chatbot flotante */}
      <ChatBot />
    </div>
  );
}

export default AdminPanel;
