// src/components/AdminPanel.jsx

import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import Sidebar from './Sidebar';
import ChatBot from './ChatBot';
import { useAuth } from '../hooks/useAuth';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AdminPanel() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'salas', 'usuarios', 'reservas'
  
  // --- Estados para Salas ---
  const [salas, setSalas] = useState([]);
  const [loadingSalas, setLoadingSalas] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [nombreSala, setNombreSala] = useState('');
  const [piso, setPiso] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [messageSala, setMessageSala] = useState('');
  
  // --- Estados para Usuarios ---
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [messageUser, setMessageUser] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [filterRole, setFilterRole] = useState('todos');

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
    setPiso('');
    setCapacidad('');
    setMessageSala('');
  };

  const handleSaveSala = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!nombreSala || !piso || !capacidad) {
      setMessageSala('Por favor, completa todos los campos.');
      return;
    }

    // Validar nombre de sala
    const nombreTrimmed = nombreSala.trim();
    if (nombreTrimmed.length < 2) {
      setMessageSala('El nombre de la sala debe tener al menos 2 caracteres.');
      return;
    }

    // Validar piso (1-10 son valores razonables)
    const pisoNum = Number(piso);
    if (isNaN(pisoNum) || pisoNum < 1 || pisoNum > 10) {
      setMessageSala('El piso debe ser un número entre 1 y 10.');
      return;
    }

    // Validar capacidad (1-200 son valores razonables)
    const capacidadNum = Number(capacidad);
    if (isNaN(capacidadNum) || capacidadNum < 1 || capacidadNum > 200) {
      setMessageSala('La capacidad debe ser un número entre 1 y 200 personas.');
      return;
    }

    const docId = editingId || nombreTrimmed;
    const salaRef = doc(db, 'salas', docId);
    const salaData = {
      nombre: nombreTrimmed,
      piso: pisoNum,
      capacidad: capacidadNum,
      activa: true,
      fechaActualizacion: new Date()
    };

    try {
      await setDoc(salaRef, salaData, { merge: true });
      setMessageSala(`✅ Sala "${nombreTrimmed}" ${editingId ? 'actualizada' : 'creada'} exitosamente!`);
      resetFormSala();

      // Auto-hide mensaje después de 3 segundos
      setTimeout(() => setMessageSala(''), 3000);
    } catch (error) {
      setMessageSala("❌ Error al guardar la sala. Verifica los permisos.");
      console.error("Error: ", error);
    }
  };

  const handleDeleteSala = async (id, nombreSala) => {
    const confirmacion = window.confirm(
      `⚠️ ELIMINAR SALA\n\n` +
      `¿Estás seguro que deseas eliminar la sala "${nombreSala}"?\n\n` +
      `Esta acción NO se puede deshacer.\n\n` +
      `Nota: Si la sala tiene reservas activas, podrían generarse inconsistencias.`
    );

    if (confirmacion) {
      try {
        await deleteDoc(doc(db, 'salas', id));
        setMessageSala(`✅ Sala "${nombreSala}" eliminada exitosamente.`);
        setTimeout(() => setMessageSala(''), 3000);
      } catch (error) {
        setMessageSala(`❌ Error al eliminar la sala "${nombreSala}".`);
        console.error("Error deleting sala:", error);
      }
    }
  };

  const handleEditSala = (sala) => {
    setEditingId(sala.id);
    setNombreSala(sala.nombre);
    setPiso(sala.piso);
    setCapacidad(sala.capacidad);
  };

  // --- ¡NUEVA FUNCIÓN MEJORADA PARA CAMBIAR ROL DE USUARIO! ---
  const handleRoleChange = async (userId, newRole) => {
    setMessageUser('');
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { role: newRole });
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
    const confirmacion = window.confirm(
      `¿Estás seguro que deseas ${accion} al usuario "${userEmail}"?`
    );

    if (!confirmacion) return;

    setMessageUser('');
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { activo: nuevoEstado });
      setMessageUser(`✅ Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`);
      fetchUsers();
      setTimeout(() => setMessageUser(''), 3000);
    } catch (error) {
      setMessageUser("❌ Error al cambiar el estado del usuario.");
      console.error("Error toggling user status:", error);
    }
  };

  // --- NUEVA FUNCIÓN: Eliminar Usuario ---
  const handleDeleteUser = async (userId, userEmail) => {
    const confirmacion = window.confirm(
      `⚠️ ELIMINAR USUARIO\n\n` +
      `¿Estás seguro que deseas eliminar al usuario "${userEmail}"?\n\n` +
      `Esta acción NO se puede deshacer.\n\n` +
      `Nota: Si el usuario tiene reservas activas, podrían generarse inconsistencias.`
    );

    if (!confirmacion) return;

    setMessageUser('');
    try {
      await deleteDoc(doc(db, 'users', userId));
      setMessageUser(`✅ Usuario "${userEmail}" eliminado exitosamente.`);
      fetchUsers();
      setTimeout(() => setMessageUser(''), 3000);
    } catch (error) {
      setMessageUser(`❌ Error al eliminar el usuario "${userEmail}".`);
      console.error("Error deleting user:", error);
    }
  };

  // --- NUEVA FUNCIÓN: Filtrar Usuarios ---
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email?.toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = filterRole === 'todos' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // --- NUEVA FUNCIÓN: Cancelar Reserva desde Admin ---
  const handleCancelarReserva = async (reservaId) => {
    try {
      const reservaRef = doc(db, 'reservas', reservaId);
      await updateDoc(reservaRef, {
        estado: 'cancelada',
        canceladaPor: 'admin',
        fechaCancelacion: new Date()
      });
      
      alert('✅ Reserva cancelada exitosamente');
    } catch (error) {
      console.error("Error al cancelar reserva:", error);
      alert('❌ Error al cancelar la reserva');
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

              {/* Recent Activity */}
              <div className="rounded-lg border border-neutral-light bg-white shadow-soft">
                <div className="border-b border-neutral-light px-6 py-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-dark">
                    <span className="material-symbols-outlined text-secondary">history</span>
                    Actividad Reciente
                  </h3>
                </div>
                <div className="divide-y divide-neutral-light">
                  {reservas.slice(0, 5).map((reserva) => (
                    <div key={reserva.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <span className="material-symbols-outlined text-primary">event</span>
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-dark">{reserva.asignatura || 'Reserva'}</p>
                          <p className="text-sm text-gray-500">{reserva.nombreDocente || 'Sin nombre'}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        reserva.estado === 'activa' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {reserva.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SALAS TAB */}
          {activeTab === 'salas' && (
            <div className="mx-auto max-w-7xl space-y-6">
              
              {/* Form Card */}
              <div className="rounded-lg border border-neutral-light bg-white p-6 shadow-soft">
                <h3 className="mb-4 text-lg font-bold text-neutral-dark">
                  {editingId ? 'Editar Sala' : 'Crear Nueva Sala'}
                </h3>
                
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Piso</label>
                      <input
                        type="number"
                        value={piso}
                        onChange={(e) => setPiso(e.target.value)}
                        placeholder="1-10"
                        min="1"
                        max="10"
                        className="w-full rounded-lg border border-neutral-light px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>

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

              {/* Salas List */}
              <div className="rounded-lg border border-neutral-light bg-white shadow-soft">
                <div className="border-b border-neutral-light px-6 py-4">
                  <h3 className="text-lg font-bold text-neutral-dark">Lista de Salas ({salas.length})</h3>
                </div>
                <div className="divide-y divide-neutral-light">
                  {salas.map((sala) => (
                    <div key={sala.id} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-light/50">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <span className="material-symbols-outlined text-primary">meeting_room</span>
                        </div>
                        <div>
                          <p className="font-bold text-neutral-dark">{sala.nombre}</p>
                          <p className="text-sm text-gray-500">
                            Piso {sala.piso} • Capacidad: {sala.capacidad} personas
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(sala.id);
                            setNombreSala(sala.nombre);
                            setPiso(sala.piso.toString());
                            setCapacidad(sala.capacidad.toString());
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
                  ))}
                </div>
              </div>
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

              {/* Filters */}
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

              {/* Botón de migración temporal */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-neutral-dark">¿Todos los usuarios aparecen inactivos?</p>
                    <p className="text-sm text-gray-600">Haz clic aquí para activarlos automáticamente</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const usersSnapshot = await getDocs(collection(db, 'users'));
                        let actualizados = 0;
                        for (const documento of usersSnapshot.docs) {
                          await updateDoc(doc(db, 'users', documento.id), { activo: true });
                          actualizados++;
                        }
                        setMessageUser(`✅ ${actualizados} usuarios activados correctamente`);
                        fetchUsers(); // Recargar usuarios
                        setTimeout(() => setMessageUser(''), 3000);
                      } catch (error) {
                        console.error('Error:', error);
                        setMessageUser('❌ Error al activar usuarios');
                      }
                    }}
                    className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-white font-semibold shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    Activar Todos
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-lg border border-neutral-light bg-white shadow-soft overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-light/50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Rol</th>
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
                              {/* No permitir cambiar nuestro propio rol ni si el usuario está inactivo */}
                              {u.id === auth.currentUser?.uid ? (
                                <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                                  {u.role === 'admin' ? 'Administrador' : u.role === 'docente' ? 'Docente' : 'Estudiante'}
                                </span>
                              ) : (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  disabled={!u.activo}
                                  className={`rounded-lg border border-neutral-light bg-white px-3 py-1.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    !u.activo ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <option value="estudiante">Estudiante</option>
                                  <option value="docente">Docente</option>
                                  <option value="admin">Administrador</option>
                                </select>
                              )}
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
                                <button
                                  onClick={() => handleToggleUserStatus(u.id, u.activo)}
                                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                                    u.activo
                                      ? 'bg-warning/10 text-warning hover:bg-warning/20'
                                      : 'bg-success/10 text-success hover:bg-success/20'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-base">
                                    {u.activo ? 'block' : 'check_circle'}
                                  </span>
                                  {u.activo ? 'Desactivar' : 'Activar'}
                                </button>
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
                                      if (window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
                                        handleCancelarReserva(reserva.id);
                                      }
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

        </div>
      </main>

      {/* Chatbot flotante */}
      <ChatBot />
    </div>
  );
}

export default AdminPanel;