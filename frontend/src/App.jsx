// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ToastContainer from './components/shared/ToastContainer';
import InstallPWA from './components/InstallPWA';

import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Perfil from './pages/Perfil';
import Settings from './pages/Settings';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoadingScreen from './components/layout/LoadingScreen';
import MisReservasPage from './pages/MisReservasPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';

function App() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verificando autenticación..." />;
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div className="flex min-h-screen flex-col bg-background-light dark:bg-gray-900">
            {/* Solo mostrar Navbar si NO está autenticado */}
            {!user && <Navbar user={user} role={role} />}

          <main className="flex-1">
            <Routes>
              <Route path="/" element={!user ? <Home /> : <Navigate to="/dashboard" />} />
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/registro" element={!user ? <Registro /> : <Navigate to="/dashboard" />} />

              {/* Rutas protegidas */}
              <Route path="/dashboard" element={<ProtectedRoute />} />
              <Route path="/mis-reservas" element={<ProtectedRoute><MisReservasPage /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
              <Route path="/configuracion" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {/* Toast notifications container */}
          <ToastContainer />
          
          {/* PWA Install Prompt */}
          <InstallPWA />
        </div>
      </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;