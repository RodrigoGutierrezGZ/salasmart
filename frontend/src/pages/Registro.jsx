// src/pages/Registro.jsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore'; 
import { useNavigate, Link } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

const Registro = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [role, setRole] = useState('estudiante');
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setRegistering(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        nombre: nombre,
        role: role,
        fechaCreacion: new Date(),
        activo: true
      });
      setTimeout(() => {
        navigate('/login?status=registered');
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
                  placeholder="Ingresa tu nombre completo" 
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-neutral-dark dark:text-neutral-light" htmlFor="email">Email Universitario</label>
                <input 
                  className="form-input w-full rounded-DEFAULT border-neutral-light dark:border-gray-600 bg-background-light dark:bg-gray-700 px-4 py-3 text-neutral-dark dark:text-neutral-light placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  id="email" 
                  placeholder="nombre.apellido@universidad.edu" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-neutral-dark dark:text-neutral-light" htmlFor="password">Contraseña</label>
                <input 
                  className="form-input w-full rounded-DEFAULT border-neutral-light dark:border-gray-600 bg-background-light dark:bg-gray-700 px-4 py-3 text-neutral-dark dark:text-neutral-light placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  id="password" 
                  placeholder="Crea una contraseña segura" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-neutral-dark dark:text-neutral-light" htmlFor="confirm-password">Confirmar Contraseña</label>
                <input 
                  className="form-input w-full rounded-DEFAULT border-neutral-light dark:border-gray-600 bg-background-light dark:bg-gray-700 px-4 py-3 text-neutral-dark dark:text-neutral-light placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  id="confirm-password" 
                  placeholder="Confirma tu contraseña" 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-neutral-dark dark:text-neutral-light">Rol</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex cursor-pointer items-center rounded-DEFAULT border p-4 transition-all ${role === 'estudiante' ? 'border-primary bg-primary/10 ring-2 ring-primary/50' : 'border-neutral-light dark:border-gray-600'}`}>
                    <input 
                      className="form-radio h-5 w-5 text-primary focus:ring-primary/50" 
                      name="role" 
                      type="radio" 
                      value="estudiante"
                      checked={role === 'estudiante'}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span className="ml-3 text-sm font-medium text-neutral-dark dark:text-neutral-light">Estudiante</span>
                  </label>
                  <label className={`flex cursor-pointer items-center rounded-DEFAULT border p-4 transition-all ${role === 'docente' ? 'border-primary bg-primary/10 ring-2 ring-primary/50' : 'border-neutral-light dark:border-gray-600'}`}>
                    <input 
                      className="form-radio h-5 w-5 text-primary focus:ring-primary/50" 
                      name="role" 
                      type="radio" 
                      value="docente"
                      checked={role === 'docente'}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span className="ml-3 text-sm font-medium text-neutral-dark dark:text-neutral-light">Docente</span>
                  </label>
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