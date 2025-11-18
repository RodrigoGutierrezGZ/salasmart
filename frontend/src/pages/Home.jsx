// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      {/* Hero Section */}
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <svg className="h-20 w-20 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
        </div>

        <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          Bienvenido a <span className="text-primary">SalaSmart</span>
        </h1>
        
        <p className="mb-8 text-xl text-slate-600 dark:text-gray-300">
          Sistema inteligente para la gestión y reserva de salas universitarias en INACAP.
          <br />
          Optimiza el uso de espacios académicos de forma simple y eficiente.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/login"
            className="rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            Iniciar Sesión
          </Link>
          <Link
            to="/registro"
            className="rounded-lg border-2 border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-8 py-4 text-lg font-semibold text-slate-700 dark:text-gray-200 shadow-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-all hover:scale-105"
          >
            Registrarse
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-20 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-soft">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
            <span className="material-symbols-outlined text-2xl text-success">calendar_month</span>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Reserva Fácil</h3>
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Reserva salas en segundos con nuestro calendario interactivo y disponibilidad en tiempo real.
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-soft">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
            <span className="material-symbols-outlined text-2xl text-warning">meeting_room</span>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Gestión Inteligente</h3>
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Visualiza la ocupación de salas y optimiza el uso de espacios académicos.
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-soft">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <span className="material-symbols-outlined text-2xl text-primary">insights</span>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Estadísticas</h3>
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Accede a reportes y estadísticas sobre el uso de las instalaciones.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-20 text-center">
        <p className="text-sm text-slate-500">
          Sistema de Gestión de Salas - INACAP 2025
        </p>
      </div>
    </div>
  );
}

export default Home;