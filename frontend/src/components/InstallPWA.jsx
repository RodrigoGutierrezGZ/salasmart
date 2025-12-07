import React, { useState, useEffect } from 'react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostrar prompt después de 10 segundos si no se ha cerrado antes
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 10000);
      }
    };

    // Evento cuando se instala la app
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA instalada exitosamente');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar prompt nativo
    deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA');
    } else {
      console.log('Usuario rechazó instalar la PWA');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // No mostrar si ya está instalada o no hay prompt disponible
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-24 lg:bottom-24 lg:w-96 z-40 animate-slideUp">
      <div className="bg-white dark:bg-card-bg-dark rounded-2xl shadow-2xl border border-neutral-light dark:border-border-dark overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-primary to-blue-600 px-6 py-4 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
              <span className="material-symbols-outlined text-2xl text-white">smartphone</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">¡Instala SalaSmart!</h3>
              <p className="text-white/90 text-sm">Acceso rápido desde tu pantalla</p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3 text-sm">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700 dark:text-text-dark-primary">
                Acceso instantáneo sin abrir el navegador
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700 dark:text-text-dark-primary">
                Funciona offline para consultar tus reservas
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700 dark:text-text-dark-primary">
                Notificaciones de tus reservas próximas
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700 dark:text-text-dark-primary">
                Experiencia rápida y optimizada
              </span>
            </li>
          </ul>

          <div className="flex gap-3">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-lg"
            >
              <span className="material-symbols-outlined text-xl">download</span>
              Instalar Ahora
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-3 text-gray-600 dark:text-text-dark-secondary hover:text-gray-800 dark:hover:text-text-dark-primary transition font-medium"
            >
              Más tarde
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-text-dark-secondary text-center mt-4">
            No ocupa espacio adicional • Se actualiza automáticamente
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
