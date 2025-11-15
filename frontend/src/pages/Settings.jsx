// ============================================================================
// PÁGINA: Configuración / Settings
// ============================================================================
// Configuración del sistema (placeholder para futuras funcionalidades)
// ============================================================================

import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/layout/Sidebar';

export default function Settings() {
  const { user, role } = useAuth();

  const features = [
    {
      icon: 'dark_mode',
      title: 'Modo Oscuro',
      description: 'Cambia entre tema claro y oscuro',
      status: 'Próximamente',
      color: 'purple'
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
      <Sidebar user={user} role={role} />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">Personaliza tu experiencia en SalaSmart</p>
        </div>

        <div className="p-8 max-w-4xl mx-auto">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-[24px]">
                construction
              </span>
              <div>
                <h3 className="font-semibold text-blue-900">En Desarrollo</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Las opciones de configuración están siendo desarrolladas. Pronto podrás
                  personalizar tu experiencia en SalaSmart.
                </p>
              </div>
            </div>
          </div>

          {/* Características futuras */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${getColorClasses(feature.color)} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-[28px]">
                      {feature.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{feature.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {feature.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Información del sistema */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Información del Sistema</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Versión</span>
                <span className="font-medium text-gray-900">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado</span>
                <span className="font-medium text-green-600">Operativo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Última actualización</span>
                <span className="font-medium text-gray-900">15 Nov 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
