// src/components/layout/MobileHeader.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificacionesPanel from '../shared/NotificacionesPanel';

function MobileHeader({ user, role, onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getRoleInfo = () => {
    if (role === 'admin') return { label: 'Administrador', color: 'text-red-600' };
    if (role === 'docente') return { label: 'Docente', color: 'text-blue-600' };
    return { label: 'Estudiante', color: 'text-green-600' };
  };

  const roleInfo = getRoleInfo();
  
  // Verificar si estamos en el dashboard principal
  const isOnDashboard = location.pathname === '/dashboard';
  
  // Páginas que necesitan botón de volver
  const needsBackButton = [
    '/mis-reservas',
    '/perfil',
    '/configuracion', 
    '/admin'
  ].some(path => location.pathname === path || location.pathname.startsWith(path));
  
  const handleLogoClick = () => {
    navigate('/dashboard');
  };
  
  const handleBackClick = () => {
    navigate(-1); // Volver a la página anterior
  };

  return (
    <header className="lg:hidden bg-white dark:bg-neutral-dark border-b border-neutral-light dark:border-border-dark px-3 py-2 flex items-center justify-between fixed top-0 left-0 right-0 z-30 h-14">
      {/* Botón hamburguesa / Volver */}
      <div className="flex items-center gap-1">
        {needsBackButton && (
          <button
            onClick={handleBackClick}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-card-bg-dark-hover rounded-md transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-xl text-gray-700 dark:text-text-dark-secondary">arrow_back</span>
          </button>
        )}
        <button
          onClick={onMenuClick}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-card-bg-dark-hover rounded-md transition-colors flex-shrink-0"
        >
          <span className="material-symbols-outlined text-xl text-gray-700 dark:text-text-dark-secondary">menu</span>
        </button>
      </div>

      {/* Logo central / Botón Inicio */}
      <div className="flex items-center absolute left-1/2 transform -translate-x-1/2">
        {!isOnDashboard ? (
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-card-bg-dark-hover transition-colors"
          >
            <span className="material-symbols-outlined text-lg text-primary">home</span>
            <span className="text-sm font-semibold text-neutral-dark dark:text-text-dark-primary">Inicio</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={handleLogoClick}>
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <h1 className="text-base font-bold text-neutral-dark dark:text-text-dark-primary">SalaSmart</h1>
          </div>
        )}
      </div>

      {/* Usuario y notificaciones */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <NotificacionesPanel usuarioId={user?.uid} />
        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center ml-1">
          <span className="text-white text-xs font-semibold">
            {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;