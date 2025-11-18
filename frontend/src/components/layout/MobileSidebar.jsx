// src/components/layout/MobileSidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import NotificacionesPanel from '../shared/NotificacionesPanel';

function MobileSidebar({ user, role, activeTab, onTabChange, isOpen, onClose }) {
  const location = useLocation();
  
  const handleLogout = async () => {
    try {
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

    // estudiante
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

  const handleLogoClick = () => {
    if (role === 'admin') {
      onTabChange && onTabChange('dashboard');
    } else {
      window.location.href = '/dashboard';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Mobile Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-white dark:bg-gray-800 border-r border-neutral-light dark:border-gray-700 z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex h-full flex-col p-3">
          {/* Header con botón cerrar */}
          <div className="flex items-center justify-between mb-3">
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-2 cursor-pointer"
            >
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              <h2 className="text-lg font-bold text-neutral-dark dark:text-white">SalaSmart</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">close</span>
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 mb-6">
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
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 flex-1">
            {navItems.map((item) => {
              if (role === 'admin' && item.tab) {
                const handleClick = () => {
                  if (onTabChange) {
                    onTabChange(item.tab);
                  }
                  onClose();
                };

                return (
                  <Link
                    key={item.tab}
                    to="/dashboard"
                    onClick={handleClick}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isTabActive(item.tab) && location.pathname === '/dashboard'
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-neutral-light dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <p className={`text-sm font-${isTabActive(item.tab) && location.pathname === '/dashboard' ? 'semibold' : 'medium'} leading-normal`}>
                      {item.label}
                    </p>
                  </Link>
                );
              }
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
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

          {/* Bottom Section */}
          <div className="mt-auto flex flex-col gap-2">
            <Link
              to="/configuracion"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 hover:bg-neutral-light"
            >
              <span className="material-symbols-outlined">settings</span>
              <p className="text-sm font-medium leading-normal">Ajustes</p>
            </Link>
            
            <button
              onClick={() => { handleLogout(); onClose(); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 hover:bg-neutral-light"
            >
              <span className="material-symbols-outlined">logout</span>
              <p className="text-sm font-medium leading-normal">Cerrar Sesión</p>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default MobileSidebar;