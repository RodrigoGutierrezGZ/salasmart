// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/shared/ToastContainer';

import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
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
    <ToastProvider>
      <Router>
        <div className="flex min-h-screen flex-col bg-background-light">
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
              <Route path="/perfil" element={<ProtectedRoute><div className="p-8"><h1>Perfil de Usuario</h1><p>Próximamente...</p></div></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {/* Toast notifications container */}
          <ToastContainer />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;