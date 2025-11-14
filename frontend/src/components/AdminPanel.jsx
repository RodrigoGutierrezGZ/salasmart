// src/components/AdminPanel.jsx

import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import Sidebar from './Sidebar';
import ChatBot from './ChatBot';
import EditorPlanos from './EditorPlanos';
import MigracionJerarquia from './MigracionJerarquia';
import GestionSedes from './GestionSedes';
import GestionEdificios from './GestionEdificios';
import ActividadReciente from './ActividadReciente';
import HistorialCompleto from './HistorialCompleto';
import AsignarSedesModal from './AsignarSedesModal';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { registrarLog } from '../services/logsService';
import { actualizarNombresDesdeEmails } from '../utils/actualizarNombresUsuarios';
import { obtenerSedes } from '../services/sedesService';
import { obtenerEdificiosPorSede } from '../services/edificiosService';
import { obtenerPisosPorEdificio } from '../services/pisosService';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AdminPanel() {
  const { user, role } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'infraestructura', 'salas', 'usuarios', 'reservas', 'migracion'
  const [salasSubTab, setSalasSubTab] = useState('lista'); // 'lista', 'planos'
  const [infraSubTab, setInfraSubTab] = useState('sedes'); // 'sedes', 'edificios'
  const [usuariosSubTab, setUsuariosSubTab] = useState('activos'); // 'activos', 'pendientes'

  // --- Estados para Salas ---
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

  // --- Estados para Jerarquía de Salas ---
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [edificiosDisponibles, setEdificiosDisponibles] = useState([]);
  const [pisosDisponibles, setPisosDisponibles] = useState([]);
  const [sedeSeleccionadaSala, setSedeSeleccionadaSala] = useState('');
  const [edificioSeleccionadoSala, setEdificioSeleccionadoSala] = useState('');
  const [pisoSeleccionadoSala, setPisoSeleccionadoSala] = useState('');

  // --- UI: Formulario y Filtros de Lista ---
  const [formularioColapsado, setFormularioColapsado] = useState(false);
  const [filtroSede, setFiltroSede] = useState('');
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [filtroPiso, setFiltroPiso] = useState('');
  const [sedesFiltro, setSedesFiltro] = useState([]);
  const [edificiosFiltro, setEdificiosFiltro] = useState([]);
  const [pisosFiltro, setPisosFiltro] = useState([]);

  // --- Estados para Usuarios ---
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [messageUser, setMessageUser] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [mostrarModalSedes, setMostrarModalSedes] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [migrandoNombres, setMigrandoNombres] = useState(false);

  // --- Estados para Reservas ---
  const [reservas, setReservas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(true);
  const [filtroEstadoReserva, setFiltroEstadoReserva] = useState('activas'); // 'activas', 'todas', 'canceladas', 'completadas'
  const [filtroSalaReserva, setFiltroSalaReserva] = useState('todas');
  const [buscarReserva, setBuscarReserva] = useState('');

  // --- Estados para Dashboard Stats ---
  const [stats, setStats] = useState({
    totalSalas: 0,
    salasDisponibles: 0,
    totalUsuarios: 0,
    reservasActivas: 0
  });

  // --- Estados para Modal de Confirmación ---
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'info',
    onConfirm: () => {}
  });

  // --- LÓGICA PARA LEER SALAS ---
  useEffect(() => {
    const unsubscribeSalas = onSnapshot(collection(db, 'salas'), (snapshot) => {
      const salasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSalas(salasData);
      setLoadingSalas(false);
    });
    return () => unsubscribeSalas();
  }, []);

  // --- LÓGICA PARA LEER USUARIOS ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // Si no tiene el campo 'activo', establecerlo como true por defecto
          activo: data.activo !== undefined ? data.activo : true
        };
      });
      console.log('Usuarios cargados:', usersData); // Debug
      setUsers(usersData);
      
      // MIGRACIÓN: Actualizar usuarios que no tengan el campo 'activo'
      for (const doc of usersSnapshot.docs) {
        const data = doc.data();
        if (data.activo === undefined) {
          console.log(`Actualizando usuario ${doc.id} - agregando campo activo:true`);
          await updateDoc(doc.ref, { activo: true });
        }
      }
    } catch (error) {
      console.error("Error al obtener usuarios: ", error);
      setMessageUser("No se pudieron cargar los usuarios.");
    } finally {
      setLoadingUsers(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);

  // --- CARGAR SEDES PARA FORMULARIO DE SALAS ---
  useEffect(() => {
    cargarSedesParaSalas();
  }, []);

  const cargarSedesParaSalas = async () => {
    try {
      const sedes = await obtenerSedes(true); // true = solo activas
      setSedesDisponibles(sedes);
    } catch (error) {
      console.error('Error al cargar sedes:', error);
    }
  };

  const handleSedeChangeSala = async (sedeId) => {
    setSedeSeleccionadaSala(sedeId);
    setEdificioSeleccionadoSala('');
    setPisoSeleccionadoSala('');
    setEdificiosDisponibles([]);
    setPisosDisponibles([]);

    if (sedeId) {
      try {
        const edificios = await obtenerEdificiosPorSede(sedeId, true); // true = solo activos
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
        const pisos = await obtenerPisosPorEdificio(edificioId, true); // true = solo activos
        setPisosDisponibles(pisos);
      } catch (error) {
        console.error('Error al cargar pisos:', error);
      }
    }
  };

  const handlePisoChangeSala = (pisoId) => {
    setPisoSeleccionadoSala(pisoId);
  };

  // --- CARGAR SEDES PARA FILTROS DE LISTA ---
  useEffect(() => {
    cargarSedesParaFiltros();
  }, []);

  const cargarSedesParaFiltros = async () => {
    try {
      const sedes = await obtenerSedes(true); // true = solo activas
      setSedesFiltro(sedes);
    } catch (error) {
      console.error('Error al cargar sedes para filtros:', error);
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
        const edificios = await obtenerEdificiosPorSede(sedeId, true); // true = solo activos
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
        const pisos = await obtenerPisosPorEdificio(edificioId, true); // true = solo activos
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

  // --- LÓGICA PARA LEER RESERVAS ---
  useEffect(() => {
    const unsubscribeReservas = onSnapshot(collection(db, 'reservas'), (snapshot) => {
      const reservasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservas(reservasData);
      setLoadingReservas(false);
    });
    return () => unsubscribeReservas();
  }, []);

  // --- CALCULAR ESTADÍSTICAS ---
  useEffect(() => {
    if (!loadingSalas && !loadingUsers && !loadingReservas) {
      const ahora = new Date();
      
      // Salas disponibles: no tienen reserva activa en este momento
      const salasDisp = salas.filter(s => !reservas.some(r => {
        if (r.salaId !== s.id || r.estado !== 'activa') return false;
        
        let horaInicio, horaFin;
        
        if (r.horaInicio) {
          if (r.horaInicio.toDate) {
            horaInicio = r.horaInicio.toDate();
          } else if (r.horaInicio.seconds) {
            horaInicio = new Date(r.horaInicio.seconds * 1000);
          }
        }
        
        if (r.horaFin) {
          if (r.horaFin.toDate) {
            horaFin = r.horaFin.toDate();
          } else if (r.horaFin.seconds) {
            horaFin = new Date(r.horaFin.seconds * 1000);
          }
        }
        
        return horaInicio && horaFin && horaInicio <= ahora && horaFin >= ahora;
      })).length;
      
      // Reservas activas: con estado 'activa' y que no hayan terminado
      const reservasAct = reservas.filter(r => {
        if (r.estado !== 'activa') return false;
        
        let horaFin;
        if (r.horaFin) {
          if (r.horaFin.toDate) {
            horaFin = r.horaFin.toDate();
          } else if (r.horaFin.seconds) {
            horaFin = new Date(r.horaFin.seconds * 1000);
          }
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
  
  // --- FUNCIONES CRUD PARA SALAS (Se mantienen igual) ---
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
    // Limpiar jerarquía
    setSedeSeleccionadaSala('');
    setEdificioSeleccionadoSala('');
    setPisoSeleccionadoSala('');
    setEdificiosDisponibles([]);
    setPisosDisponibles([]);
  };

  const handleSaveSala = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!nombreSala || !capacidad) {
      setMessageSala('Por favor, completa todos los campos básicos.');
      return;
    }

    // Validar jerarquía completa
    if (!sedeSeleccionadaSala || !edificioSeleccionadoSala || !pisoSeleccionadoSala) {
      setMessageSala('Por favor, selecciona Sede, Edificio y Piso.');
      return;
    }

    // Validar nombre de sala
    const nombreTrimmed = nombreSala.trim().toUpperCase();
    if (nombreTrimmed.length < 2) {
      setMessageSala('El nombre de la sala debe tener al menos 2 caracteres.');
      return;
    }

    // Validar capacidad (1-200 son valores razonables)
    const capacidadNum = Number(capacidad);
    if (isNaN(capacidadNum) || capacidadNum < 1 || capacidadNum > 200) {
      setMessageSala('La capacidad debe ser un número entre 1 y 200 personas.');
      return;
    }

    // Obtener datos completos del piso seleccionado
    const pisoSeleccionado = pisosDisponibles.find(p => p.id === pisoSeleccionadoSala);
    const edificioSeleccionado = edificiosDisponibles.find(e => e.id === edificioSeleccionadoSala);
    const sedeSeleccionada = sedesDisponibles.find(s => s.id === sedeSeleccionadaSala);

    if (!pisoSeleccionado || !edificioSeleccionado || !sedeSeleccionada) {
      setMessageSala('Error al obtener datos de la jerarquía. Intenta de nuevo.');
      return;
    }

    // Validar nombre único (solo al crear, no al editar)
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
      // Jerarquía completa
      sedeId: sedeSeleccionada.id,
      sedeNombre: sedeSeleccionada.nombre,
      edificioId: edificioSeleccionado.id,
      edificioNombre: edificioSeleccionado.nombre,
      pisoId: pisoSeleccionado.id,
      pisoNumero: pisoSeleccionado.numero,
      pisoNombre: pisoSeleccionado.nombre,
      // Mantener piso (número) para retrocompatibilidad
      piso: pisoSeleccionado.numero,
      // Resto de campos
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

      // Auto-hide mensaje después de 3 segundos
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
          await registrarLog('sala_eliminada', `Sala eliminada: ${nombreSala}`, user.email);
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

    if (!confirmacion) {
      return;
    }

    // Segunda confirmación
    const confirmacion2 = window.confirm(
      `⚠️ ÚLTIMA CONFIRMACIÓN\n\n` +
      `Escriba OK en la siguiente ventana para confirmar.\n\n` +
      `Se eliminarán ${totalSalas} salas.`
    );

    if (!confirmacion2) {
      return;
    }

    try {
      setMessageSala(`🗑️ Eliminando ${totalSalas} salas...`);

      // Usar batch para mejor rendimiento
      const batch = writeBatch(db);
      salas.forEach((sala) => {
        const salaRef = doc(db, 'salas', sala.id);
        batch.delete(salaRef);
      });

      await batch.commit();

      setMessageSala(`✅ ${totalSalas} salas eliminadas exitosamente. Puedes crear las nuevas salas usando el Editor de Planos.`);

      // No auto-ocultar este mensaje importante
    } catch (error) {
      setMessageSala(`❌ Error al eliminar las salas. Por favor, intenta nuevamente.`);
      console.error("Error deleting all salas:", error);
    }
  };

  const handleEditSala = async (sala) => {
    setEditingId(sala.id);
    setNombreSala(sala.nombre);
    setCapacidad(sala.capacidad);
    setTipoSala(sala.tipo || 'aula_teorica');
    setFormularioColapsado(false); // Expandir formulario al editar

    // Cargar jerarquía si existe (nuevo sistema)
    if (sala.sedeId && sala.edificioId && sala.pisoId) {
      // Pre-seleccionar sede
      setSedeSeleccionadaSala(sala.sedeId);

      // Cargar edificios de esa sede
      const edificios = await obtenerEdificiosPorSede(sala.sedeId, true); // true = solo activos
      setEdificiosDisponibles(edificios);

      // Pre-seleccionar edificio
      setEdificioSeleccionadoSala(sala.edificioId);

      // Cargar pisos de ese edificio
      const pisos = await obtenerPisosPorEdificio(sala.edificioId, true); // true = solo activos
      setPisosDisponibles(pisos);

      // Pre-seleccionar piso
      setPisoSeleccionadoSala(sala.pisoId);
    }
    // Si no tiene jerarquía (salas antiguas), dejar vacío para que el admin lo configure
    else {
      setSedeSeleccionadaSala('');
      setEdificioSeleccionadoSala('');
      setPisoSeleccionadoSala('');
    }

    // Cargar equipamiento si existe
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
      // Reset a valores por defecto si no hay equipamiento
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

  // --- ¡NUEVA FUNCIÓN MEJORADA PARA CAMBIAR ROL DE USUARIO! ---
  const handleRoleChange = async (userId, newRole) => {
    setMessageUser('');
    try {
      // Obtener datos del usuario antes de actualizar
      const usuario = users.find(u => u.id === userId);
      const userEmail = usuario?.email || 'Usuario';
      const oldRole = usuario?.role || 'desconocido';

      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { role: newRole });

      // Registrar log
      await registrarLog(
        'USUARIOS',
        'cambiar_rol',
        userEmail,
        userId,
        {
          email: userEmail,
          rolAnterior: oldRole,
          rolNuevo: newRole
        }
      );

      setMessageUser(`✅ Rol actualizado a "${newRole}" exitosamente.`);
      fetchUsers(); // Actualizamos la lista para reflejar el cambio
      setTimeout(() => setMessageUser(''), 3000);
    } catch (error) {
      setMessageUser("❌ Error al actualizar el rol. Revisa las reglas de seguridad.");
      console.error("Error updating role:", error);
    }
  };

  // --- NUEVA FUNCIÓN: Activar/Desactivar Usuario ---
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nuevoEstado = !currentStatus;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    const userEmail = users.find(u => u.id === userId)?.email || 'este usuario';

    setConfirmDialog({
      isOpen: true,
      title: nuevoEstado ? 'Activar Usuario' : 'Desactivar Usuario',
      message: `¿Estás seguro que deseas ${accion} al usuario "${userEmail}"?`,
      confirmText: nuevoEstado ? 'Activar' : 'Desactivar',
      cancelText: 'Cancelar',
      type: nuevoEstado ? 'success' : 'warning',
      onConfirm: async () => {
        try {
          const userDocRef = doc(db, 'users', userId);
          await updateDoc(userDocRef, { activo: nuevoEstado });

          // Registrar log
          await registrarLog(
            'USUARIOS',
            nuevoEstado ? 'activar' : 'desactivar',
            userEmail,
            userId,
            { estado: nuevoEstado ? 'activo' : 'inactivo' }
          );

          showSuccess(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`);
          fetchUsers();
        } catch (error) {
          showError("Error al cambiar el estado del usuario");
          console.error("Error toggling user status:", error);
        }
      }
    });
  };

  // --- NUEVA FUNCIÓN: Eliminar Usuario ---
  const handleDeleteUser = async (userId, userEmail) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Usuario',
      message: `¿Estás seguro que deseas eliminar al usuario "${userEmail}"?\n\nEsta acción NO se puede deshacer.\n\nNota: Si el usuario tiene reservas activas, podrían generarse inconsistencias.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', userId));

          // Registrar log
          await registrarLog(
            'USUARIOS',
            'eliminar',
            userEmail,
            userId,
            {}
          );

          showSuccess(`Usuario "${userEmail}" eliminado exitosamente`);
          fetchUsers();
        } catch (error) {
          showError(`Error al eliminar el usuario "${userEmail}"`);
          console.error("Error deleting user:", error);
        }
      }
    });
  };

  // --- NUEVA FUNCIÓN: Abrir Modal de Asignar Sedes ---
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
    fetchUsers(); // Recargar usuarios
    setTimeout(() => setMessageUser(''), 3000);
  };

  // --- NUEVA FUNCIÓN: Filtrar Usuarios ---
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email?.toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = filterRole === 'todos' || u.role === filterRole;
    const matchesStatus = usuariosSubTab === 'activos' ? u.activo === true : u.activo === false;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // --- Detectar si hay usuarios con nombres problemáticos ---
  const hayUsuariosSinNombre = users.some(u => {
    const nombre = u.nombre || '';
    return !nombre ||
           nombre.toLowerCase() === 'usuario' ||
           nombre.toLowerCase() === 'user' ||
           nombre.trim().length === 0;
  });

  // --- NUEVA FUNCIÓN: Migrar Nombres desde Emails ---
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
            fetchUsers(); // Recargar usuarios

            // Registrar log
            await registrarLog(
              'USUARIOS',
              'migrar_nombres',
              'Sistema',
              'admin',
              {
                usuariosActualizados: resultado.actualizados,
                mensaje: resultado.mensaje
              }
            );
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

  // --- NUEVA FUNCIÓN: Cancelar Reserva desde Admin ---
  const handleCancelarReserva = async (reservaId) => {
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
  };

  // --- Preparar datos para gráficos ---
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

  if (loadingSalas || loadingUsers || loadingReservas) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background-light">
      <Sidebar user={user} role={role} activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        
        {/* Header con título */}
        <div className="border-b border-neutral-light bg-white px-8 py-6">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-neutral-dark">
            <span className="material-symbols-outlined text-3xl text-danger">admin_panel_settings</span>
            Panel de Administración
          </h1>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="mx-auto max-w-7xl space-y-8">
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-4 rounded-lg border border-neutral-light bg-white p-6 shadow-soft">
                  <span className="material-symbols-outlined text-3xl text-secondary">inventory_2</span>
                  <p className="text-sm font-medium text-gray-500">Total Salas</p>
                  <p className="text-4xl font-bold text-neutral-dark">{stats.totalSalas}</p>
                </div>
                
                <div className="flex flex-col gap-4 rounded-lg border border-neutral-light bg-white p-6 shadow-soft">
                  <span className="material-symbols-outlined text-3xl text-success">check_circle</span>
                  <p className="text-sm font-medium text-gray-500">Salas Disponibles</p>
                  <p className="text-4xl font-bold text-neutral-dark">{stats.salasDisponibles}</p>
                </div>
                
                <div className="flex flex-col gap-4 rounded-lg border border-neutral-light bg-white p-6 shadow-soft">
                  <span className="material-symbols-outlined text-3xl text-primary">group</span>
                  <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                  <p className="text-4xl font-bold text-neutral-dark">{stats.totalUsuarios}</p>
                </div>
                
                <div className="flex flex-col gap-4 rounded-lg border border-neutral-light bg-white p-6 shadow-soft">
                  <span className="material-symbols-outlined text-3xl text-warning">event_available</span>
                  <p className="text-sm font-medium text-gray-500">Reservas Activas</p>
                  <p className="text-4xl font-bold text-neutral-dark">{stats.reservasActivas}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Bar Chart */}
                <div className="rounded-lg border border-neutral-light bg-white p-6 shadow-soft">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-dark">
                    <span className="material-symbols-outlined text-primary">bar_chart</span>
                    Reservas por Día (Última Semana)
                  </h3>
                  <div className="h-64">
                    <Bar data={chartDataBar} options={{ maintainAspectRatio: false, responsive: true }} />
                  </div>
                </div>

                {/* Doughnut Chart */}
                <div className="rounded-lg border border-neutral-light bg-white p-6 shadow-soft">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-dark">
                    <span className="material-symbols-outlined text-primary">pie_chart</span>
                    Disponibilidad de Salas
                  </h3>
                  <div className="h-64 flex items-center justify-center">
                    <Doughnut data={chartDataDoughnut} options={{ maintainAspectRatio: false, responsive: true }} />
                  </div>
                </div>
              </div>

              {/* Actividad Reciente */}
              <div className="rounded-lg border border-neutral-light bg-white px-6 py-5 shadow-soft">
                <ActividadReciente limite={15} />
              </div>
            </div>
          )}

          {/* INFRAESTRUCTURA TAB */}
          {activeTab === 'infraestructura' && (
            <div className="mx-auto max-w-7xl space-y-6">

              {/* Sub-tabs para Infraestructura */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setInfraSubTab('sedes')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    infraSubTab === 'sedes'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 border border-neutral-light hover:bg-neutral-light'
                  }`}
                >
                  <span className="material-symbols-outlined">location_city</span>
                  Sedes
                </button>
                <button
                  onClick={() => setInfraSubTab('edificios')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    infraSubTab === 'edificios'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 border border-neutral-light hover:bg-neutral-light'
                  }`}
                >
                  <span className="material-symbols-outlined">domain</span>
                  Edificios y Pisos
                </button>
              </div>

              {/* Contenido de cada sub-tab */}
              {infraSubTab === 'sedes' && <GestionSedes />}
              {infraSubTab === 'edificios' && <GestionEdificios />}

            </div>
          )}

          {/* SALAS TAB */}
          {activeTab === 'salas' && (
            <div className="mx-auto max-w-7xl space-y-6">

              {/* Sub-tabs para Salas */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSalasSubTab('lista')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    salasSubTab === 'lista'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 border border-neutral-light hover:bg-neutral-light'
                  }`}
                >
                  <span className="material-symbols-outlined">list</span>
                  Lista de Salas
                </button>
                <button
                  onClick={() => setSalasSubTab('planos')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    salasSubTab === 'planos'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 border border-neutral-light hover:bg-neutral-light'
                  }`}
                >
                  <span className="material-symbols-outlined">map</span>
                  Editor de Planos
                </button>
              </div>

              {/* Sub-tab: Lista de Salas */}
              {salasSubTab === 'lista' && (
                <>
                  {/* Form Card */}
                  <div className="rounded-lg border border-neutral-light bg-white shadow-soft">
                <button
                  onClick={() => setFormularioColapsado(!formularioColapsado)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-bold text-neutral-dark">
                    {editingId ? 'Editar Sala' : 'Crear Nueva Sala'}
                  </h3>
                  <span className="material-symbols-outlined text-gray-500">
                    {formularioColapsado ? 'expand_more' : 'expand_less'}
                  </span>
                </button>

                {!formularioColapsado && (
                  <div className="px-6 pb-6">
                
                {messageSala && (
                  <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 ${
                    messageSala.includes('éxito') || messageSala.includes('exitosamente')
                      ? 'bg-success/10 text-success'
                      : 'bg-danger/10 text-danger'
                  }`}>
                    <span className="material-symbols-outlined">
                      {messageSala.includes('éxito') || messageSala.includes('exitosamente') ? 'check_circle' : 'error'}
                    </span>
                    <p className="text-sm font-medium">{messageSala}</p>
                  </div>
                )}

                <form onSubmit={handleSaveSala} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Nombre de la Sala</label>
                    <input
                      type="text"
                      value={nombreSala}
                      onChange={(e) => setNombreSala(e.target.value)}
                      placeholder="Ej: A-101"
                      className="w-full rounded-lg border border-neutral-light px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Jerarquía: Sede → Edificio → Piso */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Sede *</label>
                      <select
                        value={sedeSeleccionadaSala}
                        onChange={(e) => handleSedeChangeSala(e.target.value)}
                        className="w-full rounded-lg border border-neutral-light px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      >
                        <option value="">Seleccionar sede...</option>
                        {sedesDisponibles.map((sede) => (
                          <option key={sede.id} value={sede.id}>
                            {sede.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Edificio *</label>
                      <select
                        value={edificioSeleccionadoSala}
                        onChange={(e) => handleEdificioChangeSala(e.target.value)}
                        className="w-full rounded-lg border border-neutral-light px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                        disabled={!sedeSeleccionadaSala}
                      >
                        <option value="">
                          {sedeSeleccionadaSala ? 'Seleccionar edificio...' : 'Primero selecciona una sede'}
                        </option>
                        {edificiosDisponibles.map((edificio) => (
                          <option key={edificio.id} value={edificio.id}>
                            {edificio.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Piso *</label>
                      <select
                        value={pisoSeleccionadoSala}
                        onChange={(e) => setPisoSeleccionadoSala(e.target.value)}
                        className="w-full rounded-lg border border-neutral-light px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                        disabled={!edificioSeleccionadoSala}
                      >
                        <option value="">
                          {edificioSeleccionadoSala ? 'Seleccionar piso...' : 'Primero selecciona un edificio'}
                        </option>
                        {pisosDisponibles.map((piso) => (
                          <option key={piso.id} value={piso.id}>
                            Piso {piso.numero} - {piso.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Capacidad</label>
                      <input
                        type="number"
                        value={capacidad}
                        onChange={(e) => setCapacidad(e.target.value)}
                        placeholder="1-200"
                        min="1"
                        max="200"
                        className="w-full rounded-lg border border-neutral-light px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de Sala</label>
                      <select
                        value={tipoSala}
                        onChange={(e) => setTipoSala(e.target.value)}
                        className="w-full rounded-lg border border-neutral-light px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="aula_teorica">Aula Teórica</option>
                        <option value="laboratorio">Laboratorio</option>
                        <option value="sala_reuniones">Sala de Reuniones</option>
                        <option value="auditorio">Auditorio</option>
                        <option value="taller">Taller</option>
                        <option value="sala_computo">Sala de Cómputo</option>
                      </select>
                    </div>
                  </div>

                  {/* Equipamiento Section */}
                  <div className="border-t border-neutral-light pt-4 mt-4">
                    <h4 className="mb-3 text-sm font-semibold text-neutral-dark flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">settings</span>
                      Equipamiento
                    </h4>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Computadores</label>
                        <input
                          type="number"
                          value={computadores}
                          onChange={(e) => setComputadores(e.target.value)}
                          placeholder="0"
                          min="0"
                          max="100"
                          className="w-full rounded-lg border border-neutral-light px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Enchufes</label>
                        <input
                          type="number"
                          value={enchufes}
                          onChange={(e) => setEnchufes(e.target.value)}
                          placeholder="0"
                          min="0"
                          max="100"
                          className="w-full rounded-lg border border-neutral-light px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de Pizarra</label>
                        <select
                          value={pizarra}
                          onChange={(e) => setPizarra(e.target.value)}
                          className="w-full rounded-lg border border-neutral-light px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="ninguna">Ninguna</option>
                          <option value="tradicional">Tradicional</option>
                          <option value="digital">Digital</option>
                          <option value="ambas">Ambas</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={proyector}
                          onChange={(e) => setProyector(e.target.checked)}
                          className="w-4 h-4 text-primary border-neutral-light rounded focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="text-sm text-gray-700">Proyector</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aireAcondicionado}
                          onChange={(e) => setAireAcondicionado(e.target.checked)}
                          className="w-4 h-4 text-primary border-neutral-light rounded focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="text-sm text-gray-700">A/C</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={parlantes}
                          onChange={(e) => setParlantes(e.target.checked)}
                          className="w-4 h-4 text-primary border-neutral-light rounded focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="text-sm text-gray-700">Parlantes</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={microfono}
                          onChange={(e) => setMicrofono(e.target.checked)}
                          className="w-4 h-4 text-primary border-neutral-light rounded focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="text-sm text-gray-700">Micrófono</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={camara}
                          onChange={(e) => setCamara(e.target.checked)}
                          className="w-4 h-4 text-primary border-neutral-light rounded focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="text-sm text-gray-700">Cámara</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-semibold text-white transition-colors hover:bg-primary/90"
                    >
                      <span className="material-symbols-outlined text-lg">save</span>
                      {editingId ? 'Actualizar' : 'Crear'} Sala
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetFormSala}
                        className="flex items-center gap-2 rounded-lg border border-neutral-light px-6 py-2 font-semibold text-gray-700 transition-colors hover:bg-neutral-light"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
                  </div>
                )}
              </div>

              {/* Filtros de Lista */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-3 gap-4">
                  {/* Filtro Sede */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Filtrar por Sede
                    </label>
                    <select
                      value={filtroSede}
                      onChange={(e) => handleFiltroSedeChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Todas las sedes</option>
                      {sedesFiltro.map((sede) => (
                        <option key={sede.id} value={sede.id}>
                          {sede.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Edificio */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Filtrar por Edificio
                    </label>
                    <select
                      value={filtroEdificio}
                      onChange={(e) => handleFiltroEdificioChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      disabled={!filtroSede}
                    >
                      <option value="">
                        {filtroSede ? 'Todos los edificios' : 'Primero selecciona una sede'}
                      </option>
                      {edificiosFiltro.map((edificio) => (
                        <option key={edificio.id} value={edificio.id}>
                          {edificio.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Piso */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Filtrar por Piso
                    </label>
                    <select
                      value={filtroPiso}
                      onChange={(e) => setFiltroPiso(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      disabled={!filtroEdificio}
                    >
                      <option value="">
                        {filtroEdificio ? 'Todos los pisos' : 'Primero selecciona un edificio'}
                      </option>
                      {pisosFiltro.map((piso) => (
                        <option key={piso.id} value={piso.id}>
                          Piso {piso.numero} - {piso.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botón limpiar filtros */}
                {(filtroSede || filtroEdificio || filtroPiso) && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={limpiarFiltrosLista}
                      className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-200"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>

              {/* Salas List */}
              <div className="rounded-lg border border-neutral-light bg-white shadow-soft">
                <div className="border-b border-neutral-light px-6 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-dark">
                    Lista de Salas ({(() => {
                      // Aplicar filtros
                      let filtradas = salas;
                      if (filtroSede) filtradas = filtradas.filter(s => s.sedeId === filtroSede);
                      if (filtroEdificio) filtradas = filtradas.filter(s => s.edificioId === filtroEdificio);
                      if (filtroPiso) filtradas = filtradas.filter(s => s.pisoId === filtroPiso);
                      return filtradas.length;
                    })()})
                  </h3>
                  {salas.length > 0 && (
                    <button
                      onClick={handleDeleteAllSalas}
                      className="flex items-center gap-2 rounded-lg bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                    >
                      <span className="material-symbols-outlined text-base">delete_sweep</span>
                      Eliminar Todas las Salas
                    </button>
                  )}
                </div>
                <div className="divide-y divide-neutral-light">
                  {(() => {
                    // Aplicar filtros
                    let salasFiltradas = salas;
                    if (filtroSede) salasFiltradas = salasFiltradas.filter(s => s.sedeId === filtroSede);
                    if (filtroEdificio) salasFiltradas = salasFiltradas.filter(s => s.edificioId === filtroEdificio);
                    if (filtroPiso) salasFiltradas = salasFiltradas.filter(s => s.pisoId === filtroPiso);

                    return salasFiltradas.length > 0 ? salasFiltradas.map((sala) => (
                    <div key={sala.id} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-light/50">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <span className="material-symbols-outlined text-primary">meeting_room</span>
                        </div>
                        <div>
                          <p className="font-bold text-neutral-dark">{sala.nombre}</p>
                          <p className="text-sm text-gray-500">
                            {sala.sedeNombre && sala.edificioNombre && sala.pisoNumero ? (
                              `${sala.sedeNombre} → ${sala.edificioNombre} → Piso ${sala.pisoNumero}`
                            ) : (
                              `Piso ${sala.piso || 'N/A'}`
                            )}
                            {' • Capacidad: '}{sala.capacidad} personas
                            {sala.tipo && ` • ${sala.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                          </p>
                          {/* Equipment badges */}
                          {sala.equipamiento && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {sala.equipamiento.proyector && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>video_settings</span>
                                  Proyector
                                </span>
                              )}
                              {sala.equipamiento.computadores > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>computer</span>
                                  {sala.equipamiento.computadores} PCs
                                </span>
                              )}
                              {sala.equipamiento.enchufes > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>power</span>
                                  {sala.equipamiento.enchufes}
                                </span>
                              )}
                              {sala.equipamiento.pizarra && sala.equipamiento.pizarra !== 'ninguna' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>edit_square</span>
                                  {sala.equipamiento.pizarra}
                                </span>
                              )}
                              {sala.equipamiento.aire_acondicionado && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>ac_unit</span>
                                  A/C
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleEditSala(sala);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="flex items-center gap-1 rounded-lg bg-warning/10 px-3 py-1.5 text-sm font-semibold text-warning transition-colors hover:bg-warning/20"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteSala(sala.id)}
                          className="flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                          Eliminar
                        </button>
                      </div>
                    </div>
                    )) : (
                      <div className="px-6 py-12 text-center text-gray-500">
                        <span className="material-symbols-outlined text-5xl mb-3 opacity-50">search_off</span>
                        <p className="font-medium">No hay salas que coincidan con los filtros seleccionados</p>
                        <button
                          onClick={limpiarFiltrosLista}
                          className="mt-4 text-primary hover:underline"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
              </>
              )}

              {/* Sub-tab: Editor de Planos */}
              {salasSubTab === 'planos' && (
                <EditorPlanos />
              )}

            </div>
          )}

          {/* USUARIOS TAB */}
          {activeTab === 'usuarios' && (
            <div className="mx-auto max-w-7xl space-y-6">

              {/* Message Alert */}
              {messageUser && (
                <div className={`flex items-center gap-2 rounded-lg p-4 ${
                  messageUser.includes('✅') || messageUser.includes('exitosamente')
                    ? 'bg-success/10 border border-success/30 text-success'
                    : 'bg-danger/10 border border-danger/30 text-danger'
                }`}>
                  <span className="material-symbols-outlined">
                    {messageUser.includes('✅') || messageUser.includes('exitosamente') ? 'check_circle' : 'error'}
                  </span>
                  <p className="text-sm font-medium">{messageUser}</p>
                </div>
              )}

              {/* Sub-Tabs Navigation */}
              <div className="flex gap-2 rounded-lg border border-neutral-light bg-white p-2">
                <button
                  onClick={() => setUsuariosSubTab('activos')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    usuariosSubTab === 'activos'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Usuarios Activos
                </button>
                <button
                  onClick={() => setUsuariosSubTab('pendientes')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    usuariosSubTab === 'pendientes'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">pending</span>
                  Pendientes de Aprobación
                  {users.filter(u => !u.activo).length > 0 && (
                    <span className="ml-1 rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-white">
                      {users.filter(u => !u.activo).length}
                    </span>
                  )}
                </button>
              </div>

              {/* Botón de Migración de Nombres - Solo visible si hay usuarios con nombres problemáticos */}
              {hayUsuariosSinNombre && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="material-symbols-outlined text-purple-600">badge</span>
                      <div>
                        <p className="text-sm font-semibold text-purple-900">
                          Actualizar Nombres de Usuarios
                        </p>
                        <p className="mt-1 text-xs text-purple-700">
                          Hay usuarios con nombre "usuario". Este botón los actualizará automáticamente extrayendo el nombre desde su email institucional.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleMigrarNombres}
                      disabled={migrandoNombres}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-purple-600 hover:to-purple-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <span className={`material-symbols-outlined text-lg ${migrandoNombres ? 'animate-spin' : ''}`}>
                        {migrandoNombres ? 'sync' : 'auto_fix_high'}
                      </span>
                      {migrandoNombres ? 'Migrando...' : 'Migrar Nombres'}
                    </button>
                  </div>
                </div>
              )}

              {/* Info y Filtros según vista */}
              {usuariosSubTab === 'pendientes' ? (
                <div className="rounded-xl border-2 border-blue-300 bg-blue-100 p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500">
                      <span className="material-symbols-outlined text-white text-2xl">info</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-blue-900 mb-2">
                        Cuentas Pendientes de Aprobación
                      </h3>
                      <p className="text-sm leading-relaxed text-blue-800">
                        Estas cuentas fueron registradas pero están inactivas. Puedes <strong className="font-semibold">cambiar el rol</strong> si corresponde (docente/admin) y luego hacer clic en <strong className="font-semibold">Aprobar</strong> para activarlas, o <strong className="font-semibold">Rechazar</strong> para eliminarlas.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-neutral-light bg-white p-4 shadow-soft">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input
                          type="text"
                          value={searchUser}
                          onChange={(e) => setSearchUser(e.target.value)}
                          placeholder="Buscar por email..."
                          className="w-full rounded-lg border border-neutral-light py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="rounded-lg border border-neutral-light px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="todos">Todos los roles</option>
                      <option value="estudiante">Estudiantes</option>
                      <option value="docente">Docentes</option>
                      <option value="admin">Administradores</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div className="rounded-lg border border-neutral-light bg-white shadow-soft overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-light/50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Sedes</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-light">
                      {filteredUsers.map((u) => {
                        // No mostrar nuestra propia cuenta
                        if (u.id === auth.currentUser?.uid) return null;
                        
                        return (
                          <tr key={u.id} className="hover:bg-neutral-light/30">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-neutral-dark">{u.nombre || 'Sin nombre'}</p>
                                <p className="text-sm text-gray-500">{u.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {/* No permitir cambiar nuestro propio rol */}
                              {u.id === auth.currentUser?.uid ? (
                                <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                                  {u.role === 'admin' ? 'Administrador' : u.role === 'docente' ? 'Docente' : 'Estudiante'}
                                </span>
                              ) : (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  className="rounded-lg border border-neutral-light bg-white px-3 py-1.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  title="Cambiar rol del usuario"
                                >
                                  <option value="estudiante">Estudiante</option>
                                  <option value="docente">Docente</option>
                                  <option value="admin">Administrador</option>
                                </select>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {u.sedesAfiliadas && u.sedesAfiliadas.length > 0 ? (
                                  <span className="text-xs font-semibold text-gray-700">
                                    {u.sedesAfiliadas.length} sede{u.sedesAfiliadas.length > 1 ? 's' : ''}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">Sin sedes</span>
                                )}
                                <button
                                  onClick={() => handleAbrirModalSedes(u)}
                                  className="text-primary hover:text-primary/80"
                                  title="Asignar sedes"
                                >
                                  <span className="material-symbols-outlined text-lg">edit_location</span>
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                                u.activo ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {u.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {usuariosSubTab === 'pendientes' ? (
                                  // Vista PENDIENTES: Aprobar o Rechazar
                                  <>
                                    <button
                                      onClick={() => handleToggleUserStatus(u.id, u.activo)}
                                      className="flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-sm font-semibold text-success transition-colors hover:bg-success/20"
                                    >
                                      <span className="material-symbols-outlined text-base">check_circle</span>
                                      Aprobar
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u.id, u.email)}
                                      className="flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                                    >
                                      <span className="material-symbols-outlined text-base">delete</span>
                                      Rechazar
                                    </button>
                                  </>
                                ) : (
                                  // Vista ACTIVOS: Desactivar o Eliminar
                                  <>
                                    <button
                                      onClick={() => handleToggleUserStatus(u.id, u.activo)}
                                      className="flex items-center gap-1 rounded-lg bg-warning/10 px-3 py-1.5 text-sm font-semibold text-warning transition-colors hover:bg-warning/20"
                                    >
                                      <span className="material-symbols-outlined text-base">block</span>
                                      Desactivar
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u.id, u.email)}
                                      className="flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                                    >
                                      <span className="material-symbols-outlined text-base">delete</span>
                                      Eliminar
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* RESERVAS TAB */}
          {activeTab === 'reservas' && (
            <div className="mx-auto max-w-7xl space-y-6">
              {/* Header */}
              <div className="rounded-lg border border-neutral-light bg-white p-6 shadow-soft">
                <h3 className="text-lg font-bold text-neutral-dark">Gestión de Reservas</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Total de reservas: <strong>{reservas.length}</strong> | 
                  Activas: <strong>{reservas.filter(r => {
                    if (r.estado !== 'activa') return false;
                    const ahora = new Date();
                    let horaFin;
                    if (r.horaFin) {
                      if (r.horaFin.toDate) {
                        horaFin = r.horaFin.toDate();
                      } else if (r.horaFin.seconds) {
                        horaFin = new Date(r.horaFin.seconds * 1000);
                      } else {
                        horaFin = new Date(r.horaFin);
                      }
                    }
                    return horaFin && horaFin > ahora;
                  }).length}</strong>
                </p>
              </div>

              {/* Filtros de Reservas */}
              <div className="rounded-lg border border-neutral-light bg-white p-6 shadow-soft">
                <h4 className="mb-4 font-semibold text-neutral-dark flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">filter_list</span>
                  Filtrar Reservas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Filtro por Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <div className="relative">
                      <select
                        value={filtroEstadoReserva}
                        onChange={(e) => setFiltroEstadoReserva(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-neutral-light bg-white px-4 py-2.5 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                      >
                        <option value="activas">Solo Activas</option>
                        <option value="todas">Todas</option>
                        <option value="canceladas">Canceladas</option>
                        <option value="completadas">Completadas</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Filtro por Sala */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sala</label>
                    <div className="relative">
                      <select
                        value={filtroSalaReserva}
                        onChange={(e) => setFiltroSalaReserva(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-neutral-light bg-white px-4 py-2.5 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                      >
                        <option value="todas">Todas las Salas</option>
                        {salas
                          .filter(sala => sala.nombre) // Solo salas con nombre
                          .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
                          .map(sala => (
                            <option key={sala.id} value={sala.id}>{sala.nombre}</option>
                          ))
                        }
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Búsqueda */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={buscarReserva}
                        onChange={(e) => setBuscarReserva(e.target.value)}
                        placeholder="Docente o asignatura..."
                        className="w-full rounded-lg border border-neutral-light bg-white px-4 py-2.5 pl-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">
                        search
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón para limpiar filtros */}
                {(filtroEstadoReserva !== 'activas' || filtroSalaReserva !== 'todas' || buscarReserva) && (
                  <button
                    onClick={() => {
                      setFiltroEstadoReserva('activas');
                      setFiltroSalaReserva('todas');
                      setBuscarReserva('');
                    }}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    <span className="material-symbols-outlined text-lg">filter_alt_off</span>
                    Limpiar Filtros
                  </button>
                )}
              </div>

              {/* Tabla de Reservas */}
              {(() => {
                const ahora = new Date();
                
                // Filtrar reservas según los criterios
                const reservasFiltradas = reservas.filter(r => {
                  // Filtro por estado
                  if (filtroEstadoReserva === 'activas') {
                    if (r.estado !== 'activa') return false;
                    let horaFin;
                    if (r.horaFin) {
                      if (r.horaFin.toDate) horaFin = r.horaFin.toDate();
                      else if (r.horaFin.seconds) horaFin = new Date(r.horaFin.seconds * 1000);
                      else horaFin = new Date(r.horaFin);
                    }
                    if (!horaFin || horaFin <= ahora) return false;
                  } else if (filtroEstadoReserva === 'canceladas') {
                    if (r.estado !== 'cancelada') return false;
                  } else if (filtroEstadoReserva === 'completadas') {
                    let horaFin;
                    if (r.horaFin) {
                      if (r.horaFin.toDate) horaFin = r.horaFin.toDate();
                      else if (r.horaFin.seconds) horaFin = new Date(r.horaFin.seconds * 1000);
                      else horaFin = new Date(r.horaFin);
                    }
                    if (!horaFin || horaFin > ahora || r.estado === 'cancelada') return false;
                  }
                  
                  // Filtro por sala
                  if (filtroSalaReserva !== 'todas' && r.salaId !== filtroSalaReserva) return false;
                  
                  // Filtro por búsqueda
                  if (buscarReserva) {
                    const busqueda = buscarReserva.toLowerCase();
                    const nombreDocente = (r.nombreDocente || '').toLowerCase();
                    const asignatura = (r.asignatura || '').toLowerCase();
                    if (!nombreDocente.includes(busqueda) && !asignatura.includes(busqueda)) return false;
                  }
                  
                  return true;
                });

                return reservasFiltradas.length > 0 ? (
                  <div className="rounded-lg border border-neutral-light bg-white shadow-soft overflow-hidden">
                    <div className="border-b border-neutral-light bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
                      <h4 className="font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined">event_available</span>
                        Reservas ({reservasFiltradas.length})
                      </h4>
                    </div>

                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="min-w-full">
                      <thead className="sticky top-0 bg-white border-b-2 border-neutral-light">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Sala</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Docente</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Asignatura</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Fecha</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Horario</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Estado</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-light">
                        {reservasFiltradas.map((reserva) => {
                          // Convertir Timestamp de Firebase a Date
                          let inicio, fin;
                          
                          // Las reservas usan horaInicio y horaFin
                          if (reserva.horaInicio) {
                            if (reserva.horaInicio.toDate) {
                              inicio = reserva.horaInicio.toDate();
                            } else if (reserva.horaInicio.seconds) {
                              inicio = new Date(reserva.horaInicio.seconds * 1000);
                            } else {
                              inicio = new Date(reserva.horaInicio);
                            }
                          }
                          
                          if (reserva.horaFin) {
                            if (reserva.horaFin.toDate) {
                              fin = reserva.horaFin.toDate();
                            } else if (reserva.horaFin.seconds) {
                              fin = new Date(reserva.horaFin.seconds * 1000);
                            } else {
                              fin = new Date(reserva.horaFin);
                            }
                          }
                          
                          // Si no tenemos fechas válidas, saltar esta reserva
                          if (!inicio || !fin || isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
                            return null;
                          }

                          // Determinar el estado visual
                          const ahora = new Date();
                          let estadoVisual = reserva.estado || 'activa';
                          let estadoColor = 'success';
                          let estadoTexto = 'Activa';
                          
                          if (reserva.estado === 'cancelada') {
                            estadoColor = 'danger';
                            estadoTexto = 'Cancelada';
                          } else if (fin <= ahora) {
                            estadoColor = 'gray-500';
                            estadoTexto = 'Completada';
                          }
                          
                          return (
                            <tr key={reserva.id} className="hover:bg-neutral-light/30">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-primary">meeting_room</span>
                                  <span className="font-semibold text-neutral-dark">{reserva.salaNombre || reserva.salaId}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-medium text-neutral-dark">{reserva.nombreDocente || 'Sin nombre'}</p>
                                <p className="text-sm text-gray-500">{reserva.usuarioId || 'N/A'}</p>
                              </td>
                              <td className="px-6 py-4 text-neutral-dark">{reserva.asignatura || 'No especificada'}</td>
                              <td className="px-6 py-4 text-neutral-dark">
                                {inicio.toLocaleDateString('es-ES', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1 text-sm text-neutral-dark">
                                  <span className="material-symbols-outlined text-base">schedule</span>
                                  {inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                  {' - '}
                                  {fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`rounded-full bg-${estadoColor}/10 px-3 py-1 text-xs font-bold text-${estadoColor}`}>
                                  {estadoTexto}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {reserva.estado === 'activa' && fin > ahora && (
                                  <button
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: 'Cancelar Reserva',
                                        message: `¿Estás seguro de que deseas cancelar esta reserva de la sala ${reserva.salaNombre}?`,
                                        confirmText: 'Cancelar Reserva',
                                        cancelText: 'Volver',
                                        type: 'warning',
                                        onConfirm: () => handleCancelarReserva(reserva.id)
                                      });
                                    }}
                                    className="flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                                  >
                                    <span className="material-symbols-outlined text-base">cancel</span>
                                    Cancelar
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-neutral-light bg-white p-8 text-center shadow-soft">
                  <span className="material-symbols-outlined mx-auto mb-3 text-6xl text-gray-300">event_busy</span>
                  <p className="text-lg font-semibold text-gray-600">No hay reservas que coincidan con los filtros</p>
                  <p className="mt-2 text-sm text-gray-500">Prueba ajustando los criterios de búsqueda</p>
                </div>
              );
            })()}

            </div>
          )}

          {/* HISTORIAL TAB */}
          {activeTab === 'historial' && (
            <HistorialCompleto />
          )}

          {/* MIGRACIÓN TAB */}
          {activeTab === 'migracion' && (
            <MigracionJerarquia />
          )}

        </div>
      </main>

      {/* Modal de Asignar Sedes */}
      {mostrarModalSedes && usuarioSeleccionado && (
        <AsignarSedesModal
          usuario={usuarioSeleccionado}
          onClose={handleCerrarModalSedes}
          onSuccess={handleSedesAsignadas}
        />
      )}

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