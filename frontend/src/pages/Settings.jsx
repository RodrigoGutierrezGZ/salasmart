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
import ChatBot from '../components/chatbot/ChatBot';

export default function Settings() {
  const { user, role, userData } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const features = [
    {
      icon: 'dark_mode',
      title: 'Modo Oscuro',
      description: 'Cambia entre tema claro y oscuro',
      status: 'Activo',
      color: 'purple',
      isToggleable: true,
      isEnabled: isDarkMode,
      onToggle: toggleDarkMode
    },
    {
      icon: 'notifications',
      title: 'Preferencias de Notificaciones',
      description: 'Configura qué notificaciones quieres recibir',
      status: 'Próximamente',
      color: 'blue'
    },
    {
      icon: 'language',
      title: 'Idioma',
      description: 'Cambia el idioma de la interfaz',
      status: 'Próximamente',
      color: 'green'
    },
    {
      icon: 'security',
      title: 'Privacidad',
      description: 'Gestiona tu privacidad y seguridad',
      status: 'Próximamente',
      color: 'red'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      purple: 'bg-purple-100 text-purple-600',
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      red: 'bg-red-100 text-red-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="flex h-screen bg-gray-50">
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
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-4 lg:py-6">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm lg:text-base">Personaliza tu experiencia en SalaSmart</p>
        </div>

        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          {/* Info banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[24px]">
                settings
              </span>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Configuración Disponible</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Personaliza tu experiencia en SalaSmart con las opciones disponibles.
                </p>
              </div>
            </div>
          </div>

          {/* Opciones de configuración */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all ${
                  feature.isToggleable ? 'hover:shadow-md cursor-pointer' : 'opacity-60'
                }`}
                onClick={feature.isToggleable ? feature.onToggle : undefined}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${getColorClasses(feature.color)} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-[28px]">
                      {feature.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{feature.description}</p>
                  </div>
                  {feature.isToggleable ? (
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        feature.isEnabled 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {feature.isEnabled ? 'Activo' : 'Inactivo'}
                      </span>
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        feature.isEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          feature.isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                    </div>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                      {feature.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Información del sistema */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Información del Sistema</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Versión</span>
                <span className="font-medium text-gray-900 dark:text-white">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Estado</span>
                <span className="font-medium text-green-600 dark:text-green-400">Operativo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Última actualización</span>
                <span className="font-medium text-gray-900 dark:text-white">17 Nov 2025</span>
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
