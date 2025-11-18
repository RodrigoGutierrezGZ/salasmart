// src/pages/Registro.jsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import LoadingScreen from '../components/layout/LoadingScreen';
import { registrarLog } from '../services/logsService';
import { generarEmailInstitucional } from '../utils/emailGenerator';

const Registro = () => {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [emailGenerado, setEmailGenerado] = useState('');
  const [generandoEmail, setGenerandoEmail] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const navigate = useNavigate();

  // Generar email cuando el usuario termine de escribir su nombre
  const handleNombreChange = async (e) => {
    const valor = e.target.value;
    setNombreCompleto(valor);

    // Si tiene al menos nombre y apellido, generar email
    if (valor.trim().split(/\s+/).length >= 2) {
      setGenerandoEmail(true);
      try {
        const email = await generarEmailInstitucional(valor);
        setEmailGenerado(email);
      } catch (err) {
        console.error('Error generando email:', err);
        setEmailGenerado('');
      } finally {
        setGenerandoEmail(false);
      }
    } else {
      setEmailGenerado('');
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');

    if (!emailGenerado) {
      setError('Por favor, ingresa tu nombre completo para generar tu email institucional');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setRegistering(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailGenerado, password);
      const user = userCredential.user;

      // SISTEMA SEGURO: Todas las cuentas nuevas son estudiantes INACTIVOS
      // Requieren aprobación de administrador para activarse
      await setDoc(doc(db, "users", user.uid), {
        email: emailGenerado,
        nombre: nombreCompleto,
        role: 'estudiante', // Siempre estudiante por defecto
        sedesAfiliadas: [], // Nuevo campo: sin sedes asignadas por defecto
        fechaCreacion: new Date(),
        activo: false // INACTIVA - requiere aprobación de admin
      });

      // Registrar log de creación de cuenta
      await registrarLog(
        'USUARIOS',
        'crear',
        emailGenerado,
        user.uid,
        {
          nombre: nombreCompleto,
          rol: 'estudiante',
          email: emailGenerado,
          estado: 'Pendiente de aprobación'
        }
      );

      setTimeout(() => {
        navigate('/login?status=pending');
      }, 500);
    } catch (error) {
      setRegistering(false);
      setError('Error al registrar. El correo puede estar en uso o la contraseña es muy débil.');
    }
  };

  if (registering) {
    return <LoadingScreen message="Creando cuenta..." />;
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4 md:p-8">
      <div className="w-full max-w-6xl overflow-hidden rounded-lg bg-card-bg-light dark:bg-card-bg-dark shadow-sm md:grid md:grid-cols-2">
        
        {/* Left Column: Branding */}
        <div className="relative hidden items-center justify-center bg-primary p-8 md:flex">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-3">
              <svg className="h-10 w-10" fill="none" height="40" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="40" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              <span className="text-3xl font-bold">SalaSmart</span>
            </div>
            <h1 className="mt-8 text-4xl font-bold leading-tight">La gestión de espacios universitarios, simplificada.</h1>
            <p className="mt-4 text-lg text-indigo-200">Reserva salas, consulta horarios y organiza tu vida académica sin complicaciones.</p>
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-left">
              <h2 className="text-3xl font-bold text-neutral-dark dark:text-neutral-light">Crear cuenta</h2>
              <p className="mt-2 text-neutral-500 dark:text-gray-400">Accede a todos los recursos en un solo lugar.</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <form className="flex flex-col gap-y-5" onSubmit={handleRegistro}>
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-neutral-dark dark:text-neutral-light" htmlFor="full-name">Nombre Completo</label>
                <input
                  className="form-input w-full rounded-DEFAULT border-neutral-light dark:border-gray-600 bg-background-light dark:bg-gray-700 px-4 py-3 text-neutral-dark dark:text-neutral-light placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  id="full-name"
                  placeholder="Ej: Juan Pérez García"
                  type="text"
                  value={nombreCompleto}
                  onChange={handleNombreChange}
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-neutral-dark dark:text-neutral-light" htmlFor="email">Email Institucional</label>
                <div className="relative">
                  <input
                    className="form-input w-full rounded-DEFAULT border-neutral-light dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-neutral-dark dark:text-neutral-light placeholder-gray-400 cursor-not-allowed"
                    id="email"
                    placeholder="Se generará automáticamente"
                    type="email"
                    value={generandoEmail ? 'Generando...' : emailGenerado}
                    readOnly
                    disabled
                  />
                  {emailGenerado && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                    </div>
                  )}
                </div>
                {emailGenerado && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ Tu email institucional ha sido generado
                  </p>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-neutral-dark dark:text-neutral-light" htmlFor="password">Contraseña</label>
                <div className="relative">
                  <input
                    className="form-input w-full rounded-DEFAULT border-neutral-light dark:border-gray-600 bg-background-light dark:bg-gray-700 px-4 py-3 pr-12 text-neutral-dark dark:text-neutral-light placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    id="password"
                    placeholder="Crea una contraseña segura"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-neutral-dark dark:text-neutral-light" htmlFor="confirm-password">Confirmar Contraseña</label>
                <div className="relative">
                  <input
                    className="form-input w-full rounded-DEFAULT border-neutral-light dark:border-gray-600 bg-background-light dark:bg-gray-700 px-4 py-3 pr-12 text-neutral-dark dark:text-neutral-light placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    id="confirm-password"
                    placeholder="Confirma tu contraseña"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* INFO: Todas las cuentas se crean como estudiantes inactivos */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Registro como Estudiante
                    </p>
                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                      Tu cuenta será creada como <strong>estudiante</strong> y estará <strong>pendiente de aprobación</strong>.
                      Un administrador la activará y podrá cambiar tu rol si corresponde (docente/admin).
                    </p>
                  </div>
                </div>
              </div>

              <button 
                className="mt-4 w-full rounded-DEFAULT bg-primary py-3 text-base font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark" 
                type="submit"
              >
                Crear Cuenta
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="font-semibold text-primary hover:underline">Inicia sesión</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;