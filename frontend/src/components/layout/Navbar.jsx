// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';

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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              <Link to="/" className="text-xl font-bold text-slate-800 dark:text-text-dark-primary">
                SalaSmart
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 dark:text-text-dark-secondary hover:text-slate-900 dark:hover:text-text-dark-primary transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link 
                to="/registro" 
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all"
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
    <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-border-dark bg-white/80 dark:bg-neutral-dark/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <Link to="/dashboard" className="text-xl font-bold text-slate-800 dark:text-text-dark-primary">
              SalaSmart
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-text-dark-secondary">{user.email}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeColor()}`}>
                {getRoleBadge()}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-border-dark px-4 py-2 text-sm font-medium text-slate-700 dark:text-text-dark-secondary hover:bg-slate-50 dark:hover:bg-card-bg-dark-hover transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
