// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from 'react-bootstrap';

// Importa los dashboards de cada rol
import StudentDashboard from '../pages/StudentDashboard';
import TeacherDashboard from '../pages/TeacherDashboard';
import AdminPanel from './AdminPanel';

const ProtectedRoute = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
        <p className="ms-3">Verificando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (role) {
    case 'admin':
      return <AdminPanel />;
    case 'docente':
      return <TeacherDashboard />;
    case 'estudiante':
      return <StudentDashboard />;
    default:
      // Si por alguna razón no hay rol, lo mandamos al login para evitar errores.
      return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;