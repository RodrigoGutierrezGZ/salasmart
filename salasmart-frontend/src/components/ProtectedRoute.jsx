// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase/config';

const ProtectedRoute = ({ children }) => {
  const user = auth.currentUser;

  if (!user) {
    // Si no hay usuario, redirige a la página de login
    return <Navigate to="/login" />;
  }

  // Si hay usuario, muestra el contenido que está protegiendo
  return children;
};

export default ProtectedRoute;