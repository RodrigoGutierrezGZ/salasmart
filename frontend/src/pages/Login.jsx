// src/pages/Login.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import LoadingScreen from '../components/layout/LoadingScreen';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const navigate = useNavigate();
  
  const location = useLocation();
  const status = new URLSearchParams(location.search).get('status');
  const registrationSuccess = status === 'registered';
  const registrationPending = status === 'pending';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoggingIn(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // useAuth y App.jsx manejan la redirección
    } catch (error) {
      setLoggingIn(false);
      setError("Correo o contraseña incorrectos. Por favor, inténtalo de nuevo.");
    }
  };

  if (loggingIn) {
    return <LoadingScreen message="Iniciando sesión..." />;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4" style={{ backgroundImage: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(168, 85, 247, 0.1))' }}>
      <div className="flex w-full max-w-md flex-col items-center rounded-xl bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm p-6 sm:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/80 dark:border-slate-800/80">
        
        <div className="flex flex-col items-center w-full mb-6">
          <svg className="h-10 w-auto text-primary" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path>
          </svg>
          <h1 className="text-slate-800 dark:text-slate-200 tracking-tight text-2xl font-bold leading-tight text-center pb-2 pt-4">
            Bienvenido de vuelta a SalaSmart
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal text-center">
            Inicia sesión en tu cuenta para gestionar las salas.
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="w-full mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
        {registrationSuccess && (
          <div className="w-full mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">¡Registro exitoso! Ya puedes iniciar sesión.</p>
          </div>
        )}
        {registrationPending && (
          <div className="w-full mb-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">pending</span>
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Cuenta creada - Pendiente de aprobación
                </p>
                <p className="mt-1 text-xs text-yellow-800 dark:text-yellow-200">
                  Tu cuenta ha sido creada exitosamente como <strong>estudiante</strong>, pero está <strong>inactiva</strong> hasta que un administrador la apruebe.
                  Recibirás un correo cuando tu cuenta sea activada.
                </p>
              </div>
            </div>
          </div>
        )}

        <form className="w-full flex flex-col gap-4" onSubmit={handleLogin}>
          <label className="flex flex-col w-full">
            <p className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">Email</p>
            <div className="flex w-full flex-1 items-stretch rounded-lg border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all duration-200">
              <input 
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden bg-transparent text-slate-800 dark:text-slate-200 focus:outline-0 focus:ring-0 border-0 h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-base font-normal leading-normal" 
                placeholder="tu.email@universidad.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div aria-hidden="true" className="text-slate-400 dark:text-slate-500 flex items-center justify-center px-3">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
              </div>
            </div>
          </label>

          <label className="flex flex-col w-full">
            <p className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">Contraseña</p>
            <div className="flex w-full flex-1 items-stretch rounded-lg border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all duration-200">
              <input 
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden bg-transparent text-slate-800 dark:text-slate-200 focus:outline-0 focus:ring-0 border-0 h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-base font-normal leading-normal" 
                placeholder="Introduce tu contraseña" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div aria-hidden="true" className="text-slate-400 dark:text-slate-500 flex items-center justify-center px-3">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span>
              </div>
            </div>
          </label>

          <button
            className="w-full bg-primary text-white font-medium py-3 px-4 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-background-dark transition-all duration-200 shadow-sm hover:shadow-md"
            type="submit"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="w-full text-center mt-6">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal">
            ¿No tienes una cuenta? <Link to="/registro" className="font-medium text-primary underline hover:text-primary/80 transition-colors">Crear una cuenta</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;