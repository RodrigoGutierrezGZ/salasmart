// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import DarkModeToggle from '../DarkModeToggle';

function Navbar({ user, role }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const getRoleBadge = () => {
    if (role === 'admin') return 'Administrador';
    if (role === 'docente') return 'Docente';
    return 'Estudiante';
  };

  const getRoleBadgeColor = () => {
    if (role === 'admin') return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    if (role === 'docente') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
  };

  if (!user) {
    // Navbar para usuarios NO autenticados
    return (
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-border-dark bg-white/80 dark:bg-neutral-dark/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <svg className="h-7 w-7 sm:h-8 sm:w-8 text-primary flex-shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              <Link to="/" className="text-lg sm:text-xl font-bold text-slate-800 dark:text-text-dark-primary truncate">
                SalaSmart
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-medium text-slate-600 dark:text-text-dark-secondary hover:text-slate-900 dark:hover:text-text-dark-primary transition-colors whitespace-nowrap"
              >
                Iniciar Sesión
              </Link>
              <DarkModeToggle />
              <Link 
                to="/registro" 
                className="rounded-lg bg-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all whitespace-nowrap"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Navbar para usuarios AUTENTICADOS
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-border-dark bg-white/80 dark:bg-neutral-dark/80 backdrop-blur-sm hidden lg:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <Link to="/dashboard" className="text-lg lg:text-xl font-bold text-slate-800 dark:text-text-dark-primary truncate">
              SalaSmart
            </Link>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <span className="text-xs lg:text-sm text-slate-600 dark:text-text-dark-secondary truncate">{user.email}</span>
              <span className={`rounded-full px-2 lg:px-3 py-1 text-xs font-medium whitespace-nowrap ${getRoleBadgeColor()}`}>
                {getRoleBadge()}
              </span>
            </div>
            <DarkModeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 lg:gap-2 rounded-lg border border-slate-300 dark:border-border-dark px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-slate-700 dark:text-text-dark-secondary hover:bg-slate-50 dark:hover:bg-card-bg-dark-hover transition-all"
            >
              <span className="material-symbols-outlined text-lg lg:text-xl">logout</span>
              <span className="hidden lg:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
