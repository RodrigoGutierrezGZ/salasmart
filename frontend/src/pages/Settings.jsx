// ============================================================================
// PÁGINA: Configuración / Settings
// ============================================================================
// Configuración del sistema (placeholder para futuras funcionalidades)
// ============================================================================

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/layout/Sidebar';
import MobileHeader from '../components/layout/MobileHeader';
import MobileSidebar from '../components/layout/MobileSidebar';
import DarkModeToggle from '../components/DarkModeToggle';
import ChatBot from '../components/chatbot/ChatBot';

export default function Settings() {
  const { user, role, userData } = useAuth();
  const { themeMode, setTheme } = useTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const features = [
    {
      icon: 'brightness_auto',
      title: 'Preferencia de Tema',
      description: 'Selecciona entre modo claro, oscuro o automático según tu sistema',
      status: themeMode === 'auto' ? 'Automático' : (themeMode === 'dark' ? 'Oscuro' : 'Claro'),
      color: 'purple',
      isActive: true,
      custom: true // Indica que usa componente personalizado
    },
    {
      icon: 'notifications',
      title: 'Preferencias de Notificaciones',
      description: 'Configura qué notificaciones quieres recibir',
      status: 'Próximamente',
      color: 'blue',
      isActive: false
    },
    {
      icon: 'language',
      title: 'Idioma',
      description: 'Cambia el idioma de la interfaz',
      status: 'Próximamente',
      color: 'green',
      isActive: false
    },
    {
      icon: 'security',
      title: 'Privacidad',
      description: 'Gestiona tu privacidad y seguridad',
      status: 'Próximamente',
      color: 'red',
      isActive: false
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark">
      {/* Sidebar Desktop */}
      <Sidebar user={user} role={role} />

      {/* Mobile Header */}
      <MobileHeader
        user={user}
        role={role}
        userData={userData}
        onMenuClick={() => setMobileSidebarOpen(true)}
      />

      {/* Mobile Sidebar */}
      <MobileSidebar
        user={user}
        role={role}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-dark border-b border-gray-200 dark:border-border-dark px-4 lg:px-8 py-4 lg:py-6">
          <h1 className="text-xl lg:text-2xl font-bold text-neutral-dark dark:text-text-dark-primary">Configuración</h1>
          <p className="text-gray-600 dark:text-text-dark-secondary mt-1 text-sm lg:text-base">Personaliza tu experiencia en SalaSmart</p>
        </div>

        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          {/* Info banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[24px]">
                settings
              </span>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-300">Configuración del Sistema</h3>
                <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
                  Personaliza tu experiencia en SalaSmart. El modo oscuro ya está disponible.
                </p>
              </div>
            </div>
          </div>

          {/* Características */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-card-bg-dark rounded-xl shadow-sm border border-gray-200 dark:border-border-dark p-6 ${
                  feature.isActive
                    ? 'hover:shadow-md hover:border-primary dark:hover:border-primary transition-all'
                    : 'opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${getColorClasses(feature.color)} flex items-center justify-center flex-shrink-0`}>
                    <span className="material-symbols-outlined text-[28px]">
                      {feature.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-text-dark-primary">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-text-dark-secondary mt-0.5">{feature.description}</p>
                  </div>
                  
                  {feature.custom ? (
                    // Componente personalizado para tema
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <DarkModeToggle />
                    </div>
                  ) : feature.isActive ? (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {feature.status}
                      </span>
                    </div>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full flex-shrink-0">
                      {feature.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Información del sistema */}
          <div className="mt-8 bg-white dark:bg-card-bg-dark rounded-xl shadow-sm border border-gray-200 dark:border-border-dark p-6">
            <h3 className="font-semibold text-gray-900 dark:text-text-dark-primary mb-4">Información del Sistema</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-text-dark-secondary">Versión</span>
                <span className="font-medium text-gray-900 dark:text-text-dark-primary">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-text-dark-secondary">Estado</span>
                <span className="font-medium text-green-600 dark:text-green-400">Operativo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-text-dark-secondary">Última actualización</span>
                <span className="font-medium text-gray-900 dark:text-text-dark-primary">15 Nov 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ChatBot */}
      <ChatBot />
    </div>
  );
}
