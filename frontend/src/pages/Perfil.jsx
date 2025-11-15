// ============================================================================
// PÁGINA: Perfil de Usuario
// ============================================================================
// Muestra información del usuario y estadísticas (solo lectura)
// ============================================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/layout/Sidebar';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Perfil() {
  const { user, userData, role } = useAuth();
  const [stats, setStats] = useState({
    totalReservas: 0,
    reservasActivas: 0,
    reservasCompletadas: 0
  });
  const [loading, setLoading] = useState(true);
  const [sedes, setSedes] = useState([]);

  // Cargar estadísticas del usuario
  useEffect(() => {
    const cargarEstadisticas = async () => {
      if (!user) return;

      try {
        // Obtener reservas del usuario
        const reservasQuery = query(
          collection(db, 'reservas'),
          where('usuarioId', '==', user.uid)
        );
        const reservasSnapshot = await getDocs(reservasQuery);
        const reservas = reservasSnapshot.docs.map(doc => doc.data());

        // Calcular estadísticas
        const ahora = new Date();
        const activas = reservas.filter(r => {
          if (r.estado !== 'activa') return false;
          const horaFin = r.horaFin.toDate ? r.horaFin.toDate() : new Date(r.horaFin);
          return horaFin > ahora;
        });
        const completadas = reservas.filter(r => r.estado === 'completada');

        setStats({
          totalReservas: reservas.length,
          reservasActivas: activas.length,
          reservasCompletadas: completadas.length
        });

        // Cargar nombres de sedes
        if (userData?.sedesAfiliadas?.length > 0) {
          const sedesQuery = query(collection(db, 'sedes'));
          const sedesSnapshot = await getDocs(sedesQuery);
          const todasSedes = sedesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const sedesUsuario = todasSedes.filter(s => userData.sedesAfiliadas.includes(s.id));
          setSedes(sedesUsuario.map(s => s.nombre));
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, [user, userData]);

  const getRoleBadge = () => {
    if (role === 'admin') return { label: 'Administrador', color: 'bg-red-100 text-red-800', icon: 'shield' };
    if (role === 'docente') return { label: 'Docente', color: 'bg-blue-100 text-blue-800', icon: 'school' };
    return { label: 'Estudiante', color: 'bg-green-100 text-green-800', icon: 'person' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} role={role} />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">Información de tu cuenta y estadísticas</p>
        </div>

        <div className="p-8 max-w-5xl mx-auto">
          {/* Card de información personal */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Banner superior */}
            <div className="h-32 bg-gradient-to-r from-primary to-purple-600"></div>

            <div className="px-8 pb-8">
              {/* Avatar y nombre */}
              <div className="flex items-start gap-6 -mt-16 mb-6">
                <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[64px]">
                    account_circle
                  </span>
                </div>
                <div className="mt-16 flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {userData?.nombre || user?.displayName || 'Usuario'}
                  </h2>
                  <p className="text-gray-600 mt-1">{user?.email}</p>
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${roleBadge.color}`}>
                      <span className="material-symbols-outlined text-[18px]">{roleBadge.icon}</span>
                      {roleBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-gray-600">email</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email Institucional</p>
                    <p className="text-base text-gray-900 mt-0.5">{user?.email}</p>
                  </div>
                </div>

                {/* Rol */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-gray-600">badge</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rol en el Sistema</p>
                    <p className="text-base text-gray-900 mt-0.5">{roleBadge.label}</p>
                  </div>
                </div>

                {/* Estado de cuenta */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-gray-600">
                      {userData?.activo ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estado de Cuenta</p>
                    <p className="text-base text-gray-900 mt-0.5">
                      {userData?.activo ? 'Activa' : 'Inactiva'}
                    </p>
                  </div>
                </div>

                {/* Sedes afiliadas */}
                {sedes.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-gray-600">location_on</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Sedes Afiliadas</p>
                      <p className="text-base text-gray-900 mt-0.5">{sedes.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estadísticas (solo para docentes y admin) */}
          {(role === 'docente' || role === 'admin') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total de reservas */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 text-[28px]">
                      event
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total de Reservas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {loading ? '...' : stats.totalReservas}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reservas activas */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 text-[28px]">
                      event_available
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reservas Activas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {loading ? '...' : stats.reservasActivas}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reservas completadas */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 text-[28px]">
                      check_circle
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Completadas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {loading ? '...' : stats.reservasCompletadas}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info adicional para estudiantes */}
          {role === 'estudiante' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 text-[24px]">info</span>
                <div>
                  <h3 className="font-semibold text-blue-900">Información</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    Como estudiante, puedes consultar la disponibilidad de salas y ver los planos
                    de los edificios. Para reservar salas, contacta a tu docente.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
