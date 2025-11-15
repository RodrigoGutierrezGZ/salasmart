// src/components/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import NotificacionesPanel from '../shared/NotificacionesPanel';

function Sidebar({ user, role, activeTab, onTabChange }) {
  const location = useLocation();
  
  const handleLogout = async () => {
    try {
      // Limpiar caché de sesión antes de cerrar sesión
      sessionStorage.removeItem('salasmart_user_cache');
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isTabActive = (tab) => {
    return activeTab === tab;
  };

  // Navegación según el rol
  const getNavItems = () => {
    const commonItems = [
      { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
      { path: '/mis-reservas', icon: 'calendar_month', label: 'Mis Reservas' },
    ];

    if (role === 'admin') {
      return [
        { tab: 'dashboard', icon: 'analytics', label: 'Dashboard' },
        { tab: 'infraestructura', icon: 'apartment', label: 'Infraestructura' },
        { tab: 'salas', icon: 'meeting_room', label: 'Salas' },
        { tab: 'usuarios', icon: 'group', label: 'Usuarios' },
        { tab: 'reservas', icon: 'event_available', label: 'Reservas' },
        { tab: 'historial', icon: 'history', label: 'Historial' },
      ];
    }

    if (role === 'docente') {
      return [
        ...commonItems,
        { path: '/perfil', icon: 'person', label: 'Perfil' },
      ];
    }

    // estudiante - Solo Dashboard y Perfil (sin Mis Reservas)
    return [
      { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
      { path: '/perfil', icon: 'person', label: 'Perfil' },
    ];
  };

  const getRoleInfo = () => {
    if (role === 'admin') return { label: 'Administrador', color: 'text-red-600' };
    if (role === 'docente') return { label: 'Docente', color: 'text-blue-600' };
    return { label: 'Estudiante', color: 'text-green-600' };
  };

  const navItems = getNavItems();
  const roleInfo = getRoleInfo();

  // Función para manejar click en el logo
  const handleLogoClick = () => {
    if (role === 'admin') {
      // Para admin, cambiar a tab de dashboard
      onTabChange && onTabChange('dashboard');
    } else {
      // Para docente y estudiante, navegar a /dashboard
      window.location.href = '/dashboard';
    }
  };

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-neutral-light bg-white p-4">
      {/* Logo y título */}
      <div className="flex flex-col gap-4">
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-3 px-2 cursor-pointer group transition-all hover:bg-primary/5 rounded-lg py-2 -mx-2"
        >
          <svg className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
          <h1 className="text-xl font-bold text-neutral-dark group-hover:text-primary transition-colors">SalaSmart</h1>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-primary">person</span>
          </div>
          <div className="flex flex-col flex-1">
            <h2 className="text-sm font-semibold leading-normal text-neutral-dark">
              {user?.email?.split('@')[0] || 'Usuario'}
            </h2>
            <p className={`text-xs font-normal leading-normal ${roleInfo.color}`}>
              {roleInfo.label}
            </p>
          </div>

          {/* Campanita de Notificaciones (solo para admin y docente) */}
          {(role === 'admin' || role === 'docente') && (
            <NotificacionesPanel usuarioId={user?.uid} />
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex flex-col gap-2">
          {navItems.map((item) => {
            // Si es admin, usar botones para cambiar tabs
            if (role === 'admin' && item.tab) {
              return (
                <button
                  key={item.tab}
                  onClick={() => onTabChange && onTabChange(item.tab)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isTabActive(item.tab)
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-neutral-light'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <p className={`text-sm font-${isTabActive(item.tab) ? 'semibold' : 'medium'} leading-normal`}>
                    {item.label}
                  </p>
                </button>
              );
            }
            
            // Para otros roles, usar Links normales
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-neutral-light'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <p className={`text-sm font-${isActive(item.path) ? 'semibold' : 'medium'} leading-normal`}>
                  {item.label}
                </p>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto flex flex-col gap-2">
        <Link
          to="/configuracion"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 hover:bg-neutral-light"
        >
          <span className="material-symbols-outlined">settings</span>
          <p className="text-sm font-medium leading-normal">Ajustes</p>
        </Link>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 hover:bg-neutral-light"
        >
          <span className="material-symbols-outlined">logout</span>
          <p className="text-sm font-medium leading-normal">Cerrar Sesión</p>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
