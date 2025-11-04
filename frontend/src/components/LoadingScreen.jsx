// src/components/LoadingScreen.jsx
import React from 'react';

function LoadingScreen({ message = "Cargando..." }) {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-blue-300 via-purple-300 to-indigo-400 dark:from-blue-900/70 dark:via-background-dark dark:to-purple-900/70 animated-gradient animate-gradient-bg transition-colors duration-500">
      <div className="flex animate-fade-in flex-col items-center gap-8 text-center text-gray-900 dark:text-gray-50">
        <div className="flex flex-col items-center gap-2">
          <svg className="h-16 w-16 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5v-10A2.5 2.5 0 0 1 6.5 2z"></path>
            <path d="m9 12 2-2 2 2"></path>
            <path d="M11 10v6"></path>
            <path d="m14 12 2-2 2 2"></path>
            <path d="M16 10v6"></path>
          </svg>
          <h1 className="tracking-tight text-4xl font-bold">SalaSmart</h1>
          <p className="text-gray-700 dark:text-gray-300">Gestión inteligente de salas universitarias</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-black/10 dark:border-white/20"></div>
            <div className="absolute inset-0 animate-spinner-rotate rounded-full border-4 border-transparent border-t-primary"></div>
          </div>
          <p className="text-base font-medium text-gray-800 dark:text-gray-200 animate-pulse-subtle">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
