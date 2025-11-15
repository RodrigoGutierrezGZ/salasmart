// ============================================================================
// PÁGINA: Recuperar Contraseña
// ============================================================================
// Permite a los usuarios recuperar su contraseña mediante email
// ============================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useToast } from '../contexts/ToastContext';

export default function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      showError('Por favor ingresa tu email');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Por favor ingresa un email válido');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailEnviado(true);
      showSuccess('Email de recuperación enviado. Revisa tu bandeja de entrada');
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);

      if (error.code === 'auth/user-not-found') {
        showError('No existe un usuario con ese email');
      } else if (error.code === 'auth/invalid-email') {
        showError('Email inválido');
      } else if (error.code === 'auth/too-many-requests') {
        showError('Demasiados intentos. Intenta más tarde');
      } else {
        showError('Error al enviar email de recuperación');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <span className="material-symbols-outlined text-white text-[32px]">
              lock_reset
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recuperar Contraseña
          </h1>
          <p className="text-gray-600">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!emailEnviado ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Institucional
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">
                    email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.email@inacap.cl"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Botón Enviar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">send</span>
                    Enviar Email de Recuperación
                  </>
                )}
              </button>
            </form>
          ) : (
            // Mensaje de éxito
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-600 text-[32px]">
                  mark_email_read
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Email Enviado
              </h3>
              <p className="text-gray-600 mb-6">
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Si no recibes el email en 5 minutos, revisa tu carpeta de spam o correo no deseado.
                </p>
              </div>
              <button
                onClick={() => {
                  setEmailEnviado(false);
                  setEmail('');
                }}
                className="text-primary hover:text-primary/80 font-medium"
              >
                ¿Enviar a otro email?
              </button>
            </div>
          )}

          {/* Volver al login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-primary hover:text-primary/80 font-medium">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
